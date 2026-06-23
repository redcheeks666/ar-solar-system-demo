import type { Camera } from 'three';
import {
  clamp,
  clamp01,
  distance2d,
  distance3d,
  inverseLerp,
  lerp,
} from '../utils/math';
import type {
  InteractionState,
  NormalizedPoint,
  SolarInspectionSnapshot,
  TrackedHand,
  TrackingSnapshot,
} from '../utils/types';
import { LowPassNumberFilter } from '../tracking/smoothing';
import {
  INDEX_TIP_INDEX,
  MIDDLE_TIP_INDEX,
  PINKY_TIP_INDEX,
  RING_TIP_INDEX,
  THUMB_TIP_INDEX,
} from './handLandmarks';
import { computeHandPoseIntent } from './handPose';
import {
  type PreviewLayout,
  type Vec3,
  mapNormalizedToWorld,
} from './coordinateMapping';
import type { SolarOpeningSnapshot } from './solarOpeningController';

export interface SolarInspectionUpdateInput {
  tracking: TrackingSnapshot;
  interactionState: InteractionState;
  solarSnapshot: SolarOpeningSnapshot;
  layout: PreviewLayout;
  camera: Camera;
  planeZ: number;
  timestamp: number;
}

export interface SolarInspectionUpdate {
  snapshot: SolarInspectionSnapshot;
  solarSnapshot: SolarOpeningSnapshot;
}

export const EMPTY_SOLAR_INSPECTION_SNAPSHOT: SolarInspectionSnapshot = {
  active: false,
  intent: 'inactive',
  reason: 'inactive',
  fingerSpread: null,
  fingerSpreadVelocity: null,
  panScore: 0,
  palmCenter: {
    x: null,
    y: null,
  },
  palmCenterVelocity: null,
  resetHoldMs: 0,
  inspectionScale: 1,
  inspectionOffset: {
    x: 0,
    y: 0,
    z: 0,
  },
};

const MIN_INSPECTION_SCALE = 0.6;
const MAX_INSPECTION_SCALE = 2.5;
const RESET_HOLD_MS = 2000;
const FIST_SPREAD_MAX = 0.28;
const FIST_GRIP_MIN = 0.55;
const ZOOM_SPREAD_VELOCITY_MIN = 0.055;
const ZOOM_REVERSE_EXIT_VELOCITY = 0.024;
const ZOOM_SETTLED_VELOCITY = 0.018;
const ZOOM_MAX_PALM_VELOCITY = 0.2;
const ZOOM_GAIN = 1.35;
const ZOOM_MAX_SCALE_CHANGE_PER_SECOND = 1.6;
const ZOOM_IN_START_SPREAD_MAX = 0.64;
const ZOOM_OUT_START_SPREAD_MIN = 0.68;
const ZOOM_OPEN_STABLE_MS = 130;
const ZOOM_UNLOCK_STABLE_MS = 180;
const ZOOM_UNLOCK_SPREAD_MIN = 0.34;
const ZOOM_UNLOCK_SPREAD_MAX = 0.62;
const PAN_MIN_SPREAD = 0.4;
const PAN_MAX_SPREAD_VELOCITY = 0.11;
const PAN_MIN_PALM_VELOCITY = 0.055;
const PAN_FULL_PALM_VELOCITY = 0.18;
const PAN_FULL_SPREAD = 0.75;
const PAN_GAIN = 1;
const PAN_ARM_STABLE_MS = 100;
const PAN_RELEASE_SPREAD_DELTA = 0.18;
const PAN_RELEASE_SPREAD_VELOCITY = 0.2;
const PAN_WORLD_DEAD_ZONE = 0.015;
const PAN_OFFSET_SMOOTHING = 0.26;
const MIN_DT_SECONDS = 1 / 120;
const MAX_DT_SECONDS = 0.12;
const TIP_SPREAD_MIN = 0.95;
const TIP_SPREAD_MAX = 2.2;

const TIP_INDICES = [
  THUMB_TIP_INDEX,
  INDEX_TIP_INDEX,
  MIDDLE_TIP_INDEX,
  RING_TIP_INDEX,
  PINKY_TIP_INDEX,
];

type InspectionGesturePhase =
  | 'idle'
  | 'zoomInActive'
  | 'zoomOutActive'
  | 'panActive';

export class SolarInspectionController {
  private readonly spreadFilter = new LowPassNumberFilter(0.32);
  private previousSpread: number | null = null;
  private previousPalmCenter: NormalizedPoint | null = null;
  private previousPalmWorld: Vec3 | null = null;
  private previousTimestamp: number | null = null;
  private defaultMidpointWorld: Vec3 | null = null;
  private defaultScale: number | null = null;
  private smoothedPanMidpointWorld: Vec3 | null = null;
  private resetHoldStartedAt: number | null = null;
  private gesturePhase: InspectionGesturePhase = 'idle';
  private zoomReboundLocked = false;
  private zoomUnlockStableSince: number | null = null;
  private openStableSince: number | null = null;
  private panCandidateSince: number | null = null;
  private panCandidatePalmWorld: Vec3 | null = null;
  private panCandidateMidpointWorld: Vec3 | null = null;
  private panAnchorPalmWorld: Vec3 | null = null;
  private panAnchorMidpointWorld: Vec3 | null = null;
  private panAnchorSpread: number | null = null;
  // Center of the dominant hand currently driving inspection, used to keep tracking the same hand
  // across frames and ignore a weak/blip second hand instead of resetting.
  private lockedHandCenter: NormalizedPoint | null = null;

  update(input: SolarInspectionUpdateInput): SolarInspectionUpdate {
    if (
      input.interactionState !== 'SolarFreeHover' ||
      !input.solarSnapshot.visible ||
      !input.solarSnapshot.midpointWorld
    ) {
      this.reset();
      return {
        snapshot: EMPTY_SOLAR_INSPECTION_SNAPSHOT,
        solarSnapshot: input.solarSnapshot,
      };
    }

    this.captureDefaultSnapshot(input.solarSnapshot);

    const hand = this.resolveActiveHand(input.tracking);
    if (!hand) {
      this.resetMotion();
      return {
        snapshot: this.createSnapshot({
          active: false,
          intent: 'idle',
          reason: 'waiting-for-a-hand',
          solarSnapshot: input.solarSnapshot,
        }),
        solarSnapshot: input.solarSnapshot,
      };
    }

    const timestamp = input.timestamp;
    const rawSpread = computeFingerSpreadScore(hand);
    const fingerSpread = this.spreadFilter.smooth(rawSpread);
    const dtSeconds = this.getDeltaSeconds(timestamp);
    const fingerSpreadVelocity =
      this.previousSpread === null
        ? 0
        : (fingerSpread - this.previousSpread) / dtSeconds;
    const palmCenterVelocity =
      this.previousPalmCenter === null
        ? 0
        : distance2d(hand.center, this.previousPalmCenter) / dtSeconds;
    const panScore = computePanScore(
      fingerSpread,
      fingerSpreadVelocity,
      palmCenterVelocity,
    );
    const palmWorld = mapNormalizedToWorld(
      hand.center,
      input.layout,
      input.camera,
      input.planeZ,
    );
    const handPose = computeHandPoseIntent(hand);
    const isFist =
      fingerSpread <= FIST_SPREAD_MAX &&
      (handPose.gripPoseScore ?? 0) >= FIST_GRIP_MIN;

    this.updateZoomReboundLock(fingerSpread, fingerSpreadVelocity, timestamp);
    this.updateOpenStableWindow(fingerSpread, fingerSpreadVelocity, timestamp);

    let nextSolarSnapshot = input.solarSnapshot;
    let intent: SolarInspectionSnapshot['intent'] = 'idle';
    let reason = 'one-hand-inspection-idle';

    if (isFist) {
      this.resetPanState();
      this.gesturePhase = 'idle';
      this.resetHoldStartedAt ??= timestamp;
      const resetHoldMs = timestamp - this.resetHoldStartedAt;

      if (resetHoldMs >= RESET_HOLD_MS) {
        nextSolarSnapshot = this.createResetSolarSnapshot(input.solarSnapshot);
        intent = 'reset';
        reason = 'fist-reset-complete';
        this.resetMotionAfterTransform(hand.center, palmWorld, fingerSpread, timestamp);
        this.lockZoomRebound();

        return {
          snapshot: this.createSnapshot({
            active: true,
            intent,
            reason,
            solarSnapshot: nextSolarSnapshot,
            fingerSpread,
            fingerSpreadVelocity,
            panScore,
            palmCenter: hand.center,
            palmCenterVelocity,
            resetHoldMs,
          }),
          solarSnapshot: nextSolarSnapshot,
        };
      }

      intent = 'resetHold';
      reason = 'fist-reset-holding';
      this.updatePreviousMotion(hand.center, palmWorld, fingerSpread, timestamp);

      return {
        snapshot: this.createSnapshot({
          active: true,
          intent,
          reason,
          solarSnapshot: nextSolarSnapshot,
          fingerSpread,
          fingerSpreadVelocity,
          panScore,
          palmCenter: hand.center,
          palmCenterVelocity,
          resetHoldMs,
        }),
        solarSnapshot: nextSolarSnapshot,
      };
    }

    this.resetHoldStartedAt = null;

    const zoomPhaseUpdate = this.updateZoomPhase({
      snapshot: input.solarSnapshot,
      fingerSpread,
      fingerSpreadVelocity,
      palmCenterVelocity,
      dtSeconds,
      timestamp,
    });

    if (zoomPhaseUpdate) {
      nextSolarSnapshot = zoomPhaseUpdate.solarSnapshot;
      intent = zoomPhaseUpdate.intent;
      reason = zoomPhaseUpdate.reason;
      this.resetPanState();
    } else {
      const panPhaseUpdate = this.updatePanPhase({
        snapshot: input.solarSnapshot,
        palmWorld,
        fingerSpread,
        fingerSpreadVelocity,
        palmCenterVelocity,
        panScore,
        dtSeconds,
        timestamp,
      });

      if (panPhaseUpdate) {
        nextSolarSnapshot = panPhaseUpdate.solarSnapshot;
        intent = panPhaseUpdate.intent;
        reason = panPhaseUpdate.reason;
      } else if (this.zoomReboundLocked) {
        reason = 'zoom-rebound-ignored-until-neutral';
      }
    }

    this.updatePreviousMotion(hand.center, palmWorld, fingerSpread, timestamp);

    return {
      snapshot: this.createSnapshot({
        active: intent !== 'idle',
        intent,
        reason,
        solarSnapshot: nextSolarSnapshot,
        fingerSpread,
        fingerSpreadVelocity,
        panScore,
        palmCenter: hand.center,
        palmCenterVelocity,
        resetHoldMs: 0,
      }),
      solarSnapshot: nextSolarSnapshot,
    };
  }

  reset(): void {
    this.defaultMidpointWorld = null;
    this.defaultScale = null;
    this.resetMotion();
  }

  /**
   * Dominant single-hand lock. Inspection uses one hand, but real webcams briefly mis-detect a
   * second hand or flash one at the frame edge. Instead of requiring exactly one detected hand
   * (which reset the gesture every blip), keep tracking the hand nearest the locked one and ignore
   * the extra. With no lock yet, pick the dominant hand (largest palm = closest / most reliable).
   */
  private resolveActiveHand(tracking: TrackingSnapshot): TrackedHand | null {
    const hands = tracking.hands.hands;

    if (hands.length === 0) {
      this.lockedHandCenter = null;
      return null;
    }

    const chosen =
      this.lockedHandCenter !== null
        ? nearestHand(hands, this.lockedHandCenter)
        : dominantHand(hands);

    this.lockedHandCenter = { ...chosen.center };
    return chosen;
  }

  private captureDefaultSnapshot(snapshot: SolarOpeningSnapshot): void {
    if (this.defaultMidpointWorld || !snapshot.midpointWorld) {
      return;
    }

    this.defaultMidpointWorld = { ...snapshot.midpointWorld };
    this.defaultScale = snapshot.scale;
  }

  private createZoomSolarSnapshot(
    snapshot: SolarOpeningSnapshot,
    spreadVelocity: number,
    dtSeconds: number,
  ): SolarOpeningSnapshot {
    const defaultScale = this.defaultScale ?? snapshot.scale;
    const rawTargetScale = clamp(
      snapshot.scale * (1 + spreadVelocity * ZOOM_GAIN * dtSeconds),
      defaultScale * MIN_INSPECTION_SCALE,
      defaultScale * MAX_INSPECTION_SCALE,
    );
    const maxScaleDelta =
      defaultScale * ZOOM_MAX_SCALE_CHANGE_PER_SECOND * dtSeconds;
    const targetScale = clamp(
      rawTargetScale,
      snapshot.scale - maxScaleDelta,
      snapshot.scale + maxScaleDelta,
    );

    return {
      ...snapshot,
      scale: targetScale,
      reason: spreadVelocity > 0 ? 'inspection-zoom-in' : 'inspection-zoom-out',
    };
  }

  private createAnchoredPanSolarSnapshot(
    snapshot: SolarOpeningSnapshot,
    palmWorld: Vec3,
    anchorPalmWorld: Vec3,
    anchorMidpointWorld: Vec3,
    dtSeconds: number,
  ): SolarOpeningSnapshot {
    if (!snapshot.midpointWorld) {
      return snapshot;
    }

    const palmDelta = {
      x: palmWorld.x - anchorPalmWorld.x,
      y: palmWorld.y - anchorPalmWorld.y,
      z: palmWorld.z - anchorPalmWorld.z,
    };
    const panDistance = Math.hypot(palmDelta.x, palmDelta.y, palmDelta.z);
    const effectiveDelta =
      panDistance <= PAN_WORLD_DEAD_ZONE
        ? { x: 0, y: 0, z: 0 }
        : palmDelta;
    const targetMidpointWorld = {
      x: anchorMidpointWorld.x + effectiveDelta.x * PAN_GAIN,
      y: anchorMidpointWorld.y + effectiveDelta.y * PAN_GAIN,
      z: anchorMidpointWorld.z + effectiveDelta.z * PAN_GAIN,
    };
    const frameAdjustedAlpha = clamp01(PAN_OFFSET_SMOOTHING * dtSeconds * 60);
    const nextMidpointWorld = this.smoothPanMidpoint(
      snapshot.midpointWorld,
      targetMidpointWorld,
      frameAdjustedAlpha,
    );

    return {
      ...snapshot,
      midpointWorld: nextMidpointWorld,
      reason: 'inspection-pan',
    };
  }

  private updateZoomPhase(input: {
    snapshot: SolarOpeningSnapshot;
    fingerSpread: number;
    fingerSpreadVelocity: number;
    palmCenterVelocity: number;
    dtSeconds: number;
    timestamp: number;
  }):
    | {
        solarSnapshot: SolarOpeningSnapshot;
        intent: Extract<SolarInspectionSnapshot['intent'], 'zoomIn' | 'zoomOut'>;
        reason: string;
      }
    | null {
    const previousSpread = this.previousSpread;
    const palmStable = input.palmCenterVelocity <= ZOOM_MAX_PALM_VELOCITY;

    if (this.gesturePhase === 'zoomInActive') {
      if (
        input.fingerSpreadVelocity >= ZOOM_REVERSE_EXIT_VELOCITY &&
        palmStable
      ) {
        return {
          solarSnapshot: this.createZoomSolarSnapshot(
            input.snapshot,
            Math.max(input.fingerSpreadVelocity, ZOOM_SPREAD_VELOCITY_MIN),
            input.dtSeconds,
          ),
          intent: 'zoomIn',
          reason: 'single-hand-spread-zoom-in-locked',
        };
      }

      if (
        input.fingerSpreadVelocity <= -ZOOM_REVERSE_EXIT_VELOCITY ||
        Math.abs(input.fingerSpreadVelocity) <= ZOOM_SETTLED_VELOCITY ||
        !palmStable
      ) {
        this.finishZoomGesture();
      }

      return null;
    }

    if (this.gesturePhase === 'zoomOutActive') {
      if (
        input.fingerSpreadVelocity <= -ZOOM_REVERSE_EXIT_VELOCITY &&
        palmStable
      ) {
        return {
          solarSnapshot: this.createZoomSolarSnapshot(
            input.snapshot,
            Math.min(input.fingerSpreadVelocity, -ZOOM_SPREAD_VELOCITY_MIN),
            input.dtSeconds,
          ),
          intent: 'zoomOut',
          reason: 'single-hand-contract-zoom-out-locked',
        };
      }

      if (
        input.fingerSpreadVelocity >= ZOOM_REVERSE_EXIT_VELOCITY ||
        Math.abs(input.fingerSpreadVelocity) <= ZOOM_SETTLED_VELOCITY ||
        !palmStable
      ) {
        this.finishZoomGesture();
      }

      return null;
    }

    if (this.zoomReboundLocked || !palmStable || previousSpread === null) {
      return null;
    }

    if (
      previousSpread <= ZOOM_IN_START_SPREAD_MAX &&
      input.fingerSpreadVelocity >= ZOOM_SPREAD_VELOCITY_MIN
    ) {
      this.gesturePhase = 'zoomInActive';
      return {
        solarSnapshot: this.createZoomSolarSnapshot(
          input.snapshot,
          input.fingerSpreadVelocity,
          input.dtSeconds,
        ),
        intent: 'zoomIn',
        reason: 'single-hand-spread-zoom-in-armed',
      };
    }

    if (
      previousSpread >= ZOOM_OUT_START_SPREAD_MIN &&
      this.openStableSince !== null &&
      input.timestamp - this.openStableSince >= ZOOM_OPEN_STABLE_MS &&
      input.fingerSpreadVelocity <= -ZOOM_SPREAD_VELOCITY_MIN
    ) {
      this.gesturePhase = 'zoomOutActive';
      return {
        solarSnapshot: this.createZoomSolarSnapshot(
          input.snapshot,
          input.fingerSpreadVelocity,
          input.dtSeconds,
        ),
        intent: 'zoomOut',
        reason: 'single-hand-contract-zoom-out-armed',
      };
    }

    return null;
  }

  private updatePanPhase(input: {
    snapshot: SolarOpeningSnapshot;
    palmWorld: Vec3 | null;
    fingerSpread: number;
    fingerSpreadVelocity: number;
    palmCenterVelocity: number;
    panScore: number;
    dtSeconds: number;
    timestamp: number;
  }):
    | {
        solarSnapshot: SolarOpeningSnapshot;
        intent: Extract<SolarInspectionSnapshot['intent'], 'pan'>;
        reason: string;
      }
    | null {
    if (!input.palmWorld || !input.snapshot.midpointWorld) {
      this.resetPanState();
      return null;
    }

    if (this.gesturePhase === 'panActive') {
      if (
        !this.panAnchorPalmWorld ||
        !this.panAnchorMidpointWorld ||
        this.panAnchorSpread === null ||
        input.fingerSpread < PAN_MIN_SPREAD ||
        Math.abs(input.fingerSpread - this.panAnchorSpread) >
          PAN_RELEASE_SPREAD_DELTA ||
        Math.abs(input.fingerSpreadVelocity) > PAN_RELEASE_SPREAD_VELOCITY
      ) {
        this.resetPanState();
        return null;
      }

      return {
        solarSnapshot: this.createAnchoredPanSolarSnapshot(
          input.snapshot,
          input.palmWorld,
          this.panAnchorPalmWorld,
          this.panAnchorMidpointWorld,
          input.dtSeconds,
        ),
        intent: 'pan',
        reason: 'single-hand-push-pan-locked',
      };
    }

    const previousPalmWorld = this.previousPalmWorld;
    const candidate =
      previousPalmWorld !== null &&
      input.palmCenterVelocity >= PAN_MIN_PALM_VELOCITY &&
      Math.abs(input.fingerSpreadVelocity) <= PAN_MAX_SPREAD_VELOCITY &&
      input.fingerSpread >= PAN_MIN_SPREAD &&
      input.panScore > 0;

    if (!candidate) {
      this.panCandidateSince = null;
      this.panCandidatePalmWorld = null;
      this.panCandidateMidpointWorld = null;
      return null;
    }

    if (this.panCandidateSince === null) {
      this.panCandidateSince = input.timestamp;
      this.panCandidatePalmWorld = { ...previousPalmWorld };
      this.panCandidateMidpointWorld = { ...input.snapshot.midpointWorld };
    }

    if (input.timestamp - this.panCandidateSince < PAN_ARM_STABLE_MS) {
      return null;
    }

    this.gesturePhase = 'panActive';
    this.panAnchorPalmWorld = this.panCandidatePalmWorld
      ? { ...this.panCandidatePalmWorld }
      : { ...input.palmWorld };
    this.panAnchorMidpointWorld = this.panCandidateMidpointWorld
      ? { ...this.panCandidateMidpointWorld }
      : { ...input.snapshot.midpointWorld };
    this.panAnchorSpread = input.fingerSpread;
    this.panCandidateSince = null;
    this.panCandidatePalmWorld = null;
    this.panCandidateMidpointWorld = null;

    return {
      solarSnapshot: this.createAnchoredPanSolarSnapshot(
        input.snapshot,
        input.palmWorld,
        this.panAnchorPalmWorld,
        this.panAnchorMidpointWorld,
        input.dtSeconds,
      ),
      intent: 'pan',
      reason: 'single-hand-push-pan-armed',
    };
  }

  private updateZoomReboundLock(
    fingerSpread: number,
    fingerSpreadVelocity: number,
    timestamp: number,
  ): void {
    if (!this.zoomReboundLocked) {
      this.zoomUnlockStableSince = null;
      return;
    }

    const inNeutralRange =
      fingerSpread >= ZOOM_UNLOCK_SPREAD_MIN &&
      fingerSpread <= ZOOM_UNLOCK_SPREAD_MAX;
    const stable = Math.abs(fingerSpreadVelocity) <= ZOOM_SETTLED_VELOCITY;

    if (!inNeutralRange || !stable) {
      this.zoomUnlockStableSince = null;
      return;
    }

    this.zoomUnlockStableSince ??= timestamp;

    if (timestamp - this.zoomUnlockStableSince >= ZOOM_UNLOCK_STABLE_MS) {
      this.zoomReboundLocked = false;
      this.zoomUnlockStableSince = null;
    }
  }

  private updateOpenStableWindow(
    fingerSpread: number,
    fingerSpreadVelocity: number,
    timestamp: number,
  ): void {
    if (
      fingerSpread >= ZOOM_OUT_START_SPREAD_MIN &&
      Math.abs(fingerSpreadVelocity) <= ZOOM_SETTLED_VELOCITY
    ) {
      this.openStableSince ??= timestamp;
      return;
    }

    if (
      this.openStableSince !== null &&
      fingerSpread >= ZOOM_UNLOCK_SPREAD_MAX
    ) {
      return;
    }

    this.openStableSince = null;
  }

  private finishZoomGesture(): void {
    this.gesturePhase = 'idle';
    this.lockZoomRebound();
  }

  private lockZoomRebound(): void {
    this.zoomReboundLocked = true;
    this.zoomUnlockStableSince = null;
  }

  private createResetSolarSnapshot(snapshot: SolarOpeningSnapshot): SolarOpeningSnapshot {
    return {
      ...snapshot,
      midpointWorld: this.defaultMidpointWorld
        ? { ...this.defaultMidpointWorld }
        : snapshot.midpointWorld,
      scale: this.defaultScale ?? snapshot.scale,
      reason: 'inspection-reset',
    };
  }

  private smoothPanMidpoint(
    currentMidpointWorld: Vec3,
    targetMidpointWorld: Vec3,
    alpha: number,
  ): Vec3 {
    const from = this.smoothedPanMidpointWorld ?? currentMidpointWorld;
    this.smoothedPanMidpointWorld = {
      x: lerp(from.x, targetMidpointWorld.x, alpha),
      y: lerp(from.y, targetMidpointWorld.y, alpha),
      z: lerp(from.z, targetMidpointWorld.z, alpha),
    };

    return { ...this.smoothedPanMidpointWorld };
  }

  private createSnapshot(input: {
    active: boolean;
    intent: SolarInspectionSnapshot['intent'];
    reason: string;
    solarSnapshot: SolarOpeningSnapshot;
    fingerSpread?: number | null;
    fingerSpreadVelocity?: number | null;
    panScore?: number;
    palmCenter?: NormalizedPoint | null;
    palmCenterVelocity?: number | null;
    resetHoldMs?: number;
  }): SolarInspectionSnapshot {
    const defaultMidpoint = this.defaultMidpointWorld;
    const midpoint = input.solarSnapshot.midpointWorld;
    const defaultScale = this.defaultScale ?? input.solarSnapshot.scale;

    return {
      active: input.active,
      intent: input.intent,
      reason: input.reason,
      fingerSpread: input.fingerSpread ?? null,
      fingerSpreadVelocity: input.fingerSpreadVelocity ?? null,
      panScore: input.panScore ?? 0,
      palmCenter: {
        x: input.palmCenter?.x ?? null,
        y: input.palmCenter?.y ?? null,
      },
      palmCenterVelocity: input.palmCenterVelocity ?? null,
      resetHoldMs: input.resetHoldMs ?? 0,
      inspectionScale:
        defaultScale > 0 ? input.solarSnapshot.scale / defaultScale : 1,
      inspectionOffset:
        defaultMidpoint && midpoint
          ? {
              x: midpoint.x - defaultMidpoint.x,
              y: midpoint.y - defaultMidpoint.y,
              z: midpoint.z - defaultMidpoint.z,
            }
          : {
              x: 0,
              y: 0,
              z: 0,
            },
    };
  }

  private getDeltaSeconds(timestamp: number): number {
    if (this.previousTimestamp === null) {
      return MIN_DT_SECONDS;
    }

    return clamp(
      (timestamp - this.previousTimestamp) / 1000,
      MIN_DT_SECONDS,
      MAX_DT_SECONDS,
    );
  }

  private resetMotion(): void {
    this.spreadFilter.reset();
    this.lockedHandCenter = null;
    this.previousSpread = null;
    this.previousPalmCenter = null;
    this.previousPalmWorld = null;
    this.previousTimestamp = null;
    this.smoothedPanMidpointWorld = null;
    this.resetHoldStartedAt = null;
    this.gesturePhase = 'idle';
    this.zoomReboundLocked = false;
    this.zoomUnlockStableSince = null;
    this.openStableSince = null;
    this.resetPanState();
  }

  private resetMotionAfterTransform(
    palmCenter: NormalizedPoint,
    palmWorld: Vec3 | null,
    fingerSpread: number,
    timestamp: number,
  ): void {
    this.spreadFilter.reset();
    this.previousSpread = fingerSpread;
    this.previousPalmCenter = { ...palmCenter };
    this.previousPalmWorld = palmWorld ? { ...palmWorld } : null;
    this.previousTimestamp = timestamp;
    this.smoothedPanMidpointWorld = null;
    this.resetHoldStartedAt = null;
    this.gesturePhase = 'idle';
    this.resetPanState();
  }

  private updatePreviousMotion(
    palmCenter: NormalizedPoint,
    palmWorld: Vec3 | null,
    fingerSpread: number,
    timestamp: number,
  ): void {
    this.previousSpread = fingerSpread;
    this.previousPalmCenter = { ...palmCenter };
    this.previousPalmWorld = palmWorld ? { ...palmWorld } : null;
    this.previousTimestamp = timestamp;
  }

  private resetPanState(): void {
    if (this.gesturePhase === 'panActive') {
      this.gesturePhase = 'idle';
    }

    this.panCandidateSince = null;
    this.panCandidatePalmWorld = null;
    this.panCandidateMidpointWorld = null;
    this.panAnchorPalmWorld = null;
    this.panAnchorMidpointWorld = null;
    this.panAnchorSpread = null;
    this.smoothedPanMidpointWorld = null;
  }
}

function nearestHand(hands: TrackedHand[], target: NormalizedPoint): TrackedHand {
  let best = hands[0];
  let bestDistance = distance2d(best.center, target);

  for (const hand of hands) {
    const handDistance = distance2d(hand.center, target);
    if (handDistance < bestDistance) {
      best = hand;
      bestDistance = handDistance;
    }
  }

  return best;
}

function dominantHand(hands: TrackedHand[]): TrackedHand {
  let best = hands[0];

  for (const hand of hands) {
    if (hand.palmScale > best.palmScale) {
      best = hand;
    }
  }

  return best;
}

function computeFingerSpreadScore(hand: TrackedHand): number {
  if (hand.palmScale <= 0) {
    return 0;
  }

  const pose = computeHandPoseIntent(hand);
  const openHandScore = pose.openHandScore ?? 0;
  const tipDistances = TIP_INDICES.map((index) => hand.landmarks[index]).filter(
    (point): point is NormalizedPoint => Boolean(point),
  );

  if (tipDistances.length === 0) {
    return openHandScore;
  }

  const averageTipDistance =
    tipDistances.reduce(
      (sum, point) => sum + distance3d(point, hand.center) / hand.palmScale,
      0,
    ) / tipDistances.length;
  const tipSpreadScore = inverseLerp(
    TIP_SPREAD_MIN,
    TIP_SPREAD_MAX,
    averageTipDistance,
  );

  return clamp01(openHandScore * 0.68 + tipSpreadScore * 0.32);
}

function computePanScore(
  fingerSpread: number,
  fingerSpreadVelocity: number,
  palmCenterVelocity: number,
): number {
  const palmVelocityScore = inverseLerp(
    PAN_MIN_PALM_VELOCITY,
    PAN_FULL_PALM_VELOCITY,
    palmCenterVelocity,
  );
  const spreadScore = inverseLerp(PAN_MIN_SPREAD, PAN_FULL_SPREAD, fingerSpread);
  const spreadStableScore =
    1 - clamp01(Math.abs(fingerSpreadVelocity) / PAN_MAX_SPREAD_VELOCITY);

  return clamp01(palmVelocityScore * spreadScore * spreadStableScore);
}
