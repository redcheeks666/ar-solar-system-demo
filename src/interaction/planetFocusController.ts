import {
  INDEX_TIP_INDEX,
  MIDDLE_TIP_INDEX,
  PINKY_TIP_INDEX,
  RING_TIP_INDEX,
  THUMB_TIP_INDEX,
} from './handLandmarks';
import {
  mapNormalizedToStagePixel,
  type PreviewLayout,
} from './coordinateMapping';
import { clamp, distance2d } from '../utils/math';
import { LowPassNumberFilter, LowPassPointFilter } from '../tracking/smoothing';
import type {
  InteractionState,
  NormalizedPoint,
  PlanetFocusDebugSnapshot,
  PlanetFocusPinchState,
  TrackingSnapshot,
  TrackedHand,
} from '../utils/types';
import type {
  FocusedCelestialBodyScreenTarget,
} from '../solar/solarSystem';
import type { InteractiveCelestialBodyId } from '../solar/solarSystemData';

export interface PlanetFocusSnapshot extends PlanetFocusDebugSnapshot {
  focusedBody: InteractiveCelestialBodyId | null;
}

export interface PlanetFocusUpdate {
  snapshot: PlanetFocusSnapshot;
  nextState: InteractionState | null;
}

export interface PlanetFocusUpdateInput {
  tracking: TrackingSnapshot;
  interactionState: InteractionState;
  focusedBody: InteractiveCelestialBodyId | null;
  target: FocusedCelestialBodyScreenTarget | null;
  layout: PreviewLayout;
  timestamp: number;
}

type FocusHandPointKind =
  | 'pinchMidpoint'
  | 'thumbTip'
  | 'indexTip'
  | 'middleTip'
  | 'ringTip'
  | 'pinkyTip'
  | 'palmCenter';

interface FocusHandPoint {
  kind: FocusHandPointKind;
  pixel: { x: number; y: number };
}

interface PinchMetrics {
  distance: number;
  distancePx: number;
  ratio: number;
}

interface FocusHandSample {
  hand: TrackedHand;
  handKey: string;
  points: FocusHandPoint[];
  nearestPoint: FocusHandPoint;
  distancePx: number;
  normalizedDistance: number;
  pinchMetrics: PinchMetrics;
}

interface SingleDwellCandidate {
  mode: 'single';
  handKey: string;
  anchorKind: FocusHandPointKind;
  startedAt: number;
  offsetPx: { x: number; y: number };
}

interface TwoHandDwellCandidate {
  mode: 'two';
  handKeys: [string, string];
  anchorKinds: [FocusHandPointKind, FocusHandPointKind];
  startedAt: number;
  offsetPx: { x: number; y: number };
  baseDistancePx: number;
  baseScaleMultiplier: number;
}

type DwellCandidate = SingleDwellCandidate | TwoHandDwellCandidate;

type PinchPhase = 'open' | 'closed';

const TOUCH_DWELL_REQUIRED_MS = 1000;
const TRACKING_LOSS_HOLD_MS = 260;
// Dwell stability: keep an in-progress dwell timer alive through brief tracking gaps / boundary
// flicker (DWELL_GAP_HOLD_MS), and keep a hand that is already dwelling counted as "touching" until
// it clearly leaves the heat zone (DWELL_HOLD_NORMALIZED_DISTANCE > strict 1.0 entry threshold).
const DWELL_GAP_HOLD_MS = 220;
const DWELL_HOLD_NORMALIZED_DISTANCE = 1.12;
const PINCH_TAP_CLOSE_RATIO = 0.4;
const PINCH_TAP_CLOSE_DISTANCE_PX = 72;
const PINCH_TAP_OPEN_RATIO = 0.58;
const PINCH_TAP_OPEN_DISTANCE_PX = 94;
const MIN_FOCUS_SCALE_MULTIPLIER = 0.3;
const MAX_FOCUS_SCALE_MULTIPLIER = 1.8;
const MIN_SCREEN_EDGE_MARGIN_PX = 28;
const FOCUS_CENTERED_THRESHOLD_PX = 36;
// Follow anchoring: single-hand drives the body from the thumb+index pinch midpoint; two-hand uses
// the four thumb/index tips (see computeTwoHandTransform) — centroid for position, mean spread for
// scale. Low-pass the followed position/scale on top of the landmark smoothing so fingertip jitter
// does not reach the body 1:1; scale is noisier than position, so it gets a stronger filter.
const FOLLOW_ANCHOR_KIND: FocusHandPointKind = 'pinchMidpoint';
const FOLLOW_POSITION_ALPHA = 0.5;
const FOLLOW_SCALE_ALPHA = 0.25;
// Two-hand follow: when one hand clearly leaves the heat zone while the other still grips, drop the
// leaving hand and continue as the staying hand's single-hand (move-only) control. KEEP/WITHDRAW
// form a deadband so boundary noise during a steady two-hand hold does not flip control.
const TWO_HAND_KEEP_NORMALIZED = 1.1;
const TWO_HAND_WITHDRAW_NORMALIZED = 1.3;
// Re-acquire the active single-follow hand by spatial continuity when its hand key shifts (an
// off-hand entering/leaving the frame changes the array index / side), so control is not dropped.
const ACTIVE_HAND_REACQUIRE_RADIUS_PX = 220;

export const EMPTY_PLANET_FOCUS_SNAPSHOT: PlanetFocusSnapshot = {
  focusedBody: null,
  controlState: 'Inactive',
  controlMode: 'none',
  activeHandKeys: [],
  touchHandCount: 0,
  touchDistancePx: null,
  touchHitRadiusPx: null,
  dwellMs: 0,
  dwellRequiredMs: TOUCH_DWELL_REQUIRED_MS,
  dwellMaxMs: TOUCH_DWELL_REQUIRED_MS,
  screenPosition: null,
  scaleMultiplier: 1,
  pinchState: 'idle',
  pinchDistancePx: null,
  pinchRatio: null,
  pinchTapHandKey: null,
  transitionReason: 'inactive',
};

export class PlanetFocusController {
  private focusedBody: InteractiveCelestialBodyId | null = null;
  private dwellCandidate: DwellCandidate | null = null;
  private dwellGapSince: number | null = null;
  private controlState: PlanetFocusSnapshot['controlState'] = 'Inactive';
  private activeHandKeys: string[] = [];
  private activeAnchorKinds: FocusHandPointKind[] = [];
  private singleOffsetPx = { x: 0, y: 0 };
  private twoOffsetPx = { x: 0, y: 0 };
  private twoBaseSpanPx = 1;
  private twoBaseScaleMultiplier = 1;
  private screenPosition: { x: number; y: number } | null = null;
  private scaleMultiplier = 1;
  private readonly singlePositionFilter = new LowPassPointFilter(FOLLOW_POSITION_ALPHA);
  private readonly twoHandPositionFilter = new LowPassPointFilter(FOLLOW_POSITION_ALPHA);
  private readonly twoHandScaleFilter = new LowPassNumberFilter(FOLLOW_SCALE_ALPHA);
  private trackingLostSince: number | null = null;
  private heatZoneClearRequired: 'intro' | 'release' | null = null;
  private pinchPhases = new Map<string, PinchPhase>();
  private snapshot = EMPTY_PLANET_FOCUS_SNAPSHOT;

  update(input: PlanetFocusUpdateInput): PlanetFocusUpdate {
    if (!canRunPlanetFocus(input.interactionState) || !input.focusedBody) {
      this.reset();
      return {
        snapshot: {
          ...EMPTY_PLANET_FOCUS_SNAPSHOT,
          transitionReason: 'inactive-state',
        },
        nextState: null,
      };
    }

    if (input.focusedBody !== this.focusedBody) {
      this.resetForFocusedBody(input.focusedBody, input.target);
    }

    if (!input.target || !input.target.visible) {
      const snapshot = this.createSnapshot({
        reason: 'focus-target-missing',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: null };
    }

    this.screenPosition ??= input.target.screenPosition;

    const samples = createHandSamples(input);
    const touchCandidates = samples.filter(
      (sample) => sample.normalizedDistance <= 1,
    );

    if (this.heatZoneClearRequired) {
      return this.updateHeatZoneClearGate(input, touchCandidates);
    }

    if (this.controlState === 'SingleHandFollow') {
      return this.updateSingleFollow(input, samples, touchCandidates);
    }

    if (this.controlState === 'TwoHandFollow') {
      return this.updateTwoHandFollow(input, samples, touchCandidates);
    }

    return this.updateTouchDwell(input, samples, touchCandidates);
  }

  getSnapshot(): PlanetFocusSnapshot {
    return this.snapshot;
  }

  reset(): void {
    this.focusedBody = null;
    this.dwellCandidate = null;
    this.dwellGapSince = null;
    this.controlState = 'Inactive';
    this.activeHandKeys = [];
    this.activeAnchorKinds = [];
    this.singleOffsetPx = { x: 0, y: 0 };
    this.twoOffsetPx = { x: 0, y: 0 };
    this.twoBaseSpanPx = 1;
    this.twoBaseScaleMultiplier = 1;
    this.screenPosition = null;
    this.scaleMultiplier = 1;
    this.singlePositionFilter.reset();
    this.twoHandPositionFilter.reset();
    this.twoHandScaleFilter.reset();
    this.trackingLostSince = null;
    this.heatZoneClearRequired = null;
    this.pinchPhases.clear();
    this.snapshot = EMPTY_PLANET_FOCUS_SNAPSHOT;
  }

  private resetForFocusedBody(
    focusedBody: InteractiveCelestialBodyId,
    target: FocusedCelestialBodyScreenTarget | null,
  ): void {
    this.focusedBody = focusedBody;
    this.dwellCandidate = null;
    this.dwellGapSince = null;
    this.controlState = 'IntroCooldown';
    this.activeHandKeys = [];
    this.activeAnchorKinds = [];
    this.screenPosition = target?.screenPosition ?? null;
    this.scaleMultiplier = 1;
    this.trackingLostSince = null;
    this.heatZoneClearRequired = 'intro';
    this.pinchPhases.clear();
  }

  private updateHeatZoneClearGate(
    input: PlanetFocusUpdateInput,
    touchCandidates: FocusHandSample[],
  ): PlanetFocusUpdate {
    this.dwellCandidate = null;
    this.activeHandKeys = [];
    this.activeAnchorKinds = [];
    this.trackingLostSince = null;
    this.pinchPhases.clear();

    if (
      this.heatZoneClearRequired === 'intro' &&
      !isFocusTargetCentered(input.target as FocusedCelestialBodyScreenTarget)
    ) {
      this.controlState = 'IntroCooldown';
      const snapshot = this.createSnapshot({
        touchCandidates,
        reason: 'waiting-for-focused-body-centered',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: null };
    }

    if (touchCandidates.length > 0) {
      this.controlState =
        this.heatZoneClearRequired === 'release'
          ? 'DeselectedWaitForClear'
          : 'WaitingForHeatZoneClear';
      const snapshot = this.createSnapshot({
        touchCandidates,
        reason:
          this.heatZoneClearRequired === 'release'
            ? 'waiting-for-heat-zone-clear-after-release'
            : 'waiting-for-heat-zone-clear-after-focus-entry',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: null };
    }

    const clearedReason =
      this.heatZoneClearRequired === 'release'
        ? 'heat-zone-cleared-after-release'
        : 'heat-zone-cleared-after-focus-entry';
    this.heatZoneClearRequired = null;
    this.controlState =
      input.interactionState === 'PlanetFocusFloating'
        ? 'Floating'
        : 'FocusIdle';
    const snapshot = this.createSnapshot({
      touchCandidates,
      reason: clearedReason,
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private updateTouchDwell(
    input: PlanetFocusUpdateInput,
    samples: FocusHandSample[],
    touchCandidates: FocusHandSample[],
  ): PlanetFocusUpdate {
    this.trackingLostSince = null;
    this.activeHandKeys = [];
    this.activeAnchorKinds = [];

    const heldCandidates = this.collectHeldDwellCandidates(
      samples,
      touchCandidates,
    );

    if (heldCandidates.length >= 2) {
      this.dwellGapSince = null;
      return this.updateTwoHandDwell(input, heldCandidates);
    }

    if (heldCandidates.length === 1) {
      this.dwellGapSince = null;
      return this.updateSingleHandDwell(input, samples, heldCandidates[0]);
    }

    // No hand on the heat zone this frame. A single dropped frame (tracking loss or boundary
    // flicker) should not wipe an in-progress dwell, so keep the candidate and its startedAt alive
    // for a short grace window before giving up — mirroring the follow-state loss tolerance.
    if (this.dwellCandidate) {
      this.dwellGapSince ??= input.timestamp;

      if (input.timestamp - this.dwellGapSince < DWELL_GAP_HOLD_MS) {
        const snapshot = this.createSnapshot({
          touchCandidates,
          dwellMs: input.timestamp - this.dwellCandidate.startedAt,
          reason: 'holding-dwell-through-brief-gap',
        });
        this.snapshot = snapshot;
        return { snapshot, nextState: null };
      }
    }

    this.dwellCandidate = null;
    this.dwellGapSince = null;
    this.controlState =
      input.interactionState === 'PlanetFocusFloating'
        ? 'Floating'
        : 'FocusIdle';
    const snapshot = this.createSnapshot({
      touchCandidates,
      reason: 'waiting-for-focused-body-touch',
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private collectHeldDwellCandidates(
    samples: FocusHandSample[],
    touchCandidates: FocusHandSample[],
  ): FocusHandSample[] {
    if (!this.dwellCandidate) {
      return touchCandidates;
    }

    const activeKeys =
      this.dwellCandidate.mode === 'single'
        ? [this.dwellCandidate.handKey]
        : this.dwellCandidate.handKeys;

    const held = samples.filter(
      (sample) =>
        activeKeys.includes(sample.handKey) &&
        sample.normalizedDistance <= DWELL_HOLD_NORMALIZED_DISTANCE &&
        !touchCandidates.some(
          (candidate) => candidate.handKey === sample.handKey,
        ),
    );

    if (held.length === 0) {
      return touchCandidates;
    }

    return [...touchCandidates, ...held].sort(
      (a, b) => a.normalizedDistance - b.normalizedDistance,
    );
  }

  private updateSingleHandDwell(
    input: PlanetFocusUpdateInput,
    samples: FocusHandSample[],
    touchCandidate: FocusHandSample,
  ): PlanetFocusUpdate {
    if (
      this.dwellCandidate?.mode !== 'single' ||
      this.dwellCandidate.handKey !== touchCandidate.handKey
    ) {
      this.dwellCandidate = createSingleDwellCandidate(
        touchCandidate,
        input.target as FocusedCelestialBodyScreenTarget,
        input.timestamp,
      );
    }

    this.controlState = 'SingleTouchDwell';
    const dwellMs = input.timestamp - this.dwellCandidate.startedAt;

    if (dwellMs >= TOUCH_DWELL_REQUIRED_MS) {
      this.enterSingleFollow(
        this.dwellCandidate,
        samples,
        input.target as FocusedCelestialBodyScreenTarget,
      );
      const placement = this.computeSingleFollowPlacement(
        samples,
        input.target as FocusedCelestialBodyScreenTarget,
      );

      if (placement) {
        this.screenPosition = placement.screenPosition;
      }

      const snapshot = this.createSnapshot({
        touchCandidates: [touchCandidate],
        dwellMs,
        pinchMetrics: touchCandidate.pinchMetrics,
        reason: 'single-touch-dwell-complete',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: 'PlanetFocusControlled' };
    }

    const snapshot = this.createSnapshot({
      touchCandidates: [touchCandidate],
      dwellMs,
      pinchMetrics: touchCandidate.pinchMetrics,
      reason: 'single-touch-dwell',
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private updateTwoHandDwell(
    input: PlanetFocusUpdateInput,
    touchCandidates: FocusHandSample[],
  ): PlanetFocusUpdate {
    const pair = getBestTwoHandPair(touchCandidates);

    if (!pair) {
      return this.updateTouchDwell(input, [], touchCandidates.slice(0, 1));
    }

    if (!isSameTwoHandDwell(this.dwellCandidate, pair)) {
      this.dwellCandidate = createTwoHandDwellCandidate(
        pair,
        input.target as FocusedCelestialBodyScreenTarget,
        input.timestamp,
        this.scaleMultiplier,
      );
    }

    this.controlState = 'TwoHandTouchDwell';
    const dwellMs = input.timestamp - this.dwellCandidate.startedAt;

    if (dwellMs >= TOUCH_DWELL_REQUIRED_MS) {
      this.enterTwoHandFollow(
        this.dwellCandidate,
        pair,
        input.target as FocusedCelestialBodyScreenTarget,
      );
      const placement = this.computeTwoHandFollowPlacement(
        pair,
        input.target as FocusedCelestialBodyScreenTarget,
      );
      this.screenPosition = placement.screenPosition;
      this.scaleMultiplier = placement.scaleMultiplier;
      const snapshot = this.createSnapshot({
        touchCandidates: pair,
        dwellMs,
        pinchMetrics: pair[0].pinchMetrics,
        reason: 'two-hand-touch-dwell-complete',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: 'PlanetFocusControlled' };
    }

    const snapshot = this.createSnapshot({
      touchCandidates: pair,
      dwellMs,
      pinchMetrics: pair[0].pinchMetrics,
      reason: 'two-hand-touch-dwell',
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private updateSingleFollow(
    input: PlanetFocusUpdateInput,
    samples: FocusHandSample[],
    touchCandidates: FocusHandSample[],
  ): PlanetFocusUpdate {
    const placement = this.computeSingleFollowPlacement(
      samples,
      input.target as FocusedCelestialBodyScreenTarget,
    );

    if (!placement) {
      return this.handleFollowTrackingLoss(input, touchCandidates);
    }

    this.trackingLostSince = null;
    this.screenPosition = placement.screenPosition;

    const activeSample = placement.sample;
    const pinchTapAccepted = this.updatePinchTap(
      activeSample.handKey,
      activeSample.pinchMetrics,
    );

    if (pinchTapAccepted) {
      return this.releaseToFloating({
        touchCandidates,
        pinchMetrics: activeSample.pinchMetrics,
        pinchTapHandKey: activeSample.handKey,
        reason: 'single-hand-pinch-tap-release',
      });
    }

    const pair = getBestTwoHandPair(touchCandidates);
    if (pair && pair.some((sample) => sample.handKey === this.activeHandKeys[0])) {
      if (!isSameTwoHandDwell(this.dwellCandidate, pair)) {
        this.dwellCandidate = createTwoHandDwellCandidate(
          pair,
          input.target as FocusedCelestialBodyScreenTarget,
          input.timestamp,
          this.scaleMultiplier,
        );
      }

      const dwellMs = input.timestamp - this.dwellCandidate.startedAt;
      if (dwellMs >= TOUCH_DWELL_REQUIRED_MS) {
        this.enterTwoHandFollow(
          this.dwellCandidate,
          pair,
          input.target as FocusedCelestialBodyScreenTarget,
        );
        const twoHandPlacement = this.computeTwoHandFollowPlacement(
          pair,
          input.target as FocusedCelestialBodyScreenTarget,
        );
        this.screenPosition = twoHandPlacement.screenPosition;
        this.scaleMultiplier = twoHandPlacement.scaleMultiplier;
        const snapshot = this.createSnapshot({
          touchCandidates: pair,
          dwellMs,
          pinchMetrics: activeSample.pinchMetrics,
          reason: 'single-follow-upgraded-to-two-hand-follow',
        });
        this.snapshot = snapshot;
        return { snapshot, nextState: null };
      }
    } else {
      this.dwellCandidate = null;
    }

    const snapshot = this.createSnapshot({
      touchCandidates,
      pinchMetrics: activeSample.pinchMetrics,
      reason: 'single-hand-following',
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private updateTwoHandFollow(
    input: PlanetFocusUpdateInput,
    samples: FocusHandSample[],
    touchCandidates: FocusHandSample[],
  ): PlanetFocusUpdate {
    const pair = this.activeHandKeys
      .map((handKey) => samples.find((sample) => sample.handKey === handKey))
      .filter((sample): sample is FocusHandSample => Boolean(sample));

    if (pair.length < 2) {
      return this.handleFollowTrackingLoss(input, touchCandidates);
    }

    // If one hand has clearly left the heat zone while the other still grips, drop the leaving hand
    // and continue as single-hand (move-only) follow with the one that stayed — instead of dragging
    // the body toward the withdrawing hand via the two-hand centroid.
    const staying = pair.filter(
      (sample) => sample.normalizedDistance <= TWO_HAND_KEEP_NORMALIZED,
    );
    const leaving = pair.filter(
      (sample) => sample.normalizedDistance > TWO_HAND_WITHDRAW_NORMALIZED,
    );
    if (staying.length === 1 && leaving.length === 1) {
      return this.downgradeToSingleFollow(
        staying[0],
        input.target as FocusedCelestialBodyScreenTarget,
        touchCandidates,
      );
    }

    this.trackingLostSince = null;
    const placement = this.computeTwoHandFollowPlacement(
      [pair[0], pair[1]],
      input.target as FocusedCelestialBodyScreenTarget,
    );
    this.screenPosition = placement.screenPosition;
    this.scaleMultiplier = placement.scaleMultiplier;

    const pinchTapHand = pair.find((sample) =>
      this.updatePinchTap(sample.handKey, sample.pinchMetrics),
    );

    if (pinchTapHand) {
      return this.releaseToFloating({
        touchCandidates,
        pinchMetrics: pinchTapHand.pinchMetrics,
        pinchTapHandKey: pinchTapHand.handKey,
        reason: 'two-hand-pinch-tap-release',
      });
    }

    const snapshot = this.createSnapshot({
      touchCandidates,
      pinchMetrics: pair[0].pinchMetrics,
      reason: 'two-hand-following',
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private downgradeToSingleFollow(
    sample: FocusHandSample,
    target: FocusedCelestialBodyScreenTarget,
    touchCandidates: FocusHandSample[],
  ): PlanetFocusUpdate {
    // Keep the body where it currently is, then have the staying hand move it (scale frozen). The
    // offset is re-captured from this hand so control hands over without the body jumping.
    this.controlState = 'SingleHandFollow';
    this.activeHandKeys = [sample.handKey];
    this.activeAnchorKinds = [FOLLOW_ANCHOR_KIND];
    const anchor = getPointByKind(sample, FOLLOW_ANCHOR_KIND);
    const bodyPosition = this.screenPosition ?? target.screenPosition;
    this.singleOffsetPx = {
      x: bodyPosition.x - anchor.pixel.x,
      y: bodyPosition.y - anchor.pixel.y,
    };
    this.singlePositionFilter.reset();
    this.dwellCandidate = null;
    this.trackingLostSince = null;
    this.initializePinchPhases([sample], this.activeHandKeys);

    const snapshot = this.createSnapshot({
      touchCandidates,
      pinchMetrics: sample.pinchMetrics,
      reason: 'two-hand-downgraded-to-single-follow',
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: null };
  }

  private handleFollowTrackingLoss(
    input: PlanetFocusUpdateInput,
    touchCandidates: FocusHandSample[],
  ): PlanetFocusUpdate {
    this.trackingLostSince ??= input.timestamp;
    const lostMs = input.timestamp - this.trackingLostSince;

    if (lostMs < TRACKING_LOSS_HOLD_MS) {
      const snapshot = this.createSnapshot({
        touchCandidates,
        reason: 'holding-follow-during-brief-hand-loss',
      });
      this.snapshot = snapshot;
      return { snapshot, nextState: null };
    }

    return this.releaseToFloating({
      touchCandidates,
      pinchMetrics: null,
      pinchTapHandKey: null,
      reason: 'follow-ended-after-hand-loss',
    });
  }

  private enterSingleFollow(
    dwell: SingleDwellCandidate,
    samples: FocusHandSample[],
    target: FocusedCelestialBodyScreenTarget,
  ): void {
    this.controlState = 'SingleHandFollow';
    this.activeHandKeys = [dwell.handKey];
    this.activeAnchorKinds = [FOLLOW_ANCHOR_KIND];
    // Capture the anchor->body offset at the moment control engages (not at dwell start) using the
    // stable palm-center anchor, so the body stays where it is instead of jumping by however much
    // the hand drifted during the dwell second.
    const sample = samples.find((candidate) => candidate.handKey === dwell.handKey);
    const anchor = sample ? getPointByKind(sample, FOLLOW_ANCHOR_KIND) : null;
    this.singleOffsetPx = anchor
      ? {
          x: target.screenPosition.x - anchor.pixel.x,
          y: target.screenPosition.y - anchor.pixel.y,
        }
      : dwell.offsetPx;
    this.singlePositionFilter.reset();
    this.dwellCandidate = null;
    this.initializePinchPhases(samples, this.activeHandKeys);
  }

  private enterTwoHandFollow(
    dwell: TwoHandDwellCandidate,
    pair: [FocusHandSample, FocusHandSample],
    target: FocusedCelestialBodyScreenTarget,
  ): void {
    this.controlState = 'TwoHandFollow';
    this.activeHandKeys = [...dwell.handKeys];
    this.activeAnchorKinds = [FOLLOW_ANCHOR_KIND, FOLLOW_ANCHOR_KIND];
    // Two-hand transform is driven by the four thumb/index tips: centroid for position, mean spread
    // from the centroid for scale. Re-capture the centroid offset and base span at engage time so
    // control starts from the current pose (no engage jump); bringing the four tips together can
    // now shrink the body far smaller than palm-center distance ever allowed.
    const transform = computeTwoHandTransform(pair);
    this.twoOffsetPx = {
      x: target.screenPosition.x - transform.center.x,
      y: target.screenPosition.y - transform.center.y,
    };
    this.twoBaseSpanPx = transform.span;
    this.twoBaseScaleMultiplier = this.scaleMultiplier;
    this.twoHandPositionFilter.reset();
    this.twoHandScaleFilter.reset();
    this.dwellCandidate = null;
    this.initializePinchPhases(pair, this.activeHandKeys);
  }

  private initializePinchPhases(
    samples: FocusHandSample[],
    handKeys: string[],
  ): void {
    this.pinchPhases.clear();
    handKeys.forEach((handKey) => {
      const metrics = samples.find((sample) => sample.handKey === handKey)
        ?.pinchMetrics;
      this.pinchPhases.set(
        handKey,
        metrics && isPinchTapClosed(metrics) ? 'closed' : 'open',
      );
    });
  }

  private resolveActiveSingleSample(
    samples: FocusHandSample[],
  ): FocusHandSample | null {
    const handKey = this.activeHandKeys[0];
    const exact = samples.find((candidate) => candidate.handKey === handKey);

    if (exact) {
      return exact;
    }

    // The hand key embeds the array index / side, which shifts when a second hand enters or leaves
    // the frame. Re-acquire the active hand by spatial continuity to the anchor it had last frame,
    // so an off-hand merely appearing does not look like the controlling hand vanished.
    if (!this.screenPosition) {
      return null;
    }

    const expectedAnchor = {
      x: this.screenPosition.x - this.singleOffsetPx.x,
      y: this.screenPosition.y - this.singleOffsetPx.y,
    };
    let best: FocusHandSample | null = null;
    let bestDistance = ACTIVE_HAND_REACQUIRE_RADIUS_PX;

    samples.forEach((sample) => {
      const anchor = getPointByKind(sample, this.activeAnchorKinds[0]);
      const distance = distancePixels(anchor.pixel, expectedAnchor);
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = sample;
      }
    });

    if (best) {
      this.rebindActiveSingleHand((best as FocusHandSample).handKey);
    }

    return best;
  }

  private rebindActiveSingleHand(newHandKey: string): void {
    const oldHandKey = this.activeHandKeys[0];
    if (oldHandKey === newHandKey) {
      return;
    }

    const phase = this.pinchPhases.get(oldHandKey) ?? 'open';
    this.pinchPhases.delete(oldHandKey);
    this.pinchPhases.set(newHandKey, phase);
    this.activeHandKeys = [newHandKey];
  }

  private computeSingleFollowPlacement(
    samples: FocusHandSample[],
    target: FocusedCelestialBodyScreenTarget,
  ): { sample: FocusHandSample; screenPosition: { x: number; y: number } } | null {
    const sample = this.resolveActiveSingleSample(samples);

    if (!sample) {
      return null;
    }

    const anchor = getPointByKind(sample, this.activeAnchorKinds[0]);
    const smoothed = this.singlePositionFilter.smooth({
      x: anchor.pixel.x + this.singleOffsetPx.x,
      y: anchor.pixel.y + this.singleOffsetPx.y,
      z: 0,
    });

    return {
      sample,
      screenPosition: clampFocusedBodyPosition(
        { x: smoothed.x, y: smoothed.y },
        target,
        this.scaleMultiplier,
        this.scaleMultiplier,
      ),
    };
  }

  private computeTwoHandFollowPlacement(
    pair: [FocusHandSample, FocusHandSample],
    target: FocusedCelestialBodyScreenTarget,
  ): {
    screenPosition: { x: number; y: number };
    scaleMultiplier: number;
  } {
    const transform = computeTwoHandTransform(pair);
    const scaleMultiplier = this.twoHandScaleFilter.smooth(
      clamp(
        this.twoBaseScaleMultiplier *
          (transform.span / Math.max(this.twoBaseSpanPx, 1)),
        MIN_FOCUS_SCALE_MULTIPLIER,
        MAX_FOCUS_SCALE_MULTIPLIER,
      ),
    );
    const smoothed = this.twoHandPositionFilter.smooth({
      x: transform.center.x + this.twoOffsetPx.x,
      y: transform.center.y + this.twoOffsetPx.y,
      z: 0,
    });

    return {
      screenPosition: clampFocusedBodyPosition(
        { x: smoothed.x, y: smoothed.y },
        target,
        scaleMultiplier,
        this.scaleMultiplier,
      ),
      scaleMultiplier,
    };
  }

  private updatePinchTap(handKey: string, metrics: PinchMetrics): boolean {
    const previousPhase = this.pinchPhases.get(handKey) ?? 'open';

    if (previousPhase === 'open' && isPinchTapClosed(metrics)) {
      this.pinchPhases.set(handKey, 'closed');
      return false;
    }

    if (previousPhase === 'closed' && isPinchTapOpen(metrics)) {
      this.pinchPhases.set(handKey, 'open');
      return true;
    }

    return false;
  }

  private releaseToFloating(input: {
    touchCandidates: FocusHandSample[];
    pinchMetrics: PinchMetrics | null;
    pinchTapHandKey: string | null;
    reason: string;
  }): PlanetFocusUpdate {
    this.controlState = 'DeselectedWaitForClear';
    this.activeHandKeys = [];
    this.activeAnchorKinds = [];
    this.dwellCandidate = null;
    this.trackingLostSince = null;
    this.heatZoneClearRequired = 'release';
    this.pinchPhases.clear();
    const snapshot = this.createSnapshot({
      touchCandidates: input.touchCandidates,
      pinchMetrics: input.pinchMetrics,
      pinchTapHandKey: input.pinchTapHandKey,
      pinchState: 'released',
      reason: input.reason,
    });
    this.snapshot = snapshot;
    return { snapshot, nextState: 'PlanetFocusFloating' };
  }

  private createSnapshot(input: {
    touchCandidates?: FocusHandSample[];
    dwellMs?: number;
    pinchMetrics?: PinchMetrics | null;
    pinchTapHandKey?: string | null;
    pinchState?: PlanetFocusPinchState;
    reason: string;
  }): PlanetFocusSnapshot {
    const touchCandidates = input.touchCandidates ?? [];
    const bestTouch = touchCandidates[0] ?? null;
    const pinchMetrics = input.pinchMetrics ?? null;

    return {
      focusedBody: this.focusedBody,
      controlState: this.controlState,
      controlMode:
        this.controlState === 'SingleHandFollow' ||
        this.controlState === 'SingleTouchDwell'
          ? 'single'
          : this.controlState === 'TwoHandFollow' ||
              this.controlState === 'TwoHandTouchDwell'
            ? 'two'
            : 'none',
      activeHandKeys: [...this.activeHandKeys],
      touchHandCount: touchCandidates.length,
      touchDistancePx: bestTouch?.distancePx ?? null,
      touchHitRadiusPx: bestTouch
        ? (bestTouch.distancePx / Math.max(bestTouch.normalizedDistance, 0.0001))
        : null,
      dwellMs: input.dwellMs ?? 0,
      dwellRequiredMs: TOUCH_DWELL_REQUIRED_MS,
      dwellMaxMs: TOUCH_DWELL_REQUIRED_MS,
      screenPosition: this.screenPosition
        ? { ...this.screenPosition }
        : null,
      scaleMultiplier: this.scaleMultiplier,
      pinchState:
        input.pinchState ??
        (pinchMetrics
          ? isPinchTapClosed(pinchMetrics)
            ? 'closed'
            : 'open'
          : 'idle'),
      pinchDistancePx: pinchMetrics?.distancePx ?? null,
      pinchRatio: pinchMetrics?.ratio ?? null,
      pinchTapHandKey: input.pinchTapHandKey ?? null,
      transitionReason: input.reason,
    };
  }
}

function canRunPlanetFocus(state: InteractionState): boolean {
  return (
    state === 'PlanetFocusView' ||
    state === 'PlanetFocusControlled' ||
    state === 'PlanetFocusFloating'
  );
}

function createHandSamples(input: {
  tracking: TrackingSnapshot;
  layout: PreviewLayout;
  target: FocusedCelestialBodyScreenTarget | null;
}): FocusHandSample[] {
  if (!input.target) {
    return [];
  }

  return input.tracking.hands.hands
    .map((hand, index) => {
      const handKey = createHandKey(hand, index);
      const points = createFocusHandPoints(hand, input.layout);
      const nearestPoint = getNearestFocusHandPoint(
        points,
        input.target?.screenPosition ?? { x: 0, y: 0 },
      );
      const distancePx = distancePixels(
        nearestPoint.pixel,
        input.target?.screenPosition ?? { x: 0, y: 0 },
      );

      return {
        hand,
        handKey,
        points,
        nearestPoint,
        distancePx,
        normalizedDistance:
          distancePx / Math.max(input.target?.hitRadiusPx ?? 1, 1),
        pinchMetrics: computeMultiFingerPinchMetrics(hand, input.layout),
      };
    })
    .sort((a, b) => a.normalizedDistance - b.normalizedDistance);
}

function createSingleDwellCandidate(
  candidate: FocusHandSample,
  target: FocusedCelestialBodyScreenTarget,
  timestamp: number,
): SingleDwellCandidate {
  return {
    mode: 'single',
    handKey: candidate.handKey,
    anchorKind: candidate.nearestPoint.kind,
    startedAt: timestamp,
    offsetPx: {
      x: target.screenPosition.x - candidate.nearestPoint.pixel.x,
      y: target.screenPosition.y - candidate.nearestPoint.pixel.y,
    },
  };
}

function createTwoHandDwellCandidate(
  pair: [FocusHandSample, FocusHandSample],
  target: FocusedCelestialBodyScreenTarget,
  timestamp: number,
  scaleMultiplier: number,
): TwoHandDwellCandidate {
  const midpoint = averagePixel(pair[0].nearestPoint.pixel, pair[1].nearestPoint.pixel);

  return {
    mode: 'two',
    handKeys: [pair[0].handKey, pair[1].handKey],
    anchorKinds: [pair[0].nearestPoint.kind, pair[1].nearestPoint.kind],
    startedAt: timestamp,
    offsetPx: {
      x: target.screenPosition.x - midpoint.x,
      y: target.screenPosition.y - midpoint.y,
    },
    baseDistancePx: Math.max(
      distancePixels(pair[0].nearestPoint.pixel, pair[1].nearestPoint.pixel),
      1,
    ),
    baseScaleMultiplier: scaleMultiplier,
  };
}

function isSameTwoHandDwell(
  dwell: DwellCandidate | null,
  pair: [FocusHandSample, FocusHandSample],
): dwell is TwoHandDwellCandidate {
  if (dwell?.mode !== 'two') {
    return false;
  }

  return (
    dwell.handKeys.includes(pair[0].handKey) &&
    dwell.handKeys.includes(pair[1].handKey)
  );
}

function getBestTwoHandPair(
  touchCandidates: FocusHandSample[],
): [FocusHandSample, FocusHandSample] | null {
  const first = touchCandidates[0];

  if (!first) {
    return null;
  }

  const second = touchCandidates.find(
    (candidate) => candidate.handKey !== first.handKey,
  );

  return second ? [first, second] : null;
}

interface TwoHandTransform {
  center: { x: number; y: number };
  span: number;
}

/**
 * Two-hand transform from the two hands' pinch midpoints (each = thumb+index average). `center` is
 * the midpoint between them (= centroid of the four tips) and drives position; `span` is the
 * distance between the two hands and drives scale. Crucially the span is the *inter-hand* distance,
 * so opening/closing a single hand's pinch does not change scale or position — that is reserved for
 * the pinch-tap release. Scale tracks span / baseSpan: spread the hands to grow, draw them together
 * to shrink, with a far wider range than two palm centers could reach.
 */
function computeTwoHandTransform(
  pair: [FocusHandSample, FocusHandSample],
): TwoHandTransform {
  const first = getPointByKind(pair[0], 'pinchMidpoint').pixel;
  const second = getPointByKind(pair[1], 'pinchMidpoint').pixel;

  return {
    center: averagePixel(first, second),
    span: Math.max(distancePixels(first, second), 1),
  };
}

function createFocusHandPoints(
  hand: TrackedHand,
  layout: PreviewLayout,
): FocusHandPoint[] {
  const thumb = getLandmark(hand, THUMB_TIP_INDEX, hand.thumbTip);
  const index = getLandmark(hand, INDEX_TIP_INDEX, hand.indexFingerTip);
  const middle = getLandmark(hand, MIDDLE_TIP_INDEX, index);
  const ring = getLandmark(hand, RING_TIP_INDEX, middle);
  const pinky = getLandmark(hand, PINKY_TIP_INDEX, ring);
  const pinchMidpoint = averagePoints(thumb, index);

  return [
    { kind: 'pinchMidpoint', pixel: mapNormalizedToStagePixel(pinchMidpoint, layout) },
    { kind: 'thumbTip', pixel: mapNormalizedToStagePixel(thumb, layout) },
    { kind: 'indexTip', pixel: mapNormalizedToStagePixel(index, layout) },
    { kind: 'middleTip', pixel: mapNormalizedToStagePixel(middle, layout) },
    { kind: 'ringTip', pixel: mapNormalizedToStagePixel(ring, layout) },
    { kind: 'pinkyTip', pixel: mapNormalizedToStagePixel(pinky, layout) },
    { kind: 'palmCenter', pixel: mapNormalizedToStagePixel(hand.center, layout) },
  ];
}

function getPointByKind(
  sample: FocusHandSample,
  kind: FocusHandPointKind | undefined,
): FocusHandPoint {
  return (
    sample.points.find((point) => point.kind === kind) ?? sample.nearestPoint
  );
}

function getNearestFocusHandPoint(
  points: FocusHandPoint[],
  target: { x: number; y: number },
): FocusHandPoint {
  return points
    .map((point) => ({
      ...point,
      distancePx: distancePixels(point.pixel, target),
    }))
    .sort((a, b) => a.distancePx - b.distancePx)[0];
}

function computeMultiFingerPinchMetrics(
  hand: TrackedHand,
  layout: PreviewLayout,
): PinchMetrics {
  const thumb = getLandmark(hand, THUMB_TIP_INDEX, hand.thumbTip);
  const thumbPixel = mapNormalizedToStagePixel(thumb, layout);
  const fingerTips = [
    getLandmark(hand, INDEX_TIP_INDEX, hand.indexFingerTip),
    getLandmark(hand, MIDDLE_TIP_INDEX, hand.indexFingerTip),
    getLandmark(hand, RING_TIP_INDEX, hand.indexFingerTip),
    getLandmark(hand, PINKY_TIP_INDEX, hand.indexFingerTip),
  ];

  return fingerTips
    .map((fingerTip) => {
      const fingerPixel = mapNormalizedToStagePixel(fingerTip, layout);
      const distance = distance2d(thumb, fingerTip);
      const distancePx = distancePixels(thumbPixel, fingerPixel);

      return {
        distance,
        distancePx,
        ratio: distance / Math.max(hand.palmScale, 0.001),
      };
    })
    .sort((a, b) => a.ratio - b.ratio)[0];
}

function isPinchTapClosed(metrics: PinchMetrics): boolean {
  return (
    metrics.ratio <= PINCH_TAP_CLOSE_RATIO ||
    metrics.distancePx <= PINCH_TAP_CLOSE_DISTANCE_PX
  );
}

function isPinchTapOpen(metrics: PinchMetrics): boolean {
  return (
    metrics.ratio >= PINCH_TAP_OPEN_RATIO ||
    metrics.distancePx >= PINCH_TAP_OPEN_DISTANCE_PX
  );
}

function clampFocusedBodyPosition(
  position: { x: number; y: number },
  target: FocusedCelestialBodyScreenTarget,
  nextScaleMultiplier: number,
  currentScaleMultiplier: number,
): { x: number; y: number } {
  const radiusScale =
    nextScaleMultiplier / Math.max(currentScaleMultiplier, 0.001);
  const margin = Math.max(
    MIN_SCREEN_EDGE_MARGIN_PX,
    target.bodyRadiusPx * radiusScale,
  );

  return {
    x: clampAxis(position.x, margin, target.layout.stageWidth - margin, target.layout.stageWidth / 2),
    y: clampAxis(position.y, margin, target.layout.stageHeight - margin, target.layout.stageHeight / 2),
  };
}

function isFocusTargetCentered(target: FocusedCelestialBodyScreenTarget): boolean {
  const center = {
    x: target.layout.stageWidth / 2,
    y: target.layout.stageHeight / 2,
  };

  return distancePixels(target.screenPosition, center) <= FOCUS_CENTERED_THRESHOLD_PX;
}

function clampAxis(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (max < min) {
    return fallback;
  }

  return clamp(value, min, max);
}

function createHandKey(hand: TrackedHand, index: number): string {
  return `${hand.side}:${index}`;
}

function getLandmark(
  hand: TrackedHand,
  index: number,
  fallback: NormalizedPoint,
): NormalizedPoint {
  return hand.landmarks[index] ?? fallback;
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

function averagePixel(
  first: { x: number; y: number },
  second: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

function distancePixels(
  first: { x: number; y: number },
  second: { x: number; y: number },
): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}
