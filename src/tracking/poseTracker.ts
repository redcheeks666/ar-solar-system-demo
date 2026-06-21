import { PoseLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { NormalizedPoint, PoseTrackingSnapshot } from '../utils/types';
import { POSE_LANDMARKER_MODEL_URL } from './config';
import { LandmarkSmoother } from './smoothing';
import type { VisionFileset } from './mediapipe';

const LEFT_SHOULDER_INDEX = 11;
const RIGHT_SHOULDER_INDEX = 12;
const POSE_SMOOTHING_ALPHA = 0.32;

const EMPTY_POSE_SNAPSHOT: PoseTrackingSnapshot = {
  detected: false,
  leftShoulder: null,
  rightShoulder: null,
  landmarks: [],
  lastUpdatedAt: null,
};

export class PoseTracker {
  private readonly smoother = new LandmarkSmoother(POSE_SMOOTHING_ALPHA);

  private constructor(private readonly landmarker: PoseLandmarker) {}

  static async create(fileset: VisionFileset): Promise<PoseTracker> {
    const landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: POSE_LANDMARKER_MODEL_URL,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputSegmentationMasks: false,
    });

    return new PoseTracker(landmarker);
  }

  detect(video: HTMLVideoElement, timestamp: number): PoseTrackingSnapshot {
    const result = this.landmarker.detectForVideo(video, timestamp);
    const landmarks = result.landmarks[0];

    if (!landmarks?.[LEFT_SHOULDER_INDEX] || !landmarks[RIGHT_SHOULDER_INDEX]) {
      this.smoother.reset();
      return {
        ...EMPTY_POSE_SNAPSHOT,
        lastUpdatedAt: timestamp,
      };
    }

    const smoothedLandmarks = this.smoother.smooth(landmarks.map(toNormalizedPoint));

    return {
      detected: true,
      leftShoulder: smoothedLandmarks[LEFT_SHOULDER_INDEX] ?? null,
      rightShoulder: smoothedLandmarks[RIGHT_SHOULDER_INDEX] ?? null,
      landmarks: smoothedLandmarks,
      lastUpdatedAt: timestamp,
    };
  }

  close(): void {
    this.landmarker.close();
  }
}

function toNormalizedPoint(landmark: NormalizedLandmark): NormalizedPoint {
  return {
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility,
  };
}
