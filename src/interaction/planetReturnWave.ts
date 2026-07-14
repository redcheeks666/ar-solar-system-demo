import {
  mapNormalizedToStagePixel,
  type PreviewLayout,
} from './coordinateMapping';
import { computeHandPoseIntent } from './handPose';
import type { FocusedCelestialBodyScreenTarget } from '../solar/solarSystem';
import { clamp01 } from '../utils/math';
import type {
  InteractionState,
  NormalizedPoint,
  PlanetReturnWaveCornerDirection,
  PlanetReturnWaveDebugSnapshot,
  TrackingSnapshot,
  TrackedHand,
} from '../utils/types';

export type PlanetReturnWaveSnapshot = PlanetReturnWaveDebugSnapshot;

export interface PlanetReturnWaveUpdate {
  snapshot: PlanetReturnWaveSnapshot;
  triggered: boolean;
  handKey: string | null;
}

export interface PlanetReturnWaveUpdateInput {
  tracking: TrackingSnapshot;
  interactionState: InteractionState;
  target: FocusedCelestialBodyScreenTarget | null;
  layout: PreviewLayout;
  timestamp: number;
}

interface StagePoint {
  x: number;
  y: number;
}

interface BodyTarget {
  point: StagePoint;
  hitRadius: number;
}

interface SweepCandidate {
  startedAt: number;
  lastAt: number;
  startPoint: StagePoint;
  lastPoint: StagePoint;
  pathLength: number;
  stableFrames: number;
  peakSpeed: number;
  openScoreTotal: number;
  openScoreCount: number;
  palmScaleMin: number;
  palmScaleMax: number;
  startDistanceToBody: number;
  endDistanceToBody: number;
  recentBodyDistances: number[];
  bodyHitRadius: number;
}

interface WaveHandTrack {
  handKey: string;
  lastCenter: NormalizedPoint;
  lastPoint: StagePoint;
  lastAt: number;
  lastOpenScore: number;
  lastPalmScale: number;
  lastVelocity: StagePoint;
  latestSpeed: number;
  visibleDurationMs: number;
  missingSince: number | null;
  candidate: SweepCandidate | null;
  strokeBlocked: boolean;
  lastReason: string;
}

interface HandSample {
  hand: TrackedHand;
  point: StagePoint;
  openScore: number;
}

interface CandidateMetrics {
  elapsedMs: number;
  displacement: number;
  peakSpeed: number;
  netSpeed: number;
  coherence: number;
  horizontalDisplacement: number;
  upwardDisplacement: number;
  horizontalDirectionRatio: number;
  upwardDirectionRatio: number;
  cornerDirection: PlanetReturnWaveCornerDirection | null;
  openHandScore: number;
  palmScaleRatio: number;
  startDistanceToBody: number;
  endDistanceToBody: number;
  bodyDistanceTrend: number;
  bodyHitRadius: number;
  score: number;
}

type EligibleFocusState = 'PlanetFocusView' | 'PlanetFocusFloating';

// Measures post-place-down inertia: only PlanetFocusFloating waits before return detection.
export const RETURN_WAVE_ARM_DELAY_MS = 250;
// Measures multi-frame evidence: a decision needs at least three spatially continuous observations.
export const RETURN_WAVE_MIN_EVIDENCE_FRAMES = 3;
// Measures throw impulse: ordinary reaches stay well below 3 preview-short-sides per second.
export const RETURN_WAVE_MIN_PEAK_SPEED = 3;
// Measures throw travel: 0.35 short-side is a deliberate arm sweep rather than a partial reach.
export const RETURN_WAVE_MIN_DISPLACEMENT = 0.35;
// Measures diagonal intent: both upward and horizontal components must contribute meaningfully.
export const RETURN_WAVE_MIN_CORNER_COMPONENT_RATIO = 0.32;
// Measures separation from the body: the throw must start beyond 1.2 times its hit radius.
export const RETURN_WAVE_START_CLEARANCE = 1.2;
// Measures hand-shape sanity only: it rejects a clear pinch/fist without ranking valid throws.
export const RETURN_WAVE_MIN_OPEN_HAND_SCORE = 0.5;
// Measures tolerated detector dropout: about three to four camera frames may be bridged.
export const RETURN_WAVE_TRACKING_GAP_HOLD_MS = 150;
// Measures spatial identity uncertainty before elapsed-time motion allowance is added.
export const RETURN_WAVE_REACQUIRE_BASE_RADIUS = 0.15;
// Measures the largest physically plausible hand travel used by adaptive gap reacquisition.
export const RETURN_WAVE_MAX_PLAUSIBLE_HAND_SPEED = 12;
// Measures identity scale stability: reciprocal bounds tolerate roughly 0.60-1.67 palm scale.
export const RETURN_WAVE_REACQUIRE_MAX_PALM_SCALE_RATIO = 1.67;
// Measures reliable candidate origin: only the start, never the endpoint, needs an 8% inset.
export const RETURN_WAVE_START_EDGE_INSET = 0.08;

export const EMPTY_PLANET_RETURN_WAVE_SNAPSHOT: PlanetReturnWaveSnapshot = {
  state: 'Inactive',
  handKey: null,
  handVisibleMs: 0,
  handReady: false,
  elapsedMs: 0,
  stableFrames: 0,
  displacement: null,
  medianSpeed: null,
  netSpeed: null,
  coherence: null,
  horizontalDisplacement: null,
  upwardDisplacement: null,
  cornerDirection: null,
  openHandScore: null,
  palmScaleRatio: null,
  triggerMode: null,
  score: 0,
  triggered: false,
  reason: 'inactive',
  peakSpeed: null,
  startDistanceToBody: null,
  endDistanceToBody: null,
  bodyDistanceTrend: null,
  bodyHitRadius: null,
};

/**
 * Detects one directional open-hand throw toward either upper display corner in the passive
 * focus states. Peak speed captures the throw impulse, while body-relative start/end geometry
 * separates a return throw from reaching in to grab the focused body. Tracking gaps remain part
 * of the same trajectory when adaptive spatial, palm-scale, and direction checks agree.
 */
export class PlanetReturnWaveController {
  private activeState: EligibleFocusState | null = null;
  private floatingEnteredAt: number | null = null;
  private tracks: WaveHandTrack[] = [];
  private nextTrackId = 1;
  private triggeredLatch = false;
  private snapshot = EMPTY_PLANET_RETURN_WAVE_SNAPSHOT;

  update(input: PlanetReturnWaveUpdateInput): PlanetReturnWaveUpdate {
    if (!isEligibleFocusState(input.interactionState)) {
      this.reset();
      const snapshot: PlanetReturnWaveSnapshot = {
        ...EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
        reason: 'inactive-state',
      };
      this.snapshot = snapshot;
      return { snapshot, triggered: false, handKey: null };
    }

    this.prepareState(input.interactionState, input.timestamp);
    if (this.triggeredLatch) {
      const snapshot: PlanetReturnWaveSnapshot = {
        ...this.snapshot,
        triggered: false,
        reason: 'return-already-triggered',
      };
      this.snapshot = snapshot;
      return { snapshot, triggered: false, handKey: null };
    }

    const armedMs =
      input.interactionState === 'PlanetFocusFloating'
        ? Math.max(0, input.timestamp - (this.floatingEnteredAt ?? input.timestamp))
        : RETURN_WAVE_ARM_DELAY_MS;
    const armed =
      input.interactionState === 'PlanetFocusView' ||
      armedMs >= RETURN_WAVE_ARM_DELAY_MS;
    const bodyTarget = toBodyTarget(input.target, input.layout);
    this.updateTracks(input, armed, bodyTarget);

    if (!armed) {
      const observed = getObservedTrack(this.tracks);
      const snapshot: PlanetReturnWaveSnapshot = {
        ...EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
        state: 'Arming',
        handKey: observed?.handKey ?? null,
        handVisibleMs: observed?.visibleDurationMs ?? 0,
        elapsedMs: armedMs,
        peakSpeed: observed?.latestSpeed ?? null,
        reason: 'waiting-after-place-down',
      };
      this.snapshot = snapshot;
      return { snapshot, triggered: false, handKey: null };
    }

    if (!bodyTarget) {
      const observed = getObservedTrack(this.tracks);
      const snapshot: PlanetReturnWaveSnapshot = {
        ...EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
        state: 'Watching',
        handKey: observed?.handKey ?? null,
        handVisibleMs: observed?.visibleDurationMs ?? 0,
        peakSpeed: observed?.latestSpeed ?? null,
        reason: 'focused-body-target-unavailable',
      };
      this.snapshot = snapshot;
      return { snapshot, triggered: false, handKey: null };
    }

    const active = getBestCandidate(this.tracks, input.timestamp);
    if (!active?.candidate) {
      const held = getBestCandidate(this.tracks);
      if (held?.candidate && held.missingSince !== null) {
        const snapshot = createCandidateSnapshot(
          held,
          computeCandidateMetrics(held.candidate),
          false,
          'tracking-gap-held-for-reacquire',
        );
        this.snapshot = snapshot;
        return { snapshot, triggered: false, handKey: null };
      }

      const observed = getObservedTrack(this.tracks);
      const snapshot: PlanetReturnWaveSnapshot = {
        ...EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
        state: 'Watching',
        handKey: observed?.handKey ?? null,
        handVisibleMs: observed?.visibleDurationMs ?? 0,
        peakSpeed: observed?.latestSpeed ?? null,
        openHandScore: observed?.lastOpenScore ?? null,
        reason:
          input.tracking.hands.hands.length === 0
            ? 'waiting-for-hand'
            : (observed?.lastReason ?? 'waiting-for-fast-upper-corner-throw'),
      };
      this.snapshot = snapshot;
      return { snapshot, triggered: false, handKey: null };
    }

    const metrics = computeCandidateMetrics(active.candidate);
    const failureReason = getCandidateFailureReason(active.candidate, metrics);
    const triggered = failureReason === null;
    const snapshot = createCandidateSnapshot(
      active,
      metrics,
      triggered,
      triggered ? 'fast-upper-corner-throw-return' : failureReason,
    );
    this.snapshot = snapshot;
    if (triggered) {
      this.triggeredLatch = true;
    }

    return {
      snapshot,
      triggered,
      handKey: triggered ? active.handKey : null,
    };
  }

  reset(): void {
    this.activeState = null;
    this.floatingEnteredAt = null;
    this.tracks = [];
    this.nextTrackId = 1;
    this.triggeredLatch = false;
    this.snapshot = EMPTY_PLANET_RETURN_WAVE_SNAPSHOT;
  }

  getSnapshot(): PlanetReturnWaveSnapshot {
    return this.snapshot;
  }

  private prepareState(state: EligibleFocusState, timestamp: number): void {
    if (this.activeState === state) {
      return;
    }

    this.activeState = state;
    this.floatingEnteredAt =
      state === 'PlanetFocusFloating' ? timestamp : null;
    this.tracks = [];
    this.nextTrackId = 1;
    this.triggeredLatch = false;
  }

  private updateTracks(
    input: PlanetReturnWaveUpdateInput,
    armed: boolean,
    bodyTarget: BodyTarget | null,
  ): void {
    const shortSide = Math.max(
      1,
      Math.min(input.layout.stageWidth, input.layout.stageHeight),
    );
    const samples: HandSample[] = input.tracking.hands.hands.map((hand) => ({
      hand,
      point: toShortSidePoint(
        mapNormalizedToStagePixel(hand.center, input.layout),
        shortSide,
      ),
      openScore: computeHandPoseIntent(hand).openHandScore ?? 0,
    }));
    const matches = createSpatialMatches(this.tracks, samples, input.timestamp);
    const matchedTracks = new Set<WaveHandTrack>();
    const matchedSamples = new Set<number>();

    matches.forEach((match) => {
      if (matchedTracks.has(match.track) || matchedSamples.has(match.sampleIndex)) {
        return;
      }

      const sample = samples[match.sampleIndex];
      this.advanceTrack(
        match.track,
        sample,
        input.timestamp,
        armed,
        bodyTarget,
      );
      match.track.missingSince = null;
      matchedTracks.add(match.track);
      matchedSamples.add(match.sampleIndex);
    });

    samples.forEach((sample, index) => {
      if (matchedSamples.has(index)) {
        return;
      }

      const track: WaveHandTrack = {
        handKey: `return-hand-${this.nextTrackId}`,
        lastCenter: sample.hand.center,
        lastPoint: sample.point,
        lastAt: input.timestamp,
        lastOpenScore: sample.openScore,
        lastPalmScale: sample.hand.palmScale,
        lastVelocity: { x: 0, y: 0 },
        latestSpeed: 0,
        visibleDurationMs: 0,
        missingSince: null,
        candidate: null,
        strokeBlocked: false,
        lastReason: 'waiting-for-fast-upper-corner-throw',
      };
      this.nextTrackId += 1;
      this.tracks.push(track);
      matchedTracks.add(track);
    });

    this.tracks.forEach((track) => {
      if (!matchedTracks.has(track)) {
        track.missingSince ??= input.timestamp;
      }
    });
    this.tracks = this.tracks.filter(
      (track) =>
        track.missingSince === null ||
        input.timestamp - track.missingSince <=
          RETURN_WAVE_TRACKING_GAP_HOLD_MS,
    );
  }

  private advanceTrack(
    track: WaveHandTrack,
    sample: HandSample,
    timestamp: number,
    armed: boolean,
    bodyTarget: BodyTarget | null,
  ): void {
    const deltaMs = timestamp - track.lastAt;
    if (deltaMs <= 0) {
      return;
    }

    const stepX = sample.point.x - track.lastPoint.x;
    const stepY = sample.point.y - track.lastPoint.y;
    const stepLength = Math.hypot(stepX, stepY);
    const deltaSeconds = deltaMs / 1000;
    const speed = stepLength / deltaSeconds;
    const wasMissing = track.missingSince !== null;
    track.latestSpeed = speed;
    if (!wasMissing) {
      track.visibleDurationMs += deltaMs;
    }

    if (!armed || !bodyTarget) {
      track.candidate = null;
      track.lastReason = !armed
        ? 'waiting-after-place-down'
        : 'focused-body-target-unavailable';
    } else {
      const motionOnsetSpeed = RETURN_WAVE_MIN_PEAK_SPEED / 3;
      if (
        track.candidate &&
        speed >= motionOnsetSpeed &&
        hasDirectionReversed(track.candidate, sample.point)
      ) {
        track.candidate = null;
        track.strokeBlocked = false;
        track.lastReason = 'sweep-direction-reversed';
      }

      if (!track.candidate && speed < motionOnsetSpeed) {
        track.strokeBlocked = false;
      }

      if (
        !track.candidate &&
        !track.strokeBlocked &&
        speed >= motionOnsetSpeed
      ) {
        const startDistanceToBody = stageDistance(
          track.lastPoint,
          bodyTarget.point,
        );
        if (!isSafeCandidateStart(track.lastCenter)) {
          track.strokeBlocked = true;
          track.lastReason = 'sweep-start-too-close-to-frame-edge';
        } else if (
          startDistanceToBody <=
          bodyTarget.hitRadius * RETURN_WAVE_START_CLEARANCE
        ) {
          track.strokeBlocked = true;
          track.lastReason = 'sweep-start-inside-body-clearance';
        } else {
          track.candidate = createSweepCandidate({
            startedAt: track.lastAt,
            lastAt: timestamp,
            startPoint: track.lastPoint,
            point: sample.point,
            stepLength,
            speed,
            previousOpenScore: track.lastOpenScore,
            openScore: sample.openScore,
            previousPalmScale: track.lastPalmScale,
            palmScale: sample.hand.palmScale,
            startDistanceToBody,
            endDistanceToBody: stageDistance(sample.point, bodyTarget.point),
            bodyHitRadius: bodyTarget.hitRadius,
          });
          track.lastReason = 'collecting-motion-evidence';
        }
      } else if (track.candidate) {
        appendCandidateSample({
          candidate: track.candidate,
          point: sample.point,
          timestamp,
          stepLength,
          speed,
          openScore: sample.openScore,
          palmScale: sample.hand.palmScale,
          endDistanceToBody: stageDistance(sample.point, bodyTarget.point),
        });
      } else if (speed < motionOnsetSpeed) {
        track.lastReason = 'waiting-for-fast-upper-corner-throw';
      }
    }

    track.lastCenter = sample.hand.center;
    track.lastPoint = sample.point;
    track.lastAt = timestamp;
    track.lastOpenScore = sample.openScore;
    track.lastPalmScale = sample.hand.palmScale;
    track.lastVelocity = {
      x: stepX / deltaSeconds,
      y: stepY / deltaSeconds,
    };
  }
}

function createSpatialMatches(
  tracks: WaveHandTrack[],
  samples: HandSample[],
  timestamp: number,
): Array<{ track: WaveHandTrack; sampleIndex: number; score: number }> {
  const matches: Array<{
    track: WaveHandTrack;
    sampleIndex: number;
    score: number;
  }> = [];

  tracks.forEach((track) => {
    if (!canReacquireTrack(track, timestamp)) {
      return;
    }

    samples.forEach((sample, sampleIndex) => {
      const elapsedSeconds = Math.max(0, timestamp - track.lastAt) / 1000;
      const distance = stageDistance(track.lastPoint, sample.point);
      const reacquireRadius =
        RETURN_WAVE_REACQUIRE_BASE_RADIUS +
        RETURN_WAVE_MAX_PLAUSIBLE_HAND_SPEED * elapsedSeconds;
      if (distance > reacquireRadius) {
        return;
      }

      if (track.missingSince !== null) {
        if (!hasStablePalmScale(track.lastPalmScale, sample.hand.palmScale)) {
          return;
        }
        if (!hasConsistentGapDirection(track, sample.point)) {
          return;
        }
      }

      const predictedPoint =
        track.missingSince === null
          ? track.lastPoint
          : {
              x: track.lastPoint.x + track.lastVelocity.x * elapsedSeconds,
              y: track.lastPoint.y + track.lastVelocity.y * elapsedSeconds,
            };
      matches.push({
        track,
        sampleIndex,
        score: stageDistance(predictedPoint, sample.point),
      });
    });
  });

  matches.sort((left, right) => left.score - right.score);
  return matches;
}

function createSweepCandidate(input: {
  startedAt: number;
  lastAt: number;
  startPoint: StagePoint;
  point: StagePoint;
  stepLength: number;
  speed: number;
  previousOpenScore: number;
  openScore: number;
  previousPalmScale: number;
  palmScale: number;
  startDistanceToBody: number;
  endDistanceToBody: number;
  bodyHitRadius: number;
}): SweepCandidate {
  return {
    startedAt: input.startedAt,
    lastAt: input.lastAt,
    startPoint: input.startPoint,
    lastPoint: input.point,
    pathLength: input.stepLength,
    stableFrames: 2,
    peakSpeed: input.speed,
    openScoreTotal: input.previousOpenScore + input.openScore,
    openScoreCount: 2,
    palmScaleMin: Math.min(input.previousPalmScale, input.palmScale),
    palmScaleMax: Math.max(input.previousPalmScale, input.palmScale),
    startDistanceToBody: input.startDistanceToBody,
    endDistanceToBody: input.endDistanceToBody,
    recentBodyDistances: [
      input.startDistanceToBody,
      input.endDistanceToBody,
    ],
    bodyHitRadius: input.bodyHitRadius,
  };
}

function appendCandidateSample(input: {
  candidate: SweepCandidate;
  point: StagePoint;
  timestamp: number;
  stepLength: number;
  speed: number;
  openScore: number;
  palmScale: number;
  endDistanceToBody: number;
}): void {
  input.candidate.lastPoint = input.point;
  input.candidate.lastAt = input.timestamp;
  input.candidate.pathLength += input.stepLength;
  input.candidate.stableFrames += 1;
  input.candidate.peakSpeed = Math.max(
    input.candidate.peakSpeed,
    input.speed,
  );
  input.candidate.openScoreTotal += input.openScore;
  input.candidate.openScoreCount += 1;
  input.candidate.palmScaleMin = Math.min(
    input.candidate.palmScaleMin,
    input.palmScale,
  );
  input.candidate.palmScaleMax = Math.max(
    input.candidate.palmScaleMax,
    input.palmScale,
  );
  input.candidate.endDistanceToBody = input.endDistanceToBody;
  input.candidate.recentBodyDistances.push(input.endDistanceToBody);
  if (
    input.candidate.recentBodyDistances.length >
    RETURN_WAVE_MIN_EVIDENCE_FRAMES
  ) {
    input.candidate.recentBodyDistances.shift();
  }
}

function computeCandidateMetrics(candidate: SweepCandidate): CandidateMetrics {
  const deltaX = candidate.lastPoint.x - candidate.startPoint.x;
  const deltaY = candidate.lastPoint.y - candidate.startPoint.y;
  const displacement = Math.hypot(deltaX, deltaY);
  const elapsedMs = Math.max(0, candidate.lastAt - candidate.startedAt);
  const netSpeed = elapsedMs > 0 ? displacement / (elapsedMs / 1000) : 0;
  const coherence =
    candidate.pathLength > 0 ? displacement / candidate.pathLength : 0;
  const horizontalDisplacement = Math.abs(deltaX);
  const upwardDisplacement = Math.max(0, -deltaY);
  const horizontalDirectionRatio =
    displacement > 0 ? horizontalDisplacement / displacement : 0;
  const upwardDirectionRatio = displacement > 0 ? -deltaY / displacement : 0;
  const cornerDirection = getCornerDirection(deltaX, deltaY);
  const openHandScore =
    candidate.openScoreCount > 0
      ? candidate.openScoreTotal / candidate.openScoreCount
      : 0;
  const palmScaleRatio =
    candidate.palmScaleMin > 0
      ? candidate.palmScaleMax / candidate.palmScaleMin
      : Number.POSITIVE_INFINITY;
  const bodyDistanceTrend =
    candidate.recentBodyDistances[
      candidate.recentBodyDistances.length - 1
    ] -
    candidate.recentBodyDistances[0];
  return {
    elapsedMs,
    displacement,
    peakSpeed: candidate.peakSpeed,
    netSpeed,
    coherence,
    horizontalDisplacement,
    upwardDisplacement,
    horizontalDirectionRatio,
    upwardDirectionRatio,
    cornerDirection,
    openHandScore,
    palmScaleRatio,
    startDistanceToBody: candidate.startDistanceToBody,
    endDistanceToBody: candidate.endDistanceToBody,
    bodyDistanceTrend,
    bodyHitRadius: candidate.bodyHitRadius,
    score: Math.min(
      clamp01(candidate.stableFrames / RETURN_WAVE_MIN_EVIDENCE_FRAMES),
      clamp01(candidate.peakSpeed / RETURN_WAVE_MIN_PEAK_SPEED),
      clamp01(displacement / RETURN_WAVE_MIN_DISPLACEMENT),
      clamp01(
        Math.min(horizontalDirectionRatio, upwardDirectionRatio) /
          RETURN_WAVE_MIN_CORNER_COMPONENT_RATIO,
      ),
      clamp01(
        candidate.startDistanceToBody /
          (candidate.bodyHitRadius * RETURN_WAVE_START_CLEARANCE),
      ),
      bodyDistanceTrend > 0 ? 1 : 0,
      clamp01(openHandScore / RETURN_WAVE_MIN_OPEN_HAND_SCORE),
    ),
  };
}

function getCandidateFailureReason(
  candidate: SweepCandidate,
  metrics: CandidateMetrics,
): string | null {
  if (candidate.stableFrames < RETURN_WAVE_MIN_EVIDENCE_FRAMES) {
    return 'collecting-motion-evidence';
  }
  if (metrics.peakSpeed < RETURN_WAVE_MIN_PEAK_SPEED) {
    return 'peak-speed-too-low';
  }
  if (metrics.displacement < RETURN_WAVE_MIN_DISPLACEMENT) {
    return 'sweep-displacement-too-small';
  }
  if (!hasUpperCornerDirection(metrics)) {
    return 'sweep-not-toward-upper-corner';
  }
  if (
    metrics.startDistanceToBody <=
    metrics.bodyHitRadius * RETURN_WAVE_START_CLEARANCE
  ) {
    return 'sweep-start-inside-body-clearance';
  }
  if (metrics.bodyDistanceTrend <= 0) {
    return 'sweep-ending-toward-body';
  }
  if (metrics.endDistanceToBody <= metrics.bodyHitRadius) {
    return 'sweep-ending-inside-body-hit-zone';
  }
  if (metrics.openHandScore < RETURN_WAVE_MIN_OPEN_HAND_SCORE) {
    return 'hand-looks-pinched-or-closed';
  }
  return null;
}

function createCandidateSnapshot(
  track: WaveHandTrack,
  metrics: CandidateMetrics,
  triggered: boolean,
  reason: string,
): PlanetReturnWaveSnapshot {
  return {
    state: triggered ? 'Triggered' : 'Sweeping',
    handKey: track.handKey,
    handVisibleMs: track.visibleDurationMs,
    handReady:
      (track.candidate?.stableFrames ?? 0) >=
      RETURN_WAVE_MIN_EVIDENCE_FRAMES,
    elapsedMs: metrics.elapsedMs,
    stableFrames: track.candidate?.stableFrames ?? 0,
    displacement: metrics.displacement,
    medianSpeed: null,
    netSpeed: metrics.netSpeed,
    coherence: metrics.coherence,
    horizontalDisplacement: metrics.horizontalDisplacement,
    upwardDisplacement: metrics.upwardDisplacement,
    cornerDirection: metrics.cornerDirection,
    openHandScore: metrics.openHandScore,
    palmScaleRatio: metrics.palmScaleRatio,
    triggerMode: null,
    score: metrics.score,
    triggered,
    reason,
    peakSpeed: metrics.peakSpeed,
    startDistanceToBody: metrics.startDistanceToBody,
    endDistanceToBody: metrics.endDistanceToBody,
    bodyDistanceTrend: metrics.bodyDistanceTrend,
    bodyHitRadius: metrics.bodyHitRadius,
  };
}

function getBestCandidate(
  tracks: WaveHandTrack[],
  updatedAt?: number,
): WaveHandTrack | null {
  let best: WaveHandTrack | null = null;
  let bestPeakSpeed = Number.NEGATIVE_INFINITY;
  let bestDisplacement = Number.NEGATIVE_INFINITY;

  tracks.forEach((track) => {
    if (!track.candidate || (updatedAt !== undefined && track.lastAt !== updatedAt)) {
      return;
    }

    const displacement = stageDistance(
      track.candidate.startPoint,
      track.candidate.lastPoint,
    );
    if (
      track.candidate.peakSpeed > bestPeakSpeed ||
      (track.candidate.peakSpeed === bestPeakSpeed &&
        displacement > bestDisplacement)
    ) {
      best = track;
      bestPeakSpeed = track.candidate.peakSpeed;
      bestDisplacement = displacement;
    }
  });

  return best;
}

function getObservedTrack(tracks: WaveHandTrack[]): WaveHandTrack | null {
  return tracks.reduce<WaveHandTrack | null>((best, track) => {
    if (track.missingSince !== null) {
      return best;
    }
    return !best || track.latestSpeed > best.latestSpeed ? track : best;
  }, null);
}

function canReacquireTrack(track: WaveHandTrack, timestamp: number): boolean {
  return (
    track.missingSince === null ||
    timestamp - track.missingSince <= RETURN_WAVE_TRACKING_GAP_HOLD_MS
  );
}

function hasStablePalmScale(previous: number, next: number): boolean {
  if (previous <= 0 || next <= 0) {
    return false;
  }
  const ratio = Math.max(previous, next) / Math.min(previous, next);
  return ratio <= RETURN_WAVE_REACQUIRE_MAX_PALM_SCALE_RATIO;
}

function hasConsistentGapDirection(
  track: WaveHandTrack,
  point: StagePoint,
): boolean {
  const stepX = point.x - track.lastPoint.x;
  const stepY = point.y - track.lastPoint.y;
  const candidate = track.candidate;
  const referenceX = candidate
    ? candidate.lastPoint.x - candidate.startPoint.x
    : track.lastVelocity.x;
  const referenceY = candidate
    ? candidate.lastPoint.y - candidate.startPoint.y
    : track.lastVelocity.y;
  const stepLength = Math.hypot(stepX, stepY);
  const referenceLength = Math.hypot(referenceX, referenceY);

  if (stepLength <= Number.EPSILON || referenceLength <= Number.EPSILON) {
    return true;
  }
  return stepX * referenceX + stepY * referenceY > 0;
}

function hasDirectionReversed(
  candidate: SweepCandidate,
  point: StagePoint,
): boolean {
  const netX = candidate.lastPoint.x - candidate.startPoint.x;
  const netY = candidate.lastPoint.y - candidate.startPoint.y;
  const stepX = point.x - candidate.lastPoint.x;
  const stepY = point.y - candidate.lastPoint.y;
  return netX * stepX + netY * stepY < 0;
}

function hasUpperCornerDirection(metrics: CandidateMetrics): boolean {
  return (
    metrics.upwardDirectionRatio >= RETURN_WAVE_MIN_CORNER_COMPONENT_RATIO &&
    metrics.horizontalDirectionRatio >= RETURN_WAVE_MIN_CORNER_COMPONENT_RATIO
  );
}

function getCornerDirection(
  deltaX: number,
  deltaY: number,
): PlanetReturnWaveCornerDirection | null {
  if (deltaY >= 0 || deltaX === 0) {
    return null;
  }
  return deltaX < 0 ? 'upper-left' : 'upper-right';
}

function isSafeCandidateStart(point: NormalizedPoint): boolean {
  return (
    point.x >= RETURN_WAVE_START_EDGE_INSET &&
    point.x <= 1 - RETURN_WAVE_START_EDGE_INSET &&
    point.y >= RETURN_WAVE_START_EDGE_INSET &&
    point.y <= 1 - RETURN_WAVE_START_EDGE_INSET
  );
}

function isEligibleFocusState(
  state: InteractionState,
): state is EligibleFocusState {
  return state === 'PlanetFocusView' || state === 'PlanetFocusFloating';
}

function toBodyTarget(
  target: FocusedCelestialBodyScreenTarget | null,
  layout: PreviewLayout,
): BodyTarget | null {
  if (!target?.visible) {
    return null;
  }
  const shortSide = Math.max(1, Math.min(layout.stageWidth, layout.stageHeight));
  return {
    point: toShortSidePoint(target.screenPosition, shortSide),
    hitRadius: target.hitRadiusPx / shortSide,
  };
}

function stageDistance(first: StagePoint, second: StagePoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function toShortSidePoint(point: StagePoint, shortSide: number): StagePoint {
  return {
    x: point.x / shortSide,
    y: point.y / shortSide,
  };
}
