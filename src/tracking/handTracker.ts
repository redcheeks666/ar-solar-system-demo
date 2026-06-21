import {
  HandLandmarker,
  type Category,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import type {
  HandTrackingSnapshot,
  NormalizedPoint,
  TrackedHand,
  TrackedHandSide,
} from '../utils/types';
import { HAND_LANDMARKER_MODEL_URL } from './config';
import type { VisionFileset } from './mediapipe';
import { LandmarkSmoother } from './smoothing';

const HAND_SMOOTHING_ALPHA = 0.38;
const WRIST_INDEX = 0;
const THUMB_TIP_INDEX = 4;
const INDEX_FINGER_TIP_INDEX = 8;
const INDEX_MCP_INDEX = 5;
const MIDDLE_MCP_INDEX = 9;
const RING_MCP_INDEX = 13;
const PINKY_MCP_INDEX = 17;

const EMPTY_HANDS_SNAPSHOT: HandTrackingSnapshot = {
  detectedHands: 0,
  left: null,
  right: null,
  hands: [],
  lastUpdatedAt: null,
};

export class HandTracker {
  private readonly smoothers: Record<'left' | 'right', LandmarkSmoother> = {
    left: new LandmarkSmoother(HAND_SMOOTHING_ALPHA),
    right: new LandmarkSmoother(HAND_SMOOTHING_ALPHA),
  };

  private constructor(private readonly landmarker: HandLandmarker) {}

  static async create(fileset: VisionFileset): Promise<HandTracker> {
    const landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: HAND_LANDMARKER_MODEL_URL,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return new HandTracker(landmarker);
  }

  detect(video: HTMLVideoElement, timestamp: number): HandTrackingSnapshot {
    const result = this.landmarker.detectForVideo(video, timestamp);

    if (result.landmarks.length === 0) {
      this.resetSmoothers();
      return {
        ...EMPTY_HANDS_SNAPSHOT,
        lastUpdatedAt: timestamp,
      };
    }

    const hands: TrackedHand[] = [];

    result.landmarks.forEach((landmarks, index) => {
      const category = result.handedness[index]?.[0];
      const side = normalizeHandSide(category);
      const points = landmarks.map(toNormalizedPoint);
      const smoothedPoints =
        side === 'left' || side === 'right'
          ? this.smoothers[side].smooth(points)
          : points;
      const hand = createTrackedHand(smoothedPoints, side, category?.score ?? 0);

      if (hand) {
        hands.push(hand);
      }
    });

    const left = chooseBestHand(hands, 'left');
    const right = chooseBestHand(hands, 'right');

    if (!left) {
      this.smoothers.left.reset();
    }

    if (!right) {
      this.smoothers.right.reset();
    }

    return {
      detectedHands: hands.length,
      left,
      right,
      hands,
      lastUpdatedAt: timestamp,
    };
  }

  close(): void {
    this.landmarker.close();
  }

  private resetSmoothers(): void {
    this.smoothers.left.reset();
    this.smoothers.right.reset();
  }
}

function createTrackedHand(
  landmarks: NormalizedPoint[],
  side: TrackedHandSide,
  handednessScore: number,
): TrackedHand | null {
  const wrist = landmarks[WRIST_INDEX];
  const thumbTip = landmarks[THUMB_TIP_INDEX];
  const indexFingerTip = landmarks[INDEX_FINGER_TIP_INDEX];
  const indexMcp = landmarks[INDEX_MCP_INDEX];
  const middleMcp = landmarks[MIDDLE_MCP_INDEX];
  const ringMcp = landmarks[RING_MCP_INDEX];
  const pinkyMcp = landmarks[PINKY_MCP_INDEX];

  if (
    !wrist ||
    !thumbTip ||
    !indexFingerTip ||
    !indexMcp ||
    !middleMcp ||
    !ringMcp ||
    !pinkyMcp
  ) {
    return null;
  }

  const center = averagePoints([wrist, indexMcp, middleMcp, ringMcp, pinkyMcp]);
  const palmScale = Math.max(distance(wrist, middleMcp), distance(indexMcp, pinkyMcp));

  return {
    side,
    handednessScore,
    center,
    wrist,
    thumbTip,
    indexFingerTip,
    palmScale,
    landmarks,
  };
}

function normalizeHandSide(category: Category | undefined): TrackedHandSide {
  const name = category?.categoryName.toLowerCase();

  if (name === 'left' || name === 'right') {
    return name;
  }

  return 'unknown';
}

function chooseBestHand(
  hands: TrackedHand[],
  side: 'left' | 'right',
): TrackedHand | null {
  return hands
    .filter((hand) => hand.side === side)
    .sort((a, b) => b.handednessScore - a.handednessScore)[0] ?? null;
}

function toNormalizedPoint(landmark: NormalizedLandmark): NormalizedPoint {
  return {
    x: landmark.x,
    y: landmark.y,
    z: landmark.z,
    visibility: landmark.visibility,
  };
}

function averagePoints(points: readonly NormalizedPoint[]): NormalizedPoint {
  const total = points.reduce(
    (sum, point) => {
      sum.x += point.x;
      sum.y += point.y;
      sum.z += point.z;
      return sum;
    },
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: total.z / points.length,
  };
}

function distance(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
