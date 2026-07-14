import { PerspectiveCamera } from 'three';
import {
  GESTURE_EXPORT_SCHEMA_VERSION,
  type GestureDebugExport,
  type GestureDebugFrame,
  type ReplayCameraSnapshot,
} from '../../src/interaction/gestureDebugRecorder';
import { PlanetFocusController } from '../../src/interaction/planetFocusController';
import { PlanetReturnWaveController } from '../../src/interaction/planetReturnWave';
import { SolarOpeningController } from '../../src/interaction/solarOpeningController';
import {
  INDEX_TIP_INDEX,
  THUMB_TIP_INDEX,
  WRIST_INDEX,
} from '../../src/interaction/handLandmarks';
import type {
  InteractionState,
  TrackedHand,
  TrackedHandSide,
  TrackingSnapshot,
  TrackingStatus,
} from '../../src/utils/types';

export interface SolarReplayFrameResult {
  t: number;
  inputState: InteractionState;
  stateAfter: InteractionState;
  nextState: InteractionState | null;
  snapshot: ReturnType<SolarOpeningController['update']>['snapshot'];
  endpoint: ReturnType<SolarOpeningController['getEndpointDebugSnapshot']>;
}

export interface PlanetFocusReplayFrameResult {
  t: number;
  inputState: InteractionState;
  stateAfter: InteractionState;
  nextState: InteractionState | null;
  snapshot: ReturnType<PlanetFocusController['update']>['snapshot'];
}

export interface PlanetReturnWaveReplayFrameResult {
  t: number;
  inputState: InteractionState;
  stateAfter: InteractionState;
  triggered: boolean;
  snapshot: ReturnType<PlanetReturnWaveController['update']>['snapshot'];
}

export interface GestureCurveFrame {
  t: number;
  interactionState: string;
  controlConfidence: number;
  reGripConfidence: number;
  legacyEndpointScore: number;
  pinchPenalty: number;
  leftPinchRatio: number | null;
  rightPinchRatio: number | null;
  activeEndpointScore: number;
  activeEndpointStableMs: number;
  focusPinchRatio: number | null;
  focusPinchDistancePx: number | null;
  focusReason: string;
}

export function parseGestureDebugExport(json: string): GestureDebugExport {
  const value = JSON.parse(json) as Partial<GestureDebugExport>;

  if (value.version !== GESTURE_EXPORT_SCHEMA_VERSION) {
    throw new Error(
      `Gesture replay requires schema v${GESTURE_EXPORT_SCHEMA_VERSION}; received v${String(value.version)}. Re-record this scenario with the current Debug recorder.`,
    );
  }

  if (!Array.isArray(value.frames)) {
    throw new Error('Gesture replay export is missing its frames array.');
  }

  return value as GestureDebugExport;
}

/** Replays the product solar lifecycle from PullArmed using only recorded controller inputs. */
export function replaySolarController(
  recording: GestureDebugExport,
): SolarReplayFrameResult[] {
  const startIndex = recording.frames.findIndex(
    (frame) => frame.replay.solar.interactionState === 'PullArmed',
  );

  if (startIndex < 0) {
    throw new Error(
      'Solar replay needs a recording that starts before pull-open and contains PullArmed.',
    );
  }

  const controller = new SolarOpeningController();
  let state: InteractionState = 'PullArmed';
  const results: SolarReplayFrameResult[] = [];

  recording.frames.slice(startIndex).forEach((frame) => {
    const inputState = state;
    const replay = frame.replay.solar;
    const update = controller.update({
      tracking: restoreTrackingSnapshot(frame),
      interactionState: inputState,
      thresholds: frame.calibration.thresholds,
      layout: replay.layout,
      camera: restoreReplayCamera(replay.camera),
      planeZ: replay.planeZ,
      timestamp: frame.t,
    });

    if (update.nextState) {
      state = update.nextState;
    }

    results.push({
      t: frame.t,
      inputState,
      stateAfter: state,
      nextState: update.nextState,
      snapshot: update.snapshot,
      endpoint: controller.getEndpointDebugSnapshot(),
    });
  });

  return results;
}

/**
 * Replays focus entry, dwell/follow, and PinchTap. A recording started from the
 * Debug panel may already be in PlanetFocusFloating; in that case seed the
 * controller with an empty, centered floating frame before replaying the first
 * recorded frame. This seed reconstructs only the documented post-release gate
 * and does not copy recorded controller outputs into the controller under test.
 */
export function replayPlanetFocusController(
  recording: GestureDebugExport,
): PlanetFocusReplayFrameResult[] {
  let startIndex = recording.frames.findIndex(
    (frame) =>
      frame.replay.planetFocus?.interactionState === 'PlanetFocusView',
  );

  const controller = new PlanetFocusController();
  let state: InteractionState = 'PlanetFocusView';

  if (startIndex < 0) {
    startIndex = recording.frames.findIndex(
      (frame) =>
        frame.replay.planetFocus?.interactionState === 'PlanetFocusFloating' &&
        frame.replay.planetFocus.focusedBody !== null &&
        frame.replay.planetFocus.target !== null,
    );

    if (startIndex < 0) {
      throw new Error(
        'Planet focus replay needs PlanetFocusView, or a PlanetFocusFloating frame with a focused body and target.',
      );
    }

    const seedFrame = recording.frames[startIndex];
    const seedReplay = seedFrame.replay.planetFocus;
    const seedTarget = seedReplay?.target;
    if (!seedReplay?.focusedBody || !seedTarget) {
      throw new Error('Planet focus floating replay seed is incomplete.');
    }

    const layout = seedFrame.replay.solar.layout;
    const seedTracking = restoreTrackingSnapshot(seedFrame);
    seedTracking.hands = {
      detectedHands: 0,
      left: null,
      right: null,
      hands: [],
      lastUpdatedAt: seedFrame.t - 1,
    };
    controller.update({
      tracking: seedTracking,
      interactionState: 'PlanetFocusFloating',
      focusedBody: seedReplay.focusedBody,
      target: {
        ...seedTarget,
        screenPosition: {
          x: layout.stageWidth / 2,
          y: layout.stageHeight / 2,
        },
        layout,
      },
      layout,
      timestamp: seedFrame.t - 1,
    });
    state = 'PlanetFocusFloating';
  }

  const results: PlanetFocusReplayFrameResult[] = [];

  recording.frames.slice(startIndex).forEach((frame) => {
    const replay = frame.replay.planetFocus;
    if (!replay) {
      return;
    }

    const inputState = state;
    const update = controller.update({
      tracking: restoreTrackingSnapshot(frame),
      interactionState: inputState,
      focusedBody: replay.focusedBody,
      target: replay.target,
      layout: frame.replay.solar.layout,
      timestamp: frame.t,
    });

    if (update.nextState) {
      state = update.nextState;
    }

    results.push({
      t: frame.t,
      inputState,
      stateAfter: state,
      nextState: update.nextState,
      snapshot: update.snapshot,
    });
  });

  return results;
}

/** Replays the passive-focus upper-corner throw detector from recorded frames. */
export function replayPlanetReturnWave(
  recording: GestureDebugExport,
): PlanetReturnWaveReplayFrameResult[] {
  const startIndex = recording.frames.findIndex(
    (frame) => {
      const state = frame.replay.planetFocus?.interactionState;
      return state === 'PlanetFocusView' || state === 'PlanetFocusFloating';
    },
  );

  if (startIndex < 0) {
    throw new Error(
      'Planet return wave replay needs a PlanetFocusView or PlanetFocusFloating frame.',
    );
  }

  const controller = new PlanetReturnWaveController();
  let returned = false;
  const results: PlanetReturnWaveReplayFrameResult[] = [];

  recording.frames.slice(startIndex).forEach((frame) => {
    const focusReplay = frame.replay.planetFocus;
    if (!focusReplay) {
      return;
    }

    const inputState: InteractionState = returned
      ? 'BodyReturning'
      : focusReplay.interactionState;
    const update = controller.update({
      tracking: restoreTrackingSnapshot(frame),
      interactionState: inputState,
      target: focusReplay.target,
      layout: frame.replay.solar.layout,
      timestamp: frame.t,
    });

    if (update.triggered) {
      returned = true;
    }

    results.push({
      t: frame.t,
      inputState,
      stateAfter: returned ? 'BodyReturning' : inputState,
      triggered: update.triggered,
      snapshot: update.snapshot,
    });
  });

  return results;
}

export function extractGestureCurves(
  recording: GestureDebugExport,
): GestureCurveFrame[] {
  return recording.frames.map((frame) => ({
    t: frame.t,
    interactionState: frame.startup.state,
    controlConfidence: frame.wholeSystem.controlConfidence,
    reGripConfidence: frame.wholeSystem.reGripConfidence,
    legacyEndpointScore: frame.wholeSystem.endpointHitScore,
    pinchPenalty: frame.wholeSystem.pinchPenalty,
    leftPinchRatio: frame.wholeSystem.leftPinchRatio,
    rightPinchRatio: frame.wholeSystem.rightPinchRatio,
    activeEndpointScore: frame.replay.solar.endpoint.score,
    activeEndpointStableMs: frame.replay.solar.endpoint.stableMs,
    focusPinchRatio: frame.planetFocus.pinchRatio,
    focusPinchDistancePx: frame.planetFocus.pinchDistancePx,
    focusReason: frame.planetFocus.transitionReason,
  }));
}

export function restoreTrackingSnapshot(
  frame: GestureDebugFrame,
): TrackingSnapshot {
  const hands = frame.tracking.hands.map(restoreTrackedHand);

  return {
    status: frame.tracking.status as TrackingStatus,
    error: null,
    pose: {
      detected: false,
      leftShoulder: null,
      rightShoulder: null,
      landmarks: [],
      lastUpdatedAt: frame.t,
    },
    hands: {
      detectedHands: frame.tracking.detectedHands,
      left: hands.find((hand) => hand.side === 'left') ?? null,
      right: hands.find((hand) => hand.side === 'right') ?? null,
      hands,
      lastUpdatedAt: frame.t,
    },
    lastUpdatedAt: frame.t,
  };
}

function restoreTrackedHand(
  hand: GestureDebugFrame['tracking']['hands'][number],
): TrackedHand {
  return {
    side: hand.side as TrackedHandSide,
    handednessScore: hand.handednessScore,
    center: hand.center,
    wrist: hand.landmarks[WRIST_INDEX] ?? hand.center,
    thumbTip: hand.landmarks[THUMB_TIP_INDEX] ?? hand.center,
    indexFingerTip: hand.landmarks[INDEX_TIP_INDEX] ?? hand.center,
    palmScale: hand.palmScale,
    landmarks: hand.landmarks,
    worldLandmarks: hand.worldLandmarks,
  };
}

function restoreReplayCamera(snapshot: ReplayCameraSnapshot): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    snapshot.fov,
    snapshot.aspect,
    snapshot.near,
    snapshot.far,
  );
  camera.zoom = snapshot.zoom;
  camera.position.set(
    snapshot.position.x,
    snapshot.position.y,
    snapshot.position.z,
  );
  camera.quaternion.set(
    snapshot.quaternion.x,
    snapshot.quaternion.y,
    snapshot.quaternion.z,
    snapshot.quaternion.w,
  );
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}
