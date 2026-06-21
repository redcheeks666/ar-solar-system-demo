import { FilesetResolver } from '@mediapipe/tasks-vision';
import type { TrackingSnapshot } from '../utils/types';
import { HandTracker } from './handTracker';
import { PoseTracker } from './poseTracker';
import { MEDIAPIPE_WASM_URL } from './config';

export type VisionFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

const MIN_DETECTION_INTERVAL_MS = 33;

export class MediaPipeTrackingController {
  private poseTracker: PoseTracker | null = null;
  private handTracker: HandTracker | null = null;
  private initializePromise: Promise<void> | null = null;
  private lastDetectionAt = 0;
  private snapshot: TrackingSnapshot = createEmptyTrackingSnapshot('idle');

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
    if (this.snapshot.status !== 'ready' || !this.poseTracker || !this.handTracker) {
      return this.snapshot;
    }

    if (!video.videoWidth || !video.videoHeight || timestamp - this.lastDetectionAt < MIN_DETECTION_INTERVAL_MS) {
      return this.snapshot;
    }

    this.lastDetectionAt = timestamp;

    try {
      const pose = this.poseTracker.detect(video, timestamp);
      const hands = this.handTracker.detect(video, timestamp);

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

  getSnapshot(): TrackingSnapshot {
    return this.snapshot;
  }

  dispose(): void {
    this.poseTracker?.close();
    this.handTracker?.close();
    this.poseTracker = null;
    this.handTracker = null;
    this.initializePromise = null;
    this.snapshot = createEmptyTrackingSnapshot('idle');
  }

  private async loadTrackers(): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    const [poseTracker, handTracker] = await Promise.all([
      PoseTracker.create(fileset),
      HandTracker.create(fileset),
    ]);

    this.poseTracker = poseTracker;
    this.handTracker = handTracker;
    this.snapshot = createEmptyTrackingSnapshot('ready');
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
