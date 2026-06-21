import type {
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

const CONTROL_ENTER_THRESHOLD = 0.7;
const CONTROL_EXIT_THRESHOLD = 0.35;
const RELEASE_CONFIRM_MS = 480;
const RELEASE_STABLE_MS = 280;
const REGRIP_STABLE_MS = 220;
const COLLAPSE_STABLE_MS = 180;
const ENDPOINT_ENTER_RADIUS = 0.16;
const ENDPOINT_EXIT_RADIUS = 0.24;
const REGRIP_MAGNET_RADIUS = 0.34;
const RELEASE_REGRIP_CLEAR_RADIUS = ENDPOINT_EXIT_RADIUS;
const SCALE_VELOCITY_DEADBAND = 0.025;
const SCALE_VELOCITY_FULL_SCORE = 0.22;
const ROTATION_VELOCITY_DEADBAND = 0.9;
const ROTATION_VELOCITY_FULL_SCORE = 3.4;
const PALM_NORMAL_ROTATION_DEADBAND = 0.45;
const PALM_NORMAL_ROTATION_FULL_SCORE = 2.4;
const COLLAPSE_START_DISTANCE = 0.34;
const COLLAPSE_COMPLETE_DISTANCE = 0.19;
const PINCH_RATIO_THRESHOLD = 0.2;
const RELEASE_OPEN_SCORE_THRESHOLD = 0.82;
const RELEASE_GRIP_CANCEL_THRESHOLD = 0.44;
const RELEASE_MIN_OPEN_FINGERS = 4;

export const EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT: WholeSystemIntentSnapshot = {
  controlState: 'Inactive',
  controlConfidence: 0,
  releaseConfidence: 0,
  reGripConfidence: 0,
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
};

interface HandPointPair {
  left: NormalizedPoint;
  right: NormalizedPoint;
  bothHandsVisible: boolean;
  lostHandHoldActive: boolean;
}

interface TrackedHandPair {
  left: TrackedHand;
  right: TrackedHand;
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
        virtualLeftEndpoint: this.endpoints.left,
        virtualRightEndpoint: this.endpoints.right,
      };
    }

    const endpointMatch = matchEndpoints(handPair, this.endpoints, this.endpointRadius);
    const preciseEndpointMatch = matchEndpoints(
      handPair,
      this.endpoints,
      ENDPOINT_ENTER_RADIUS,
    );
    this.updateReleaseLatchFromEndpointExit(handPair);

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
          ? 0.55
          : 0,
      palmFacingScore,
      palmUpScore,
      pinchPenalty,
      hasStateInertia: isActiveControlState(this.controlState),
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

    this.updateControlState({
      handPair,
      controlConfidence,
      releaseConfidence,
      reGripConfidence,
      collapseIntentScore,
      releaseGestureActive,
      gripHoldActive,
      timestamp,
    });

    if (shouldFollowHands(this.controlState, controlConfidence)) {
      this.establishVirtualEndpoints(handPair);
    }

    return {
      controlState: this.controlState,
      controlConfidence,
      releaseConfidence,
      reGripConfidence,
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

  private get endpointRadius(): number {
    return this.controlState === 'SolarFreeHover' ||
      this.controlState === 'ReGripCandidate'
      ? REGRIP_MAGNET_RADIUS
      : ENDPOINT_EXIT_RADIUS;
  }

  private resolveTrackedPair(tracking: TrackingSnapshot): TrackedHandPair | null {
    const currentPair = getCurrentTrackedHandPair(tracking, this.previousTrackedPair);

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
  }: {
    handPair: HandPointPair;
    controlConfidence: number;
    releaseConfidence: number;
    reGripConfidence: number;
    collapseIntentScore: number;
    releaseGestureActive: boolean;
    gripHoldActive: boolean;
    timestamp: number;
  }): void {
    if (this.controlState === 'VirtualOpeningHandle') {
      if (controlConfidence >= CONTROL_ENTER_THRESHOLD) {
        this.controlStableSince ??= timestamp;

        if (timestamp - this.controlStableSince >= REGRIP_STABLE_MS) {
          this.controlState = 'SolarHandleControl';
          this.controlStableSince = null;
        }
      } else {
        this.controlStableSince = null;
      }

      return;
    }

    if (this.controlState === 'SolarHandleControl') {
      if (collapseIntentScore >= 0.72) {
        this.collapseStableSince ??= timestamp;

        if (timestamp - this.collapseStableSince >= COLLAPSE_STABLE_MS) {
          this.controlState = 'SolarClosing';
          this.collapseStableSince = null;
        }

        return;
      }

      this.collapseStableSince = null;

      if (releaseGestureActive) {
        this.enterReleaseCandidate(timestamp, true);
        return;
      }

      if (
        !gripHoldActive &&
        (controlConfidence < CONTROL_EXIT_THRESHOLD || releaseConfidence >= 0.78)
      ) {
        this.enterReleaseCandidate(timestamp, false);
      }

      return;
    }

    if (this.controlState === 'ReleaseCandidate') {
      if (
        !this.releaseGestureLatched &&
        !releaseGestureActive &&
        controlConfidence >= CONTROL_ENTER_THRESHOLD &&
        reGripConfidence >= 0.62
      ) {
        this.controlState = 'SolarHandleControl';
        this.releaseCandidateSince = null;
        return;
      }

      if (
        this.releaseCandidateSince !== null &&
        timestamp - this.releaseCandidateSince >= RELEASE_CONFIRM_MS
      ) {
        this.controlState = 'SolarFreeHover';
        this.releaseCandidateSince = null;
      }

      return;
    }

    if (this.controlState === 'SolarFreeHover') {
      if (this.releaseGestureLatched) {
        this.reGripStableSince = null;
        return;
      }

      if (reGripConfidence >= CONTROL_ENTER_THRESHOLD) {
        this.reGripStableSince ??= timestamp;
        this.controlState = 'ReGripCandidate';
      }

      return;
    }

    if (this.controlState === 'ReGripCandidate') {
      if (this.releaseGestureLatched) {
        this.controlState = 'SolarFreeHover';
        this.reGripStableSince = null;
        return;
      }

      if (reGripConfidence >= CONTROL_ENTER_THRESHOLD) {
        this.reGripStableSince ??= timestamp;

        if (timestamp - this.reGripStableSince >= REGRIP_STABLE_MS) {
          this.controlState = 'SolarHandleControl';
          this.reGripStableSince = null;
        }
      } else {
        this.controlState = 'SolarFreeHover';
        this.reGripStableSince = null;
      }

      return;
    }

    if (this.controlState === 'SolarClosing') {
      if (
        handPair.bothHandsVisible &&
        distance2d(handPair.left, handPair.right) <= COLLAPSE_COMPLETE_DISTANCE
      ) {
        this.resetVirtualControl();
        return;
      }

      if (collapseIntentScore < 0.36) {
        this.controlState = 'SolarHandleControl';
      }
    }
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

  private updateReleaseLatchFromEndpointExit(handPair: HandPointPair): void {
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
      RELEASE_REGRIP_CLEAR_RADIUS,
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
      palmMotionScore * (0.62 + spatialPostureScore * 0.38),
    );

    if (combinedMotionScore === 0) {
      return 0;
    }

    return clamp01(combinedMotionScore * (0.72 + spatialPostureScore * 0.28));
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

function getCurrentTrackedHandPair(
  tracking: TrackingSnapshot,
  previousPair: { left: NormalizedPoint; right: NormalizedPoint } | null,
): TrackedHandPair | null {
  const [first, second] = tracking.hands.hands;

  if (first && second) {
    return assignTrackedHandPair(first, second, previousPair);
  }

  if (tracking.hands.left && tracking.hands.right) {
    return assignTrackedHandPair(
      tracking.hands.left,
      tracking.hands.right,
      previousPair,
    );
  }

  return null;
}

function assignTrackedHandPair(
  first: TrackedHand,
  second: TrackedHand,
  previousPair: { left: NormalizedPoint; right: NormalizedPoint } | null,
): TrackedHandPair {
  if (!previousPair) {
    return first.center.x >= second.center.x
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

function sortVisualLeftRight(
  first: NormalizedPoint,
  second: NormalizedPoint,
): { left: NormalizedPoint; right: NormalizedPoint } {
  return first.x >= second.x
    ? { left: first, right: second }
    : { left: second, right: first };
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
  const longFingerOpenCount = fingerScores.filter((score) => score >= 0.62).length;
  const curledFingerCount = fingerScores.filter((score) => score < 0.5).length;
  const longFingerAverage =
    fingerScores.reduce((sum, score) => sum + score, 0) / fingerScores.length;
  const openHandScore = clamp01(longFingerAverage * 0.88 + thumbOpenScore * 0.12);
  const gripPoseScore = clamp01(
    (1 - openHandScore) * 0.46 + (curledFingerCount / 4) * 0.54,
  );

  return {
    openHandScore,
    gripPoseScore,
    openFingerCount: longFingerOpenCount + (thumbOpenScore >= 0.62 ? 1 : 0),
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
  const straightScore = inverseLerp(0.45, 0.92, straightness);
  const extensionScore = inverseLerp(
    0.58,
    1.08,
    distance3d(tip, mcp) / hand.palmScale,
  );
  const awayScore = inverseLerp(
    0.62,
    1.22,
    distance3d(tip, hand.center) / hand.palmScale,
  );

  return clamp01(straightScore * 0.48 + extensionScore * 0.34 + awayScore * 0.18);
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
  const straightScore = inverseLerp(0.35, 0.88, straightness);
  const awayScore = inverseLerp(
    0.58,
    1.2,
    distance3d(thumbTip, palmCenter) / hand.palmScale,
  );

  return clamp01(straightScore * 0.42 + awayScore * 0.58);
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
    endpointScore >= 0.22 &&
    (averageGripScore >= 0.24 ||
      averageOpenFingerCount <= 4 ||
      palmUpScore >= 0.44 ||
      rotationIntentScore >= 0.18)
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
  if (endpointMatch.score < 0.32) {
    return 'none';
  }

  if (
    palmUpScore >= 0.38 &&
    (rotationIntent === 'rotate3d' || rotationIntentScore >= 0.28)
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
    palmUpScore >= 0.48 &&
    (averageGripScore >= 0.24 ||
      minimumOpenFingerCount < 5 ||
      minimumOpenScore < 0.9)
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
    reGripConfidence >= 0.62 &&
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
}: {
  endpointScore: number;
  availabilityScore: number;
  palmFacingScore: number;
  palmUpScore: number;
  pinchPenalty: number;
  hasStateInertia: boolean;
}): number {
  const palmScore = Math.max(palmFacingScore, palmUpScore * 0.8, 0.45);
  const stateInertiaScore = hasStateInertia ? 1 : 0;

  return clamp01(
    endpointScore * 0.42 +
      availabilityScore * 0.24 +
      palmScore * 0.16 +
      0.12 +
      stateInertiaScore * 0.06 -
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
      ? 0.28
      : 1;
  const endpointMissScore =
    endpointMatch.leftMatched && endpointMatch.rightMatched ? 0 : 0.62;

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
}: {
  endpointScore: number;
  availabilityScore: number;
  palmFacingScore: number;
  palmUpScore: number;
  pinchPenalty: number;
}): number {
  const palmScore = Math.max(palmFacingScore, palmUpScore * 0.75, 0.35);

  return clamp01(
    endpointScore * 0.58 +
      availabilityScore * 0.26 +
      palmScore * 0.16 -
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

  return clamp01(movementScore * 0.78 + palmFacingScore * 0.22);
}

function getScaleIntent(
  distanceVelocity: number | null,
  score: number,
): WholeSystemScaleIntent {
  if (score < 0.18 || distanceVelocity === null) {
    return 'none';
  }

  return distanceVelocity >= 0 ? 'scaleUp' : 'scaleDown';
}

function getRotationIntent(
  score: number,
  palmUpScore: number,
  palmFacingScore: number,
): WholeSystemRotationIntent {
  if (score < 0.18) {
    return 'none';
  }

  return computeSpatialPalmPostureScore(palmUpScore, palmFacingScore) >= 0.28
    ? 'rotate3d'
    : 'rotate2d';
}

function computeSpatialPalmPostureScore(
  palmUpScore: number,
  palmFacingScore: number,
): number {
  const notCameraFacingScore = clamp01((0.72 - palmFacingScore) / 0.72);

  return Math.max(palmUpScore, notCameraFacingScore * 0.66);
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
): number {
  if (distance === null) {
    return 0;
  }

  const distanceScore = 1 - inverseLerp(
    COLLAPSE_COMPLETE_DISTANCE,
    COLLAPSE_START_DISTANCE,
    distance,
  );
  const inwardMotionScore =
    distanceVelocity !== null && distanceVelocity < -SCALE_VELOCITY_DEADBAND
      ? 1
      : 0.42;

  return clamp01(distanceScore * (0.72 + inwardMotionScore * 0.28));
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
    return 0.28;
  }

  return leftPinch || rightPinch ? 0.18 : 0;
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

function subtract(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function cross(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(point: NormalizedPoint): NormalizedPoint | null {
  const length = distance3d(point, { x: 0, y: 0, z: 0 });

  if (length <= 0.00001) {
    return null;
  }

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length,
  };
}

function averageNullable(a: number | null, b: number | null): number {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return b ?? 0;
  }

  if (b === null) {
    return a;
  }

  return (a + b) / 2;
}

function inverseLerp(from: number, to: number, value: number): number {
  if (from === to) {
    return value >= to ? 1 : 0;
  }

  return clamp01((value - from) / (to - from));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function distance2d(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distance3d(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function cosineSimilarity(a: NormalizedPoint, b: NormalizedPoint): number {
  const aLength = distance3d(a, { x: 0, y: 0, z: 0 });
  const bLength = distance3d(b, { x: 0, y: 0, z: 0 });

  if (aLength <= 0.00001 || bLength <= 0.00001) {
    return 0;
  }

  return clamp01(
    (a.x * b.x + a.y * b.y + a.z * b.z) / (aLength * bLength),
  );
}

function unwrapAngle(angle: number): number {
  if (angle > Math.PI) {
    return angle - Math.PI * 2;
  }

  if (angle < -Math.PI) {
    return angle + Math.PI * 2;
  }

  return angle;
}
