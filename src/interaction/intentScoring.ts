import {
  averageNullable,
  clamp01,
  distance2d,
  distance3d,
  inverseLerp,
} from '../utils/math';
import type {
  GestureThresholds,
  HandPoseIntentSnapshot,
  NormalizedPoint,
  TrackedHand,
  WholeSystemControlState,
  WholeSystemReGripReason,
  WholeSystemReleaseBlockReason,
  WholeSystemRotationIntent,
  WholeSystemScaleIntent,
} from '../utils/types';
import type { TrackedHandPair } from './handPairing';
import {
  COLLAPSE_DISTANCE_WEIGHT,
  COLLAPSE_INWARD_RELAXED_SCORE,
  COLLAPSE_INWARD_WEIGHT,
  CONTROL_CONF_AVAILABILITY_WEIGHT,
  CONTROL_CONF_BASE,
  CONTROL_CONF_ENDPOINT_WEIGHT,
  CONTROL_CONF_INERTIA_WEIGHT,
  CONTROL_CONF_PALM_FLOOR,
  CONTROL_CONF_PALM_UP_FACTOR,
  CONTROL_CONF_PALM_WEIGHT,
  CONTROL_CONF_TRACKING_WEIGHT,
  CUPPED_GRIP_MAX_OPEN_FINGERS,
  CUPPED_GRIP_MAX_OPEN_SCORE,
  CUPPED_GRIP_MIN_GRIP_SCORE,
  CUPPED_GRIP_MIN_PALM_UP,
  GRIP_HOLD_MAX_OPEN_FINGERS,
  GRIP_HOLD_MIN_ENDPOINT_SCORE,
  GRIP_HOLD_MIN_GRIP_SCORE,
  GRIP_HOLD_MIN_PALM_UP,
  GRIP_HOLD_MIN_ROTATION,
  PINCH_PENALTY_BOTH,
  PINCH_PENALTY_SINGLE,
  PINCH_RATIO_THRESHOLD,
  REGRIP_CONF_AVAILABILITY_WEIGHT,
  REGRIP_CONF_ENDPOINT_WEIGHT,
  REGRIP_CONF_PALM_FLOOR,
  REGRIP_CONF_PALM_UP_FACTOR,
  REGRIP_CONF_PALM_WEIGHT,
  REGRIP_CONF_TRACKING_WEIGHT,
  RELEASE_BLOCK_MIN_ENDPOINT_SCORE,
  RELEASE_CONFIDENCE_ENDPOINT_MISS,
  RELEASE_CONFIDENCE_LOST_HAND,
  ROTATION_3D_POSTURE_THRESHOLD,
  ROTATION_HOLD_MIN_PALM_UP,
  ROTATION_HOLD_MIN_ROTATION_SCORE,
  ROTATION_INTENT_MIN_SCORE,
  SCALE_INTENT_MIN_SCORE,
  SCALE_MOVEMENT_WEIGHT,
  SCALE_PALM_FACING_WEIGHT,
  SCALE_VELOCITY_DEADBAND,
  SCALE_VELOCITY_FULL_SCORE,
  SPATIAL_NOT_FACING_WEIGHT,
  SPATIAL_PALM_FACING_PIVOT,
  WIDE_MAGNET_MIN_REGRIP_CONFIDENCE,
} from './intentTuning';

/**
 * Pure whole-system intent scoring: confidences, intent classification, endpoint matching, and
 * pinch separation. No cross-frame state — every function is a deterministic map from inputs to
 * scores, which the WholeSystemIntentController orchestrates via its state machine.
 */

export interface HandPointPair {
  left: NormalizedPoint;
  right: NormalizedPoint;
  bothHandsVisible: boolean;
  lostHandHoldActive: boolean;
}

export interface VirtualEndpoints {
  left: NormalizedPoint;
  right: NormalizedPoint;
}

export interface EndpointMatch {
  leftMatched: boolean;
  rightMatched: boolean;
  score: number;
}

export function computeGripHoldActive({
  endpointScore,
  palmUpScore,
  rotationIntentScore,
  leftHandPose,
  rightHandPose,
}: {
  endpointScore: number;
  palmUpScore: number;
  rotationIntentScore: number;
  leftHandPose: HandPoseIntentSnapshot;
  rightHandPose: HandPoseIntentSnapshot;
}): boolean {
  const averageGripScore = averageNullable(
    leftHandPose.gripPoseScore,
    rightHandPose.gripPoseScore,
  );
  const averageOpenFingerCount =
    (leftHandPose.openFingerCount + rightHandPose.openFingerCount) / 2;

  return (
    endpointScore >= GRIP_HOLD_MIN_ENDPOINT_SCORE &&
    (averageGripScore >= GRIP_HOLD_MIN_GRIP_SCORE ||
      averageOpenFingerCount <= GRIP_HOLD_MAX_OPEN_FINGERS ||
      palmUpScore >= GRIP_HOLD_MIN_PALM_UP ||
      rotationIntentScore >= GRIP_HOLD_MIN_ROTATION)
  );
}

export function computeReleaseBlockReason({
  endpointMatch,
  palmUpScore,
  rotationIntent,
  rotationIntentScore,
  leftHandPose,
  rightHandPose,
}: {
  endpointMatch: EndpointMatch;
  palmUpScore: number;
  rotationIntent: WholeSystemRotationIntent;
  rotationIntentScore: number;
  leftHandPose: HandPoseIntentSnapshot;
  rightHandPose: HandPoseIntentSnapshot;
}): WholeSystemReleaseBlockReason {
  if (endpointMatch.score < RELEASE_BLOCK_MIN_ENDPOINT_SCORE) {
    return 'none';
  }

  if (
    palmUpScore >= ROTATION_HOLD_MIN_PALM_UP &&
    (rotationIntent === 'rotate3d' ||
      rotationIntentScore >= ROTATION_HOLD_MIN_ROTATION_SCORE)
  ) {
    return 'rotationHold';
  }

  const minimumOpenScore = Math.min(
    leftHandPose.openHandScore ?? 0,
    rightHandPose.openHandScore ?? 0,
  );
  const averageGripScore = averageNullable(
    leftHandPose.gripPoseScore,
    rightHandPose.gripPoseScore,
  );
  const minimumOpenFingerCount = Math.min(
    leftHandPose.openFingerCount,
    rightHandPose.openFingerCount,
  );

  if (
    palmUpScore >= CUPPED_GRIP_MIN_PALM_UP &&
    (averageGripScore >= CUPPED_GRIP_MIN_GRIP_SCORE ||
      minimumOpenFingerCount < CUPPED_GRIP_MAX_OPEN_FINGERS ||
      minimumOpenScore < CUPPED_GRIP_MAX_OPEN_SCORE)
  ) {
    return 'cuppedGrip';
  }

  return 'none';
}

export function getReGripReason(
  state: WholeSystemControlState,
  preciseEndpointMatch: EndpointMatch,
  magnetEndpointMatch: EndpointMatch,
  reGripConfidence: number,
): WholeSystemReGripReason {
  if (
    state !== 'SolarFreeHover' &&
    state !== 'ReGripCandidate'
  ) {
    return 'none';
  }

  if (preciseEndpointMatch.leftMatched && preciseEndpointMatch.rightMatched) {
    return 'endpoint';
  }

  if (
    reGripConfidence >= WIDE_MAGNET_MIN_REGRIP_CONFIDENCE &&
    magnetEndpointMatch.leftMatched &&
    magnetEndpointMatch.rightMatched
  ) {
    return 'wideMagnet';
  }

  return 'none';
}

export function computeControlConfidence({
  endpointScore,
  availabilityScore,
  palmFacingScore,
  palmUpScore,
  pinchPenalty,
  hasStateInertia,
  trackingConfidence,
}: {
  endpointScore: number;
  availabilityScore: number;
  palmFacingScore: number;
  palmUpScore: number;
  pinchPenalty: number;
  hasStateInertia: boolean;
  trackingConfidence: number;
}): number {
  const palmScore = Math.max(
    palmFacingScore,
    palmUpScore * CONTROL_CONF_PALM_UP_FACTOR,
    CONTROL_CONF_PALM_FLOOR,
  );
  const stateInertiaScore = hasStateInertia ? 1 : 0;

  return clamp01(
    endpointScore * CONTROL_CONF_ENDPOINT_WEIGHT +
      availabilityScore * CONTROL_CONF_AVAILABILITY_WEIGHT +
      trackingConfidence * CONTROL_CONF_TRACKING_WEIGHT +
      palmScore * CONTROL_CONF_PALM_WEIGHT +
      CONTROL_CONF_BASE +
      stateInertiaScore * CONTROL_CONF_INERTIA_WEIGHT -
      pinchPenalty,
  );
}

export function computeReleaseConfidence(
  handPair: HandPointPair,
  endpointMatch: EndpointMatch,
  controlConfidence: number,
): number {
  const missingScore = handPair.bothHandsVisible
    ? 0
    : handPair.lostHandHoldActive
      ? RELEASE_CONFIDENCE_LOST_HAND
      : 1;
  const endpointMissScore =
    endpointMatch.leftMatched && endpointMatch.rightMatched
      ? 0
      : RELEASE_CONFIDENCE_ENDPOINT_MISS;

  return clamp01(
    Math.max(
      missingScore,
      endpointMissScore,
      1 - controlConfidence,
    ),
  );
}

export function computeReGripConfidence({
  endpointScore,
  availabilityScore,
  palmFacingScore,
  palmUpScore,
  pinchPenalty,
  trackingConfidence,
}: {
  endpointScore: number;
  availabilityScore: number;
  palmFacingScore: number;
  palmUpScore: number;
  pinchPenalty: number;
  trackingConfidence: number;
}): number {
  const palmScore = Math.max(
    palmFacingScore,
    palmUpScore * REGRIP_CONF_PALM_UP_FACTOR,
    REGRIP_CONF_PALM_FLOOR,
  );

  return clamp01(
    endpointScore * REGRIP_CONF_ENDPOINT_WEIGHT +
      availabilityScore * REGRIP_CONF_AVAILABILITY_WEIGHT +
      trackingConfidence * REGRIP_CONF_TRACKING_WEIGHT +
      palmScore * REGRIP_CONF_PALM_WEIGHT -
      pinchPenalty,
  );
}

export function computeScaleIntentScore(
  distanceVelocity: number | null,
  palmFacingScore: number,
): number {
  if (distanceVelocity === null) {
    return 0;
  }

  const movementScore = inverseLerp(
    SCALE_VELOCITY_DEADBAND,
    SCALE_VELOCITY_FULL_SCORE,
    Math.abs(distanceVelocity),
  );

  if (movementScore === 0) {
    return 0;
  }

  return clamp01(
    movementScore * SCALE_MOVEMENT_WEIGHT + palmFacingScore * SCALE_PALM_FACING_WEIGHT,
  );
}

export function getScaleIntent(
  distanceVelocity: number | null,
  score: number,
): WholeSystemScaleIntent {
  if (score < SCALE_INTENT_MIN_SCORE || distanceVelocity === null) {
    return 'none';
  }

  return distanceVelocity >= 0 ? 'scaleUp' : 'scaleDown';
}

export function getRotationIntent(
  score: number,
  palmUpScore: number,
  palmFacingScore: number,
): WholeSystemRotationIntent {
  if (score < ROTATION_INTENT_MIN_SCORE) {
    return 'none';
  }

  return computeSpatialPalmPostureScore(palmUpScore, palmFacingScore) >=
    ROTATION_3D_POSTURE_THRESHOLD
    ? 'rotate3d'
    : 'rotate2d';
}

export function computeSpatialPalmPostureScore(
  palmUpScore: number,
  palmFacingScore: number,
): number {
  const notCameraFacingScore = clamp01(
    (SPATIAL_PALM_FACING_PIVOT - palmFacingScore) / SPATIAL_PALM_FACING_PIVOT,
  );

  return Math.max(palmUpScore, notCameraFacingScore * SPATIAL_NOT_FACING_WEIGHT);
}

export function computeCollapseIntentScore(
  distance: number | null,
  distanceVelocity: number | null,
  thresholds: GestureThresholds,
): number {
  if (distance === null) {
    return 0;
  }

  const distanceScore = 1 - inverseLerp(
    thresholds.collapseCompleteDistance,
    thresholds.collapseStartDistance,
    distance,
  );
  const inwardMotionScore =
    distanceVelocity !== null && distanceVelocity < -SCALE_VELOCITY_DEADBAND
      ? 1
      : COLLAPSE_INWARD_RELAXED_SCORE;

  return clamp01(
    distanceScore * (COLLAPSE_DISTANCE_WEIGHT + inwardMotionScore * COLLAPSE_INWARD_WEIGHT),
  );
}

export function matchEndpoints(
  handPair: HandPointPair,
  endpoints: VirtualEndpoints,
  radius: number,
): EndpointMatch {
  const directLeftDistance = distance2d(handPair.left, endpoints.left);
  const directRightDistance = distance2d(handPair.right, endpoints.right);
  const swappedLeftDistance = distance2d(handPair.right, endpoints.left);
  const swappedRightDistance = distance2d(handPair.left, endpoints.right);
  const useDirect =
    directLeftDistance + directRightDistance <=
    swappedLeftDistance + swappedRightDistance;
  const leftDistance = useDirect ? directLeftDistance : swappedLeftDistance;
  const rightDistance = useDirect ? directRightDistance : swappedRightDistance;
  const leftScore = 1 - clamp01(leftDistance / radius);
  const rightScore = 1 - clamp01(rightDistance / radius);

  return {
    leftMatched: leftDistance <= radius,
    rightMatched: rightDistance <= radius,
    score: (leftScore + rightScore) / 2,
  };
}

export function computePinchPenalty(pair: TrackedHandPair): number {
  const leftPinch = isPinching(pair.left);
  const rightPinch = isPinching(pair.right);

  if (leftPinch && rightPinch) {
    return PINCH_PENALTY_BOTH;
  }

  return leftPinch || rightPinch ? PINCH_PENALTY_SINGLE : 0;
}

function isPinching(hand: TrackedHand): boolean {
  if (hand.palmScale <= 0) {
    return false;
  }

  return (
    distance3d(hand.thumbTip, hand.indexFingerTip) / hand.palmScale <=
    PINCH_RATIO_THRESHOLD
  );
}
