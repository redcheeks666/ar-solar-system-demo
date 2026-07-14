import { distance2d } from '../utils/math';
import type {
  InteractionState,
  NormalizedPoint,
  TrackingSnapshot,
  TrackedHand,
} from '../utils/types';
import { mapNormalizedToStagePixel, type PreviewLayout } from './coordinateMapping';
import type {
  CelestialBodyScreenTarget,
} from '../solar/solarSystem';
import type {
  CelestialOriginalOrbitTransform,
  InteractiveCelestialBodyId,
} from '../solar/solarSystemData';

export type PlanetActivationPinchState =
  | 'idle'
  | 'open'
  | 'close-ready'
  | 'closed'
  | 'pinching'
  | 'held-during-loss';

export interface PlanetActivationSnapshot {
  hoveredBody: InteractiveCelestialBodyId | null;
  activatedBody: InteractiveCelestialBodyId | null;
  activeHandKey: string | null;
  pinchState: PlanetActivationPinchState;
  pinchDistance: number | null;
  pinchDistancePx: number | null;
  pinchRatio: number | null;
  pinchStartThreshold: number;
  pinchEndThreshold: number;
  hoverDistancePx: number | null;
  hoverHitRadiusPx: number | null;
  hoverScreenPosition: { x: number; y: number } | null;
  hoverPointKind: HandInteractionPointKind | null;
  activatedOriginalOrbit: CelestialOriginalOrbitTransform | null;
  trackingLossMs: number;
  doubleCloseCount: number;
  doubleCloseValleyRatio: number | null;
  doubleClosePeakRatio: number | null;
  doubleCloseProminence: number | null;
  doubleCloseTimeoutRemainingMs: number | null;
  doubleCloseFailureReason: string | null;
  transitionReason: string;
}

export interface PlanetActivationUpdate {
  snapshot: PlanetActivationSnapshot;
  nextState: InteractionState | null;
}

export interface PlanetActivationUpdateInput {
  tracking: TrackingSnapshot;
  interactionState: InteractionState;
  targets: readonly CelestialBodyScreenTarget[];
  layout: PreviewLayout;
  timestamp: number;
}

interface Candidate {
  target: CelestialBodyScreenTarget;
  hand: TrackedHand;
  handKey: string;
  handPixel: { x: number; y: number };
  handPointKind: HandInteractionPointKind;
  distancePx: number;
  normalizedDistance: number;
}

interface PinchMetrics {
  distance: number;
  distancePx: number;
  ratio: number;
}

type HandInteractionPointKind =
  | 'pinchMidpoint'
  | 'thumbTip'
  | 'indexTip'
  | 'palmCenter';

type DoubleClosePhase =
  | 'wait-initial-open'
  | 'wait-first-valley'
  | 'wait-peak'
  | 'wait-second-valley'
  | 'wait-final-release';

type DoubleCloseUpdate =
  | 'first-close'
  | 'peak-ready'
  | 'second-close'
  | 'focus-entry'
  | null;

const PINCH_START_RATIO = 0.48;
const PINCH_END_RATIO = 0.62;
const PINCH_START_MAX_DISTANCE_PX = 96;
const PINCH_END_MAX_DISTANCE_PX = 128;
// A valley is a physically closed thumb/index pair relative to palm size; 0.35 includes deliberate
// shallow clicks while remaining below the ordinary partially-open range.
const DOUBLE_CLOSE_VALLEY_MAX_RATIO = 0.35;
// A peak is a deliberate reopen between clicks; 0.50 is separated from the closed band without
// requiring the larger 0.62 activation-pinch release.
const DOUBLE_CLOSE_PEAK_MIN_RATIO = 0.5;
// Peak prominence measures intentional close-open travel. A quarter palm-scale separates that
// travel from normal fingertip jitter while leaving margin for unequal click depths.
const DOUBLE_CLOSE_MIN_PROMINENCE = 0.25;
// Every valley and the intervening peak needs two fresh detection frames: one-frame spikes cannot
// decide an important transition, while 33-66ms click bottoms remain valid at webcam frame rates.
const DOUBLE_CLOSE_MIN_EXTREMUM_FRAMES = 2;
// The final reopen must remain visible for the existing release gate before focus entry.
const DOUBLE_CLOSE_FINAL_RELEASE_STABLE_MS = 70;
// Human double-click cadence may include a deliberate reset between clicks; the interval is still
// bounded so a much later independent pinch cannot complete an old gesture.
const DOUBLE_CLOSE_MAX_INTERVAL_MS = 3800;
// The activation pinch itself is excluded from the two subsequent click valleys.
const DOUBLE_CLOSE_IGNORE_AFTER_ACTIVATION_MS = 180;
// Focus entry is rate-limited after a completed double-close release.
const DOUBLE_CLOSE_ENTER_FOCUS_COOLDOWN_MS = 900;
const HOVER_EXIT_RADIUS_MULTIPLIER = 1.32;
const ACTIVATION_EXIT_HOLD_MS = 1000;
const HOVER_SWITCH_MARGIN = 0.24;
const ACTIVATION_TRACKING_LOSS_HOLD_MS = 360;

export const EMPTY_PLANET_ACTIVATION_SNAPSHOT: PlanetActivationSnapshot = {
  hoveredBody: null,
  activatedBody: null,
  activeHandKey: null,
  pinchState: 'idle',
  pinchDistance: null,
  pinchDistancePx: null,
  pinchRatio: null,
  pinchStartThreshold: PINCH_START_RATIO,
  pinchEndThreshold: PINCH_END_RATIO,
  hoverDistancePx: null,
  hoverHitRadiusPx: null,
  hoverScreenPosition: null,
  hoverPointKind: null,
  activatedOriginalOrbit: null,
  trackingLossMs: 0,
  doubleCloseCount: 0,
  doubleCloseValleyRatio: null,
  doubleClosePeakRatio: null,
  doubleCloseProminence: null,
  doubleCloseTimeoutRemainingMs: null,
  doubleCloseFailureReason: null,
  transitionReason: 'inactive',
};

export class PlanetActivationController {
  private hoveredBody: InteractiveCelestialBodyId | null = null;
  private activatedBody: InteractiveCelestialBodyId | null = null;
  private activeHandKey: string | null = null;
  private activatedAtMs: number | null = null;
  private fallbackSolarState: Extract<
    InteractionState,
    'SolarActive' | 'SolarFreeHover'
  > = 'SolarFreeHover';
  private trackingLostSince: number | null = null;
  private activationExitStartedAt: number | null = null;
  private lockedHoverPointKind: HandInteractionPointKind | null = null;
  private switchArmedBody: InteractiveCelestialBodyId | null = null;
  private doubleCloseCount = 0;
  private doubleClosePhase: DoubleClosePhase = 'wait-initial-open';
  private firstValleyAt: number | null = null;
  private firstValleyRatio: number | null = null;
  private candidateValleyStartedAt: number | null = null;
  private candidateValleyRatio: number | null = null;
  private candidateValleyFrames = 0;
  private peakRatio: number | null = null;
  private peakStableFrames = 0;
  private finalReleaseStartedAt: number | null = null;
  private doubleCloseTimeoutRemainingMs: number | null = null;
  private doubleCloseFailureReason: string | null = null;
  private focusCooldownUntil = 0;
  private snapshot = EMPTY_PLANET_ACTIVATION_SNAPSHOT;

  update(input: PlanetActivationUpdateInput): PlanetActivationUpdate {
    if (input.interactionState === 'SolarActive') {
      this.fallbackSolarState = 'SolarActive';
    } else if (input.interactionState === 'SolarFreeHover') {
      this.fallbackSolarState = 'SolarFreeHover';
    }

    if (isPlanetFocusState(input.interactionState)) {
      const snapshot = this.createSnapshot({
        hoverCandidate: null,
        pinchMetrics: null,
        pinchState: this.activatedBody ? 'pinching' : 'idle',
        reason: this.activatedBody ? 'focus-view-active' : 'focus-view-missing-activation',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: null };
    }

    if (!canRunPlanetActivation(input.interactionState)) {
      this.reset();
      return {
        snapshot: {
          ...EMPTY_PLANET_ACTIVATION_SNAPSHOT,
          transitionReason: 'inactive-state',
        },
        nextState: null,
      };
    }

    this.releaseInteractionPointLockIfFullyOpen(input);
    const candidates = this.createCandidates(input);
    const hoverCandidate = this.selectHoverCandidate(candidates);

    if (input.interactionState === 'PlanetActivated' || this.activatedBody) {
      return this.updateActivated(input, candidates, hoverCandidate);
    }

    this.trackingLostSince = null;
    this.hoveredBody = hoverCandidate?.target.id ?? null;

    if (!hoverCandidate) {
      const snapshot = this.createSnapshot({
        hoverCandidate,
        pinchMetrics: null,
        pinchState: 'idle',
        reason: 'no-body-hover',
      });
      this.snapshot = snapshot;
      return {
        snapshot,
        nextState:
          input.interactionState === 'BodyHover' ? this.fallbackSolarState : null,
      };
    }

    const pinchMetrics = computePinchMetrics(hoverCandidate.hand, input.layout);
    if (isPinchStart(pinchMetrics)) {
      this.activateBody(hoverCandidate, input.timestamp);
      const snapshot = this.createSnapshot({
        hoverCandidate,
        pinchMetrics,
        pinchState: 'pinching',
        reason: 'pinch-activated-body',
      });
      this.snapshot = snapshot;
      return {
        snapshot,
        nextState: 'PlanetActivated',
      };
    }

    const snapshot = this.createSnapshot({
      hoverCandidate,
      pinchMetrics,
      pinchState: 'open',
      reason: 'body-hovered',
    });
    this.snapshot = snapshot;

    return {
      snapshot,
      nextState: input.interactionState === 'BodyHover' ? null : 'BodyHover',
    };
  }

  getSnapshot(): PlanetActivationSnapshot {
    return this.snapshot;
  }

  reset(): void {
    this.hoveredBody = null;
    this.activatedBody = null;
    this.activeHandKey = null;
    this.activatedAtMs = null;
    this.trackingLostSince = null;
    this.activationExitStartedAt = null;
    this.lockedHoverPointKind = null;
    this.switchArmedBody = null;
    this.resetDoubleClose();
    this.snapshot = EMPTY_PLANET_ACTIVATION_SNAPSHOT;
  }

  private updateActivated(
    input: PlanetActivationUpdateInput,
    candidates: Candidate[],
    hoverCandidate: Candidate | null,
  ): PlanetActivationUpdate {
    const activeBody = this.activatedBody;

    if (!activeBody) {
      const snapshot = this.createSnapshot({
        hoverCandidate,
        pinchMetrics: null,
        pinchState: 'idle',
        reason: 'activation-missing-body',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: this.fallbackSolarState };
    }

    const activeCandidate =
      this.findActiveHandCandidate(candidates, activeBody) ??
      this.findCandidateByBody(candidates, activeBody);

    if (!activeCandidate) {
      this.interruptDoubleCloseObservation();
      this.switchArmedBody = null;
      this.trackingLostSince ??= input.timestamp;
      const trackingLossMs = input.timestamp - this.trackingLostSince;
      const snapshot = this.createSnapshot({
        hoverCandidate,
        pinchMetrics: null,
        pinchState: 'held-during-loss',
        reason: 'holding-activation-during-brief-hand-loss',
        trackingLossMs,
      });
      this.snapshot = snapshot;

      if (trackingLossMs <= ACTIVATION_TRACKING_LOSS_HOLD_MS) {
        return { snapshot, nextState: null };
      }

      this.clearActivation();
      const nextState = hoverCandidate ? 'BodyHover' : this.fallbackSolarState;
      return {
        snapshot: {
          ...snapshot,
          activatedBody: null,
          activeHandKey: null,
          pinchState: hoverCandidate ? 'open' : 'idle',
          transitionReason: 'activation-ended-after-hand-loss',
        },
        nextState,
      };
    }

    this.trackingLostSince = null;
    const pinchMetrics = computePinchMetrics(activeCandidate.hand, input.layout);
    const sameHandHover =
      hoverCandidate?.handKey === activeCandidate.handKey
        ? hoverCandidate
        : null;
    const fullyOpen = pinchMetrics.ratio >= PINCH_END_RATIO;
    let switchArmedThisFrame = false;

    if (fullyOpen) {
      this.lockedHoverPointKind = null;
      if (sameHandHover && sameHandHover.target.id !== activeBody) {
        this.switchArmedBody = sameHandHover.target.id;
        this.hoveredBody = sameHandHover.target.id;
        switchArmedThisFrame = true;
      } else {
        this.switchArmedBody = null;
        this.hoveredBody = activeBody;
      }
    } else {
      const armedSwitchCandidate =
        this.switchArmedBody &&
        sameHandHover?.target.id === this.switchArmedBody
          ? sameHandHover
          : null;

      // A body switch is legal only when the open hand first hovered that body. The subsequent
      // close commits that already-armed intent; a closed hand drifting into a neighbour can never
      // switch selection or clear the in-progress double-close sequence.
      if (armedSwitchCandidate && isPinchStart(pinchMetrics)) {
        this.activateBody(armedSwitchCandidate, input.timestamp);
        this.trackingLostSince = null;
        const snapshot = this.createSnapshot({
          hoverCandidate: armedSwitchCandidate,
          pinchMetrics,
          pinchState: 'pinching',
          reason: 'activation-switched-body-after-open-hover',
        });
        this.snapshot = snapshot;
        return { snapshot, nextState: null };
      }

      if (pinchMetrics.ratio <= DOUBLE_CLOSE_VALLEY_MAX_RATIO) {
        this.lockedHoverPointKind ??= activeCandidate.handPointKind;
        this.switchArmedBody = null;
      }
      this.hoveredBody = activeBody;
    }

    const activeHandNearBody =
      activeCandidate.normalizedDistance <= HOVER_EXIT_RADIUS_MULTIPLIER;
    const pinchHeld = isPinchHeld(pinchMetrics);

    if (pinchHeld || activeHandNearBody) {
      this.activationExitStartedAt = null;
    }

    if (!pinchHeld && !activeHandNearBody) {
      this.activationExitStartedAt ??= input.timestamp;
      const exitMs = input.timestamp - this.activationExitStartedAt;

      if (exitMs >= ACTIVATION_EXIT_HOLD_MS) {
        this.clearActivation();
        const nextHover =
          hoverCandidate?.target.id === activeBody ? hoverCandidate : null;
        this.hoveredBody = nextHover?.target.id ?? null;
        const snapshot = this.createSnapshot({
          hoverCandidate: nextHover,
          pinchMetrics,
          pinchState: nextHover ? 'open' : 'idle',
          reason: 'pinch-ended',
        });
        this.snapshot = snapshot;
        return {
          snapshot,
          nextState: nextHover ? 'BodyHover' : this.fallbackSolarState,
        };
      }
    }

    const doubleClose = this.updateDoubleClose(
      pinchMetrics.ratio,
      input.timestamp,
      this.activatedAtMs ?? input.timestamp,
    );

    const lockedHover =
      this.findActiveHandCandidate(candidates, activeBody) ??
      this.findCandidateByBody(candidates, activeBody) ??
      hoverCandidate;

    if (doubleClose === 'focus-entry') {
      const snapshot = this.createSnapshot({
        hoverCandidate: lockedHover,
        pinchMetrics,
        pinchState: 'open',
        reason: 'double-close-release-enter-focus',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: 'PlanetFocusView' };
    }

    const snapshot = this.createSnapshot({
      hoverCandidate: switchArmedThisFrame ? sameHandHover : lockedHover,
      pinchMetrics,
      pinchState: this.getPinchState(pinchMetrics),
      reason: this.getActivatedReason(
        doubleClose,
        switchArmedThisFrame,
        pinchMetrics,
      ),
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private createCandidates(input: PlanetActivationUpdateInput): Candidate[] {
    const candidates: Candidate[] = [];

    input.tracking.hands.hands.forEach((hand, handIndex) => {
      const handKey = createHandKey(hand, handIndex);
      const handPoints = createHandInteractionPoints(hand, input.layout);
      const lockedPointKind =
        handKey === this.activeHandKey ? this.lockedHoverPointKind : null;

      input.targets.forEach((target) => {
        if (!target.visible || target.hitRadiusPx <= 0) {
          return;
        }

        const nearestPoint = lockedPointKind
          ? getInteractionPoint(
              handPoints,
              lockedPointKind,
              target.screenPosition,
            )
          : getNearestInteractionPoint(handPoints, target.screenPosition);
        const distancePx = nearestPoint.distancePx;
        candidates.push({
          target,
          hand,
          handKey,
          handPixel: nearestPoint.pixel,
          handPointKind: nearestPoint.kind,
          distancePx,
          normalizedDistance: distancePx / target.hitRadiusPx,
        });
      });
    });

    return candidates.sort((a, b) => a.normalizedDistance - b.normalizedDistance);
  }

  private selectHoverCandidate(candidates: Candidate[]): Candidate | null {
    const current = this.hoveredBody
      ? this.findCandidateByBody(candidates, this.hoveredBody)
      : null;
    const best = candidates.find((candidate) => candidate.normalizedDistance <= 1);

    if (
      current &&
      current.distancePx <=
        current.target.hitRadiusPx * HOVER_EXIT_RADIUS_MULTIPLIER
    ) {
      if (
        best &&
        best.target.id !== current.target.id &&
        best.normalizedDistance + HOVER_SWITCH_MARGIN <
          current.normalizedDistance
      ) {
        return best;
      }

      return current;
    }

    return best ?? null;
  }

  private findActiveHandCandidate(
    candidates: Candidate[],
    bodyId: InteractiveCelestialBodyId,
  ): Candidate | null {
    if (!this.activeHandKey) {
      return null;
    }

    return (
      candidates.find(
        (candidate) =>
          candidate.target.id === bodyId &&
          candidate.handKey === this.activeHandKey,
      ) ?? null
    );
  }

  private findCandidateByBody(
    candidates: Candidate[],
    bodyId: InteractiveCelestialBodyId,
  ): Candidate | null {
    return candidates.find((candidate) => candidate.target.id === bodyId) ?? null;
  }

  private createSnapshot(input: {
    hoverCandidate: Candidate | null;
    pinchMetrics: PinchMetrics | null;
    pinchState: PlanetActivationPinchState;
    reason: string;
    trackingLossMs?: number;
  }): PlanetActivationSnapshot {
    const activatedTarget = this.activatedBody
      ? input.hoverCandidate?.target.id === this.activatedBody
        ? input.hoverCandidate.target
        : null
      : null;
    const activatedOriginalOrbit = this.activatedBody
      ? activatedTarget?.originalOrbit ??
        this.snapshot.activatedOriginalOrbit ??
        null
      : null;

    return {
      hoveredBody: this.hoveredBody,
      activatedBody: this.activatedBody,
      activeHandKey: this.activeHandKey,
      pinchState: input.pinchState,
      pinchDistance: input.pinchMetrics?.distance ?? null,
      pinchDistancePx: input.pinchMetrics?.distancePx ?? null,
      pinchRatio: input.pinchMetrics?.ratio ?? null,
      pinchStartThreshold: PINCH_START_RATIO,
      pinchEndThreshold: PINCH_END_RATIO,
      hoverDistancePx: input.hoverCandidate?.distancePx ?? null,
      hoverHitRadiusPx: input.hoverCandidate?.target.hitRadiusPx ?? null,
      hoverScreenPosition: input.hoverCandidate?.target.screenPosition ?? null,
      hoverPointKind: input.hoverCandidate?.handPointKind ?? null,
      activatedOriginalOrbit,
      trackingLossMs: input.trackingLossMs ?? 0,
      doubleCloseCount: this.doubleCloseCount,
      doubleCloseValleyRatio:
        this.candidateValleyRatio ?? this.firstValleyRatio,
      doubleClosePeakRatio: this.peakRatio,
      doubleCloseProminence: this.getDoubleCloseProminence(),
      doubleCloseTimeoutRemainingMs: this.doubleCloseTimeoutRemainingMs,
      doubleCloseFailureReason: this.doubleCloseFailureReason,
      transitionReason: input.reason,
    };
  }

  private activateBody(candidate: Candidate, timestamp: number): void {
    this.activatedBody = candidate.target.id;
    this.activeHandKey = candidate.handKey;
    this.activatedAtMs = timestamp;
    this.trackingLostSince = null;
    this.activationExitStartedAt = null;
    this.lockedHoverPointKind = candidate.handPointKind;
    this.switchArmedBody = null;
    this.resetDoubleClose();
  }

  private clearActivation(): void {
    this.activatedBody = null;
    this.activeHandKey = null;
    this.activatedAtMs = null;
    this.trackingLostSince = null;
    this.activationExitStartedAt = null;
    this.lockedHoverPointKind = null;
    this.switchArmedBody = null;
    this.resetDoubleClose();
  }

  private releaseInteractionPointLockIfFullyOpen(
    input: PlanetActivationUpdateInput,
  ): void {
    if (!this.activeHandKey || !this.lockedHoverPointKind) {
      return;
    }

    const hands = input.tracking.hands.hands;
    const exactHand = hands.find(
      (hand, index) => createHandKey(hand, index) === this.activeHandKey,
    );
    const activeSide = this.activeHandKey.split(':')[0];
    const activeHand =
      exactHand ?? hands.find((hand) => hand.side === activeSide) ?? null;

    if (activeHand && computePinchRatio(activeHand) >= PINCH_END_RATIO) {
      this.lockedHoverPointKind = null;
    }
  }

  private getPinchState(metrics: PinchMetrics): PlanetActivationPinchState {
    if (
      metrics.ratio <= DOUBLE_CLOSE_VALLEY_MAX_RATIO ||
      this.candidateValleyFrames > 0 ||
      (this.doubleClosePhase === 'wait-final-release' &&
        metrics.ratio < DOUBLE_CLOSE_PEAK_MIN_RATIO)
    ) {
      return 'closed';
    }

    if (
      this.doubleClosePhase === 'wait-first-valley' ||
      this.doubleClosePhase === 'wait-second-valley'
    ) {
      return 'close-ready';
    }

    return isPinchHeld(metrics) ? 'pinching' : 'open';
  }

  private getActivatedReason(
    doubleClose: DoubleCloseUpdate,
    switchArmedThisFrame: boolean,
    metrics: PinchMetrics,
  ): string {
    if (doubleClose === 'first-close') {
      return 'double-close-first-close';
    }
    if (
      doubleClose === 'second-close' ||
      this.doubleClosePhase === 'wait-final-release'
    ) {
      return 'double-close-second-close-waiting-for-release';
    }
    if (
      doubleClose === 'peak-ready' ||
      this.doubleClosePhase === 'wait-second-valley'
    ) {
      return 'double-close-peak-ready';
    }
    if (this.doubleCloseFailureReason) {
      return this.doubleCloseFailureReason;
    }
    if (switchArmedThisFrame) {
      return 'activation-switch-armed-open-hover';
    }
    if (this.doubleClosePhase === 'wait-first-valley') {
      return 'double-close-open-ready';
    }
    if (this.doubleClosePhase === 'wait-peak') {
      return 'double-close-first-close-waiting-for-peak';
    }
    return isPinchHeld(metrics) ? 'activation-held' : 'activation-held-open';
  }

  private updateDoubleClose(
    ratio: number,
    timestamp: number,
    activatedAtMs: number,
  ): DoubleCloseUpdate {
    if (
      timestamp < this.focusCooldownUntil ||
      timestamp - activatedAtMs < DOUBLE_CLOSE_IGNORE_AFTER_ACTIVATION_MS
    ) {
      return null;
    }

    if (this.doubleCloseCount === 1 && this.firstValleyAt !== null) {
      this.doubleCloseTimeoutRemainingMs = Math.max(
        0,
        DOUBLE_CLOSE_MAX_INTERVAL_MS - (timestamp - this.firstValleyAt),
      );
      if (timestamp - this.firstValleyAt > DOUBLE_CLOSE_MAX_INTERVAL_MS) {
        this.resetDoubleClose('double-close-timeout');
        return null;
      }
    } else {
      this.doubleCloseTimeoutRemainingMs = null;
    }

    if (this.doubleClosePhase === 'wait-initial-open') {
      if (ratio >= DOUBLE_CLOSE_PEAK_MIN_RATIO) {
        this.peakStableFrames += 1;
        this.peakRatio = maxMaybe(this.peakRatio, ratio);
        if (this.peakStableFrames >= DOUBLE_CLOSE_MIN_EXTREMUM_FRAMES) {
          this.doubleClosePhase = 'wait-first-valley';
          this.peakRatio = null;
          this.peakStableFrames = 0;
          this.doubleCloseFailureReason = null;
        }
      } else {
        this.peakStableFrames = 0;
        this.peakRatio = null;
      }
      return null;
    }

    if (this.doubleClosePhase === 'wait-first-valley') {
      if (ratio > DOUBLE_CLOSE_VALLEY_MAX_RATIO) {
        this.clearCandidateValley();
        return null;
      }

      this.trackCandidateValley(ratio, timestamp);
      if (this.candidateValleyFrames < DOUBLE_CLOSE_MIN_EXTREMUM_FRAMES) {
        return null;
      }

      this.firstValleyAt = this.candidateValleyStartedAt;
      this.firstValleyRatio = this.candidateValleyRatio;
      this.doubleCloseCount = 1;
      this.doubleClosePhase = 'wait-peak';
      this.doubleCloseTimeoutRemainingMs = DOUBLE_CLOSE_MAX_INTERVAL_MS;
      this.doubleCloseFailureReason = null;
      this.clearCandidateValley();
      return 'first-close';
    }

    if (this.doubleClosePhase === 'wait-peak') {
      if (ratio <= DOUBLE_CLOSE_VALLEY_MAX_RATIO) {
        this.firstValleyRatio = minMaybe(this.firstValleyRatio, ratio);
        this.peakRatio = null;
        this.peakStableFrames = 0;
        return null;
      }

      this.peakRatio = maxMaybe(this.peakRatio, ratio);
      if (ratio >= DOUBLE_CLOSE_PEAK_MIN_RATIO) {
        this.peakStableFrames += 1;
        if (this.peakStableFrames >= DOUBLE_CLOSE_MIN_EXTREMUM_FRAMES) {
          this.doubleClosePhase = 'wait-second-valley';
          this.clearCandidateValley();
          this.doubleCloseFailureReason = null;
          return 'peak-ready';
        }
      } else {
        this.peakStableFrames = 0;
      }
      return null;
    }

    if (this.doubleClosePhase === 'wait-second-valley') {
      if (ratio > DOUBLE_CLOSE_VALLEY_MAX_RATIO) {
        this.peakRatio = maxMaybe(this.peakRatio, ratio);
        this.clearCandidateValley();
        return null;
      }

      this.trackCandidateValley(ratio, timestamp);
      if (this.candidateValleyFrames < DOUBLE_CLOSE_MIN_EXTREMUM_FRAMES) {
        return null;
      }

      const prominence = this.getDoubleCloseProminence();
      if (prominence === null || prominence < DOUBLE_CLOSE_MIN_PROMINENCE) {
        this.firstValleyRatio = minMaybe(
          this.firstValleyRatio,
          this.candidateValleyRatio,
        );
        this.doubleClosePhase = 'wait-peak';
        this.peakRatio = null;
        this.peakStableFrames = 0;
        this.clearCandidateValley();
        this.doubleCloseFailureReason = 'double-close-prominence-too-low';
        return null;
      }

      this.doubleCloseCount = 2;
      this.doubleClosePhase = 'wait-final-release';
      this.doubleCloseTimeoutRemainingMs = null;
      this.finalReleaseStartedAt = null;
      this.doubleCloseFailureReason = null;
      return 'second-close';
    }

    if (ratio >= DOUBLE_CLOSE_PEAK_MIN_RATIO) {
      this.finalReleaseStartedAt ??= timestamp;
      if (
        timestamp - this.finalReleaseStartedAt >=
        DOUBLE_CLOSE_FINAL_RELEASE_STABLE_MS
      ) {
        this.focusCooldownUntil =
          timestamp + DOUBLE_CLOSE_ENTER_FOCUS_COOLDOWN_MS;
        return 'focus-entry';
      }
    } else {
      this.finalReleaseStartedAt = null;
      if (ratio <= DOUBLE_CLOSE_VALLEY_MAX_RATIO) {
        this.candidateValleyRatio = minMaybe(
          this.candidateValleyRatio,
          ratio,
        );
      }
    }

    return null;
  }

  private trackCandidateValley(ratio: number, timestamp: number): void {
    this.candidateValleyStartedAt ??= timestamp;
    this.candidateValleyRatio = minMaybe(this.candidateValleyRatio, ratio);
    this.candidateValleyFrames += 1;
  }

  private clearCandidateValley(): void {
    this.candidateValleyStartedAt = null;
    this.candidateValleyRatio = null;
    this.candidateValleyFrames = 0;
  }

  private interruptDoubleCloseObservation(): void {
    this.clearCandidateValley();
    this.peakStableFrames = 0;
    this.finalReleaseStartedAt = null;
    if (this.doubleClosePhase === 'wait-initial-open') {
      this.peakRatio = null;
    }
  }

  private getDoubleCloseProminence(): number | null {
    if (this.firstValleyRatio === null || this.peakRatio === null) {
      return null;
    }

    const currentValley =
      this.candidateValleyRatio ?? this.firstValleyRatio;
    return this.peakRatio - Math.max(this.firstValleyRatio, currentValley);
  }

  private resetDoubleClose(failureReason: string | null = null): void {
    this.doubleCloseCount = 0;
    this.doubleClosePhase = 'wait-initial-open';
    this.firstValleyAt = null;
    this.firstValleyRatio = null;
    this.clearCandidateValley();
    this.peakRatio = null;
    this.peakStableFrames = 0;
    this.finalReleaseStartedAt = null;
    this.doubleCloseTimeoutRemainingMs = null;
    this.doubleCloseFailureReason = failureReason;
  }
}

function canRunPlanetActivation(state: InteractionState): boolean {
  return (
    state === 'SolarActive' ||
    state === 'SolarFreeHover' ||
    state === 'BodyHover' ||
    state === 'PlanetActivated'
  );
}

function isPlanetFocusState(state: InteractionState): boolean {
  return (
    state === 'PlanetFocusView' ||
    state === 'PlanetFocusControlled' ||
    state === 'PlanetFocusFloating' ||
    state === 'BodyReturning'
  );
}

function createHandKey(hand: TrackedHand, index: number): string {
  return `${hand.side}:${index}`;
}

function createHandInteractionPoints(
  hand: TrackedHand,
  layout: PreviewLayout,
): Array<{
  kind: HandInteractionPointKind;
  pixel: { x: number; y: number };
}> {
  const pinchMidpoint = averagePoints(hand.thumbTip, hand.indexFingerTip);

  return [
    {
      kind: 'pinchMidpoint',
      pixel: mapNormalizedToStagePixel(pinchMidpoint, layout),
    },
    {
      kind: 'thumbTip',
      pixel: mapNormalizedToStagePixel(hand.thumbTip, layout),
    },
    {
      kind: 'indexTip',
      pixel: mapNormalizedToStagePixel(hand.indexFingerTip, layout),
    },
    {
      kind: 'palmCenter',
      pixel: mapNormalizedToStagePixel(hand.center, layout),
    },
  ];
}

function getNearestInteractionPoint(
  points: ReturnType<typeof createHandInteractionPoints>,
  target: { x: number; y: number },
): {
  kind: HandInteractionPointKind;
  pixel: { x: number; y: number };
  distancePx: number;
} {
  return points
    .map((point) => ({
      ...point,
      distancePx: distancePixels(point.pixel, target),
    }))
    .sort((a, b) => a.distancePx - b.distancePx)[0];
}

function getInteractionPoint(
  points: ReturnType<typeof createHandInteractionPoints>,
  kind: HandInteractionPointKind,
  target: { x: number; y: number },
): {
  kind: HandInteractionPointKind;
  pixel: { x: number; y: number };
  distancePx: number;
} {
  const point = points.find((candidate) => candidate.kind === kind) as {
    kind: HandInteractionPointKind;
    pixel: { x: number; y: number };
  };
  return {
    ...point,
    distancePx: distancePixels(point.pixel, target),
  };
}

function computePinchMetrics(
  hand: TrackedHand,
  layout: PreviewLayout,
): PinchMetrics {
  const distance = distance2d(hand.thumbTip, hand.indexFingerTip);
  const thumbPixel = mapNormalizedToStagePixel(hand.thumbTip, layout);
  const indexPixel = mapNormalizedToStagePixel(hand.indexFingerTip, layout);
  const distancePx = distancePixels(thumbPixel, indexPixel);
  const ratio = distance / Math.max(hand.palmScale, 0.001);

  return { distance, distancePx, ratio };
}

function computePinchRatio(hand: TrackedHand): number {
  return (
    distance2d(hand.thumbTip, hand.indexFingerTip) /
    Math.max(hand.palmScale, 0.001)
  );
}

function isPinchStart(metrics: PinchMetrics): boolean {
  return (
    metrics.ratio <= PINCH_START_RATIO &&
    metrics.distancePx <= PINCH_START_MAX_DISTANCE_PX
  );
}

function isPinchHeld(metrics: PinchMetrics): boolean {
  return (
    metrics.ratio < PINCH_END_RATIO &&
    metrics.distancePx < PINCH_END_MAX_DISTANCE_PX
  );
}

function minMaybe(current: number | null, next: number | null): number | null {
  if (next === null) {
    return current;
  }
  return current === null ? next : Math.min(current, next);
}

function maxMaybe(current: number | null, next: number): number {
  return current === null ? next : Math.max(current, next);
}

function averagePoints(
  first: NormalizedPoint,
  second: NormalizedPoint,
): NormalizedPoint {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
    z: (first.z + second.z) / 2,
  };
}

function distancePixels(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
