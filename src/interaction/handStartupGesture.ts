import type {
  HandStartupGestureSnapshot,
  InteractionState,
  NormalizedPoint,
  TrackedHand,
  TrackingSnapshot,
} from '../utils/types';
import { LowPassNumberFilter, LowPassPointFilter } from '../tracking/smoothing';

const CLOSED_DISTANCE_THRESHOLD = 0.18;
const CLOSED_STABLE_MS = 220;
const CLOSED_EVIDENCE_DISTANCE_THRESHOLD = 0.22;
const LOST_HAND_HOLD_MS = 2200;
const CLOSED_EVIDENCE_TTL_MS = 2400;
const HANDS_CLOSED_EXIT_GRACE_MS = 1100;
const PULL_MOVEMENT_MEMORY_MS = 500;
const PULL_MIN_DISTANCE_DELTA = 0.08;
const PULL_VELOCITY_THRESHOLD = 0.05;
const PULL_STOP_GRACE_MS = 1000;
const POSITION_SMOOTHING_ALPHA = 0.42;
const VELOCITY_SMOOTHING_ALPHA = 0.35;

const EMPTY_HAND_STARTUP_SNAPSHOT: HandStartupGestureSnapshot = {
  leftHand: null,
  rightHand: null,
  midpoint: null,
  direction: null,
  distance: null,
  distanceVelocity: null,
  bothHandsVisible: false,
  lostHandHoldActive: false,
  handsClosed: false,
  pullArmed: false,
};

interface HandPair {
  left: NormalizedPoint;
  right: NormalizedPoint;
  bothHandsVisible: boolean;
  lostHandHoldActive: boolean;
}

export interface HandStartupGestureUpdate {
  snapshot: HandStartupGestureSnapshot;
  nextState: InteractionState | null;
}

export class HandStartupGestureController {
  private readonly leftFilter = new LowPassPointFilter(POSITION_SMOOTHING_ALPHA);
  private readonly rightFilter = new LowPassPointFilter(POSITION_SMOOTHING_ALPHA);
  private readonly distanceFilter = new LowPassNumberFilter(POSITION_SMOOTHING_ALPHA);
  private readonly velocityFilter = new LowPassNumberFilter(VELOCITY_SMOOTHING_ALPHA);
  private lastVisiblePair: { left: NormalizedPoint; right: NormalizedPoint } | null =
    null;
  private lastVisibleAt: number | null = null;
  private lastDistance: number | null = null;
  private lastDistanceAt: number | null = null;
  private closedStableSince: number | null = null;
  private lastClosedEvidenceAt: number | null = null;
  private handsClosedExitSince: number | null = null;
  private pullTrendSince: number | null = null;
  private pullStartDistance: number | null = null;
  private lastPullMovementAt: number | null = null;

  update(
    tracking: TrackingSnapshot,
    currentState: InteractionState,
    timestamp: number,
  ): HandStartupGestureUpdate {
    if (!isStartupState(currentState)) {
      return {
        snapshot: this.createSnapshot(null, false, false, currentState),
        nextState: null,
      };
    }

    const pair = this.resolveHandPair(tracking, timestamp);

    if (!pair) {
      this.resetTrackingMemory();
      return {
        snapshot: this.createSnapshot(null, false, false, currentState),
        nextState: currentState === 'EmptyIdle' ? null : 'EmptyIdle',
      };
    }

    const geometry = computeGeometry(pair.left, pair.right);
    const distance = this.distanceFilter.smooth(geometry.distance);
    const velocity = this.computeVelocity(distance, timestamp, pair.bothHandsVisible);
    const snapshot = this.createSnapshot(
      {
        ...geometry,
        distance,
        distanceVelocity: velocity,
      },
      pair.bothHandsVisible,
      pair.lostHandHoldActive,
      currentState,
    );
    const hasClosedEvidence = this.updateClosedEvidence(
      distance,
      pair.bothHandsVisible,
      pair.lostHandHoldActive,
      timestamp,
    );
    const canEvaluateState =
      pair.bothHandsVisible ||
      (pair.lostHandHoldActive && this.hasRecentClosedEvidence(timestamp));
    const nextState = this.computeNextState(
      currentState,
      distance,
      velocity,
      hasClosedEvidence,
      canEvaluateState,
      timestamp,
    );

    return {
      snapshot: {
        ...snapshot,
        handsClosed: nextState === 'HandsClosed' || currentState === 'HandsClosed',
        pullArmed: nextState === 'PullArmed' || currentState === 'PullArmed',
      },
      nextState,
    };
  }

  reset(): void {
    this.leftFilter.reset();
    this.rightFilter.reset();
    this.distanceFilter.reset();
    this.velocityFilter.reset();
    this.resetTrackingMemory();
  }

  private resolveHandPair(
    tracking: TrackingSnapshot,
    timestamp: number,
  ): HandPair | null {
    const currentPair = getCurrentHandPair(tracking, this.lastVisiblePair);

    if (currentPair) {
      const smoothedPair = {
        left: this.leftFilter.smooth(currentPair.left.center),
        right: this.rightFilter.smooth(currentPair.right.center),
      };

      this.lastVisiblePair = smoothedPair;
      this.lastVisibleAt = timestamp;

      return {
        ...smoothedPair,
        bothHandsVisible: true,
        lostHandHoldActive: false,
      };
    }

    if (
      this.lastVisiblePair &&
      this.lastVisibleAt !== null &&
      timestamp - this.lastVisibleAt <= LOST_HAND_HOLD_MS
    ) {
      return {
        ...this.lastVisiblePair,
        bothHandsVisible: false,
        lostHandHoldActive: true,
      };
    }

    return null;
  }

  private computeVelocity(
    distance: number,
    timestamp: number,
    bothHandsVisible: boolean,
  ): number | null {
    if (!bothHandsVisible) {
      return 0;
    }

    if (this.lastDistance === null || this.lastDistanceAt === null) {
      this.lastDistance = distance;
      this.lastDistanceAt = timestamp;
      return 0;
    }

    const deltaSeconds = Math.max((timestamp - this.lastDistanceAt) / 1000, 0.001);
    const rawVelocity = (distance - this.lastDistance) / deltaSeconds;

    this.lastDistance = distance;
    this.lastDistanceAt = timestamp;

    return this.velocityFilter.smooth(rawVelocity);
  }

  private computeNextState(
    currentState: InteractionState,
    distance: number,
    velocity: number | null,
    hasClosedEvidence: boolean,
    canEvaluateState: boolean,
    timestamp: number,
  ): InteractionState | null {
    if (!canEvaluateState) {
      return null;
    }

    if (currentState === 'EmptyIdle') {
      return this.updateIdleState(distance, hasClosedEvidence, timestamp);
    }

    if (currentState === 'HandsClosed') {
      return this.updateHandsClosedState(
        distance,
        velocity,
        hasClosedEvidence,
        timestamp,
      );
    }

    if (currentState === 'PullArmed') {
      return this.updatePullArmedState(
        distance,
        velocity,
        hasClosedEvidence,
        timestamp,
      );
    }

    return null;
  }

  private updateClosedEvidence(
    distance: number,
    bothHandsVisible: boolean,
    lostHandHoldActive: boolean,
    timestamp: number,
  ): boolean {
    if (bothHandsVisible && distance <= CLOSED_EVIDENCE_DISTANCE_THRESHOLD) {
      this.closedStableSince ??= timestamp;
      this.lastClosedEvidenceAt = timestamp;
      return true;
    }

    if (
      lostHandHoldActive &&
      distance <= CLOSED_EVIDENCE_DISTANCE_THRESHOLD &&
      this.hasRecentClosedEvidence(timestamp)
    ) {
      this.closedStableSince ??= timestamp;
      return true;
    }

    if (bothHandsVisible && distance > CLOSED_EVIDENCE_DISTANCE_THRESHOLD) {
      this.closedStableSince = null;
      this.lastClosedEvidenceAt = null;
      this.handsClosedExitSince = null;
      return false;
    }

    return this.hasRecentClosedEvidence(timestamp);
  }

  private hasRecentClosedEvidence(timestamp: number): boolean {
    return (
      this.lastClosedEvidenceAt !== null &&
      timestamp - this.lastClosedEvidenceAt <= CLOSED_EVIDENCE_TTL_MS
    );
  }

  private updateIdleState(
    distance: number,
    hasClosedEvidence: boolean,
    timestamp: number,
  ): InteractionState | null {
    if (!hasClosedEvidence) {
      this.closedStableSince = null;
      this.handsClosedExitSince = null;
      return null;
    }

    this.closedStableSince ??= timestamp;
    this.handsClosedExitSince = null;

    if (timestamp - this.closedStableSince >= CLOSED_STABLE_MS) {
      this.pullTrendSince = null;
      this.pullStartDistance = distance;
      this.lastPullMovementAt = null;
      this.handsClosedExitSince = null;
      return 'HandsClosed';
    }

    return null;
  }

  private updateHandsClosedState(
    distance: number,
    velocity: number | null,
    hasClosedEvidence: boolean,
    timestamp: number,
  ): InteractionState | null {
    if (hasClosedEvidence && distance <= CLOSED_EVIDENCE_DISTANCE_THRESHOLD) {
      this.closedStableSince ??= timestamp;
      this.pullTrendSince = null;
      this.pullStartDistance = Math.min(this.pullStartDistance ?? distance, distance);
      this.handsClosedExitSince = null;
      return null;
    }

    this.pullStartDistance ??= CLOSED_DISTANCE_THRESHOLD;

    if ((velocity ?? 0) > PULL_VELOCITY_THRESHOLD) {
      this.pullTrendSince ??= timestamp;
      this.lastPullMovementAt = timestamp;
      this.handsClosedExitSince = null;
    } else {
      this.pullTrendSince = null;
      this.handsClosedExitSince ??= timestamp;
    }

    const hasRecentPullMovement =
      this.lastPullMovementAt !== null &&
      timestamp - this.lastPullMovementAt <= PULL_MOVEMENT_MEMORY_MS;

    if (
      hasRecentPullMovement &&
      distance - this.pullStartDistance >= PULL_MIN_DISTANCE_DELTA
    ) {
      this.lastPullMovementAt = timestamp;
      this.handsClosedExitSince = null;
      return 'PullArmed';
    }

    if (
      this.handsClosedExitSince !== null &&
      timestamp - this.handsClosedExitSince >= HANDS_CLOSED_EXIT_GRACE_MS
    ) {
      this.closedStableSince = null;
      this.handsClosedExitSince = null;
      this.pullTrendSince = null;
      this.pullStartDistance = null;
      this.lastPullMovementAt = null;
      return 'EmptyIdle';
    }

    return null;
  }

  private updatePullArmedState(
    distance: number,
    velocity: number | null,
    hasClosedEvidence: boolean,
    timestamp: number,
  ): InteractionState | null {
    if (hasClosedEvidence && distance <= CLOSED_DISTANCE_THRESHOLD) {
      this.closedStableSince = timestamp;
      this.handsClosedExitSince = null;
      this.pullTrendSince = null;
      this.pullStartDistance = distance;
      return 'HandsClosed';
    }

    if ((velocity ?? 0) > PULL_VELOCITY_THRESHOLD) {
      this.lastPullMovementAt = timestamp;
      return null;
    }

    if (
      this.lastPullMovementAt !== null &&
      timestamp - this.lastPullMovementAt <= PULL_STOP_GRACE_MS
    ) {
      return null;
    }

    this.closedStableSince = null;
    this.handsClosedExitSince = null;
    this.pullTrendSince = null;
    this.pullStartDistance = null;
    return 'EmptyIdle';
  }

  private createSnapshot(
    geometry: {
      leftHand: NormalizedPoint;
      rightHand: NormalizedPoint;
      midpoint: NormalizedPoint;
      direction: NormalizedPoint;
      distance: number;
      distanceVelocity: number | null;
    } | null,
    bothHandsVisible: boolean,
    lostHandHoldActive: boolean,
    currentState: InteractionState,
  ): HandStartupGestureSnapshot {
    if (!geometry) {
      return {
        ...EMPTY_HAND_STARTUP_SNAPSHOT,
        bothHandsVisible,
        lostHandHoldActive,
        handsClosed: currentState === 'HandsClosed',
        pullArmed: currentState === 'PullArmed',
      };
    }

    return {
      leftHand: geometry.leftHand,
      rightHand: geometry.rightHand,
      midpoint: geometry.midpoint,
      direction: geometry.direction,
      distance: geometry.distance,
      distanceVelocity: geometry.distanceVelocity,
      bothHandsVisible,
      lostHandHoldActive,
      handsClosed: currentState === 'HandsClosed',
      pullArmed: currentState === 'PullArmed',
    };
  }

  private resetTrackingMemory(): void {
    this.leftFilter.reset();
    this.rightFilter.reset();
    this.lastVisiblePair = null;
    this.lastVisibleAt = null;
    this.lastDistance = null;
    this.lastDistanceAt = null;
    this.closedStableSince = null;
    this.lastClosedEvidenceAt = null;
    this.handsClosedExitSince = null;
    this.pullTrendSince = null;
    this.pullStartDistance = null;
    this.lastPullMovementAt = null;
    this.velocityFilter.reset();
    this.distanceFilter.reset();
  }
}

function getCurrentHandPair(
  tracking: TrackingSnapshot,
  previousPair: { left: NormalizedPoint; right: NormalizedPoint } | null,
): { left: TrackedHand; right: TrackedHand } | null {
  if (tracking.hands.hands.length >= 2) {
    const [first, second] = tracking.hands.hands;

    if (first && second) {
      return assignHandPair(first, second, previousPair);
    }
  }

  if (tracking.hands.left && tracking.hands.right) {
    return assignHandPair(tracking.hands.left, tracking.hands.right, previousPair);
  }

  return null;
}

function assignHandPair(
  first: TrackedHand,
  second: TrackedHand,
  previousPair: { left: NormalizedPoint; right: NormalizedPoint } | null,
): { left: TrackedHand; right: TrackedHand } {
  if (!previousPair) {
    return first.center.x <= second.center.x
      ? { left: first, right: second }
      : { left: second, right: first };
  }

  const directCost =
    distance2d(first.center, previousPair.left) +
    distance2d(second.center, previousPair.right);
  const swappedCost =
    distance2d(first.center, previousPair.right) +
    distance2d(second.center, previousPair.left);

  return directCost <= swappedCost
    ? { left: first, right: second }
    : { left: second, right: first };
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
    leftHand,
    rightHand,
    midpoint: {
      x: (leftHand.x + rightHand.x) / 2,
      y: (leftHand.y + rightHand.y) / 2,
      z: (leftHand.z + rightHand.z) / 2,
    },
    direction,
    distance,
    distanceVelocity: null,
  };
}

function isStartupState(state: InteractionState): boolean {
  return (
    state === 'CameraReady' ||
    state === 'EmptyIdle' ||
    state === 'HandsClosed' ||
    state === 'PullArmed'
  );
}

function distance2d(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
