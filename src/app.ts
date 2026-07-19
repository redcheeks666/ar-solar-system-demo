import { startCamera, stopCamera } from './camera/camera';
import { GestureCalibrationController, getDefaultGestureCalibrationSnapshot } from './interaction/gestureCalibration';
import {
  captureReplayCamera,
  GestureDebugRecorder,
  type GestureReplayFrameContext,
} from './interaction/gestureDebugRecorder';
import { isFreshTrackingFrame } from './interaction/freshFrameGate';
import { EMPTY_HAND_PRIMITIVES, HandPrimitiveController } from './interaction/handPrimitives';
import { HandStartupGestureController } from './interaction/handStartupGesture';
import {
  EMPTY_PLANET_ACTIVATION_SNAPSHOT,
  PlanetActivationController,
  type PlanetActivationSnapshot,
} from './interaction/planetActivationController';
import {
  EMPTY_PLANET_FOCUS_SNAPSHOT,
  PlanetFocusController,
  type PlanetFocusSnapshot,
} from './interaction/planetFocusController';
import {
  EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
  PlanetReturnWaveController,
} from './interaction/planetReturnWave';
import { InteractionStateMachine } from './interaction/stateMachine';
import {
  EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT,
  WholeSystemIntentController,
} from './interaction/wholeSystemIntent';
import {
  SolarOpeningController,
  type SolarOpeningSnapshot,
} from './interaction/solarOpeningController';
import {
  EMPTY_INDEX_FINGER_UI_HOLD,
  updateIndexFingerUiHold,
  type IndexFingerUiHoldState,
  type UiButtonStageRect,
} from './interaction/indexFingerUiHold';
import { DebugOverlay } from './rendering/debugOverlay';
import {
  hideRenderingInterruptionOverlay,
  showFatalErrorOverlay,
  showRenderingInterruptionOverlay,
} from './rendering/fatalErrorOverlay';
import { InteractionStatusSummary } from './rendering/interactionStatusSummary';
import { LandmarkOverlay } from './rendering/landmarkOverlay';
import { INTERACTION_PLANE_Z, TransparentSceneRenderer } from './rendering/scene';
import { SunRoomGlow } from './rendering/sunRoomGlow';
import {
  FOCUS_BODY_WORLD_Z,
  type FocusedBodyReturnMotion,
} from './solar/focusedCelestialBody';
import { createFocusedBodyReturnMotionFromWave } from './solar/focusedBodyReturnMotion';
import { CodePlaceholderSolarSystem } from './solar/solarSystem';
import {
  INTERACTIVE_CELESTIAL_BODY_IDS,
  type InteractiveCelestialBodyId,
} from './solar/solarSystemData';
import { MediaPipeTrackingController } from './tracking/mediapipe';
import {
  mapStagePixelToWorld,
  mapWorldToStagePixel,
  type PreviewLayout,
} from './interaction/coordinateMapping';
import type {
  CameraPermissionStatus,
  DebugSnapshot,
  PlanetReturnWaveDebugSnapshot,
  TrackingSnapshot,
} from './utils/types';

const videoElement = getElement<HTMLVideoElement>('camera-video');
const canvasElement = getElement<HTMLCanvasElement>('webgl-canvas');
const landmarkCanvas = getElement<HTMLCanvasElement>('landmark-canvas');
const previewOverlay = getElement<HTMLElement>('preview-overlay');
const startButton = getElement<HTMLButtonElement>('start-camera');
const statusText = getElement<HTMLElement>('status-text');
const introPanel = getElement<HTMLElement>('intro-panel');
const loadingPanel = getElement<HTMLElement>('loading-panel');
const loadingStage = getElement<HTMLElement>('loading-stage');
const loadingProgress = getElement<HTMLElement>('loading-progress');
const loadingDetail = getElement<HTMLElement>('loading-detail');
const guidance = getElement<HTMLElement>('guidance');
const interactionSummary = getElement<HTMLElement>('interaction-summary');
const debugPanel = getElement<HTMLElement>('debug-panel');
const debugToggle = getElement<HTMLButtonElement>('debug-toggle');
const debugRecorderControls = getElement<HTMLElement>('debug-recorder');
const debugRecordToggle = getElement<HTMLButtonElement>('debug-record-toggle');
const debugRecordExport = getElement<HTMLButtonElement>('debug-record-export');
const debugRecordClear = getElement<HTMLButtonElement>('debug-record-clear');
const planetFocusControls = getElement<HTMLElement>('planet-focus-controls');
const planetFocusHudTag = getElement<HTMLElement>('planet-focus-hud-tag');
const planetFocusSwitchButton = getElement<HTMLButtonElement>(
  'planet-focus-switch-button',
);
const planetFocusSwitchLabel = getElement<HTMLElement>(
  'planet-focus-switch-label',
);
const planetFocusSwitchContext = getElement<HTMLElement>(
  'planet-focus-switch-context',
);
const demoHandModelButton = getElement<HTMLButtonElement>(
  'demo-hand-model-button',
);
const demoHandModelLabel = getElement<HTMLElement>('demo-hand-model-label');
const demoHandModelContext = getElement<HTMLElement>(
  'demo-hand-model-context',
);
const sunRoomGlow = getElement<HTMLElement>('sun-room-glow');

const interaction = new InteractionStateMachine();
const urlParams = new URLSearchParams(window.location.search);
const renderer = new TransparentSceneRenderer(
  canvasElement,
  parseDevicePixelRatioOverride(urlParams.get('dpr')),
  {
    onContextLost: showRenderingInterruptionOverlay,
    onContextRestored: hideRenderingInterruptionOverlay,
    onContextRestoreFailed: (error) => {
      console.error('[AR Solar System] WebGL 上下文恢复失败。', error);
      showFatalErrorOverlay({
        title: '渲染无法恢复',
        message: '画面渲染已中断，请刷新页面后重试。',
      });
    },
  },
);
const solarPreviewEnabled = urlParams.get('solarPreview') === '1';
// 演示模式：隐藏 Debug/底部说明，保留精简操作 HUD，并提供骨架显示开关。
const demoModeEnabled = urlParams.get('demo') === '1';
const placeholderSolarSystem = new CodePlaceholderSolarSystem();
const debugOverlay = new DebugOverlay(debugPanel, debugToggle);
const statusSummary = new InteractionStatusSummary(
  interactionSummary,
  demoModeEnabled ? 'operation-only' : 'full',
);
const landmarkOverlay = new LandmarkOverlay(landmarkCanvas, videoElement);
const sunRoomGlowEffect = new SunRoomGlow(sunRoomGlow);
const tracking = new MediaPipeTrackingController();
const handPrimitives = new HandPrimitiveController();
const gestureCalibration = new GestureCalibrationController();
const gestureRecorder = new GestureDebugRecorder();
const startupGesture = new HandStartupGestureController();
const wholeSystemIntent = new WholeSystemIntentController();
const solarOpening = new SolarOpeningController();
const planetActivation = new PlanetActivationController();
const planetFocus = new PlanetFocusController();
const planetReturnWave = new PlanetReturnWaveController();
const EARTH_MOON_SWITCH_HOLD_MS = 500;
const DEMO_HAND_MODEL_HOLD_MS = 500;
const UI_BUTTON_FINGER_HIT_SLOP_PX = 12;
type EarthMoonFocusBodyId = Extract<
  InteractiveCelestialBodyId,
  'earth' | 'moon'
>;

let activeStream: MediaStream | null = null;
let cameraStatus: CameraPermissionStatus = 'idle';
let latestTracking = tracking.getSnapshot();
let returningFocusedBody: InteractiveCelestialBodyId | null = null;
let latestPlanetActivationSnapshot: PlanetActivationSnapshot =
  EMPTY_PLANET_ACTIVATION_SNAPSHOT;
let earthMoonFocusBody: EarthMoonFocusBodyId = 'earth';
let earthMoonSwitchButtonHold: IndexFingerUiHoldState =
  EMPTY_INDEX_FINGER_UI_HOLD;
let earthMoonSwitchNeedsClear = false;
let demoHandModelButtonHold: IndexFingerUiHoldState =
  EMPTY_INDEX_FINGER_UI_HOLD;
let demoHandModelNeedsClear = false;
let demoHandSkeletonVisible = false;
// Detection timestamp of the last tracking frame fed to the interaction controllers.
let lastGestureInputAt: number | null = null;
let perfFreshTrackingFrames = 0;
let perfStaleRenderFrames = 0;
let lastControllerMs: number | null = null;
let lastRecorderMs: number | null = null;
let lastSolarUpdateMs: number | null = null;
let lastRecorderControlsRecording: boolean | null = null;
let lastRecorderControlsFrameCount: number | null = null;
let lastPlanetFocusSwitchButtonProgress: string | null = null;
let lastDemoHandModelButtonProgress: string | null = null;
let lastPlanetFocusHudBody: InteractiveCelestialBodyId | null = null;
let latestGestureReplayContext: GestureReplayFrameContext | null = null;

renderer.addObject3D(placeholderSolarSystem.group);
placeholderSolarSystem.setVisible(solarPreviewEnabled);
placeholderSolarSystem.setOpeningProgress(solarPreviewEnabled ? 1 : 0);

if (solarPreviewEnabled) {
  placeholderSolarSystem.setTransform({
    position: { x: 0, y: 0, z: 0 },
    scale: 0.66,
  });
  introPanel.hidden = true;
  guidance.hidden = true;
}

if (demoModeEnabled) {
  debugToggle.hidden = true;
  interactionSummary.classList.add(
    'planet-focus-action-card',
    'demo-operation-hud',
  );
  demoHandModelButton.hidden = false;
  updateDemoHandModelButtonLabel();
}

const debugSnapshot: DebugSnapshot = {
  fps: 0,
  performance: createEmptyPerformanceSnapshot(),
  cameraStatus,
  trackingStatus: latestTracking.status,
  trackingError: latestTracking.error,
  poseDetected: false,
  leftHandDetected: false,
  rightHandDetected: false,
  poseLandmarkCount: 0,
  leftHandCenter: {
    x: null,
    y: null,
  },
  rightHandCenter: {
    x: null,
    y: null,
  },
  handMidpoint: {
    x: null,
    y: null,
  },
  handDirection: {
    x: null,
    y: null,
  },
  handDistanceVelocity: null,
  startupTransitionReason: 'not-started',
  handPrimitives: EMPTY_HAND_PRIMITIVES,
  gestureCalibration: getDefaultGestureCalibrationSnapshot(),
  gestureRecording: gestureRecorder.getStatus(),
  bothHandsVisible: false,
  lostHandHoldActive: false,
  interactionState: interaction.state,
  chestAnchor: {
    x: null,
    y: null,
  },
  handDistance: null,
  openProgress: solarPreviewEnabled ? 1 : 0,
  solarScale: solarPreviewEnabled ? 0.66 : 1,
  solarReason: solarPreviewEnabled ? 'dev-preview' : 'inactive',
  solarStartDistance: null,
  solarTargetDistance: null,
  solarEndpoint: solarOpening.getEndpointDebugSnapshot(),
  hoveredBody: null,
  activatedBody: null,
  pinchState: 'idle',
  planetActivation: EMPTY_PLANET_ACTIVATION_SNAPSHOT,
  planetFocus: EMPTY_PLANET_FOCUS_SNAPSHOT,
  planetReturnWave: EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
  throwVelocity: null,
  wholeSystem: EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT,
  rendererReady: true,
  canvasSize: renderer.getCanvasSize(),
  videoSourceSize: {
    width: null,
    height: null,
  },
  videoDisplaySize: {
    width: 0,
    height: 0,
  },
  videoDisplayRatio: null,
  videoObjectFit: 'contain',
  canvasDisplaySize: {
    width: 0,
    height: 0,
  },
  canvasBufferSize: {
    width: 0,
    height: 0,
  },
  overlayDisplaySize: {
    width: 0,
    height: 0,
  },
};

debugOverlay.onVisibilityChange((visible) => {
  syncLandmarkOverlayVisibility();
  debugRecorderControls.hidden = !visible;
});

renderer.start(({ fps, canvasSize, deltaMs, deltaSeconds, renderMs, timestampMs }) => {
  const timestamp = timestampMs;
  let trackingUpdateMs: number | null = null;
  let freshTrackingFrame = false;
  let recordGestureAt: number | null = null;

  if (cameraStatus === 'granted') {
    const trackingUpdateStartedAt = performance.now();
    latestTracking = tracking.update(videoElement, timestamp);
    trackingUpdateMs = performance.now() - trackingUpdateStartedAt;

    // P0: only advance the interaction state machines on a genuinely new detection frame, and
    // feed them the detection timestamp (not the render timestamp), so re-rendered stale frames
    // do not inject fake zero-velocity samples into the gesture velocity features.
    if (isFreshTrackingFrame(latestTracking.lastUpdatedAt, lastGestureInputAt)) {
      freshTrackingFrame = true;
      perfFreshTrackingFrames += 1;
      const trackingAt = latestTracking.lastUpdatedAt as number;
      lastGestureInputAt = trackingAt;
      const controllerStartedAt = performance.now();
      updateGestureControllers(latestTracking, trackingAt, canvasSize);
      lastControllerMs = performance.now() - controllerStartedAt;
      recordGestureAt = trackingAt;
    } else if (latestTracking.status === 'ready') {
      perfStaleRenderFrames += 1;
    }
  }

  const solarUpdateStartedAt = performance.now();
  placeholderSolarSystem.update(deltaSeconds);
  lastSolarUpdateMs = performance.now() - solarUpdateStartedAt;
  const solarSystemVisible = placeholderSolarSystem.group.visible;
  renderer.setSceneContentVisible(solarSystemVisible);
  renderer.setBloomActive(solarSystemVisible);
  updateSunRoomGlow(canvasSize, deltaSeconds);
  completeBodyReturnIfReady();

  debugSnapshot.fps = fps;
  debugSnapshot.cameraStatus = cameraStatus;
  debugSnapshot.interactionState = interaction.state;
  debugSnapshot.canvasSize = canvasSize;
  updatePerformanceDebugMetrics({
    deltaMs,
    renderMs,
    timestamp,
    trackingUpdateMs,
    freshTrackingFrame,
  });
  if (recordGestureAt !== null && latestGestureReplayContext) {
    const recorderStartedAt = performance.now();
    gestureRecorder.record(
      recordGestureAt,
      latestTracking,
      debugSnapshot,
      latestGestureReplayContext,
    );
    lastRecorderMs = performance.now() - recorderStartedAt;
    debugSnapshot.performance.recorderMs = lastRecorderMs;
  }
  updateTrackingDebugMetrics(latestTracking);
  if (debugOverlay.isVisible) {
    updatePreviewDebugMetrics();
  }
  landmarkOverlay.draw(
    latestTracking,
    demoModeEnabled && demoHandSkeletonVisible
      ? undefined
      : debugSnapshot.wholeSystem,
    interaction.state,
  );
  debugSnapshot.gestureRecording = gestureRecorder.getStatus();
  updateRecorderControls();
  statusSummary.update(debugSnapshot);
  debugOverlay.update(debugSnapshot);
  updatePlanetFocusControlsVisibility();
  updatePlanetFocusSwitchButtonVisibility();
});

startButton.addEventListener('click', () => {
  void handleCameraStart();
});

window.addEventListener('beforeunload', () => {
  stopCamera(activeStream);
  tracking.dispose();
  sunRoomGlowEffect.reset();
  handPrimitives.reset();
  gestureCalibration.reset();
  wholeSystemIntent.reset();
  solarOpening.reset();
  planetActivation.reset();
  planetFocus.reset();
  planetReturnWave.reset();
  cancelEarthMoonSwitchHold();
  cancelDemoHandModelHold();
  renderer.removeObject3D(placeholderSolarSystem.group);
  placeholderSolarSystem.dispose();
  renderer.dispose();
});

debugRecordToggle.addEventListener('click', () => {
  gestureRecorder.toggle();
  debugSnapshot.gestureRecording = gestureRecorder.getStatus();
  updateRecorderControls();
});

debugRecordExport.addEventListener('click', () => {
  gestureRecorder.exportJson();
  debugSnapshot.gestureRecording = gestureRecorder.getStatus();
  updateRecorderControls();
});

debugRecordClear.addEventListener('click', () => {
  gestureRecorder.clear();
  debugSnapshot.gestureRecording = gestureRecorder.getStatus();
  updateRecorderControls();
});

async function handleCameraStart(): Promise<void> {
  cameraStatus = 'requesting';
  startButton.disabled = true;
  startButton.textContent = '正在开启...';
  statusText.textContent = '正在请求摄像头权限。';

  const result = await startCamera(videoElement);

  cameraStatus = result.status;

  if (!result.ok) {
    startButton.disabled = false;
    startButton.textContent = '重新开启摄像头';
    statusText.textContent = result.message;
    return;
  }

  activeStream = result.stream;
  interaction.transition('EmptyIdle');
  introPanel.hidden = true;
  guidance.hidden = true;
  showTrackingLoading();
  void initializeTracking();
}

function updateGestureControllers(
  tracking: TrackingSnapshot,
  timestamp: number,
  canvasSize: { width: number; height: number },
): void {
  latestGestureReplayContext = null;
  const primitiveSnapshot = handPrimitives.update(
    tracking,
    gestureCalibration.getSnapshot().thresholds,
    timestamp,
  );

  debugSnapshot.handPrimitives = primitiveSnapshot;
  debugSnapshot.gestureCalibration =
    gestureCalibration.updateFromPrimitives(primitiveSnapshot);

  const startupUpdate = startupGesture.update(
    tracking,
    interaction.state,
    timestamp,
    debugSnapshot.gestureCalibration.thresholds,
  );

  if (startupUpdate.nextState) {
    interaction.transition(startupUpdate.nextState);
    updateGuidanceForState(interaction.state);
  }

  updateStartupGestureDebugMetrics(startupUpdate.snapshot);
  debugSnapshot.wholeSystem = wholeSystemIntent.update(
    tracking,
    startupUpdate.snapshot,
    interaction.state,
    timestamp,
    debugSnapshot.gestureCalibration.thresholds,
    primitiveSnapshot.trackingConfidence,
  );
  debugSnapshot.gestureCalibration = gestureCalibration.updateFromInteraction(
    startupUpdate.snapshot,
    debugSnapshot.wholeSystem,
  );

  if (solarPreviewEnabled) {
    return;
  }

  const previewLayout = createPreviewLayout(canvasSize);
  updateDemoHandModelButtonHandHold(tracking, timestamp, previewLayout);
  const camera = renderer.getCamera();
  const solarInteractionState = interaction.state;
  const solarOpeningUpdate = solarOpening.update({
    tracking,
    interactionState: solarInteractionState,
    thresholds: debugSnapshot.gestureCalibration.thresholds,
    layout: previewLayout,
    camera,
    planeZ: INTERACTION_PLANE_Z,
    timestamp,
  });
  const planetActivationTargets =
    placeholderSolarSystem.getInteractiveBodyScreenTargets(
      camera,
      previewLayout,
    );
  latestGestureReplayContext = {
    solar: {
      interactionState: solarInteractionState,
      layout: previewLayout,
      camera: captureReplayCamera(camera),
      planeZ: INTERACTION_PLANE_Z,
      snapshot: solarOpeningUpdate.snapshot,
      endpoint: solarOpening.getEndpointDebugSnapshot(),
    },
    planetFocus: null,
  };

  if (solarOpeningUpdate.nextState) {
    interaction.transition(solarOpeningUpdate.nextState);
    updateGuidanceForState(interaction.state);
  }

  applySolarOpeningSnapshot(solarOpeningUpdate.snapshot);

  if (interaction.state === 'BodyReturning') {
    cancelEarthMoonSwitchHold();
    planetReturnWave.reset();
    debugSnapshot.planetReturnWave = EMPTY_PLANET_RETURN_WAVE_SNAPSHOT;
    return;
  }

  latestGestureReplayContext.planetActivation = {
    interactionState: interaction.state,
    targets: planetActivationTargets,
  };
  const planetActivationUpdate = planetActivation.update({
    tracking,
    interactionState: interaction.state,
    targets: planetActivationTargets,
    layout: previewLayout,
    timestamp,
  });

  if (planetActivationUpdate.nextState) {
    interaction.transition(planetActivationUpdate.nextState);
    updateGuidanceForState(interaction.state);
  }

  applyPlanetActivationSnapshot(planetActivationUpdate.snapshot);

  const activatedBody = planetActivationUpdate.snapshot.activatedBody;
  const focusedBody = getFocusDisplayBody(activatedBody);
  if (isPlanetFocusState(interaction.state) && activatedBody && focusedBody) {
    const focusInteractionState = interaction.state;
    const focusTarget = placeholderSolarSystem.getFocusedBodyScreenTarget(
      focusedBody,
      camera,
      previewLayout,
    );
    latestGestureReplayContext.planetFocus = {
      interactionState: focusInteractionState,
      focusedBody,
      target: focusTarget,
    };
    const planetFocusUpdate = planetFocus.update({
      tracking,
      interactionState: focusInteractionState,
      focusedBody,
      target: focusTarget,
      layout: previewLayout,
      timestamp,
    });

    if (planetFocusUpdate.nextState) {
      interaction.transition(planetFocusUpdate.nextState);
      if (planetFocusUpdate.nextState === 'BodyReturning') {
        startBodyReturn(planetFocusUpdate.snapshot.focusedBody);
      }
      updateGuidanceForState(interaction.state);
    }

    applyPlanetFocusSnapshot(planetFocusUpdate.snapshot, camera, previewLayout);
    const returnWaveUpdate = planetReturnWave.update({
      tracking,
      interactionState: interaction.state,
      target: focusTarget,
      layout: previewLayout,
      timestamp,
    });
    debugSnapshot.planetReturnWave = returnWaveUpdate.snapshot;

    if (returnWaveUpdate.triggered) {
      triggerPlanetReturn(returnWaveUpdate.snapshot);
      return;
    }

    updatePlanetFocusControlsVisibility();
    updatePlanetFocusSwitchButtonVisibility();
    updateEarthMoonSwitchButtonHandHold(tracking, timestamp, previewLayout);
    return;
  }

  cancelEarthMoonSwitchHold();
  resetEarthMoonFocusBody();
  planetFocus.reset();
  planetReturnWave.reset();
  debugSnapshot.planetFocus = EMPTY_PLANET_FOCUS_SNAPSHOT;
  debugSnapshot.planetReturnWave = EMPTY_PLANET_RETURN_WAVE_SNAPSHOT;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element as T;
}

function parseDevicePixelRatioOverride(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 2
    ? parsed
    : undefined;
}

function updateSunRoomGlow(
  canvasSize: { width: number; height: number },
  deltaSeconds: number,
): void {
  // The dev-only static preview has no camera feed to light.
  if (solarPreviewEnabled || cameraStatus !== 'granted') {
    return;
  }

  const solarVisible = placeholderSolarSystem.group.visible;
  const reveal = solarVisible ? debugSnapshot.openProgress : 0;
  let sunStagePosition: { x: number; y: number } | null = null;

  if (solarVisible && reveal > 0.3) {
    const projected = mapWorldToStagePixel(
      placeholderSolarSystem.group.position,
      createPreviewLayout(canvasSize),
      renderer.getCamera(),
    );

    if (projected?.visible) {
      sunStagePosition = { x: projected.x, y: projected.y };
    }
  }

  sunRoomGlowEffect.update({
    reveal,
    focusActive: isFocusVisualState(interaction.state),
    sunStagePosition,
    stageSize: canvasSize,
    deltaSeconds,
  });
}

function updatePreviewDebugMetrics(): void {
  const videoRect = videoElement.getBoundingClientRect();
  const canvasRect = canvasElement.getBoundingClientRect();
  const overlayRect = previewOverlay.getBoundingClientRect();

  debugSnapshot.videoSourceSize.width = videoElement.videoWidth || null;
  debugSnapshot.videoSourceSize.height = videoElement.videoHeight || null;
  debugSnapshot.videoDisplaySize.width = videoRect.width;
  debugSnapshot.videoDisplaySize.height = videoRect.height;
  debugSnapshot.videoDisplayRatio =
    videoRect.height > 0 ? videoRect.width / videoRect.height : null;
  debugSnapshot.videoObjectFit = getComputedStyle(videoElement).objectFit;
  debugSnapshot.canvasDisplaySize.width = canvasRect.width;
  debugSnapshot.canvasDisplaySize.height = canvasRect.height;
  debugSnapshot.canvasBufferSize.width = canvasElement.width;
  debugSnapshot.canvasBufferSize.height = canvasElement.height;
  debugSnapshot.overlayDisplaySize.width = overlayRect.width;
  debugSnapshot.overlayDisplaySize.height = overlayRect.height;
}

function createPreviewLayout(canvasSize: { width: number; height: number }) {
  return {
    stageWidth: canvasSize.width,
    stageHeight: canvasSize.height,
    sourceWidth: videoElement.videoWidth || canvasSize.width,
    sourceHeight: videoElement.videoHeight || canvasSize.height,
    mirrored: true,
  };
}

function createEmptyPerformanceSnapshot(): DebugSnapshot['performance'] {
  return {
    renderDeltaMs: 0,
    renderMs: null,
    trackingUpdateMs: null,
    detectMs: null,
    handDetectMs: null,
    poseDetectMs: null,
    workerRoundTripMs: null,
    handDelegate: null,
    controllerMs: null,
    recorderMs: null,
    solarUpdateMs: null,
    vfxFrameUploadMs: null,
    vfxFrameUploadCount: 0,
    trackingHz: null,
    freshFrameAgeMs: null,
    freshTrackingFrame: false,
    freshTrackingFrames: 0,
    staleRenderFrames: 0,
    detectionFrameCount: 0,
    droppedVideoFrameCount: 0,
    repeatedVideoFrameCount: 0,
    videoCurrentTimeMs: null,
    videoFrameDeltaMs: null,
  };
}

function updatePerformanceDebugMetrics(input: {
  deltaMs: number;
  renderMs: number | null;
  timestamp: number;
  trackingUpdateMs: number | null;
  freshTrackingFrame: boolean;
}): void {
  const trackingPerf = tracking.getPerformanceSnapshot();
  const solarPerf = placeholderSolarSystem.getPerformanceSnapshot();

  debugSnapshot.performance = {
    ...trackingPerf,
    renderDeltaMs: input.deltaMs,
    renderMs: input.renderMs,
    trackingUpdateMs: input.trackingUpdateMs,
    controllerMs: lastControllerMs,
    recorderMs: lastRecorderMs,
    solarUpdateMs: lastSolarUpdateMs,
    vfxFrameUploadMs: solarPerf.vfxFrameUploadMs,
    vfxFrameUploadCount: solarPerf.vfxFrameUploadCount,
    freshFrameAgeMs:
      latestTracking.lastUpdatedAt === null
        ? null
        : Math.max(input.timestamp - latestTracking.lastUpdatedAt, 0),
    freshTrackingFrame: input.freshTrackingFrame,
    freshTrackingFrames: perfFreshTrackingFrames,
    staleRenderFrames: perfStaleRenderFrames,
  };
}

function applySolarOpeningSnapshot(snapshot: SolarOpeningSnapshot): void {
  debugSnapshot.openProgress = snapshot.progress;
  debugSnapshot.solarScale = snapshot.scale;
  debugSnapshot.solarReason = snapshot.reason;
  debugSnapshot.solarStartDistance = snapshot.startDistance;
  debugSnapshot.solarTargetDistance = snapshot.targetDistance;
  debugSnapshot.solarEndpoint = solarOpening.getEndpointDebugSnapshot();

  placeholderSolarSystem.setVisible(snapshot.visible);
  placeholderSolarSystem.setClosingActive(interaction.state === 'SolarClosing');
  placeholderSolarSystem.setOpeningProgress(snapshot.progress);

  if (!snapshot.midpointWorld) {
    return;
  }

  placeholderSolarSystem.setTransform({
    position: snapshot.midpointWorld,
    scale: snapshot.scale,
  });
}

function applyPlanetActivationSnapshot(
  snapshot: PlanetActivationSnapshot,
): void {
  const focusedBody = isFocusVisualState(interaction.state)
    ? getFocusDisplayBody(snapshot.activatedBody)
    : null;

  latestPlanetActivationSnapshot = snapshot;
  debugSnapshot.hoveredBody = snapshot.hoveredBody;
  debugSnapshot.activatedBody = snapshot.activatedBody;
  debugSnapshot.pinchState = snapshot.pinchState;
  debugSnapshot.planetActivation = snapshot;
  updatePlanetFocusHudTag(focusedBody);
  placeholderSolarSystem.applyBodyInteractionState({
    hoveredBody: snapshot.hoveredBody,
    activatedBody: snapshot.activatedBody,
    focusedBody,
  });
}

function applyPlanetFocusSnapshot(
  snapshot: PlanetFocusSnapshot,
  camera: ReturnType<TransparentSceneRenderer['getCamera']>,
  previewLayout: ReturnType<typeof createPreviewLayout>,
): void {
  debugSnapshot.planetFocus = snapshot;

  // Only the follow states drive the body transform from hand input. During intro / centering /
  // dwell / floating the FocusedCelestialBody owns its own transform (the intro animation, then a
  // hold at the last placement), so overriding it here would cancel the intro animation and pin
  // the body at the stale source screen position — which also deadlocks the "centered" gate.
  const isFollowing =
    snapshot.controlState === 'SingleHandFollow' ||
    snapshot.controlState === 'TwoHandFollow';

  if (!isFollowing || !snapshot.focusedBody || !snapshot.screenPosition) {
    return;
  }

  const worldPosition = mapStagePixelToWorld(
    snapshot.screenPosition,
    previewLayout,
    camera,
    FOCUS_BODY_WORLD_Z,
  );

  if (!worldPosition) {
    return;
  }

  placeholderSolarSystem.setFocusedBodyPlacement({
    focusedBody: snapshot.focusedBody,
    worldPosition,
    scaleMultiplier: snapshot.scaleMultiplier,
  });
}

async function initializeTracking(): Promise<void> {
  try {
    await tracking.initialize();
    latestTracking = tracking.getSnapshot();
    hideTrackingLoading();
    guidance.hidden = demoModeEnabled;
    updateGuidanceForState(interaction.state);
  } catch (error) {
    console.error(error);
    latestTracking = tracking.getSnapshot();
    const message =
      '摄像头已开启，姿态与手部识别模型加载失败，请检查网络后刷新。';
    showTrackingLoadingError(message);
    guidance.hidden = demoModeEnabled;
    guidance.textContent = message;
  }
}

function showTrackingLoading(): void {
  loadingPanel.hidden = false;
  loadingPanel.classList.remove('is-error');
  loadingPanel.setAttribute('aria-busy', 'true');
  loadingStage.textContent = '阶段 2 / 2 · 正在加载手势识别';
  loadingDetail.textContent =
    '摄像头已就绪。首次访问需要下载识别组件，请保持页面开启。';
  loadingProgress.setAttribute('aria-valuetext', '正在加载手势识别模型');
}

function hideTrackingLoading(): void {
  loadingPanel.hidden = true;
  loadingPanel.classList.remove('is-error');
  loadingPanel.setAttribute('aria-busy', 'false');
}

function showTrackingLoadingError(message: string): void {
  loadingPanel.hidden = false;
  loadingPanel.classList.add('is-error');
  loadingPanel.setAttribute('aria-busy', 'false');
  loadingStage.textContent = '手势识别加载失败';
  loadingDetail.textContent = message;
  loadingProgress.setAttribute('aria-valuetext', '加载失败');
}

function updateTrackingDebugMetrics(snapshot: TrackingSnapshot): void {
  const leftHand = snapshot.hands.left;
  const rightHand = snapshot.hands.right;

  debugSnapshot.trackingStatus = snapshot.status;
  debugSnapshot.trackingError = snapshot.error;
  debugSnapshot.poseDetected = snapshot.pose.detected;
  debugSnapshot.leftHandDetected = Boolean(leftHand);
  debugSnapshot.rightHandDetected = Boolean(rightHand);
  debugSnapshot.poseLandmarkCount = snapshot.pose.landmarks.length;
  debugSnapshot.leftHandCenter.x = leftHand?.center.x ?? null;
  debugSnapshot.leftHandCenter.y = leftHand?.center.y ?? null;
  debugSnapshot.rightHandCenter.x = rightHand?.center.x ?? null;
  debugSnapshot.rightHandCenter.y = rightHand?.center.y ?? null;
}

function updateStartupGestureDebugMetrics(
  snapshot: ReturnType<HandStartupGestureController['update']>['snapshot'],
): void {
  debugSnapshot.leftHandCenter.x = snapshot.leftHand?.x ?? null;
  debugSnapshot.leftHandCenter.y = snapshot.leftHand?.y ?? null;
  debugSnapshot.rightHandCenter.x = snapshot.rightHand?.x ?? null;
  debugSnapshot.rightHandCenter.y = snapshot.rightHand?.y ?? null;
  debugSnapshot.handMidpoint.x = snapshot.midpoint?.x ?? null;
  debugSnapshot.handMidpoint.y = snapshot.midpoint?.y ?? null;
  debugSnapshot.handDirection.x = snapshot.direction?.x ?? null;
  debugSnapshot.handDirection.y = snapshot.direction?.y ?? null;
  debugSnapshot.handDistance = snapshot.distance;
  debugSnapshot.handDistanceVelocity = snapshot.distanceVelocity;
  debugSnapshot.startupTransitionReason = snapshot.transitionReason;
  debugSnapshot.bothHandsVisible = snapshot.bothHandsVisible;
  debugSnapshot.lostHandHoldActive = snapshot.lostHandHoldActive;
}

function updateRecorderControls(): void {
  const status = gestureRecorder.getStatus();

  if (
    status.recording === lastRecorderControlsRecording &&
    status.frameCount === lastRecorderControlsFrameCount
  ) {
    return;
  }

  lastRecorderControlsRecording = status.recording;
  lastRecorderControlsFrameCount = status.frameCount;

  debugRecordToggle.textContent = status.recording
    ? `Stop (${status.frameCount})`
    : 'Record';
  debugRecordExport.disabled = status.frameCount === 0;
  debugRecordClear.disabled = status.frameCount === 0;
}

function updateGuidanceForState(state: string): void {
  if (state === 'HandsClosed') {
    guidance.textContent = '保持双手可见，向两侧拉开';
    return;
  }

  if (state === 'PullArmed') {
    guidance.textContent = '已识别拉开手势，继续保持双手可见';
    return;
  }

  if (state === 'SolarOpening') {
    guidance.textContent = '继续向两侧拉开，太阳系会跟随双手展开';
    return;
  }

  if (state === 'SolarActive') {
    guidance.textContent = '太阳系已展开，双手分别靠近左右端点即可控制';
    return;
  }

  if (state === 'SolarHandleControl') {
    guidance.textContent = '已扶住左右端点，可以移动或松手悬浮；向内合拢可收起';
    return;
  }

  if (state === 'SolarFreeHover') {
    guidance.textContent = '太阳系悬浮中，双手靠近左右端点可重新控制或向内合拢收起';
    return;
  }

  if (state === 'BodyHover') {
    guidance.textContent = '手靠近天体时会高亮，捏合拇指和食指可激活目标';
    return;
  }

  if (state === 'PlanetActivated') {
    guidance.textContent = '目标已激活，用选中这只手的拇指和食指连续点捏两次，第二次松开后进入单个星球界面';
    return;
  }

  if (state === 'PlanetFocusView') {
    guidance.textContent = '已进入单个星球界面，等居中后离开热区，再重新碰触星球停留 1 秒可跟手；地月界面可长按切换视角';
    return;
  }

  if (state === 'PlanetFocusControlled') {
    guidance.textContent = '星球正在跟手；单手捏合后张开可放下，双手距离可调整大小；地月界面可长按切换视角';
    return;
  }

  if (state === 'PlanetFocusFloating') {
    guidance.textContent = '星球已放下悬浮；朝左上角或右上角快速张手挥出可返回太阳系，或重新碰触停留 1 秒跟手；地月界面可长按切换视角';
    return;
  }

  if (state === 'BodyReturning') {
    guidance.textContent = '星球正在回到太阳系轨道，完成后恢复太阳系交互';
    return;
  }

  if (state === 'SolarClosing') {
    guidance.textContent = '继续向内合拢端点，完全合拢后回到空场';
    return;
  }

  guidance.textContent = '双手在画面任意位置合拢，再向两侧拉开';
}

function isPlanetFocusState(state: string): boolean {
  return (
    state === 'PlanetFocusView' ||
    state === 'PlanetFocusControlled' ||
    state === 'PlanetFocusFloating'
  );
}

function isFocusVisualState(state: string): boolean {
  return isPlanetFocusState(state) || state === 'BodyReturning';
}

function getFocusDisplayBody(
  activatedBody: InteractiveCelestialBodyId | null,
): InteractiveCelestialBodyId | null {
  if (activatedBody === 'earth') {
    return earthMoonFocusBody;
  }

  return activatedBody;
}

function updateDemoHandModelButtonHandHold(
  tracking: TrackingSnapshot,
  timestamp: number,
  layout: PreviewLayout,
): void {
  const active = demoModeEnabled && !demoHandModelButton.hidden;
  const rect = getButtonStageRect(demoHandModelButton, layout);

  if (demoHandModelNeedsClear) {
    const clearProbe = updateIndexFingerUiHold({
      active,
      hands: tracking.hands.hands,
      layout,
      rect,
      previous: EMPTY_INDEX_FINGER_UI_HOLD,
      requiredMs: DEMO_HAND_MODEL_HOLD_MS,
      timestamp,
      hitSlopPx: UI_BUTTON_FINGER_HIT_SLOP_PX,
    });

    if (!active || clearProbe.hit === null) {
      demoHandModelNeedsClear = false;
    }

    cancelDemoHandModelHold();
    return;
  }

  const holdUpdate = updateIndexFingerUiHold({
    active,
    hands: tracking.hands.hands,
    layout,
    rect,
    previous: demoHandModelButtonHold,
    requiredMs: DEMO_HAND_MODEL_HOLD_MS,
    timestamp,
    hitSlopPx: UI_BUTTON_FINGER_HIT_SLOP_PX,
  });

  demoHandModelButtonHold = holdUpdate.hold;
  setDemoHandModelButtonProgress(holdUpdate.progress);
  demoHandModelButton.classList.toggle(
    'is-charging',
    holdUpdate.hit !== null,
  );

  if (holdUpdate.triggered) {
    toggleDemoHandSkeleton();
  }
}

function toggleDemoHandSkeleton(): void {
  if (!demoModeEnabled) {
    cancelDemoHandModelHold();
    return;
  }

  demoHandSkeletonVisible = !demoHandSkeletonVisible;
  demoHandModelNeedsClear = true;
  cancelDemoHandModelHold({ keepProgress: true });
  updateDemoHandModelButtonLabel();
  syncLandmarkOverlayVisibility();
}

function cancelDemoHandModelHold(
  options: { keepProgress?: boolean } = {},
): void {
  demoHandModelButtonHold = EMPTY_INDEX_FINGER_UI_HOLD;
  demoHandModelButton.classList.remove('is-charging');

  if (!options.keepProgress) {
    setDemoHandModelButtonProgress(0);
  }
}

function setDemoHandModelButtonProgress(progress: number): void {
  const value = progress.toFixed(3);

  if (value === lastDemoHandModelButtonProgress) {
    return;
  }

  lastDemoHandModelButtonProgress = value;
  demoHandModelButton.style.setProperty('--focus-action-progress', value);
}

function updateDemoHandModelButtonLabel(): void {
  const action = demoHandSkeletonVisible ? '隐藏' : '显示';
  const label = `长按${action}手部模型`;

  demoHandModelLabel.textContent = label;
  demoHandModelContext.textContent = `HAND SKELETON · ${
    demoHandSkeletonVisible ? 'ON' : 'OFF'
  }`;
  demoHandModelButton.setAttribute('aria-label', label);
  demoHandModelButton.setAttribute(
    'aria-pressed',
    demoHandSkeletonVisible ? 'true' : 'false',
  );
}

function syncLandmarkOverlayVisibility(): void {
  landmarkOverlay.setVisible(
    debugOverlay.isVisible || (demoModeEnabled && demoHandSkeletonVisible),
  );
}

function updateEarthMoonSwitchButtonHandHold(
  tracking: TrackingSnapshot,
  timestamp: number,
  layout: PreviewLayout,
): void {
  const active = isEarthMoonFocusSwitchActive();
  const rect = getPlanetFocusSwitchButtonStageRect(layout);

  if (earthMoonSwitchNeedsClear) {
    const clearProbe = updateIndexFingerUiHold({
      active,
      hands: tracking.hands.hands,
      layout,
      rect,
      previous: EMPTY_INDEX_FINGER_UI_HOLD,
      requiredMs: EARTH_MOON_SWITCH_HOLD_MS,
      timestamp,
      hitSlopPx: UI_BUTTON_FINGER_HIT_SLOP_PX,
    });

    if (!active || clearProbe.hit === null) {
      earthMoonSwitchNeedsClear = false;
    }

    cancelEarthMoonSwitchHold();
    return;
  }

  const holdUpdate = updateIndexFingerUiHold({
    active,
    hands: tracking.hands.hands,
    layout,
    rect,
    previous: earthMoonSwitchButtonHold,
    requiredMs: EARTH_MOON_SWITCH_HOLD_MS,
    timestamp,
    hitSlopPx: UI_BUTTON_FINGER_HIT_SLOP_PX,
  });

  earthMoonSwitchButtonHold = holdUpdate.hold;
  setPlanetFocusSwitchButtonProgress(holdUpdate.progress);
  planetFocusSwitchButton.classList.toggle(
    'is-charging',
    holdUpdate.hit !== null,
  );

  if (holdUpdate.triggered) {
    triggerEarthMoonFocusSwitch();
  }
}

function triggerPlanetReturn(
  returnWaveSnapshot: PlanetReturnWaveDebugSnapshot | null = null,
): void {
  const focusedBody = getActiveFocusedBody();
  cancelEarthMoonSwitchHold();

  if (!focusedBody || !isPlanetFocusState(interaction.state)) {
    return;
  }

  debugSnapshot.activatedBody = focusedBody;
  debugSnapshot.planetFocus = {
    ...debugSnapshot.planetFocus,
    focusedBody,
    transitionReason: 'fast-upper-corner-throw-return',
  };
  interaction.transition('BodyReturning');
  startBodyReturn(
    focusedBody,
    createFocusedBodyReturnMotionFromWave(returnWaveSnapshot),
  );
  updateGuidanceForState(interaction.state);
  updatePlanetFocusControlsVisibility();
  updatePlanetFocusSwitchButtonVisibility();
}

function updatePlanetFocusControlsVisibility(): void {
  const visible =
    isPlanetFocusState(interaction.state) && getActiveFocusedBody() !== null;
  const hidden = !visible;

  if (planetFocusControls.hidden !== hidden) {
    planetFocusControls.hidden = hidden;
  }
}

function triggerEarthMoonFocusSwitch(): void {
  if (!isEarthMoonFocusSwitchActive()) {
    cancelEarthMoonSwitchHold();
    return;
  }

  earthMoonFocusBody = earthMoonFocusBody === 'earth' ? 'moon' : 'earth';
  earthMoonSwitchNeedsClear = true;
  cancelEarthMoonSwitchHold({ keepProgress: true });
  updatePlanetFocusSwitchButtonLabel();
  applyPlanetActivationSnapshot(latestPlanetActivationSnapshot);
  debugSnapshot.planetFocus = {
    ...debugSnapshot.planetFocus,
    focusedBody: earthMoonFocusBody,
    transitionReason: `earth-moon-switch-to-${earthMoonFocusBody}`,
  };
}

function cancelEarthMoonSwitchHold(
  options: { keepProgress?: boolean } = {},
): void {
  earthMoonSwitchButtonHold = EMPTY_INDEX_FINGER_UI_HOLD;
  planetFocusSwitchButton.classList.remove('is-charging');

  if (!options.keepProgress) {
    setPlanetFocusSwitchButtonProgress(0);
  }
}

function setPlanetFocusSwitchButtonProgress(progress: number): void {
  const value = progress.toFixed(3);

  if (value === lastPlanetFocusSwitchButtonProgress) {
    return;
  }

  lastPlanetFocusSwitchButtonProgress = value;
  planetFocusSwitchButton.style.setProperty('--focus-action-progress', value);
}

function updatePlanetFocusSwitchButtonVisibility(): void {
  const visible = isEarthMoonFocusSwitchActive();
  const hidden = !visible;

  if (planetFocusSwitchButton.hidden !== hidden) {
    planetFocusSwitchButton.hidden = hidden;
  }
  updatePlanetFocusSwitchButtonLabel();

  if (!visible) {
    cancelEarthMoonSwitchHold();
  }
}

let lastPlanetFocusSwitchLabel = '';

function updatePlanetFocusHudTag(
  focusedBody: InteractiveCelestialBodyId | null,
): void {
  if (focusedBody === null || focusedBody === lastPlanetFocusHudBody) {
    return;
  }

  lastPlanetFocusHudBody = focusedBody;
  const bodyName = placeholderSolarSystem.getBodyDefinition(focusedBody).name;
  planetFocusHudTag.textContent = `FOCUS CONTROL // ${bodyName.toUpperCase()}`;
}

function updatePlanetFocusSwitchButtonLabel(): void {
  const targetBody = earthMoonFocusBody === 'earth' ? '月球' : '地球';
  const label = `长按切换${targetBody}视角`;

  if (label === lastPlanetFocusSwitchLabel) {
    return;
  }

  lastPlanetFocusSwitchLabel = label;
  planetFocusSwitchLabel.textContent = label;
  planetFocusSwitchContext.textContent =
    earthMoonFocusBody === 'earth'
      ? 'VIEW · EARTH → MOON'
      : 'VIEW · MOON → EARTH';
  planetFocusSwitchButton.setAttribute('aria-label', label);
}

function isEarthMoonFocusSwitchActive(): boolean {
  return (
    isPlanetFocusState(interaction.state) &&
    debugSnapshot.activatedBody === 'earth'
  );
}

function resetEarthMoonFocusBody(): void {
  earthMoonFocusBody = 'earth';
  earthMoonSwitchNeedsClear = false;
  updatePlanetFocusSwitchButtonLabel();
}

function getPlanetFocusSwitchButtonStageRect(
  layout: PreviewLayout,
): UiButtonStageRect | null {
  return getButtonStageRect(planetFocusSwitchButton, layout);
}

function getButtonStageRect(
  button: HTMLElement,
  layout: PreviewLayout,
): UiButtonStageRect | null {
  if (button.hidden) {
    return null;
  }

  const buttonRect = button.getBoundingClientRect();
  const canvasRect = canvasElement.getBoundingClientRect();

  if (buttonRect.width <= 0 || buttonRect.height <= 0) {
    return null;
  }

  const scaleX = canvasRect.width > 0 ? layout.stageWidth / canvasRect.width : 1;
  const scaleY = canvasRect.height > 0 ? layout.stageHeight / canvasRect.height : 1;

  return {
    x: (buttonRect.left - canvasRect.left) * scaleX,
    y: (buttonRect.top - canvasRect.top) * scaleY,
    width: buttonRect.width * scaleX,
    height: buttonRect.height * scaleY,
  };
}

function getActiveFocusedBody(): InteractiveCelestialBodyId | null {
  const candidate = debugSnapshot.planetFocus.focusedBody ?? debugSnapshot.activatedBody;

  return isInteractiveCelestialBodyId(candidate) ? candidate : null;
}

function isInteractiveCelestialBodyId(
  id: string | null,
): id is InteractiveCelestialBodyId {
  return Boolean(
    id && INTERACTIVE_CELESTIAL_BODY_IDS.includes(id as InteractiveCelestialBodyId),
  );
}

function startBodyReturn(
  focusedBody: PlanetFocusSnapshot['focusedBody'],
  returnMotion: FocusedBodyReturnMotion | null = null,
): void {
  if (!focusedBody) {
    finishBodyReturn();
    return;
  }

  returningFocusedBody = focusedBody;
  const started = placeholderSolarSystem.startFocusedBodyReturn({
    focusedBody,
    returnMotion,
  });

  if (!started) {
    finishBodyReturn();
  }
}

function completeBodyReturnIfReady(): void {
  if (
    interaction.state !== 'BodyReturning' ||
    !placeholderSolarSystem.isFocusedBodyReturnComplete(returningFocusedBody)
  ) {
    return;
  }

  finishBodyReturn();
}

function finishBodyReturn(): void {
  if (interaction.state === 'BodyReturning') {
    interaction.transition('SolarFreeHover');
  }

  returningFocusedBody = null;
  resetEarthMoonFocusBody();
  cancelEarthMoonSwitchHold();
  planetActivation.reset();
  planetFocus.reset();
  planetReturnWave.reset();
  debugSnapshot.hoveredBody = null;
  debugSnapshot.activatedBody = null;
  debugSnapshot.pinchState = 'idle';
  debugSnapshot.planetActivation = EMPTY_PLANET_ACTIVATION_SNAPSHOT;
  latestPlanetActivationSnapshot = EMPTY_PLANET_ACTIVATION_SNAPSHOT;
  debugSnapshot.planetFocus = EMPTY_PLANET_FOCUS_SNAPSHOT;
  debugSnapshot.planetReturnWave = EMPTY_PLANET_RETURN_WAVE_SNAPSHOT;
  debugSnapshot.throwVelocity = null;
  placeholderSolarSystem.applyBodyInteractionState({
    hoveredBody: null,
    activatedBody: null,
    focusedBody: null,
  });
  updateGuidanceForState(interaction.state);
}
