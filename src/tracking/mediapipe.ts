import type { FilesetResolver } from '@mediapipe/tasks-vision';
import type {
  MediaPipePerformanceSnapshot,
  PoseTrackingSnapshot,
  TrackingSnapshot,
} from '../utils/types';
import { HandTrackingResultProcessor } from './handTracker';
import {
  HandLandmarkerWorkerClient,
  type HandLandmarkerInferenceClient,
  type HandLandmarkerInferenceResult,
} from './handLandmarkerWorkerClient';
import {
  ENABLE_POSE_TRACKING,
  MEDIAPIPE_WASM_URL,
  POSE_DETECTION_INTERVAL_MS,
} from './config';
import type { PoseTracker } from './poseTracker';

export type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

const ACTIVE_DETECTION_INTERVAL_MS = 33;
const IDLE_DETECTION_INTERVAL_MS = 120;
const IDLE_DETECTION_DELAY_MS = 2000;
const SAME_VIDEO_FRAME_EPSILON_MS = 0.5;

const EMPTY_POSE_SNAPSHOT: PoseTrackingSnapshot = {
  detected: false,
  leftShoulder: null,
  rightShoulder: null,
  landmarks: [],
  lastUpdatedAt: null,
};

const EMPTY_PERFORMANCE_SNAPSHOT: MediaPipePerformanceSnapshot = {
  detectMs: null,
  handDetectMs: null,
  poseDetectMs: null,
  workerRoundTripMs: null,
  handDelegate: null,
  trackingHz: null,
  detectionFrameCount: 0,
  droppedVideoFrameCount: 0,
  repeatedVideoFrameCount: 0,
  videoCurrentTimeMs: null,
  videoFrameDeltaMs: null,
};

export interface MediaPipeTrackingDependencies {
  readonly createHandClient?: () => HandLandmarkerInferenceClient;
  readonly createFrame?: (video: HTMLVideoElement) => Promise<ImageBitmap>;
  readonly now?: () => number;
}

/**
 * Owns the asynchronous tracking lifecycle.
 *
 * HandLandmarker inference runs in a dedicated Worker. The render loop only reads the latest
 * completed snapshot; interaction controllers remain gated by the unchanged detection timestamp.
 */
export class MediaPipeTrackingController {
  private readonly handResultProcessor = new HandTrackingResultProcessor();
  private readonly createHandClient: () => HandLandmarkerInferenceClient;
  private readonly createFrame: (video: HTMLVideoElement) => Promise<ImageBitmap>;
  private readonly now: () => number;
  private poseTracker: PoseTracker | null = null;
  private handClient: HandLandmarkerInferenceClient | null = null;
  private initializePromise: Promise<void> | null = null;
  private frameInFlight = false;
  private lifecycleGeneration = 0;
  private lastDetectionAt = 0;
  private noHandsSinceAt: number | null = null;
  private previousDetectionAt: number | null = null;
  private smoothedTrackingHz: number | null = null;
  private lastVideoCurrentTimeMs: number | null = null;
  private lastDroppedVideoCurrentTimeMs: number | null = null;
  private detectionFrameCount = 0;
  private droppedVideoFrameCount = 0;
  private repeatedVideoFrameCount = 0;
  private lastPoseAt = 0;
  private poseSnapshot: PoseTrackingSnapshot = EMPTY_POSE_SNAPSHOT;
  private snapshot: TrackingSnapshot = createEmptyTrackingSnapshot('idle');
  private performanceSnapshot: MediaPipePerformanceSnapshot = {
    ...EMPTY_PERFORMANCE_SNAPSHOT,
  };

  constructor(dependencies: MediaPipeTrackingDependencies = {}) {
    this.createHandClient =
      dependencies.createHandClient ?? (() => new HandLandmarkerWorkerClient());
    this.createFrame = dependencies.createFrame ?? ((video) => createImageBitmap(video));
    this.now = dependencies.now ?? (() => performance.now());
  }

  initialize(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.snapshot = createEmptyTrackingSnapshot('loading');
    const generation = this.lifecycleGeneration;

    this.initializePromise = this.loadTrackers()
      .then(() => {
        if (generation !== this.lifecycleGeneration) {
          return;
        }

        this.snapshot = createEmptyTrackingSnapshot('ready');
      })
      .catch((error: unknown) => {
        if (generation === this.lifecycleGeneration) {
          this.handClient?.dispose();
          this.handClient = null;
          this.snapshot = {
            ...createEmptyTrackingSnapshot('error'),
            error: toErrorMessage(error, 'MediaPipe tracking failed to load.'),
          };
        }
        throw error;
      });

    return this.initializePromise;
  }

  /**
   * Preserves the active pre-Worker detection schedule: the rAF loop offers a frame at most once
   * every 33ms while hands are present. After two seconds of completed no-hand results, idle
   * detection backs off to 120ms. Each request still keeps its original rAF capture timestamp.
   */
  update(video: HTMLVideoElement, timestamp: number): TrackingSnapshot {
    if (
      this.snapshot.status !== 'ready' ||
      !this.handClient ||
      !video.videoWidth ||
      !video.videoHeight ||
      timestamp - this.lastDetectionAt < this.getDetectionIntervalMs(timestamp)
    ) {
      return this.snapshot;
    }

    const videoCurrentTimeMs = video.currentTime * 1000;

    if (this.frameInFlight) {
      this.recordDroppedVideoFrame(videoCurrentTimeMs);
      return this.snapshot;
    }

    this.lastDetectionAt = timestamp;
    this.queueVideoFrame(video, timestamp, videoCurrentTimeMs);

    return this.snapshot;
  }

  getSnapshot(): TrackingSnapshot {
    return this.snapshot;
  }

  getPerformanceSnapshot(): MediaPipePerformanceSnapshot {
    return { ...this.performanceSnapshot };
  }

  dispose(): void {
    this.lifecycleGeneration += 1;
    this.poseTracker?.close();
    this.handClient?.dispose();
    this.poseTracker = null;
    this.handClient = null;
    this.frameInFlight = false;
    this.initializePromise = null;
    this.handResultProcessor.reset();
    this.snapshot = createEmptyTrackingSnapshot('idle');
    this.performanceSnapshot = { ...EMPTY_PERFORMANCE_SNAPSHOT };
    this.lastDetectionAt = 0;
    this.noHandsSinceAt = null;
    this.previousDetectionAt = null;
    this.smoothedTrackingHz = null;
    this.lastVideoCurrentTimeMs = null;
    this.lastDroppedVideoCurrentTimeMs = null;
    this.detectionFrameCount = 0;
    this.droppedVideoFrameCount = 0;
    this.repeatedVideoFrameCount = 0;
    this.lastPoseAt = 0;
    this.poseSnapshot = EMPTY_POSE_SNAPSHOT;
  }

  private async loadTrackers(): Promise<void> {
    this.handClient = this.createHandClient();
    const delegate = await this.handClient.initialize();
    this.performanceSnapshot = {
      ...this.performanceSnapshot,
      handDelegate: delegate,
    };

    // Pose currently has no consumer and stays disabled. Keeping this lazy path preserves the
    // existing opt-in behavior without loading pose code or its model in the default hand path.
    if (ENABLE_POSE_TRACKING) {
      const [{ FilesetResolver }, { PoseTracker }] = await Promise.all([
        import('@mediapipe/tasks-vision'),
        import('./poseTracker'),
      ]);
      const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      this.poseTracker = await PoseTracker.create(fileset);
    }

    this.poseSnapshot = EMPTY_POSE_SNAPSHOT;
  }

  private queueVideoFrame(
    video: HTMLVideoElement,
    timestamp: number,
    videoCurrentTimeMs: number,
  ): void {
    if (
      this.snapshot.status !== 'ready' ||
      !this.handClient ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }

    this.frameInFlight = true;
    const generation = this.lifecycleGeneration;
    const roundTripStartedAt = this.now();

    void this.processVideoFrame(
      video,
      timestamp,
      videoCurrentTimeMs,
      generation,
      roundTripStartedAt,
    )
      .catch((error: unknown) => {
        if (generation !== this.lifecycleGeneration) {
          return;
        }

        this.snapshot = {
          ...this.snapshot,
          status: 'error',
          error: toErrorMessage(error, 'MediaPipe detection failed.'),
        };
        this.handClient?.dispose();
        this.handClient = null;
      })
      .finally(() => {
        if (generation === this.lifecycleGeneration) {
          this.frameInFlight = false;
        }
      });
  }

  private async processVideoFrame(
    video: HTMLVideoElement,
    timestamp: number,
    videoCurrentTimeMs: number,
    generation: number,
    roundTripStartedAt: number,
  ): Promise<void> {
    const frame = await this.createFrame(video);

    if (
      generation !== this.lifecycleGeneration ||
      !this.handClient ||
      this.snapshot.status !== 'ready'
    ) {
      frame.close();
      return;
    }

    const result = await this.handClient.detect(
      frame,
      timestamp,
      videoCurrentTimeMs,
    );

    if (generation !== this.lifecycleGeneration) {
      return;
    }

    // Keep the legacy order: hand inference first, then the optional throttled Pose pass.
    // Pose is disabled by default, but preserving this order keeps its opt-in path equivalent too.
    const poseStartedAt = this.now();
    const pose = this.detectPose(video, timestamp);
    const poseDetectMs = this.now() - poseStartedAt;

    this.commitWorkerResult(
      result,
      pose,
      poseDetectMs,
      this.now() - roundTripStartedAt,
    );
  }

  private commitWorkerResult(
    result: HandLandmarkerInferenceResult,
    pose: PoseTrackingSnapshot,
    poseDetectMs: number,
    workerRoundTripMs: number,
  ): void {
    const videoFrameDeltaMs =
      this.lastVideoCurrentTimeMs === null
        ? null
        : result.videoCurrentTimeMs - this.lastVideoCurrentTimeMs;
    if (
      videoFrameDeltaMs !== null &&
      Math.abs(videoFrameDeltaMs) < SAME_VIDEO_FRAME_EPSILON_MS
    ) {
      this.repeatedVideoFrameCount += 1;
    }
    this.lastVideoCurrentTimeMs = result.videoCurrentTimeMs;

    const hands = this.handResultProcessor.process(result.hands, result.timestamp);
    if (hands.detectedHands > 0) {
      this.noHandsSinceAt = null;
    } else if (this.noHandsSinceAt === null) {
      this.noHandsSinceAt = result.timestamp;
    }
    this.detectionFrameCount += 1;
    this.updateTrackingHz(result.timestamp);
    this.performanceSnapshot = {
      detectMs: workerRoundTripMs,
      handDetectMs: result.inferenceMs,
      poseDetectMs,
      workerRoundTripMs,
      handDelegate: this.performanceSnapshot.handDelegate,
      trackingHz: this.smoothedTrackingHz,
      detectionFrameCount: this.detectionFrameCount,
      droppedVideoFrameCount: this.droppedVideoFrameCount,
      repeatedVideoFrameCount: this.repeatedVideoFrameCount,
      videoCurrentTimeMs: result.videoCurrentTimeMs,
      videoFrameDeltaMs,
    };

    this.snapshot = {
      status: 'ready',
      error: null,
      pose,
      hands,
      lastUpdatedAt: result.timestamp,
    };
  }

  private detectPose(
    video: HTMLVideoElement,
    timestamp: number,
  ): PoseTrackingSnapshot {
    if (!this.poseTracker) {
      return this.poseSnapshot;
    }

    if (timestamp - this.lastPoseAt < POSE_DETECTION_INTERVAL_MS) {
      return this.poseSnapshot;
    }

    this.lastPoseAt = timestamp;
    this.poseSnapshot = this.poseTracker.detect(video, timestamp);
    return this.poseSnapshot;
  }

  private updateTrackingHz(timestamp: number): void {
    if (this.previousDetectionAt === null) {
      this.previousDetectionAt = timestamp;
      return;
    }

    const deltaMs = timestamp - this.previousDetectionAt;
    this.previousDetectionAt = timestamp;

    if (deltaMs <= 0) {
      return;
    }

    const instantHz = 1000 / deltaMs;
    this.smoothedTrackingHz =
      this.smoothedTrackingHz === null
        ? instantHz
        : this.smoothedTrackingHz + (instantHz - this.smoothedTrackingHz) * 0.2;
  }

  private getDetectionIntervalMs(timestamp: number): number {
    if (
      this.noHandsSinceAt !== null &&
      timestamp - this.noHandsSinceAt >= IDLE_DETECTION_DELAY_MS
    ) {
      return IDLE_DETECTION_INTERVAL_MS;
    }

    return ACTIVE_DETECTION_INTERVAL_MS;
  }

  private recordDroppedVideoFrame(videoCurrentTimeMs: number): void {
    if (
      this.lastDroppedVideoCurrentTimeMs !== null &&
      Math.abs(videoCurrentTimeMs - this.lastDroppedVideoCurrentTimeMs) <
        SAME_VIDEO_FRAME_EPSILON_MS
    ) {
      return;
    }

    this.lastDroppedVideoCurrentTimeMs = videoCurrentTimeMs;
    this.droppedVideoFrameCount += 1;
    this.performanceSnapshot = {
      ...this.performanceSnapshot,
      droppedVideoFrameCount: this.droppedVideoFrameCount,
    };
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function createEmptyTrackingSnapshot(
  status: TrackingSnapshot['status'],
): TrackingSnapshot {
  return {
    status,
    error: null,
    pose: {
      detected: false,
      leftShoulder: null,
      rightShoulder: null,
      landmarks: [],
      lastUpdatedAt: null,
    },
    hands: {
      detectedHands: 0,
      left: null,
      right: null,
      hands: [],
      lastUpdatedAt: null,
    },
    lastUpdatedAt: null,
  };
}
