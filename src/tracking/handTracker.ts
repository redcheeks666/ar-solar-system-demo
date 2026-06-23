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
import {
  GestureInputFramePairer,
  buildTrackedHand,
} from '../interaction/gestureInputFrame';
import { HAND_LANDMARKER_MODEL_URL } from './config';
import type { VisionFileset } from './mediapipe';

const MIN_HAND_DETECTION_CONFIDENCE = 0.35;
const MIN_HAND_PRESENCE_CONFIDENCE = 0.35;
const MIN_HAND_TRACKING_CONFIDENCE = 0.4;

const EMPTY_HANDS_SNAPSHOT: HandTrackingSnapshot = {
  detectedHands: 0,
  left: null,
  right: null,
  hands: [],
  lastUpdatedAt: null,
};

export class HandTracker {
  private readonly pairer = new GestureInputFramePairer();

  private constructor(private readonly landmarker: HandLandmarker) {}

  static async create(fileset: VisionFileset): Promise<HandTracker> {
    const landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: HAND_LANDMARKER_MODEL_URL,
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: MIN_HAND_DETECTION_CONFIDENCE,
      minHandPresenceConfidence: MIN_HAND_PRESENCE_CONFIDENCE,
      minTrackingConfidence: MIN_HAND_TRACKING_CONFIDENCE,
    });

    return new HandTracker(landmarker);
  }

  detect(video: HTMLVideoElement, timestamp: number): HandTrackingSnapshot {
    const result = this.landmarker.detectForVideo(video, timestamp);

    if (result.landmarks.length === 0) {
      this.pairer.reset();
      return {
        ...EMPTY_HANDS_SNAPSHOT,
        lastUpdatedAt: timestamp,
      };
    }

    // Build raw (unsmoothed) hands, then assign visual identity and smooth per visual slot, so a
    // MediaPipe handedness flip during a hand crossing cannot swap smoother history.
    const rawHands: TrackedHand[] = [];

    result.landmarks.forEach((landmarks, index) => {
      const category = result.handedness[index]?.[0];
      const side = normalizeHandSide(category);
      const worldLandmarks =
        result.worldLandmarks[index]?.map(toNormalizedPoint) ?? null;
      const hand = buildTrackedHand(
        landmarks.map(toNormalizedPoint),
        side,
        category?.score ?? 0,
        worldLandmarks,
      );

      if (hand) {
        rawHands.push(hand);
      }
    });

    const hands = this.pairer.stabilize(rawHands);
    const left = chooseBestHand(hands, 'left');
    const right = chooseBestHand(hands, 'right');

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

