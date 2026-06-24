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

const PINCH_START_RATIO = 0.48;
const PINCH_END_RATIO = 0.62;
const PINCH_START_MAX_DISTANCE_PX = 96;
const PINCH_END_MAX_DISTANCE_PX = 128;
const DOUBLE_CLOSE_STABLE_MS = 40;
const DOUBLE_CLOSE_MIN_OPEN_GAP_MS = 70;
const DOUBLE_CLOSE_MAX_INTERVAL_MS = 1600;
const DOUBLE_CLOSE_IGNORE_AFTER_ACTIVATION_MS = 180;
const DOUBLE_CLOSE_ENTER_FOCUS_COOLDOWN_MS = 900;
const DOUBLE_CLOSE_OPEN_RATIO = 0.34;
const DOUBLE_CLOSE_CLOSE_RATIO = 0.28;
const DOUBLE_CLOSE_OPEN_DISTANCE_PX = 66;
const DOUBLE_CLOSE_CLOSE_DISTANCE_PX = 56;
const DOUBLE_CLOSE_REOPEN_DELTA_RATIO = 0.035;
const DOUBLE_CLOSE_REOPEN_DELTA_DISTANCE_PX = 7;
const DOUBLE_CLOSE_RECLOSE_DELTA_RATIO = 0.03;
const DOUBLE_CLOSE_RECLOSE_DELTA_DISTANCE_PX = 7;
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
  private doubleCloseCount = 0;
  private firstCloseAt: number | null = null;
  private closeStableSince: number | null = null;
  private closedLatched = false;
  private reopenStableSince: number | null = null;
  private openReady = false;
  private latchedCloseMetrics: PinchMetrics | null = null;
  private reopenPeakMetrics: PinchMetrics | null = null;
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

    this.hoveredBody = hoverCandidate?.target.id ?? activeBody;

    if (hoverCandidate && hoverCandidate.target.id !== activeBody) {
      const nextMetrics = computePinchMetrics(hoverCandidate.hand, input.layout);

      if (isPinchStart(nextMetrics) || isDoubleCloseClosed(nextMetrics)) {
        this.activateBody(hoverCandidate, input.timestamp);
        this.trackingLostSince = null;
        const snapshot = this.createSnapshot({
          hoverCandidate,
          pinchMetrics: nextMetrics,
          pinchState: 'pinching',
          reason: 'activation-switched-body',
        });
        this.snapshot = snapshot;
        return { snapshot, nextState: null };
      }
    }

    if (!activeCandidate) {
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
      pinchMetrics,
      input.timestamp,
      this.activatedAtMs ?? input.timestamp,
    );

    const lockedHover =
      hoverCandidate?.target.id === activeBody
        ? hoverCandidate
        : this.findCandidateByBody(candidates, activeBody) ?? hoverCandidate;

    if (doubleClose === 'focus-entry') {
      const snapshot = this.createSnapshot({
        hoverCandidate: lockedHover,
        pinchMetrics,
        pinchState: 'closed',
        reason: 'double-close-enter-focus',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: 'PlanetFocusView' };
    }

    const snapshot = this.createSnapshot({
      hoverCandidate: lockedHover,
      pinchMetrics,
      pinchState:
        doubleClose === 'first-close'
          ? 'closed'
          : this.openReady
            ? 'close-ready'
            : isPinchHeld(pinchMetrics)
              ? 'pinching'
              : 'open',
      reason:
        doubleClose === 'first-close'
          ? 'double-close-first-close'
          : this.openReady
            ? 'double-close-open-ready'
            : isPinchHeld(pinchMetrics)
              ? 'activation-held'
              : 'activation-held-open',
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private createCandidates(input: PlanetActivationUpdateInput): Candidate[] {
    const candidates: Candidate[] = [];

    input.tracking.hands.hands.forEach((hand, handIndex) => {
      const handKey = createHandKey(hand, handIndex);
      const handPoints = createHandInteractionPoints(hand, input.layout);

      input.targets.forEach((target) => {
        if (!target.visible || target.hitRadiusPx <= 0) {
          return;
        }

        const nearestPoint = getNearestInteractionPoint(
          handPoints,
          target.screenPosition,
        );
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
      transitionReason: input.reason,
    };
  }

  private activateBody(candidate: Candidate, timestamp: number): void {
    this.activatedBody = candidate.target.id;
    this.activeHandKey = candidate.handKey;
    this.activatedAtMs = timestamp;
    this.trackingLostSince = null;
    this.activationExitStartedAt = null;
    this.resetDoubleClose();
  }

  private clearActivation(): void {
    this.activatedBody = null;
    this.activeHandKey = null;
    this.activatedAtMs = null;
    this.trackingLostSince = null;
    this.activationExitStartedAt = null;
    this.resetDoubleClose();
  }

  private updateDoubleClose(
    metrics: PinchMetrics,
    timestamp: number,
    activatedAtMs: number,
  ): 'first-close' | 'focus-entry' | null {
    if (
      timestamp < this.focusCooldownUntil ||
      timestamp - activatedAtMs < DOUBLE_CLOSE_IGNORE_AFTER_ACTIVATION_MS
    ) {
      return null;
    }

    if (
      this.doubleCloseCount === 1 &&
      this.firstCloseAt !== null &&
      timestamp - this.firstCloseAt > DOUBLE_CLOSE_MAX_INTERVAL_MS
    ) {
      this.resetDoubleClose();
    }

    const openForDoubleClose = this.isOpenForDoubleClose(metrics);
    const closedForDoubleClose = isDoubleCloseClosed(metrics);

    if (this.closedLatched) {
      if (openForDoubleClose) {
        this.reopenStableSince ??= timestamp;
        this.reopenPeakMetrics = maxPinchMetrics(
          this.reopenPeakMetrics,
          metrics,
        );

        if (timestamp - this.reopenStableSince >= DOUBLE_CLOSE_MIN_OPEN_GAP_MS) {
          this.closedLatched = false;
          this.closeStableSince = null;
          this.openReady = true;
        }
      } else {
        this.reopenStableSince = null;
        this.reopenPeakMetrics = null;
      }

      return null;
    }

    if (openForDoubleClose) {
      this.openReady = true;
      this.reopenPeakMetrics = maxPinchMetrics(
        this.reopenPeakMetrics,
        metrics,
      );
      this.closeStableSince = null;
      return null;
    }

    if (!closedForDoubleClose) {
      this.closeStableSince = null;
      return null;
    }

    if (!this.openReady) {
      return null;
    }

    if (!this.isClosedAfterReopen(metrics)) {
      this.closeStableSince = null;
      return null;
    }

    this.closeStableSince ??= timestamp;

    if (timestamp - this.closeStableSince < DOUBLE_CLOSE_STABLE_MS) {
      return null;
    }

    if (this.doubleCloseCount === 0) {
      this.doubleCloseCount = 1;
      this.firstCloseAt = timestamp;
      this.closedLatched = true;
      this.openReady = false;
      this.latchedCloseMetrics = metrics;
      this.reopenPeakMetrics = null;
      this.reopenStableSince = null;
      return 'first-close';
    }

    if (
      this.doubleCloseCount === 1 &&
      this.firstCloseAt !== null &&
      timestamp - this.firstCloseAt <= DOUBLE_CLOSE_MAX_INTERVAL_MS
    ) {
      this.doubleCloseCount = 2;
      this.closedLatched = true;
      this.focusCooldownUntil =
        timestamp + DOUBLE_CLOSE_ENTER_FOCUS_COOLDOWN_MS;
      return 'focus-entry';
    }

    this.resetDoubleClose();
    return null;
  }

  private resetDoubleClose(): void {
    this.doubleCloseCount = 0;
    this.firstCloseAt = null;
    this.closeStableSince = null;
    this.closedLatched = false;
    this.reopenStableSince = null;
    this.openReady = false;
    this.latchedCloseMetrics = null;
    this.reopenPeakMetrics = null;
  }

  private isOpenForDoubleClose(metrics: PinchMetrics): boolean {
    if (isDoubleCloseOpen(metrics)) {
      return true;
    }

    if (!this.latchedCloseMetrics) {
      return false;
    }

    return (
      metrics.ratio - this.latchedCloseMetrics.ratio >=
        DOUBLE_CLOSE_REOPEN_DELTA_RATIO &&
      metrics.distancePx - this.latchedCloseMetrics.distancePx >=
        DOUBLE_CLOSE_REOPEN_DELTA_DISTANCE_PX
    );
  }

  private isClosedAfterReopen(metrics: PinchMetrics): boolean {
    if (this.doubleCloseCount === 0) {
      return true;
    }

    if (!this.reopenPeakMetrics) {
      return false;
    }

    return (
      this.reopenPeakMetrics.ratio - metrics.ratio >=
        DOUBLE_CLOSE_RECLOSE_DELTA_RATIO ||
      this.reopenPeakMetrics.distancePx - metrics.distancePx >=
        DOUBLE_CLOSE_RECLOSE_DELTA_DISTANCE_PX
    );
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
    state === 'PlanetFocusFloating'
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

function isDoubleCloseOpen(metrics: PinchMetrics): boolean {
  return (
    metrics.ratio >= DOUBLE_CLOSE_OPEN_RATIO ||
    metrics.distancePx >= DOUBLE_CLOSE_OPEN_DISTANCE_PX ||
    !isPinchHeld(metrics)
  );
}

function isDoubleCloseClosed(metrics: PinchMetrics): boolean {
  return (
    metrics.ratio <= DOUBLE_CLOSE_CLOSE_RATIO ||
    metrics.distancePx <= DOUBLE_CLOSE_CLOSE_DISTANCE_PX
  );
}

function maxPinchMetrics(
  current: PinchMetrics | null,
  next: PinchMetrics,
): PinchMetrics {
  if (!current) {
    return next;
  }

  return {
    distance: Math.max(current.distance, next.distance),
    distancePx: Math.max(current.distancePx, next.distancePx),
    ratio: Math.max(current.ratio, next.ratio),
  };
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
