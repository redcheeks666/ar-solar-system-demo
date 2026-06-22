import type {
  GestureThresholds,
  HandStartupGestureSnapshot,
  InteractionState,
  HandPoseIntentSnapshot,
  NormalizedPoint,
  PalmOrientationSnapshot,
  TrackedHand,
  TrackingSnapshot,
  WholeSystemReleaseBlockReason,
  WholeSystemReGripReason,
  WholeSystemControlState,
  WholeSystemIntentSnapshot,
  WholeSystemRotationIntent,
  WholeSystemScaleIntent,
} from '../utils/types';
import {
  averageNullable,
  averagePoints,
  clamp01,
  cosineSimilarity,
  cross,
  distance2d,
  distance3d,
  inverseLerp,
  normalize,
  subtract,
  unwrapAngle,
} from '../utils/math';
import {
  getVisualTrackedHandPair,
  sortVisualLeftRight,
  type TrackedHandPair,
} from './handPairing';
import {
  AVAILABILITY_LOST_HAND_SCORE,
  COLLAPSE_DISTANCE_WEIGHT,
  COLLAPSE_ENTER_SCORE,
  COLLAPSE_EXIT_SCORE,
  COLLAPSE_INWARD_RELAXED_SCORE,
  COLLAPSE_INWARD_WEIGHT,
  COLLAPSE_STABLE_MS,
  CONTROL_CONF_AVAILABILITY_WEIGHT,
  CONTROL_CONF_BASE,
  CONTROL_CONF_ENDPOINT_WEIGHT,
  CONTROL_CONF_INERTIA_WEIGHT,
  CONTROL_CONF_PALM_FLOOR,
  CONTROL_CONF_PALM_UP_FACTOR,
  CONTROL_CONF_PALM_WEIGHT,
  CONTROL_CONF_TRACKING_WEIGHT,
  CONTROL_ENTER_THRESHOLD,
  CONTROL_EXIT_THRESHOLD,
  CUPPED_GRIP_MAX_OPEN_FINGERS,
  CUPPED_GRIP_MAX_OPEN_SCORE,
  CUPPED_GRIP_MIN_GRIP_SCORE,
  CUPPED_GRIP_MIN_PALM_UP,
  FALLBACK_RELEASE_CONFIDENCE,
  FINGER_AWAY_MAX,
  FINGER_AWAY_MIN,
  FINGER_AWAY_WEIGHT,
  FINGER_CURLED_THRESHOLD,
  FINGER_EXTENSION_MAX,
  FINGER_EXTENSION_MIN,
  FINGER_EXTENSION_WEIGHT,
  FINGER_OPEN_THRESHOLD,
  FINGER_STRAIGHT_MAX,
  FINGER_STRAIGHT_MIN,
  FINGER_STRAIGHT_WEIGHT,
  GRIP_HOLD_MAX_OPEN_FINGERS,
  GRIP_HOLD_MIN_ENDPOINT_SCORE,
  GRIP_HOLD_MIN_GRIP_SCORE,
  GRIP_HOLD_MIN_PALM_UP,
  GRIP_HOLD_MIN_ROTATION,
  GRIP_POSE_CURLED_WEIGHT,
  GRIP_POSE_OPEN_WEIGHT,
  OPEN_HAND_FINGER_WEIGHT,
  OPEN_HAND_THUMB_WEIGHT,
  PALM_NORMAL_ROTATION_DEADBAND,
  PALM_NORMAL_ROTATION_FULL_SCORE,
  PINCH_PENALTY_BOTH,
  PINCH_PENALTY_SINGLE,
  PINCH_RATIO_THRESHOLD,
  REGRIP_CONF_AVAILABILITY_WEIGHT,
  REGRIP_CONF_ENDPOINT_WEIGHT,
  REGRIP_CONF_PALM_FLOOR,
  REGRIP_CONF_PALM_UP_FACTOR,
  REGRIP_CONF_PALM_WEIGHT,
  REGRIP_CONF_TRACKING_WEIGHT,
  REGRIP_STABLE_MS,
  RELEASE_BLOCK_MIN_ENDPOINT_SCORE,
  RELEASE_CANCEL_REGRIP_CONFIDENCE,
  RELEASE_CONFIDENCE_ENDPOINT_MISS,
  RELEASE_CONFIDENCE_LOST_HAND,
  RELEASE_CONFIRM_MS,
  RELEASE_GRIP_CANCEL_THRESHOLD,
  RELEASE_MIN_OPEN_FINGERS,
  RELEASE_OPEN_SCORE_THRESHOLD,
  RELEASE_STABLE_MS,
  ROTATION_3D_POSTURE_THRESHOLD,
  ROTATION_COMBINED_BASE,
  ROTATION_COMBINED_POSTURE_WEIGHT,
  ROTATION_HOLD_MIN_PALM_UP,
  ROTATION_HOLD_MIN_ROTATION_SCORE,
  ROTATION_INTENT_MIN_SCORE,
  ROTATION_PALM_MOTION_BASE,
  ROTATION_PALM_MOTION_POSTURE_WEIGHT,
  ROTATION_VELOCITY_DEADBAND,
  ROTATION_VELOCITY_FULL_SCORE,
  SCALE_INTENT_MIN_SCORE,
  SCALE_MOVEMENT_WEIGHT,
  SCALE_PALM_FACING_WEIGHT,
  SCALE_VELOCITY_DEADBAND,
  SCALE_VELOCITY_FULL_SCORE,
  SPATIAL_NOT_FACING_WEIGHT,
  SPATIAL_PALM_FACING_PIVOT,
  THUMB_AWAY_MAX,
  THUMB_AWAY_MIN,
  THUMB_AWAY_WEIGHT,
  THUMB_OPEN_THRESHOLD,
  THUMB_STRAIGHT_MAX,
  THUMB_STRAIGHT_MIN,
  THUMB_STRAIGHT_WEIGHT,
  WIDE_MAGNET_MIN_REGRIP_CONFIDENCE,
} from './intentTuning';

const WRIST_INDEX = 0;
const THUMB_CMC_INDEX = 1;
const THUMB_MCP_INDEX = 2;
const THUMB_TIP_INDEX = 4;
const INDEX_MCP_INDEX = 5;
const INDEX_PIP_INDEX = 6;
const INDEX_TIP_INDEX = 8;
const MIDDLE_MCP_INDEX = 9;
const MIDDLE_PIP_INDEX = 10;
const MIDDLE_TIP_INDEX = 12;
const RING_MCP_INDEX = 13;
const RING_PIP_INDEX = 14;
const RING_TIP_INDEX = 16;
const PINKY_MCP_INDEX = 17;
const PINKY_PIP_INDEX = 18;
const PINKY_TIP_INDEX = 20;

export const EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT: WholeSystemIntentSnapshot = {
  controlState: 'Inactive',
  controlConfidence: 0,
  releaseConfidence: 0,
  reGripConfidence: 0,
  endpointHitScore: 0,
  trackingConfidence: 0,
  scaleIntent: 'none',
  scaleIntentScore: 0,
  rotationIntent: 'none',
  rotationIntentScore: 0,
  collapseIntentScore: 0,
  leftPalm: createEmptyPalm(),
  rightPalm: createEmptyPalm(),
  leftHandPose: createEmptyHandPose(),
  rightHandPose: createEmptyHandPose(),
  releaseGestureActive: false,
  releaseGestureLatched: false,
  releaseGestureScore: 0,
  releaseStableMs: 0,
  releaseBlockReason: 'none',
  gripHoldActive: false,
  reGripReason: 'none',
  virtualLeftEndpoint: null,
  virtualRightEndpoint: null,
  leftEndpointMatched: false,
  rightEndpointMatched: false,
  transitionReason: 'inactive',
};

interface HandPointPair {
  left: NormalizedPoint;
  right: NormalizedPoint;
  bothHandsVisible: boolean;
  lostHandHoldActive: boolean;
}

interface VirtualEndpoints {
  left: NormalizedPoint;
  right: NormalizedPoint;
}

interface EndpointMatch {
  leftMatched: boolean;
  rightMatched: boolean;
  score: number;
}

export class WholeSystemIntentController {
  private controlState: WholeSystemControlState = 'Inactive';
  private endpoints: VirtualEndpoints | null = null;
  private previousTrackedPair: { left: NormalizedPoint; right: NormalizedPoint } | null =
    null;
  private previousAngle: number | null = null;
  private previousAngleAt: number | null = null;
  private previousPalmNormal: NormalizedPoint | null = null;
  private previousPalmNormalAt: number | null = null;
  private controlStableSince: number | null = null;
  private releaseCandidateSince: number | null = null;
  private releaseGestureStableSince: number | null = null;
  private releaseStableMs = 0;
  private releaseGestureLatched = false;
  private reGripStableSince: number | null = null;
  private collapseStableSince: number | null = null;

  update(
    tracking: TrackingSnapshot,
    startup: HandStartupGestureSnapshot,
    interactionState: InteractionState,
    timestamp: number,
    thresholds: GestureThresholds,
    trackingConfidence: number,
  ): WholeSystemIntentSnapshot {
    const trackedPair = this.resolveTrackedPair(tracking);
    const handPair = resolveHandPointPair(startup, trackedPair);
    const leftPalm = trackedPair ? computePalmOrientation(trackedPair.left) : createEmptyPalm();
    const rightPalm = trackedPair
      ? computePalmOrientation(trackedPair.right)
      : createEmptyPalm();
    const leftHandPose = trackedPair
      ? computeHandPoseIntent(trackedPair.left)
      : createEmptyHandPose();
    const rightHandPose = trackedPair
      ? computeHandPoseIntent(trackedPair.right)
      : createEmptyHandPose();
    const releaseGestureEvidence = computeReleaseGesture(
      leftHandPose,
      rightHandPose,
    );

    if (!this.endpoints && startup.pullArmed && handPair) {
      this.establishVirtualEndpoints(handPair);
      this.controlState = 'VirtualOpeningHandle';
      this.controlStableSince = timestamp;
    }

    if (!this.endpoints) {
      if (!startup.pullArmed && interactionState === 'EmptyIdle') {
        this.resetVirtualControl();
      }

      return {
        ...EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT,
        controlState: this.controlState,
        leftPalm,
        rightPalm,
        leftHandPose,
        rightHandPose,
        releaseGestureActive: false,
        releaseGestureLatched: this.releaseGestureLatched,
        releaseGestureScore: releaseGestureEvidence.score,
        releaseStableMs: this.resetReleaseStability(),
        trackingConfidence,
        transitionReason: 'waiting-for-virtual-endpoints',
      };
    }

    if (!handPair) {
      this.updateMissingHandState(timestamp);

      return {
        ...EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT,
        controlState: this.controlState,
        releaseConfidence: isActiveControlState(this.controlState) ? 1 : 0,
        leftPalm,
        rightPalm,
        leftHandPose,
        rightHandPose,
        releaseGestureActive: false,
        releaseGestureLatched: this.releaseGestureLatched,
        releaseGestureScore: releaseGestureEvidence.score,
        releaseStableMs: this.resetReleaseStability(),
        trackingConfidence,
        virtualLeftEndpoint: this.endpoints.left,
        virtualRightEndpoint: this.endpoints.right,
        transitionReason: 'missing-hand-pair',
      };
    }

    const endpointMatch = matchEndpoints(
      handPair,
      this.endpoints,
      this.getEndpointRadius(thresholds),
    );
    const preciseEndpointMatch = matchEndpoints(
      handPair,
      this.endpoints,
      thresholds.endpointEnterRadius,
    );
    this.updateReleaseLatchFromEndpointExit(handPair, thresholds);

    const pinchPenalty = trackedPair ? computePinchPenalty(trackedPair) : 0;
    const palmFacingScore = averageNullable(
      leftPalm.facingCameraScore,
      rightPalm.facingCameraScore,
    );
    const palmUpScore = averageNullable(leftPalm.upScore, rightPalm.upScore);
    const controlConfidence = computeControlConfidence({
      endpointScore: endpointMatch.score,
      availabilityScore: handPair.bothHandsVisible
        ? 1
        : handPair.lostHandHoldActive
          ? AVAILABILITY_LOST_HAND_SCORE
          : 0,
      palmFacingScore,
      palmUpScore,
      pinchPenalty,
      hasStateInertia: isActiveControlState(this.controlState),
      trackingConfidence,
    });
    const releaseConfidence = computeReleaseConfidence(
      handPair,
      endpointMatch,
      controlConfidence,
    );
    const reGripConfidence = computeReGripConfidence({
      endpointScore: endpointMatch.score,
      availabilityScore: handPair.bothHandsVisible ? 1 : 0,
      palmFacingScore,
      palmUpScore,
      pinchPenalty,
      trackingConfidence,
    });
    const scaleIntentScore = computeScaleIntentScore(
      startup.distanceVelocity,
      palmFacingScore,
    );
    const scaleIntent = getScaleIntent(startup.distanceVelocity, scaleIntentScore);
    const rotationIntentScore = this.computeRotationIntentScore(
      startup.direction,
      palmUpScore,
      palmFacingScore,
      averagePalmNormal(leftPalm.normal, rightPalm.normal),
      timestamp,
    );
    const rotationIntent = getRotationIntent(
      rotationIntentScore,
      palmUpScore,
      palmFacingScore,
    );
    const collapseIntentScore = computeCollapseIntentScore(
      startup.distance,
      startup.distanceVelocity,
      thresholds,
    );
    const gripHoldActive = computeGripHoldActive({
      endpointScore: endpointMatch.score,
      palmUpScore,
      rotationIntentScore,
      leftHandPose,
      rightHandPose,
    });
    const releaseBlockReason = computeReleaseBlockReason({
      endpointMatch,
      palmUpScore,
      rotationIntent,
      rotationIntentScore,
      leftHandPose,
      rightHandPose,
    });
    const releaseGestureActive = this.updateReleaseGestureStability({
      canRelease:
        this.controlState === 'SolarHandleControl' &&
        releaseGestureEvidence.active &&
        releaseBlockReason === 'none',
      timestamp,
    });
    const reGripReason = getReGripReason(
      this.controlState,
      preciseEndpointMatch,
      endpointMatch,
      reGripConfidence,
    );

    const transitionReason = this.updateControlState({
      handPair,
      controlConfidence,
      releaseConfidence,
      reGripConfidence,
      collapseIntentScore,
      releaseGestureActive,
      gripHoldActive,
      timestamp,
      thresholds,
    });

    if (shouldFollowHands(this.controlState, controlConfidence)) {
      this.establishVirtualEndpoints(handPair);
    }

    return {
      controlState: this.controlState,
      controlConfidence,
      releaseConfidence,
      reGripConfidence,
      endpointHitScore: endpointMatch.score,
      trackingConfidence,
      scaleIntent,
      scaleIntentScore,
      rotationIntent,
      rotationIntentScore,
      collapseIntentScore,
      leftPalm,
      rightPalm,
      leftHandPose,
      rightHandPose,
      releaseGestureActive,
      releaseGestureLatched: this.releaseGestureLatched,
      releaseGestureScore: releaseGestureEvidence.score,
      releaseStableMs: this.releaseStableMs,
      releaseBlockReason,
      gripHoldActive,
      reGripReason,
      virtualLeftEndpoint: this.endpoints?.left ?? null,
      virtualRightEndpoint: this.endpoints?.right ?? null,
      leftEndpointMatched: endpointMatch.leftMatched,
      rightEndpointMatched: endpointMatch.rightMatched,
      transitionReason,
    };
  }

  reset(): void {
    this.resetVirtualControl();
    this.previousTrackedPair = null;
    this.previousAngle = null;
    this.previousAngleAt = null;
    this.previousPalmNormal = null;
    this.previousPalmNormalAt = null;
    this.releaseGestureLatched = false;
    this.resetReleaseStability();
  }

  private getEndpointRadius(thresholds: GestureThresholds): number {
    return this.controlState === 'SolarFreeHover' ||
      this.controlState === 'ReGripCandidate'
      ? thresholds.reGripMagnetRadius
      : thresholds.endpointExitRadius;
  }

  private resolveTrackedPair(tracking: TrackingSnapshot): TrackedHandPair | null {
    const currentPair = getVisualTrackedHandPair(tracking, this.previousTrackedPair);

    if (!currentPair) {
      return null;
    }

    this.previousTrackedPair = {
      left: currentPair.left.center,
      right: currentPair.right.center,
    };

    return currentPair;
  }

  private establishVirtualEndpoints(handPair: HandPointPair): void {
    this.endpoints = {
      left: { ...handPair.left },
      right: { ...handPair.right },
    };
  }

  private updateControlState({
    handPair,
    controlConfidence,
    releaseConfidence,
    reGripConfidence,
    collapseIntentScore,
    releaseGestureActive,
    gripHoldActive,
    timestamp,
    thresholds,
  }: {
    handPair: HandPointPair;
    controlConfidence: number;
    releaseConfidence: number;
    reGripConfidence: number;
    collapseIntentScore: number;
    releaseGestureActive: boolean;
    gripHoldActive: boolean;
    timestamp: number;
    thresholds: GestureThresholds;
  }): string {
    if (this.controlState === 'VirtualOpeningHandle') {
      if (controlConfidence >= CONTROL_ENTER_THRESHOLD) {
        this.controlStableSince ??= timestamp;

        if (timestamp - this.controlStableSince >= REGRIP_STABLE_MS) {
          this.controlState = 'SolarHandleControl';
          this.controlStableSince = null;
          return 'virtual-handle-control-stable';
        }
        return 'virtual-handle-stabilizing';
      } else {
        this.controlStableSince = null;
      }

      return 'waiting-for-control-confidence';
    }

    if (this.controlState === 'SolarHandleControl') {
      if (collapseIntentScore >= COLLAPSE_ENTER_SCORE) {
        this.collapseStableSince ??= timestamp;

        if (timestamp - this.collapseStableSince >= COLLAPSE_STABLE_MS) {
          this.controlState = 'SolarClosing';
          this.collapseStableSince = null;
          return 'collapse-intent-stable';
        }

        return 'collapse-intent-stabilizing';
      }

      this.collapseStableSince = null;

      if (releaseGestureActive) {
        this.enterReleaseCandidate(timestamp, true);
        return 'open-hand-release-stable';
      }

      if (
        !gripHoldActive &&
        (controlConfidence < CONTROL_EXIT_THRESHOLD ||
          releaseConfidence >= FALLBACK_RELEASE_CONFIDENCE)
      ) {
        this.enterReleaseCandidate(timestamp, false);
        return 'fallback-release-confidence';
      }

      return 'holding-endpoints';
    }

    if (this.controlState === 'ReleaseCandidate') {
      if (
        !this.releaseGestureLatched &&
        !releaseGestureActive &&
        controlConfidence >= CONTROL_ENTER_THRESHOLD &&
        reGripConfidence >= RELEASE_CANCEL_REGRIP_CONFIDENCE
      ) {
        this.controlState = 'SolarHandleControl';
        this.releaseCandidateSince = null;
        return 'release-candidate-cancelled';
      }

      if (
        this.releaseCandidateSince !== null &&
        timestamp - this.releaseCandidateSince >= RELEASE_CONFIRM_MS
      ) {
        this.controlState = 'SolarFreeHover';
        this.releaseCandidateSince = null;
        return 'release-confirmed-free-hover';
      }

      return 'release-candidate-waiting';
    }

    if (this.controlState === 'SolarFreeHover') {
      if (this.releaseGestureLatched) {
        this.reGripStableSince = null;
        return 'release-lock-waiting-for-hand-exit';
      }

      if (reGripConfidence >= CONTROL_ENTER_THRESHOLD) {
        this.reGripStableSince ??= timestamp;
        this.controlState = 'ReGripCandidate';
        return 'regrip-confidence-entered';
      }

      return 'free-hover-waiting-for-regrip';
    }

    if (this.controlState === 'ReGripCandidate') {
      if (this.releaseGestureLatched) {
        this.controlState = 'SolarFreeHover';
        this.reGripStableSince = null;
        return 'regrip-blocked-by-release-lock';
      }

      if (reGripConfidence >= CONTROL_ENTER_THRESHOLD) {
        this.reGripStableSince ??= timestamp;

        if (timestamp - this.reGripStableSince >= REGRIP_STABLE_MS) {
          this.controlState = 'SolarHandleControl';
          this.reGripStableSince = null;
          return 'regrip-stable-control-restored';
        }
        return 'regrip-stabilizing';
      } else {
        this.controlState = 'SolarFreeHover';
        this.reGripStableSince = null;
        return 'regrip-confidence-lost';
      }
    }

    if (this.controlState === 'SolarClosing') {
      if (
        handPair.bothHandsVisible &&
        distance2d(handPair.left, handPair.right) <= thresholds.collapseCompleteDistance
      ) {
        this.resetVirtualControl();
        return 'collapse-complete-reset-empty';
      }

      if (collapseIntentScore < COLLAPSE_EXIT_SCORE) {
        this.controlState = 'SolarHandleControl';
        return 'collapse-cancelled';
      }

      return 'collapse-continuing';
    }

    return 'inactive';
  }

  private resetVirtualControl(): void {
    this.controlState = 'Inactive';
    this.endpoints = null;
    this.controlStableSince = null;
    this.releaseCandidateSince = null;
    this.reGripStableSince = null;
    this.collapseStableSince = null;
    this.previousAngle = null;
    this.previousAngleAt = null;
    this.previousPalmNormal = null;
    this.previousPalmNormalAt = null;
    this.releaseGestureLatched = false;
    this.resetReleaseStability();
  }

  private updateReleaseGestureStability({
    canRelease,
    timestamp,
  }: {
    canRelease: boolean;
    timestamp: number;
  }): boolean {
    if (!canRelease) {
      this.resetReleaseStability();
      return false;
    }

    this.releaseGestureStableSince ??= timestamp;
    this.releaseStableMs = timestamp - this.releaseGestureStableSince;

    return this.releaseStableMs >= RELEASE_STABLE_MS;
  }

  private resetReleaseStability(): number {
    this.releaseGestureStableSince = null;
    this.releaseStableMs = 0;

    return this.releaseStableMs;
  }

  private updateMissingHandState(timestamp: number): void {
    if (
      this.controlState === 'VirtualOpeningHandle' ||
      this.controlState === 'SolarHandleControl' ||
      this.controlState === 'SolarClosing'
    ) {
      this.enterReleaseCandidate(timestamp, false);
      return;
    }

    if (
      this.controlState === 'ReleaseCandidate' &&
      this.releaseCandidateSince !== null &&
      timestamp - this.releaseCandidateSince >= RELEASE_CONFIRM_MS
    ) {
      this.controlState = 'SolarFreeHover';
    }

    if (this.controlState === 'SolarFreeHover') {
      this.releaseGestureLatched = false;
    }
  }

  private enterReleaseCandidate(
    timestamp: number,
    fromOpenHandRelease: boolean,
  ): void {
    this.controlState = 'ReleaseCandidate';
    this.releaseCandidateSince = timestamp;
    this.releaseGestureLatched = fromOpenHandRelease;
    this.resetReleaseStability();
  }

  private updateReleaseLatchFromEndpointExit(
    handPair: HandPointPair,
    thresholds: GestureThresholds,
  ): void {
    if (
      !this.releaseGestureLatched ||
      !this.endpoints ||
      (this.controlState !== 'SolarFreeHover' &&
        this.controlState !== 'ReGripCandidate')
    ) {
      return;
    }

    const releaseExitMatch = matchEndpoints(
      handPair,
      this.endpoints,
      thresholds.releaseReGripClearRadius,
    );

    if (!releaseExitMatch.leftMatched || !releaseExitMatch.rightMatched) {
      this.releaseGestureLatched = false;
    }
  }

  private computeRotationIntentScore(
    direction: NormalizedPoint | null,
    palmUpScore: number,
    palmFacingScore: number,
    palmNormal: NormalizedPoint | null,
    timestamp: number,
  ): number {
    const angleMotionScore = this.computeHandleAngleMotionScore(direction, timestamp);
    const palmMotionScore = this.computePalmNormalMotionScore(palmNormal, timestamp);
    const spatialPostureScore = computeSpatialPalmPostureScore(
      palmUpScore,
      palmFacingScore,
    );
    const combinedMotionScore = Math.max(
      angleMotionScore,
      palmMotionScore *
        (ROTATION_PALM_MOTION_BASE +
          spatialPostureScore * ROTATION_PALM_MOTION_POSTURE_WEIGHT),
    );

    if (combinedMotionScore === 0) {
      return 0;
    }

    return clamp01(
      combinedMotionScore *
        (ROTATION_COMBINED_BASE + spatialPostureScore * ROTATION_COMBINED_POSTURE_WEIGHT),
    );
  }

  private computeHandleAngleMotionScore(
    direction: NormalizedPoint | null,
    timestamp: number,
  ): number {
    if (!direction) {
      return 0;
    }

    const angle = Math.atan2(direction.y, direction.x);

    if (this.previousAngle === null) {
      this.previousAngle = angle;
      this.previousAngleAt = timestamp;
      return 0;
    }

    const previousAt = this.previousAngleAt ?? timestamp;
    const deltaSeconds = Math.max((timestamp - previousAt) / 1000, 0.001);
    const angularVelocity = Math.abs(
      unwrapAngle(angle - this.previousAngle) / deltaSeconds,
    );

    this.previousAngle = angle;
    this.previousAngleAt = timestamp;

    return inverseLerp(
      ROTATION_VELOCITY_DEADBAND,
      ROTATION_VELOCITY_FULL_SCORE,
      angularVelocity,
    );
  }

  private computePalmNormalMotionScore(
    palmNormal: NormalizedPoint | null,
    timestamp: number,
  ): number {
    if (!palmNormal) {
      return 0;
    }

    if (!this.previousPalmNormal) {
      this.previousPalmNormal = palmNormal;
      this.previousPalmNormalAt = timestamp;
      return 0;
    }

    const previousAt = this.previousPalmNormalAt ?? timestamp;
    const deltaSeconds = Math.max((timestamp - previousAt) / 1000, 0.001);
    const normalDelta = distance3d(palmNormal, this.previousPalmNormal);
    const normalVelocity = normalDelta / deltaSeconds;

    this.previousPalmNormal = palmNormal;
    this.previousPalmNormalAt = timestamp;

    return inverseLerp(
      PALM_NORMAL_ROTATION_DEADBAND,
      PALM_NORMAL_ROTATION_FULL_SCORE,
      normalVelocity,
    );
  }
}

function resolveHandPointPair(
  startup: HandStartupGestureSnapshot,
  trackedPair: TrackedHandPair | null,
): HandPointPair | null {
  if (startup.leftHand && startup.rightHand) {
    const visualPair = sortVisualLeftRight(startup.leftHand, startup.rightHand);

    return {
      left: visualPair.left,
      right: visualPair.right,
      bothHandsVisible: startup.bothHandsVisible,
      lostHandHoldActive: startup.lostHandHoldActive,
    };
  }

  if (trackedPair) {
    return {
      left: trackedPair.left.center,
      right: trackedPair.right.center,
      bothHandsVisible: true,
      lostHandHoldActive: false,
    };
  }

  return null;
}

function computePalmOrientation(hand: TrackedHand): PalmOrientationSnapshot {
  const wrist = hand.landmarks[WRIST_INDEX];
  const indexMcp = hand.landmarks[INDEX_MCP_INDEX];
  const middleMcp = hand.landmarks[MIDDLE_MCP_INDEX];
  const pinkyMcp = hand.landmarks[PINKY_MCP_INDEX];

  if (!wrist || !indexMcp || !middleMcp || !pinkyMcp) {
    return createEmptyPalm();
  }

  const palmAcross = subtract(pinkyMcp, indexMcp);
  const palmLength = subtract(middleMcp, wrist);
  const normal = normalize(cross(palmAcross, palmLength));

  if (!normal) {
    return createEmptyPalm();
  }

  return {
    normal,
    facingCameraScore: clamp01(Math.abs(normal.z)),
    upScore: clamp01(Math.abs(normal.y)),
  };
}

function computeHandPoseIntent(hand: TrackedHand): HandPoseIntentSnapshot {
  const wrist = hand.landmarks[WRIST_INDEX];
  const indexMcp = hand.landmarks[INDEX_MCP_INDEX];
  const middleMcp = hand.landmarks[MIDDLE_MCP_INDEX];
  const ringMcp = hand.landmarks[RING_MCP_INDEX];
  const pinkyMcp = hand.landmarks[PINKY_MCP_INDEX];
  const thumbCmc = hand.landmarks[THUMB_CMC_INDEX];
  const thumbMcp = hand.landmarks[THUMB_MCP_INDEX];
  const thumbTip = hand.landmarks[THUMB_TIP_INDEX];

  if (
    !wrist ||
    !indexMcp ||
    !middleMcp ||
    !ringMcp ||
    !pinkyMcp ||
    !thumbCmc ||
    !thumbMcp ||
    !thumbTip ||
    hand.palmScale <= 0
  ) {
    return createEmptyHandPose();
  }

  const palmCenter = averagePoints([wrist, indexMcp, middleMcp, ringMcp, pinkyMcp]);
  const fingerScores = [
    computeLongFingerOpenScore(hand, INDEX_MCP_INDEX, INDEX_PIP_INDEX, INDEX_TIP_INDEX),
    computeLongFingerOpenScore(
      hand,
      MIDDLE_MCP_INDEX,
      MIDDLE_PIP_INDEX,
      MIDDLE_TIP_INDEX,
    ),
    computeLongFingerOpenScore(hand, RING_MCP_INDEX, RING_PIP_INDEX, RING_TIP_INDEX),
    computeLongFingerOpenScore(
      hand,
      PINKY_MCP_INDEX,
      PINKY_PIP_INDEX,
      PINKY_TIP_INDEX,
    ),
  ];
  const thumbOpenScore = computeThumbOpenScore(hand, palmCenter);
  const longFingerOpenCount = fingerScores.filter(
    (score) => score >= FINGER_OPEN_THRESHOLD,
  ).length;
  const curledFingerCount = fingerScores.filter(
    (score) => score < FINGER_CURLED_THRESHOLD,
  ).length;
  const longFingerAverage =
    fingerScores.reduce((sum, score) => sum + score, 0) / fingerScores.length;
  const openHandScore = clamp01(
    longFingerAverage * OPEN_HAND_FINGER_WEIGHT + thumbOpenScore * OPEN_HAND_THUMB_WEIGHT,
  );
  const gripPoseScore = clamp01(
    (1 - openHandScore) * GRIP_POSE_OPEN_WEIGHT +
      (curledFingerCount / fingerScores.length) * GRIP_POSE_CURLED_WEIGHT,
  );

  return {
    openHandScore,
    gripPoseScore,
    openFingerCount:
      longFingerOpenCount + (thumbOpenScore >= THUMB_OPEN_THRESHOLD ? 1 : 0),
    releaseReady:
      openHandScore >= RELEASE_OPEN_SCORE_THRESHOLD &&
      longFingerOpenCount >= RELEASE_MIN_OPEN_FINGERS &&
      gripPoseScore <= RELEASE_GRIP_CANCEL_THRESHOLD,
  };
}

function computeLongFingerOpenScore(
  hand: TrackedHand,
  mcpIndex: number,
  pipIndex: number,
  tipIndex: number,
): number {
  const mcp = hand.landmarks[mcpIndex];
  const pip = hand.landmarks[pipIndex];
  const tip = hand.landmarks[tipIndex];

  if (!mcp || !pip || !tip || hand.palmScale <= 0) {
    return 0;
  }

  const straightness = cosineSimilarity(subtract(pip, mcp), subtract(tip, pip));
  const straightScore = inverseLerp(
    FINGER_STRAIGHT_MIN,
    FINGER_STRAIGHT_MAX,
    straightness,
  );
  const extensionScore = inverseLerp(
    FINGER_EXTENSION_MIN,
    FINGER_EXTENSION_MAX,
    distance3d(tip, mcp) / hand.palmScale,
  );
  const awayScore = inverseLerp(
    FINGER_AWAY_MIN,
    FINGER_AWAY_MAX,
    distance3d(tip, hand.center) / hand.palmScale,
  );

  return clamp01(
    straightScore * FINGER_STRAIGHT_WEIGHT +
      extensionScore * FINGER_EXTENSION_WEIGHT +
      awayScore * FINGER_AWAY_WEIGHT,
  );
}

function computeThumbOpenScore(
  hand: TrackedHand,
  palmCenter: NormalizedPoint,
): number {
  const thumbCmc = hand.landmarks[THUMB_CMC_INDEX];
  const thumbMcp = hand.landmarks[THUMB_MCP_INDEX];
  const thumbTip = hand.landmarks[THUMB_TIP_INDEX];

  if (!thumbCmc || !thumbMcp || !thumbTip || hand.palmScale <= 0) {
    return 0;
  }

  const straightness = cosineSimilarity(
    subtract(thumbMcp, thumbCmc),
    subtract(thumbTip, thumbMcp),
  );
  const straightScore = inverseLerp(
    THUMB_STRAIGHT_MIN,
    THUMB_STRAIGHT_MAX,
    straightness,
  );
  const awayScore = inverseLerp(
    THUMB_AWAY_MIN,
    THUMB_AWAY_MAX,
    distance3d(thumbTip, palmCenter) / hand.palmScale,
  );

  return clamp01(straightScore * THUMB_STRAIGHT_WEIGHT + awayScore * THUMB_AWAY_WEIGHT);
}

function computeReleaseGesture(
  leftHandPose: HandPoseIntentSnapshot,
  rightHandPose: HandPoseIntentSnapshot,
): { active: boolean; score: number } {
  const leftScore = leftHandPose.openHandScore ?? 0;
  const rightScore = rightHandPose.openHandScore ?? 0;
  const score = Math.min(leftScore, rightScore);

  return {
    active: leftHandPose.releaseReady && rightHandPose.releaseReady,
    score,
  };
}

function computeGripHoldActive({
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

function computeReleaseBlockReason({
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

function getReGripReason(
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

function computeControlConfidence({
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

function computeReleaseConfidence(
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

function computeReGripConfidence({
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

function computeScaleIntentScore(
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

function getScaleIntent(
  distanceVelocity: number | null,
  score: number,
): WholeSystemScaleIntent {
  if (score < SCALE_INTENT_MIN_SCORE || distanceVelocity === null) {
    return 'none';
  }

  return distanceVelocity >= 0 ? 'scaleUp' : 'scaleDown';
}

function getRotationIntent(
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

function computeSpatialPalmPostureScore(
  palmUpScore: number,
  palmFacingScore: number,
): number {
  const notCameraFacingScore = clamp01(
    (SPATIAL_PALM_FACING_PIVOT - palmFacingScore) / SPATIAL_PALM_FACING_PIVOT,
  );

  return Math.max(palmUpScore, notCameraFacingScore * SPATIAL_NOT_FACING_WEIGHT);
}

function averagePalmNormal(
  leftNormal: NormalizedPoint | null,
  rightNormal: NormalizedPoint | null,
): NormalizedPoint | null {
  if (!leftNormal && !rightNormal) {
    return null;
  }

  if (!leftNormal) {
    return rightNormal;
  }

  if (!rightNormal) {
    return leftNormal;
  }

  return normalize({
    x: (leftNormal.x + rightNormal.x) / 2,
    y: (leftNormal.y + rightNormal.y) / 2,
    z: (leftNormal.z + rightNormal.z) / 2,
  });
}

function computeCollapseIntentScore(
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

function matchEndpoints(
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

function computePinchPenalty(pair: TrackedHandPair): number {
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

function shouldFollowHands(
  state: WholeSystemControlState,
  controlConfidence: number,
): boolean {
  return (
    (state === 'VirtualOpeningHandle' ||
      state === 'SolarHandleControl' ||
      state === 'SolarClosing') &&
    controlConfidence >= CONTROL_EXIT_THRESHOLD
  );
}

function isActiveControlState(state: WholeSystemControlState): boolean {
  return (
    state === 'VirtualOpeningHandle' ||
    state === 'SolarHandleControl' ||
    state === 'ReleaseCandidate' ||
    state === 'SolarClosing'
  );
}

function createEmptyPalm(): PalmOrientationSnapshot {
  return {
    normal: null,
    facingCameraScore: null,
    upScore: null,
  };
}

function createEmptyHandPose(): HandPoseIntentSnapshot {
  return {
    openHandScore: null,
    gripPoseScore: null,
    openFingerCount: 0,
    releaseReady: false,
  };
}

