import { LowPassNumberFilter } from '../tracking/smoothing';
import { average, clamp01, distance2d, inverseLerp } from '../utils/math';
import { getVisualTrackedHandPair } from './handPairing';
import type {
  GestureThresholds,
  HandPrimitiveSnapshot,
  NormalizedPoint,
  TrackedHand,
  TrackingSnapshot,
} from '../utils/types';

const VELOCITY_SMOOTHING_ALPHA = 0.35;
const PULL_VELOCITY_DEADBAND = 0.035;
const PULL_VELOCITY_FULL_SCORE = 0.18;

export const EMPTY_HAND_PRIMITIVES: HandPrimitiveSnapshot = {
  leftHand: null,
  rightHand: null,
  midpoint: null,
  direction: null,
  distance: null,
  distanceVelocity: null,
  handAxisAngle: null,
  averagePalmScale: null,
  trackingConfidence: 0,
  closeIntentScore: 0,
  pullIntentScore: 0,
  bothHandsVisible: false,
  visibleHandCount: 0,
  transitionReason: 'no-hands',
};

export class HandPrimitiveController {
  private readonly velocityFilter = new LowPassNumberFilter(VELOCITY_SMOOTHING_ALPHA);
  private previousPair: { left: NormalizedPoint; right: NormalizedPoint } | null = null;
  private previousMidpoint: NormalizedPoint | null = null;
  private previousDistance: number | null = null;
  private previousDistanceAt: number | null = null;
  private snapshot = EMPTY_HAND_PRIMITIVES;

  update(
    tracking: TrackingSnapshot,
    thresholds: GestureThresholds,
    timestamp: number,
  ): HandPrimitiveSnapshot {
    const pair = getVisualTrackedHandPair(tracking, this.previousPair);

    if (!pair) {
      this.velocityFilter.reset();
      this.previousDistance = null;
      this.previousDistanceAt = null;
      this.snapshot = {
        ...EMPTY_HAND_PRIMITIVES,
        visibleHandCount: tracking.hands.detectedHands,
        transitionReason:
          tracking.hands.detectedHands === 1 ? 'one-hand-visible' : 'no-hand-pair',
      };
      return this.snapshot;
    }

    this.previousPair = {
      left: pair.left.center,
      right: pair.right.center,
    };

    const geometry = computeGeometry(pair.left.center, pair.right.center);
    const distanceVelocity = this.computeDistanceVelocity(
      geometry.distance,
      timestamp,
    );
    const averagePalmScale = average(pair.left.palmScale, pair.right.palmScale);
    const trackingConfidence = computeTrackingConfidence({
      left: pair.left,
      right: pair.right,
      midpoint: geometry.midpoint,
      previousMidpoint: this.previousMidpoint,
    });
    const closeIntentScore = computeCloseIntentScore(
      geometry.distance,
      thresholds,
      trackingConfidence,
    );
    const pullIntentScore = computePullIntentScore(distanceVelocity);

    this.previousMidpoint = geometry.midpoint;
    this.snapshot = {
      leftHand: pair.left.center,
      rightHand: pair.right.center,
      midpoint: geometry.midpoint,
      direction: geometry.direction,
      distance: geometry.distance,
      distanceVelocity,
      handAxisAngle: Math.atan2(geometry.direction.y, geometry.direction.x),
      averagePalmScale,
      trackingConfidence,
      closeIntentScore,
      pullIntentScore,
      bothHandsVisible: true,
      visibleHandCount: tracking.hands.detectedHands,
      transitionReason: buildPrimitiveReason(
        closeIntentScore,
        pullIntentScore,
        trackingConfidence,
      ),
    };

    return this.snapshot;
  }

  getSnapshot(): HandPrimitiveSnapshot {
    return this.snapshot;
  }

  reset(): void {
    this.velocityFilter.reset();
    this.previousPair = null;
    this.previousMidpoint = null;
    this.previousDistance = null;
    this.previousDistanceAt = null;
    this.snapshot = EMPTY_HAND_PRIMITIVES;
  }

  private computeDistanceVelocity(distance: number, timestamp: number): number {
    if (this.previousDistance === null || this.previousDistanceAt === null) {
      this.previousDistance = distance;
      this.previousDistanceAt = timestamp;
      return 0;
    }

    const deltaSeconds = Math.max((timestamp - this.previousDistanceAt) / 1000, 0.001);
    const rawVelocity = (distance - this.previousDistance) / deltaSeconds;

    this.previousDistance = distance;
    this.previousDistanceAt = timestamp;

    return this.velocityFilter.smooth(rawVelocity);
  }
}

function computeGeometry(leftHand: NormalizedPoint, rightHand: NormalizedPoint) {
  const delta = {
    x: rightHand.x - leftHand.x,
    y: rightHand.y - leftHand.y,
    z: rightHand.z - leftHand.z,
  };
  const distance = Math.hypot(delta.x, delta.y, delta.z);
  const direction =
    distance > 0
      ? {
          x: delta.x / distance,
          y: delta.y / distance,
          z: delta.z / distance,
        }
      : { x: 0, y: 0, z: 0 };

  return {
    midpoint: {
      x: (leftHand.x + rightHand.x) / 2,
      y: (leftHand.y + rightHand.y) / 2,
      z: (leftHand.z + rightHand.z) / 2,
    },
    direction,
    distance,
  };
}

function computeTrackingConfidence({
  left,
  right,
  midpoint,
  previousMidpoint,
}: {
  left: TrackedHand;
  right: TrackedHand;
  midpoint: NormalizedPoint;
  previousMidpoint: NormalizedPoint | null;
}): number {
  const handednessScore = average(left.handednessScore, right.handednessScore);
  const palmScaleScore = Math.min(average(left.palmScale, right.palmScale) / 0.09, 1);
  const stabilityScore = previousMidpoint
    ? 1 - clamp01(distance2d(midpoint, previousMidpoint) / 0.16)
    : 0.72;

  return clamp01(
    handednessScore * 0.42 +
      palmScaleScore * 0.24 +
      stabilityScore * 0.22 +
      0.12,
  );
}

function computeCloseIntentScore(
  distance: number,
  thresholds: GestureThresholds,
  trackingConfidence: number,
): number {
  const distanceScore =
    1 -
    inverseLerp(
      thresholds.closedDistance,
      thresholds.closedEvidenceDistance,
      distance,
    );

  return clamp01(distanceScore * (0.72 + trackingConfidence * 0.28));
}

function computePullIntentScore(distanceVelocity: number): number {
  return inverseLerp(
    PULL_VELOCITY_DEADBAND,
    PULL_VELOCITY_FULL_SCORE,
    distanceVelocity,
  );
}

function buildPrimitiveReason(
  closeIntentScore: number,
  pullIntentScore: number,
  trackingConfidence: number,
): string {
  if (trackingConfidence < 0.45) {
    return 'low-tracking-confidence';
  }

  if (closeIntentScore >= 0.72) {
    return 'hands-close';
  }

  if (pullIntentScore >= 0.5) {
    return 'hands-pulling-apart';
  }

  return 'tracking-stable';
}
