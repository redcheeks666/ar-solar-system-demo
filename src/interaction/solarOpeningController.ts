import type { Camera } from 'three';
import type {
  GestureThresholds,
  HandPoseIntentSnapshot,
  InteractionState,
  NormalizedPoint,
  SolarEndpointDebugMode,
  SolarEndpointDebugSnapshot,
  TrackingSnapshot,
} from '../utils/types';
import { clamp, clamp01, inverseLerp } from '../utils/math';
import {
  type PreviewLayout,
  type Vec3,
  mapNormalizedToWorld,
} from './coordinateMapping';
import { getVisualTrackedHandPair } from './handPairing';
import { computeHandPoseIntent } from './handPose';
import { SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN } from '../solar/solarSystemData';
import {
  MAX_VISUAL_WIDTH_ENTER_SCREEN_FRACTION,
  MAX_VISUAL_WIDTH_EXIT_SCREEN_FRACTION,
  MAX_VISUAL_WIDTH_STABLE_MS,
  SOLAR_PLACE_DOWN_FIST_SCORE_MIN,
  SOLAR_PLACE_DOWN_OPEN_MIN_FINGERS,
  SOLAR_PLACE_DOWN_OPEN_SCORE_MIN,
} from './intentTuning';
import { LowPassNumberFilter, LowPassPointFilter } from '../tracking/smoothing';

export interface SolarOpeningSnapshot {
  active: boolean;
  visible: boolean;
  progress: number;
  scale: number;
  reason: string;
  leftWorld: Vec3 | null;
  rightWorld: Vec3 | null;
  midpointWorld: Vec3 | null;
  normalizedDistance: number | null;
  startDistance: number | null;
  targetDistance: number | null;
}

export interface SolarOpeningUpdate {
  snapshot: SolarOpeningSnapshot;
  nextState: InteractionState | null;
}

export interface SolarOpeningUpdateInput {
  tracking: TrackingSnapshot;
  interactionState: InteractionState;
  thresholds: GestureThresholds;
  layout: PreviewLayout;
  camera: Camera;
  planeZ: number;
  timestamp: number;
}

interface SolarOpeningGeometry {
  leftCenter: NormalizedPoint;
  rightCenter: NormalizedPoint;
  leftWorld: Vec3;
  rightWorld: Vec3;
  midpointWorld: Vec3;
  normalizedDistance: number;
  worldDistance: number;
}

interface EndpointHit {
  leftEndpoint: Vec3;
  rightEndpoint: Vec3;
  leftDistance: number;
  rightDistance: number;
  radius: number;
  score: number;
  withinEnterRadius: boolean;
  withinExitRadius: boolean;
}

const EMPTY_SOLAR_OPENING_SNAPSHOT: SolarOpeningSnapshot = {
  active: false,
  visible: false,
  progress: 0,
  scale: 1,
  reason: 'inactive',
  leftWorld: null,
  rightWorld: null,
  midpointWorld: null,
  normalizedDistance: null,
  startDistance: null,
  targetDistance: null,
};

const MISSING_HAND_HOLD_MS = 360;
const OPEN_COMPLETE_PROGRESS = 0.985;
const OPEN_TARGET_MIN_DELTA = 0.3;
const OPEN_TARGET_MIN_DISTANCE = 0.5;
const OPEN_TARGET_MAX_DISTANCE = 0.78;
const MIN_FOLLOW_SCALE = 0.12;
const MAX_FOLLOW_SCALE = 1.08;
const MAX_OPENING_PROGRESS_DROP = 0.04;
// Low-pass factor pulling displayed openProgress toward the raw hand-driven value (PRD §13: 0.15-0.3).
const OPENING_PROGRESS_SMOOTHING = 0.22;
// Cap on how fast displayed openProgress may rise per frame, so a sudden hand-distance jump
// eases the system open instead of snapping it. Scaled by frame time, like the outlier guards.
const MAX_OPENING_PROGRESS_RISE_PER_FRAME = 0.06;
const MAX_NORMALIZED_DISTANCE_DROP_PER_FRAME = 0.13;
const MAX_MIDPOINT_JUMP_PER_FRAME = 0.75;
const SUSPICIOUS_SCALE_DROP_RATIO = 0.68;
const SUSPICIOUS_MIN_SCALE_AFTER_OPEN = 0.2;
const MIN_PREVIOUS_SCALE_FOR_OUTLIER_CHECK = 0.32;
const TARGET_FRAME_MS = 33.33;
// Re-grip dwell: both hands must hold the endpoints stably for ~0.5s before
// SolarActive / SolarFreeHover hands re-acquire SolarHandleControl.
const ENDPOINT_ENTER_STABLE_MS = 500;

const EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT: SolarEndpointDebugSnapshot = {
  mode: 'inactive',
  reason: 'inactive',
  handLeftWorld: null,
  handRightWorld: null,
  referenceLeftWorld: null,
  referenceRightWorld: null,
  leftDistanceWorld: null,
  rightDistanceWorld: null,
  radiusWorld: null,
  score: 0,
  bothWithinRadius: false,
  stableMs: 0,
  stableRequiredMs: ENDPOINT_ENTER_STABLE_MS,
};
const ENDPOINT_EXIT_GRACE_MS = 180;
// In SolarHandleControl the opened solar system is hand-attached, so a place-down
// no longer comes from leaving the endpoints. It comes from a deliberate two-hand
// fist->open gesture, a sustained near-edge visual span, or a fallback when both
// hands are fully lost for this long.
const HANDLE_HAND_LOSS_RELEASE_MS = 320;
// Once both hands close into a fist (armed), wait at most this long for them to
// reopen before discarding the place-down attempt and resuming hand-follow.
const PLACE_DOWN_ARMED_TIMEOUT_MS = 1600;
// After opening completes (SolarActive), if the hands are not holding the endpoints for this long
// (released or dropped), fall through to SolarFreeHover so the solar system can hover while waiting
// for endpoint re-grip or reverse collapse.
const ACTIVE_RELEASE_GRACE_MS = 220;
const ENDPOINT_RADIUS_WORLD_SCALE = 0.72;
const MIN_ENDPOINT_RADIUS_WORLD = 0.32;
const MAX_ENDPOINT_RADIUS_WORLD = 1;
// Frame-to-frame low-pass on the geometry-driven transform while the system is held / collapsing,
// so scale and midpoint stop jittering with raw hand-landmark noise (PRD §13).
const SCALE_SMOOTHING_ALPHA = 0.25;
const MIDPOINT_SMOOTHING_ALPHA = 0.3;

export class SolarOpeningController {
  private previousPair: { left: NormalizedPoint; right: NormalizedPoint } | null =
    null;
  private startDistance: number | null = null;
  private targetDistance: number | null = null;
  private lastSnapshot: SolarOpeningSnapshot = EMPTY_SOLAR_OPENING_SNAPSHOT;
  private missingSince: number | null = null;
  private lastAcceptedAt: number | null = null;
  private endpointHitSince: number | null = null;
  private endpointMissSince: number | null = null;
  private activeReleaseSince: number | null = null;
  // Non-null once both hands have closed into a fist during SolarHandleControl,
  // holding the place-down "armed" until they reopen (confirm) or it times out.
  private placeDownArmedSince: number | null = null;
  private maxVisualWidthSince: number | null = null;
  private smoothedOpenProgress = 0;
  private lastRawOpenProgress = 0;
  private endpointDebug = EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT;
  private readonly scaleFilter = new LowPassNumberFilter(SCALE_SMOOTHING_ALPHA);
  private readonly midpointFilter = new LowPassPointFilter(MIDPOINT_SMOOTHING_ALPHA);

  update(input: SolarOpeningUpdateInput): SolarOpeningUpdate {
    if (input.interactionState !== 'SolarHandleControl') {
      this.maxVisualWidthSince = null;
    }

    this.endpointDebug = {
      ...EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT,
      reason: `inactive-in-${input.interactionState}`,
    };

    if (input.interactionState === 'PullArmed') {
      return this.updatePullArmed(input);
    }

    if (input.interactionState === 'SolarOpening') {
      return this.updateOpening(input);
    }

    if (
      input.interactionState === 'SolarActive' ||
      input.interactionState === 'SolarFreeHover'
    ) {
      return this.updateActive(input);
    }

    if (input.interactionState === 'SolarHandleControl') {
      return this.updateHandleControl(input);
    }

    if (input.interactionState === 'SolarClosing') {
      return this.updateClosing(input);
    }

    if (isBodyInteractionState(input.interactionState)) {
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: Math.max(this.lastSnapshot.progress, 1),
          reason: 'solar-held-during-body-interaction',
        },
        nextState: null,
      };
    }

    this.reset();
    return { snapshot: EMPTY_SOLAR_OPENING_SNAPSHOT, nextState: null };
  }

  reset(): void {
    this.previousPair = null;
    this.startDistance = null;
    this.targetDistance = null;
    this.missingSince = null;
    this.lastAcceptedAt = null;
    this.endpointHitSince = null;
    this.endpointMissSince = null;
    this.activeReleaseSince = null;
    this.placeDownArmedSince = null;
    this.maxVisualWidthSince = null;
    this.smoothedOpenProgress = 0;
    this.lastRawOpenProgress = 0;
    this.endpointDebug = EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT;
    this.scaleFilter.reset();
    this.midpointFilter.reset();
    this.lastSnapshot = EMPTY_SOLAR_OPENING_SNAPSHOT;
  }

  getEndpointDebugSnapshot(): SolarEndpointDebugSnapshot {
    return this.endpointDebug;
  }

  private updatePullArmed(input: SolarOpeningUpdateInput): SolarOpeningUpdate {
    const geometry = this.computeGeometry(input);

    if (!geometry) {
      return {
        snapshot: {
          ...EMPTY_SOLAR_OPENING_SNAPSHOT,
          reason: 'waiting-for-opening-hands',
        },
        nextState: null,
      };
    }

    this.startDistance =
      this.startDistance ??
      Math.max(
        input.thresholds.closedEvidenceDistance,
        geometry.normalizedDistance - input.thresholds.pullMinDistanceDelta,
      );
    this.targetDistance =
      this.targetDistance ??
      clamp(
        this.startDistance +
          Math.max(
            OPEN_TARGET_MIN_DELTA,
            input.thresholds.pullMinDistanceDelta * 4.2,
          ),
        OPEN_TARGET_MIN_DISTANCE,
        OPEN_TARGET_MAX_DISTANCE,
      );

    const rawSnapshot = this.createSnapshot(geometry, 'pull-armed-opening-started');
    const snapshot = this.smoothTransform(rawSnapshot);
    this.smoothedOpenProgress = snapshot.progress;
    this.lastRawOpenProgress = rawSnapshot.progress;
    this.acceptGeometry(geometry, input.timestamp);
    this.lastSnapshot = snapshot;

    return {
      snapshot,
      nextState: 'SolarOpening',
    };
  }

  private updateOpening(input: SolarOpeningUpdateInput): SolarOpeningUpdate {
    const geometry = this.computeGeometry(input);

    if (!geometry) {
      this.missingSince ??= input.timestamp;

      if (
        this.lastSnapshot.progress >= 0.78 &&
        input.timestamp - this.missingSince >= MISSING_HAND_HOLD_MS
      ) {
        return {
          snapshot: {
            ...this.lastSnapshot,
            active: true,
            visible: true,
            reason: 'hands-lost-after-mostly-open',
          },
          nextState: 'SolarActive',
        };
      }

      if (input.timestamp - this.missingSince >= MISSING_HAND_HOLD_MS) {
        this.reset();
        return {
          snapshot: {
            ...EMPTY_SOLAR_OPENING_SNAPSHOT,
            reason: 'hands-lost-before-open',
          },
          nextState: 'EmptyIdle',
        };
      }

      return {
        snapshot: {
          ...this.lastSnapshot,
          reason: 'holding-opening-during-brief-hand-loss',
        },
        nextState: null,
      };
    }

    this.missingSince = null;
    const rawSnapshot = this.createSnapshot(
      geometry,
      'opening-follows-hand-distance',
    );
    const unstableReason = this.getUnstableGeometryReason(
      rawSnapshot,
      input.timestamp,
      'opening',
    );

    if (unstableReason) {
      return {
        snapshot: {
          ...this.lastSnapshot,
          reason: unstableReason,
        },
        nextState: null,
      };
    }

    const smoothedProgress = this.smoothOpeningProgress(
      rawSnapshot.progress,
      input.timestamp,
    );
    const smoothedSnapshot: SolarOpeningSnapshot = {
      ...this.smoothTransform(rawSnapshot),
      progress: smoothedProgress,
      visible: smoothedProgress > 0.001,
    };

    this.lastRawOpenProgress = rawSnapshot.progress;
    this.acceptGeometry(geometry, input.timestamp);
    this.lastSnapshot = smoothedSnapshot;

    if (smoothedProgress >= OPEN_COMPLETE_PROGRESS) {
      this.smoothedOpenProgress = 1;
      return {
        snapshot: {
          ...smoothedSnapshot,
          progress: 1,
          reason: 'opening-complete',
        },
        nextState: 'SolarActive',
      };
    }

    if (
      smoothedProgress <= 0.005 &&
      geometry.normalizedDistance <= input.thresholds.closedDistance
    ) {
      this.reset();
      return {
        snapshot: {
          ...EMPTY_SOLAR_OPENING_SNAPSHOT,
          reason: 'opening-returned-to-closed',
        },
        nextState: 'EmptyIdle',
      };
    }

    return { snapshot: smoothedSnapshot, nextState: null };
  }

  private updateActive(input: SolarOpeningUpdateInput): SolarOpeningUpdate {
    const geometry = this.computeGeometry(input);

    if (!geometry) {
      this.endpointHitSince = null;
      this.endpointDebug = {
        ...EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT,
        mode: 'enter',
        reason: 'missing-hand-geometry',
      };
      const released = this.tryReleaseToFreeHover(
        input,
        'solar-active-released-to-free-hover-hand-loss',
      );
      if (released) {
        return released;
      }
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: 'solar-active-free-hover-during-hand-loss',
        },
        nextState: null,
      };
    }

    this.missingSince = null;
    const endpointHit = this.computeEndpointHit(geometry, input, 'enter');

    if (!endpointHit?.withinEnterRadius) {
      this.endpointHitSince = null;
      this.endpointDebug = endpointHit
        ? this.createEndpointDebugSnapshot(
            geometry,
            endpointHit,
            'enter',
            'outside-enter-radius',
            0,
          )
        : {
            ...EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT,
            mode: 'enter',
            reason: 'missing-endpoint-reference',
            handLeftWorld: geometry.leftWorld,
            handRightWorld: geometry.rightWorld,
          };
      const released = this.tryReleaseToFreeHover(
        input,
        'solar-active-released-to-free-hover',
      );
      if (released) {
        return released;
      }
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: endpointHit
            ? 'solar-active-waiting-for-both-endpoints'
            : 'solar-active-missing-endpoint-reference',
        },
        nextState: null,
      };
    }

    this.activeReleaseSince = null;
    this.endpointHitSince ??= input.timestamp;
    const endpointStableMs = input.timestamp - this.endpointHitSince;
    this.endpointDebug = this.createEndpointDebugSnapshot(
      geometry,
      endpointHit,
      'enter',
      endpointStableMs < ENDPOINT_ENTER_STABLE_MS
        ? 'endpoint-hit-stabilizing'
        : 'endpoint-hit-stable',
      endpointStableMs,
    );

    if (endpointStableMs < ENDPOINT_ENTER_STABLE_MS) {
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: 'solar-active-endpoint-hit-stabilizing',
        },
        nextState: null,
      };
    }

    const rawSnapshot = {
      ...this.createSnapshot(geometry, 'solar-handle-control-started'),
      active: true,
      visible: true,
      progress: 1,
    };

    const unstableReason = this.getUnstableGeometryReason(
      rawSnapshot,
      input.timestamp,
      'active',
    );

    if (unstableReason) {
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: unstableReason,
        },
        nextState: null,
      };
    }

    const snapshot = this.smoothTransform(rawSnapshot);
    this.endpointHitSince = null;
    this.endpointMissSince = null;
    this.acceptGeometry(geometry, input.timestamp);
    this.lastSnapshot = snapshot;

    return {
      snapshot,
      nextState: 'SolarHandleControl',
    };
  }

  /**
   * In SolarActive, once the hands are no longer holding both endpoints (released or lost) for
   * ACTIVE_RELEASE_GRACE_MS, drop to SolarFreeHover so one-hand inspection can start immediately.
   * No-op (and resets the timer) in any other state, so SolarFreeHover does not re-emit itself.
   */
  private tryReleaseToFreeHover(
    input: SolarOpeningUpdateInput,
    reason: string,
  ): SolarOpeningUpdate | null {
    if (input.interactionState !== 'SolarActive') {
      this.activeReleaseSince = null;
      return null;
    }

    this.activeReleaseSince ??= input.timestamp;

    if (input.timestamp - this.activeReleaseSince < ACTIVE_RELEASE_GRACE_MS) {
      return null;
    }

    this.activeReleaseSince = null;
    return {
      snapshot: {
        ...this.lastSnapshot,
        active: true,
        visible: true,
        progress: 1,
        reason,
      },
      nextState: 'SolarFreeHover',
    };
  }

  private updateHandleControl(input: SolarOpeningUpdateInput): SolarOpeningUpdate {
    const geometry = this.computeGeometry(input);

    if (!geometry) {
      // Fallback place-down: only a sustained full loss of both hands drops to
      // free hover. A one-frame tracking gap keeps the handle.
      this.placeDownArmedSince = null;
      this.maxVisualWidthSince = null;
      this.endpointMissSince ??= input.timestamp;
      this.endpointDebug = {
        ...EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT,
        mode: 'follow',
        reason: 'missing-hand-geometry',
        stableRequiredMs: 0,
      };

      if (input.timestamp - this.endpointMissSince >= HANDLE_HAND_LOSS_RELEASE_MS) {
        this.endpointMissSince = null;
        return {
          snapshot: {
            ...this.lastSnapshot,
            active: true,
            visible: true,
            progress: 1,
            reason: 'solar-handle-released-after-hand-loss',
          },
          nextState: 'SolarFreeHover',
        };
      }

      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: 'solar-handle-holding-during-brief-hand-loss',
        },
        nextState: null,
      };
    }

    const endpointHit = this.computeEndpointHit(geometry, input, 'exit');
    this.endpointDebug = endpointHit
      ? this.createEndpointDebugSnapshot(
          geometry,
          endpointHit,
          'follow',
          endpointHit.withinExitRadius
            ? 'hands-near-follow-endpoints'
            : 'hands-away-from-follow-endpoints',
          0,
        )
      : {
          ...EMPTY_SOLAR_ENDPOINT_DEBUG_SNAPSHOT,
          mode: 'follow',
          reason: 'missing-endpoint-reference',
          handLeftWorld: geometry.leftWorld,
          handRightWorld: geometry.rightWorld,
          stableRequiredMs: 0,
        };

    this.endpointMissSince = null;
    this.missingSince = null;

    // Deliberate place-down: both hands make a fist, then reopen once. The opened
    // system is hand-attached, so simply leaving the endpoints is no longer a
    // release; the fist->open gesture (or the max-width guard below) is.
    const placeDown = this.updatePlaceDownGesture(input);

    if (placeDown === 'released') {
      this.maxVisualWidthSince = null;
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: 'solar-handle-placed-down-by-fist-open',
        },
        nextState: 'SolarFreeHover',
      };
    }

    // Auto place-down: hold a near-frame-edge span stably. A single wide frame
    // must not flip this important state transition.
    if (
      placeDown === 'idle' &&
      this.updateMaxVisualWidthPlaceDown(geometry, input.timestamp)
    ) {
      this.placeDownArmedSince = null;
      this.maxVisualWidthSince = null;
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: 'solar-handle-placed-down-beyond-max-width',
        },
        nextState: 'SolarFreeHover',
      };
    }

    if (geometry.normalizedDistance <= input.thresholds.collapseStartDistance) {
      this.placeDownArmedSince = null;
      this.maxVisualWidthSince = null;
      const snapshot = this.smoothTransform(
        this.createClosingSnapshot(
          geometry,
          input.thresholds,
          'solar-closing-from-handle-control',
        ),
      );
      this.acceptGeometry(geometry, input.timestamp);
      this.lastSnapshot = snapshot;

      if (snapshot.progress <= 0.005) {
        this.reset();
        return {
          snapshot: {
            ...EMPTY_SOLAR_OPENING_SNAPSHOT,
            reason: 'solar-closing-complete',
          },
          nextState: 'EmptyIdle',
        };
      }

      return {
        snapshot,
        nextState: 'SolarClosing',
      };
    }

    // Both hands are fisted (armed) but have not reopened yet: freeze the
    // transform so the clench itself does not drag or rescale the system while
    // we wait for the confirming reopen.
    if (placeDown === 'armed') {
      this.maxVisualWidthSince = null;
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: 'solar-handle-place-down-armed',
        },
        nextState: null,
      };
    }

    const rawSnapshot = {
      ...this.createSnapshot(geometry, 'solar-handle-control-follows-endpoints'),
      active: true,
      visible: true,
      progress: 1,
    };

    const unstableReason = this.getUnstableGeometryReason(
      rawSnapshot,
      input.timestamp,
      'active',
    );

    if (unstableReason) {
      return {
        snapshot: {
          ...this.lastSnapshot,
          active: true,
          visible: true,
          progress: 1,
          reason: unstableReason,
        },
        nextState: null,
      };
    }

    const snapshot = this.smoothTransform(rawSnapshot);
    this.acceptGeometry(geometry, input.timestamp);
    this.lastSnapshot = snapshot;

    return {
      snapshot,
      nextState: null,
    };
  }

  /**
   * Two-hand fist->open place-down detector for SolarHandleControl. Returns
   * 'armed' while both hands stay clenched after the initial fist, 'released' on
   * the confirming reopen, and 'idle' otherwise. Stateful via placeDownArmedSince;
   * times out so a stray clench does not leave the handle frozen.
   */
  private updatePlaceDownGesture(
    input: SolarOpeningUpdateInput,
  ): 'idle' | 'armed' | 'released' {
    const poses = this.computeBothHandsPose(input);

    if (!poses) {
      this.placeDownArmedSince = null;
      return 'idle';
    }

    if (this.placeDownArmedSince === null) {
      if (isTwoHandFist(poses.left, poses.right)) {
        this.placeDownArmedSince = input.timestamp;
        return 'armed';
      }
      return 'idle';
    }

    if (input.timestamp - this.placeDownArmedSince > PLACE_DOWN_ARMED_TIMEOUT_MS) {
      this.placeDownArmedSince = null;
      return 'idle';
    }

    if (isTwoHandOpen(poses.left, poses.right)) {
      this.placeDownArmedSince = null;
      return 'released';
    }

    return 'armed';
  }

  private computeBothHandsPose(
    input: SolarOpeningUpdateInput,
  ): { left: HandPoseIntentSnapshot; right: HandPoseIntentSnapshot } | null {
    const pair = getVisualTrackedHandPair(input.tracking, this.previousPair);

    if (!pair) {
      return null;
    }

    return {
      left: computeHandPoseIntent(pair.left),
      right: computeHandPoseIntent(pair.right),
    };
  }

  /**
   * The opened system's on-screen visual width is the two-hand screen-x span,
   * because the left/right control endpoints stay hand-attached. Enter and exit
   * thresholds form a deadband so boundary jitter cannot restart the dwell.
   */
  private updateMaxVisualWidthPlaceDown(
    geometry: SolarOpeningGeometry,
    timestamp: number,
  ): boolean {
    const screenXSpan = Math.abs(geometry.rightCenter.x - geometry.leftCenter.x);

    if (this.maxVisualWidthSince === null) {
      if (screenXSpan >= MAX_VISUAL_WIDTH_ENTER_SCREEN_FRACTION) {
        this.maxVisualWidthSince = timestamp;
      }
      return false;
    }

    if (screenXSpan < MAX_VISUAL_WIDTH_EXIT_SCREEN_FRACTION) {
      this.maxVisualWidthSince = null;
      return false;
    }

    return timestamp - this.maxVisualWidthSince >= MAX_VISUAL_WIDTH_STABLE_MS;
  }

  private updateClosing(input: SolarOpeningUpdateInput): SolarOpeningUpdate {
    const geometry = this.computeGeometry(input);

    if (!geometry) {
      this.endpointMissSince ??= input.timestamp;

      if (input.timestamp - this.endpointMissSince >= ENDPOINT_EXIT_GRACE_MS) {
        this.endpointMissSince = null;
        return {
          snapshot: {
            ...this.lastSnapshot,
            active: true,
            visible: true,
            reason: 'solar-closing-paused-after-hand-loss',
          },
          nextState: 'SolarFreeHover',
        };
      }

      return {
        snapshot: {
          ...this.lastSnapshot,
          reason: 'solar-closing-holding-during-brief-hand-loss',
        },
        nextState: null,
      };
    }

    if (geometry.normalizedDistance <= input.thresholds.collapseCompleteDistance) {
      this.reset();
      return {
        snapshot: {
          ...EMPTY_SOLAR_OPENING_SNAPSHOT,
          reason: 'solar-closing-complete',
        },
        nextState: 'EmptyIdle',
      };
    }

    if (
      geometry.normalizedDistance >=
      input.thresholds.collapseStartDistance + input.thresholds.pullMinDistanceDelta
    ) {
      const snapshot = this.smoothTransform({
        ...this.createSnapshot(geometry, 'solar-closing-reopened-to-handle-control'),
        active: true,
        visible: true,
        progress: 1,
      });
      this.acceptGeometry(geometry, input.timestamp);
      this.lastSnapshot = snapshot;

      return {
        snapshot,
        nextState: 'SolarHandleControl',
      };
    }

    const snapshot = this.smoothTransform(
      this.createClosingSnapshot(
        geometry,
        input.thresholds,
        'solar-closing-follows-inward-endpoints',
      ),
    );
    this.acceptGeometry(geometry, input.timestamp);
    this.lastSnapshot = snapshot;

    return {
      snapshot,
      nextState: null,
    };
  }

  private computeGeometry(input: SolarOpeningUpdateInput): SolarOpeningGeometry | null {
    const pair = getVisualTrackedHandPair(input.tracking, this.previousPair);

    if (!pair) {
      return null;
    }

    const leftWorld = mapNormalizedToWorld(
      pair.left.center,
      input.layout,
      input.camera,
      input.planeZ,
    );
    const rightWorld = mapNormalizedToWorld(
      pair.right.center,
      input.layout,
      input.camera,
      input.planeZ,
    );

    if (!leftWorld || !rightWorld) {
      return null;
    }

    const worldDistance = distance3d(leftWorld, rightWorld);
    // 2D screen distance for opening progress / collapse; image-landmark z is noisy depth.
    const normalizedDistance = Math.hypot(
      pair.right.center.x - pair.left.center.x,
      pair.right.center.y - pair.left.center.y,
    );

    return {
      leftCenter: pair.left.center,
      rightCenter: pair.right.center,
      leftWorld,
      rightWorld,
      midpointWorld: {
        x: (leftWorld.x + rightWorld.x) / 2,
        y: (leftWorld.y + rightWorld.y) / 2,
        z: (leftWorld.z + rightWorld.z) / 2,
      },
      normalizedDistance,
      worldDistance,
    };
  }

  private createSnapshot(
    geometry: SolarOpeningGeometry,
    reason: string,
  ): SolarOpeningSnapshot {
    const startDistance = this.startDistance ?? geometry.normalizedDistance;
    const targetDistance =
      this.targetDistance ?? Math.max(startDistance + OPEN_TARGET_MIN_DELTA, OPEN_TARGET_MIN_DISTANCE);
    const progress = clamp01(
      inverseLerp(startDistance, targetDistance, geometry.normalizedDistance),
    );
    const scale = clamp(
      geometry.worldDistance / SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN,
      MIN_FOLLOW_SCALE,
      MAX_FOLLOW_SCALE,
    );

    return {
      active: true,
      visible: progress > 0.001,
      progress,
      scale,
      reason,
      leftWorld: geometry.leftWorld,
      rightWorld: geometry.rightWorld,
      midpointWorld: geometry.midpointWorld,
      normalizedDistance: geometry.normalizedDistance,
      startDistance,
      targetDistance,
    };
  }

  private createClosingSnapshot(
    geometry: SolarOpeningGeometry,
    thresholds: GestureThresholds,
    reason: string,
  ): SolarOpeningSnapshot {
    const snapshot = this.createSnapshot(geometry, reason);
    const collapseRange = Math.max(
      0.001,
      thresholds.collapseStartDistance - thresholds.collapseCompleteDistance,
    );
    const progress = clamp01(
      (geometry.normalizedDistance - thresholds.collapseCompleteDistance) /
        collapseRange,
    );

    return {
      ...snapshot,
      active: true,
      visible: progress > 0.001,
      progress,
    };
  }

  private acceptGeometry(
    geometry: SolarOpeningGeometry,
    timestamp: number,
  ): void {
    this.previousPair = {
      left: geometry.leftCenter,
      right: geometry.rightCenter,
    };
    this.lastAcceptedAt = timestamp;
  }

  /**
   * Ease displayed openProgress toward the raw hand-driven value with a frame-time-aware low-pass,
   * and cap the rise rate so a sudden hand-distance jump opens smoothly instead of snapping. Drops
   * are only low-passed (not rate-capped) because abrupt glitch drops are already rejected by
   * `getUnstableGeometryReason`; a genuine reverse pull should still ease the system back down.
   */
  private smoothOpeningProgress(rawProgress: number, timestamp: number): number {
    const frameFactor = clamp(
      (timestamp - (this.lastAcceptedAt ?? timestamp)) / TARGET_FRAME_MS,
      1,
      8,
    );
    const alpha = clamp01(OPENING_PROGRESS_SMOOTHING * frameFactor);
    const blended =
      this.smoothedOpenProgress + (rawProgress - this.smoothedOpenProgress) * alpha;
    const maxRise = MAX_OPENING_PROGRESS_RISE_PER_FRAME * frameFactor;
    const capped =
      blended > this.smoothedOpenProgress + maxRise
        ? this.smoothedOpenProgress + maxRise
        : blended;

    this.smoothedOpenProgress = clamp01(capped);
    return this.smoothedOpenProgress;
  }

  /**
   * Frame-to-frame low-pass on the geometry-driven transform (scale, midpoint)
   * so the held / collapsing solar system stops jittering with raw hand-landmark
   * noise. Must be called ONLY on accepted (non-outlier) frames — it advances
   * stateful filters, so a rejected glitch frame must never reach it. Progress
   * and other fields pass through untouched.
   */
  private smoothTransform(snapshot: SolarOpeningSnapshot): SolarOpeningSnapshot {
    if (
      !snapshot.midpointWorld ||
      snapshot.normalizedDistance === null
    ) {
      return snapshot;
    }

    const scale = this.scaleFilter.smooth(snapshot.scale);
    const midpoint = this.midpointFilter.smooth(snapshot.midpointWorld);

    return {
      ...snapshot,
      scale,
      midpointWorld: { x: midpoint.x, y: midpoint.y, z: midpoint.z },
    };
  }

  private getUnstableGeometryReason(
    candidate: SolarOpeningSnapshot,
    timestamp: number,
    phase: 'opening' | 'active',
  ): string | null {
    if (
      !this.lastSnapshot.active ||
      !this.lastSnapshot.midpointWorld ||
      this.lastSnapshot.normalizedDistance === null ||
      candidate.normalizedDistance === null
    ) {
      return null;
    }

    const frameFactor = clamp(
      (timestamp - (this.lastAcceptedAt ?? timestamp)) / TARGET_FRAME_MS,
      1,
      8,
    );
    const normalizedDistanceDrop =
      this.lastSnapshot.normalizedDistance - candidate.normalizedDistance;
    const scaleDropRatio =
      this.lastSnapshot.scale > 0
        ? candidate.scale / this.lastSnapshot.scale
        : 1;
    const midpointJump = Math.hypot(
      candidate.midpointWorld
        ? candidate.midpointWorld.x - this.lastSnapshot.midpointWorld.x
        : 0,
      candidate.midpointWorld
        ? candidate.midpointWorld.y - this.lastSnapshot.midpointWorld.y
        : 0,
      candidate.midpointWorld
        ? candidate.midpointWorld.z - this.lastSnapshot.midpointWorld.z
        : 0,
    );

    if (
      phase === 'opening' &&
      candidate.progress < this.lastRawOpenProgress - MAX_OPENING_PROGRESS_DROP
    ) {
      return 'holding-opening-during-abrupt-progress-drop';
    }

    if (
      this.lastSnapshot.scale >= MIN_PREVIOUS_SCALE_FOR_OUTLIER_CHECK &&
      normalizedDistanceDrop > MAX_NORMALIZED_DISTANCE_DROP_PER_FRAME * frameFactor &&
      scaleDropRatio < SUSPICIOUS_SCALE_DROP_RATIO
    ) {
      return phase === 'active'
        ? 'solar-active-holding-during-abrupt-distance-drop'
        : 'holding-opening-during-abrupt-distance-drop';
    }

    if (
      this.lastSnapshot.scale >= MIN_PREVIOUS_SCALE_FOR_OUTLIER_CHECK &&
      candidate.scale <= SUSPICIOUS_MIN_SCALE_AFTER_OPEN &&
      scaleDropRatio < SUSPICIOUS_SCALE_DROP_RATIO
    ) {
      return phase === 'active'
        ? 'solar-active-holding-during-scale-outlier'
        : 'holding-opening-during-scale-outlier';
    }

    if (
      midpointJump > MAX_MIDPOINT_JUMP_PER_FRAME * frameFactor &&
      scaleDropRatio < SUSPICIOUS_SCALE_DROP_RATIO
    ) {
      return phase === 'active'
        ? 'solar-active-holding-during-midpoint-outlier'
        : 'holding-opening-during-midpoint-outlier';
    }

    return null;
  }

  private computeEndpointHit(
    geometry: SolarOpeningGeometry,
    input: SolarOpeningUpdateInput,
    mode: 'enter' | 'exit',
  ): EndpointHit | null {
    const endpoints = this.getCurrentEndpointWorldPositions();

    if (!endpoints) {
      return null;
    }

    const radius = this.getEndpointHitRadiusWorld(input.thresholds, mode);
    const leftDistance = distance3d(geometry.leftWorld, endpoints.left);
    const rightDistance = distance3d(geometry.rightWorld, endpoints.right);
    const maxDistance = Math.max(leftDistance, rightDistance);
    const score = clamp01(1 - maxDistance / radius);

    return {
      leftEndpoint: endpoints.left,
      rightEndpoint: endpoints.right,
      leftDistance,
      rightDistance,
      radius,
      score,
      withinEnterRadius: leftDistance <= radius && rightDistance <= radius,
      withinExitRadius: leftDistance <= radius && rightDistance <= radius,
    };
  }

  private createEndpointDebugSnapshot(
    geometry: SolarOpeningGeometry,
    hit: EndpointHit,
    mode: Exclude<SolarEndpointDebugMode, 'inactive'>,
    reason: string,
    stableMs: number,
  ): SolarEndpointDebugSnapshot {
    return {
      mode,
      reason,
      handLeftWorld: geometry.leftWorld,
      handRightWorld: geometry.rightWorld,
      referenceLeftWorld: hit.leftEndpoint,
      referenceRightWorld: hit.rightEndpoint,
      leftDistanceWorld: hit.leftDistance,
      rightDistanceWorld: hit.rightDistance,
      radiusWorld: hit.radius,
      score: hit.score,
      bothWithinRadius:
        mode === 'enter' ? hit.withinEnterRadius : hit.withinExitRadius,
      stableMs,
      stableRequiredMs: mode === 'enter' ? ENDPOINT_ENTER_STABLE_MS : 0,
    };
  }

  private getCurrentEndpointWorldPositions():
    | { left: Vec3; right: Vec3 }
    | null {
    if (!this.lastSnapshot.midpointWorld) {
      return null;
    }

    const halfSpan =
      (SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * this.lastSnapshot.scale) / 2;
    const { midpointWorld } = this.lastSnapshot;

    return {
      left: {
        x: midpointWorld.x - halfSpan,
        y: midpointWorld.y,
        z: midpointWorld.z,
      },
      right: {
        x: midpointWorld.x + halfSpan,
        y: midpointWorld.y,
        z: midpointWorld.z,
      },
    };
  }

  private getEndpointHitRadiusWorld(
    thresholds: GestureThresholds,
    mode: 'enter' | 'exit',
  ): number {
    const normalizedRadius =
      mode === 'enter'
        ? thresholds.endpointEnterRadius
        : thresholds.endpointExitRadius;

    return clamp(
      normalizedRadius * SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * ENDPOINT_RADIUS_WORLD_SCALE,
      MIN_ENDPOINT_RADIUS_WORLD,
      MAX_ENDPOINT_RADIUS_WORLD,
    );
  }
}

function isTwoHandFist(
  left: HandPoseIntentSnapshot,
  right: HandPoseIntentSnapshot,
): boolean {
  return (
    (left.gripPoseScore ?? 0) >= SOLAR_PLACE_DOWN_FIST_SCORE_MIN &&
    (right.gripPoseScore ?? 0) >= SOLAR_PLACE_DOWN_FIST_SCORE_MIN
  );
}

function isTwoHandOpen(
  left: HandPoseIntentSnapshot,
  right: HandPoseIntentSnapshot,
): boolean {
  return (
    (left.openHandScore ?? 0) >= SOLAR_PLACE_DOWN_OPEN_SCORE_MIN &&
    (right.openHandScore ?? 0) >= SOLAR_PLACE_DOWN_OPEN_SCORE_MIN &&
    left.openFingerCount >= SOLAR_PLACE_DOWN_OPEN_MIN_FINGERS &&
    right.openFingerCount >= SOLAR_PLACE_DOWN_OPEN_MIN_FINGERS
  );
}

function isBodyInteractionState(state: InteractionState): boolean {
  return (
    state === 'BodyHover' ||
    state === 'PlanetActivated' ||
    state === 'PlanetFocusView' ||
    state === 'PlanetFocusControlled' ||
    state === 'PlanetFocusFloating' ||
    state === 'BodyReturning'
  );
}

function distance3d(first: Vec3, second: Vec3): number {
  return Math.hypot(
    first.x - second.x,
    first.y - second.y,
    first.z - second.z,
  );
}
