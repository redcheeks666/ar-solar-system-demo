import { FilesetResolver } from '@mediapipe/tasks-vision';
import type {
  MediaPipePerformanceSnapshot,
  PoseTrackingSnapshot,
  TrackingSnapshot,
} from '../utils/types';
import { HandTracker } from './handTracker';
import { PoseTracker } from './poseTracker';
import {
  ENABLE_POSE_TRACKING,
  MEDIAPIPE_WASM_URL,
  POSE_DETECTION_INTERVAL_MS,
} from './config';

export type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

const MIN_DETECTION_INTERVAL_MS = 33;

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
  trackingHz: null,
  detectionFrameCount: 0,
  repeatedVideoFrameCount: 0,
  videoCurrentTimeMs: null,
  videoFrameDeltaMs: null,
};

export class MediaPipeTrackingController {
  private poseTracker: PoseTracker | null = null;
  private handTracker: HandTracker | null = null;
  private initializePromise: Promise<void> | null = null;
  private lastDetectionAt = 0;
  private previousDetectionAt: number | null = null;
  private smoothedTrackingHz: number | null = null;
  private lastVideoCurrentTimeMs: number | null = null;
  private detectionFrameCount = 0;
  private repeatedVideoFrameCount = 0;
  private lastPoseAt = 0;
  private poseSnapshot: PoseTrackingSnapshot = EMPTY_POSE_SNAPSHOT;
  private snapshot: TrackingSnapshot = createEmptyTrackingSnapshot('idle');
  private performanceSnapshot: MediaPipePerformanceSnapshot =
    EMPTY_PERFORMANCE_SNAPSHOT;

  initialize(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.snapshot = createEmptyTrackingSnapshot('loading');

    this.initializePromise = this.loadTrackers().catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'MediaPipe tracking failed to load.';
      this.snapshot = {
        ...createEmptyTrackingSnapshot('error'),
        error: message,
      };
      throw error;
    });

    return this.initializePromise;
  }

  update(video: HTMLVideoElement, timestamp: number): TrackingSnapshot {
    if (this.snapshot.status !== 'ready' || !this.handTracker) {
      return this.snapshot;
    }

    if (!video.videoWidth || !video.videoHeight || timestamp - this.lastDetectionAt < MIN_DETECTION_INTERVAL_MS) {
      return this.snapshot;
    }

    this.lastDetectionAt = timestamp;

    try {
      const videoCurrentTimeMs = video.currentTime * 1000;
      const videoFrameDeltaMs =
        this.lastVideoCurrentTimeMs === null
          ? null
          : videoCurrentTimeMs - this.lastVideoCurrentTimeMs;
      if (
        this.lastVideoCurrentTimeMs !== null &&
        Math.abs(videoCurrentTimeMs - this.lastVideoCurrentTimeMs) < 0.5
      ) {
        this.repeatedVideoFrameCount += 1;
      }
      this.lastVideoCurrentTimeMs = videoCurrentTimeMs;

      const detectStartedAt = performance.now();
      const handStartedAt = performance.now();
      const hands = this.handTracker.detect(video, timestamp);
      const handDetectMs = performance.now() - handStartedAt;
      const poseStartedAt = performance.now();
      const pose = this.detectPose(video, timestamp);
      const poseDetectMs = performance.now() - poseStartedAt;
      const detectMs = performance.now() - detectStartedAt;

      this.detectionFrameCount += 1;
      this.updateTrackingHz(timestamp);
      this.performanceSnapshot = {
        detectMs,
        handDetectMs,
        poseDetectMs,
        trackingHz: this.smoothedTrackingHz,
        detectionFrameCount: this.detectionFrameCount,
        repeatedVideoFrameCount: this.repeatedVideoFrameCount,
        videoCurrentTimeMs,
        videoFrameDeltaMs,
      };

      this.snapshot = {
        status: 'ready',
        error: null,
        pose,
        hands,
        lastUpdatedAt: timestamp,
      };
    } catch (error) {
      this.snapshot = {
        ...this.snapshot,
        status: 'error',
        error: error instanceof Error ? error.message : 'MediaPipe detection failed.',
      };
    }

    return this.snapshot;
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

  getSnapshot(): TrackingSnapshot {
    return this.snapshot;
  }

  getPerformanceSnapshot(): MediaPipePerformanceSnapshot {
    return { ...this.performanceSnapshot };
  }

  dispose(): void {
    this.poseTracker?.close();
    this.handTracker?.close();
    this.poseTracker = null;
    this.handTracker = null;
    this.initializePromise = null;
    this.snapshot = createEmptyTrackingSnapshot('idle');
    this.performanceSnapshot = EMPTY_PERFORMANCE_SNAPSHOT;
    this.previousDetectionAt = null;
    this.smoothedTrackingHz = null;
    this.lastVideoCurrentTimeMs = null;
    this.detectionFrameCount = 0;
    this.repeatedVideoFrameCount = 0;
  }

  private async loadTrackers(): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

    this.handTracker = await HandTracker.create(fileset);

    if (ENABLE_POSE_TRACKING) {
      this.poseTracker = await PoseTracker.create(fileset);
    }

    this.poseSnapshot = EMPTY_POSE_SNAPSHOT;
    this.snapshot = createEmptyTrackingSnapshot('ready');
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
