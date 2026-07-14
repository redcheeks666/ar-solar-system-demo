import type {
  GestureThresholds,
  HandStartupGestureSnapshot,
  InteractionState,
  NormalizedPoint,
  TrackingSnapshot,
  WholeSystemControlState,
  WholeSystemIntentSnapshot,
} from '../utils/types';
import {
  averageNullable,
  clamp01,
  distance2d,
  distance3d,
  inverseLerp,
  unwrapAngle,
} from '../utils/math';
import {
  getVisualTrackedHandPair,
  sortVisualLeftRight,
  type TrackedHandPair,
} from './handPairing';
import {
  AVAILABILITY_LOST_HAND_SCORE,
  COLLAPSE_ENTER_SCORE,
  COLLAPSE_EXIT_SCORE,
  COLLAPSE_STABLE_MS,
  CONTROL_ENTER_THRESHOLD,
  CONTROL_EXIT_THRESHOLD,
  FALLBACK_RELEASE_CONFIDENCE,
  PALM_NORMAL_ROTATION_DEADBAND,
  PALM_NORMAL_ROTATION_FULL_SCORE,
  REGRIP_STABLE_MS,
  RELEASE_CANCEL_REGRIP_CONFIDENCE,
  RELEASE_CONFIRM_MS,
  RELEASE_STABLE_MS,
  ROTATION_COMBINED_BASE,
  ROTATION_COMBINED_POSTURE_WEIGHT,
  ROTATION_PALM_MOTION_BASE,
  ROTATION_PALM_MOTION_POSTURE_WEIGHT,
  ROTATION_VELOCITY_DEADBAND,
  ROTATION_VELOCITY_FULL_SCORE,
} from './intentTuning';

import {
  computeHandPoseIntent,
  computeReleaseGesture,
  createEmptyHandPose,
} from './handPose';
import {
  averagePalmNormal,
  computePalmOrientation,
  createEmptyPalm,
} from './palmOrientation';
import {
  computeCollapseIntentScore,
  computeControlConfidence,
  computeGripHoldActive,
  computePinchPenaltySnapshot,
  computeReGripConfidence,
  computeReleaseBlockReason,
  computeReleaseConfidence,
  computeScaleIntentScore,
  computeSpatialPalmPostureScore,
  getReGripReason,
  getRotationIntent,
  getScaleIntent,
  matchEndpoints,
  type HandPointPair,
  type VirtualEndpoints,
} from './intentScoring';

export const EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT: WholeSystemIntentSnapshot = {
  controlState: 'Inactive',
  controlConfidence: 0,
  releaseConfidence: 0,
  reGripConfidence: 0,
  endpointHitScore: 0,
  leftPinchRatio: null,
  rightPinchRatio: null,
  pinchPenalty: 0,
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

/**
 * Whole-system interaction protocol controller — the orchestration layer.
 *
 * This class owns ONLY cross-frame state and the state machine; all stateless computation is
 * delegated to focused modules:
 *   - utils/math       vector/scalar helpers
 *   - handPairing      visual left/right hand assignment
 *   - palmOrientation  palm normal / facing-camera / up scores
 *   - handPose         open-hand / grip / release-ready scoring
 *   - intentScoring    control/release/re-grip confidence, scale/rotation/collapse intent,
 *                      endpoint matching, pinch separation
 *   - intentTuning     every tunable threshold and blend weight
 *
 * Owned state: control state, virtual endpoints, previous tracked pair, previous hand-axis angle
 * and palm normal (for rotation velocity), and the release/re-grip/collapse stable timers and
 * release latch. Lifecycle order:
 *   Inactive -> VirtualOpeningHandle -> SolarHandleControl
 *     -> ReleaseCandidate -> SolarFreeHover -> ReGripCandidate -> SolarHandleControl
 *     -> SolarClosing -> Inactive
 *
 * It must not render any 3D content. Its protocol fields are legacy diagnostics; the product
 * endpoint lifecycle that moves between SolarFreeHover and SolarHandleControl lives in
 * SolarOpeningController. Keep the two data sources visibly distinct in logs and replay reports.
 */
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

    const pinchSnapshot = trackedPair
      ? computePinchPenaltySnapshot(trackedPair)
      : { leftRatio: null, rightRatio: null, penalty: 0 };
    const pinchPenalty = pinchSnapshot.penalty;
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
      leftPinchRatio: pinchSnapshot.leftRatio,
      rightPinchRatio: pinchSnapshot.rightRatio,
      pinchPenalty,
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

  /**
   * Rotation-intent scoring is STATEFUL: it needs the previous-frame hand-axis angle and palm
   * normal to derive angular / normal velocity. That is why these three methods live in the
   * controller instead of the pure intentScoring module — do not relocate or "purify" them.
   */
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
