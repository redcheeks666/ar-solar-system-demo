import './styles.css';
import { startCamera, stopCamera } from './camera/camera';
import { GestureCalibrationController, getDefaultGestureCalibrationSnapshot } from './interaction/gestureCalibration';
import { GestureDebugRecorder } from './interaction/gestureDebugRecorder';
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
import { InteractionStateMachine } from './interaction/stateMachine';
import {
  EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT,
  WholeSystemIntentController,
} from './interaction/wholeSystemIntent';
import {
  SolarOpeningController,
  getSolarOpeningRotation,
  type SolarOpeningSnapshot,
} from './interaction/solarOpeningController';
import { DebugOverlay } from './rendering/debugOverlay';
import { InteractionStatusSummary } from './rendering/interactionStatusSummary';
import { LandmarkOverlay } from './rendering/landmarkOverlay';
import { INTERACTION_PLANE_Z, TransparentSceneRenderer } from './rendering/scene';
import { FOCUS_BODY_WORLD_Z } from './solar/focusedCelestialBody';
import { CodePlaceholderSolarSystem } from './solar/solarSystem';
import { MediaPipeTrackingController } from './tracking/mediapipe';
import { mapStagePixelToWorld } from './interaction/coordinateMapping';
import type {
  CameraPermissionStatus,
  DebugSnapshot,
  TrackingSnapshot,
} from './utils/types';

const videoElement = getElement<HTMLVideoElement>('camera-video');
const canvasElement = getElement<HTMLCanvasElement>('webgl-canvas');
const landmarkCanvas = getElement<HTMLCanvasElement>('landmark-canvas');
const previewOverlay = getElement<HTMLElement>('preview-overlay');
const startButton = getElement<HTMLButtonElement>('start-camera');
const statusText = getElement<HTMLElement>('status-text');
const introPanel = getElement<HTMLElement>('intro-panel');
const guidance = getElement<HTMLElement>('guidance');
const interactionSummary = getElement<HTMLElement>('interaction-summary');
const debugPanel = getElement<HTMLElement>('debug-panel');
const debugToggle = getElement<HTMLButtonElement>('debug-toggle');
const debugRecorderControls = getElement<HTMLElement>('debug-recorder');
const debugRecordToggle = getElement<HTMLButtonElement>('debug-record-toggle');
const debugRecordExport = getElement<HTMLButtonElement>('debug-record-export');
const debugRecordClear = getElement<HTMLButtonElement>('debug-record-clear');

const interaction = new InteractionStateMachine();
const renderer = new TransparentSceneRenderer(canvasElement);
const solarPreviewEnabled =
  new URLSearchParams(window.location.search).get('solarPreview') === '1';
const placeholderSolarSystem = new CodePlaceholderSolarSystem();
const debugOverlay = new DebugOverlay(debugPanel, debugToggle);
const statusSummary = new InteractionStatusSummary(interactionSummary);
const landmarkOverlay = new LandmarkOverlay(landmarkCanvas, videoElement);
const tracking = new MediaPipeTrackingController();
const handPrimitives = new HandPrimitiveController();
const gestureCalibration = new GestureCalibrationController();
const gestureRecorder = new GestureDebugRecorder();
const startupGesture = new HandStartupGestureController();
const wholeSystemIntent = new WholeSystemIntentController();
const solarOpening = new SolarOpeningController();
const planetActivation = new PlanetActivationController();
const planetFocus = new PlanetFocusController();

let activeStream: MediaStream | null = null;
let cameraStatus: CameraPermissionStatus = 'idle';
let latestTracking = tracking.getSnapshot();
// Detection timestamp of the last tracking frame fed to the interaction controllers.
let lastGestureInputAt: number | null = null;

renderer.addObject3D(placeholderSolarSystem.group);
placeholderSolarSystem.setVisible(solarPreviewEnabled);
placeholderSolarSystem.setOpeningProgress(solarPreviewEnabled ? 1 : 0);

if (solarPreviewEnabled) {
  placeholderSolarSystem.setTransform({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: -0.58, y: 0.12, z: 0.08 },
    scale: 0.66,
  });
  introPanel.hidden = true;
  guidance.hidden = true;
}

const debugSnapshot: DebugSnapshot = {
  fps: 0,
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
  hoveredBody: null,
  activatedBody: null,
  pinchState: 'idle',
  planetActivation: EMPTY_PLANET_ACTIVATION_SNAPSHOT,
  planetFocus: EMPTY_PLANET_FOCUS_SNAPSHOT,
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
  landmarkOverlay.setVisible(visible);
  debugRecorderControls.hidden = !visible;
});

renderer.start(({ fps, canvasSize, deltaSeconds, timestampMs }) => {
  const timestamp = timestampMs;

  if (cameraStatus === 'granted') {
    latestTracking = tracking.update(videoElement, timestamp);

    // P0: only advance the interaction state machines on a genuinely new detection frame, and
    // feed them the detection timestamp (not the render timestamp), so re-rendered stale frames
    // do not inject fake zero-velocity samples into the gesture velocity features.
    if (isFreshTrackingFrame(latestTracking.lastUpdatedAt, lastGestureInputAt)) {
      const trackingAt = latestTracking.lastUpdatedAt as number;
      lastGestureInputAt = trackingAt;
      updateGestureControllers(latestTracking, trackingAt, canvasSize);
      gestureRecorder.record(trackingAt, latestTracking, debugSnapshot);
    }
  }

  placeholderSolarSystem.update(deltaSeconds);

  debugSnapshot.fps = fps;
  debugSnapshot.cameraStatus = cameraStatus;
  debugSnapshot.interactionState = interaction.state;
  debugSnapshot.canvasSize = canvasSize;
  updateTrackingDebugMetrics(latestTracking);
  if (debugOverlay.isVisible) {
    updatePreviewDebugMetrics();
  }
  landmarkOverlay.draw(
    latestTracking,
    debugSnapshot.wholeSystem,
    interaction.state,
  );
  debugSnapshot.gestureRecording = gestureRecorder.getStatus();
  updateRecorderControls();
  statusSummary.update(debugSnapshot);
  debugOverlay.update(debugSnapshot);
});

startButton.addEventListener('click', () => {
  void handleCameraStart();
});

window.addEventListener('beforeunload', () => {
  stopCamera(activeStream);
  tracking.dispose();
  handPrimitives.reset();
  gestureCalibration.reset();
  wholeSystemIntent.reset();
  solarOpening.reset();
  planetActivation.reset();
  planetFocus.reset();
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
  guidance.hidden = false;
  guidance.textContent = '正在加载姿态与手部识别模型...';
  void initializeTracking();
}

function updateGestureControllers(
  tracking: TrackingSnapshot,
  timestamp: number,
  canvasSize: { width: number; height: number },
): void {
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
  const camera = renderer.getCamera();
  const solarOpeningUpdate = solarOpening.update({
    tracking,
    interactionState: interaction.state,
    thresholds: debugSnapshot.gestureCalibration.thresholds,
    layout: previewLayout,
    camera,
    planeZ: INTERACTION_PLANE_Z,
    timestamp,
  });

  if (solarOpeningUpdate.nextState) {
    interaction.transition(solarOpeningUpdate.nextState);
    updateGuidanceForState(interaction.state);
  }

  applySolarOpeningSnapshot(solarOpeningUpdate.snapshot);

  const planetActivationUpdate = planetActivation.update({
    tracking,
    interactionState: interaction.state,
    targets: placeholderSolarSystem.getInteractiveBodyScreenTargets(
      camera,
      previewLayout,
    ),
    layout: previewLayout,
    timestamp,
  });

  if (planetActivationUpdate.nextState) {
    interaction.transition(planetActivationUpdate.nextState);
    updateGuidanceForState(interaction.state);
  }

  applyPlanetActivationSnapshot(planetActivationUpdate.snapshot);

  const focusedBody = planetActivationUpdate.snapshot.activatedBody;
  if (isPlanetFocusState(interaction.state) && focusedBody) {
    const planetFocusUpdate = planetFocus.update({
      tracking,
      interactionState: interaction.state,
      focusedBody,
      target: placeholderSolarSystem.getFocusedBodyScreenTarget(
        focusedBody,
        camera,
        previewLayout,
      ),
      layout: previewLayout,
      timestamp,
    });

    if (planetFocusUpdate.nextState) {
      interaction.transition(planetFocusUpdate.nextState);
      updateGuidanceForState(interaction.state);
    }

    applyPlanetFocusSnapshot(planetFocusUpdate.snapshot, camera, previewLayout);
    return;
  }

  planetFocus.reset();
  debugSnapshot.planetFocus = EMPTY_PLANET_FOCUS_SNAPSHOT;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element as T;
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

function applySolarOpeningSnapshot(snapshot: SolarOpeningSnapshot): void {
  debugSnapshot.openProgress = snapshot.progress;
  debugSnapshot.solarScale = snapshot.scale;
  debugSnapshot.solarReason = snapshot.reason;
  debugSnapshot.solarStartDistance = snapshot.startDistance;
  debugSnapshot.solarTargetDistance = snapshot.targetDistance;

  placeholderSolarSystem.setVisible(snapshot.visible);
  placeholderSolarSystem.setOpeningProgress(snapshot.progress);

  if (!snapshot.midpointWorld) {
    return;
  }

  placeholderSolarSystem.setTransform({
    position: snapshot.midpointWorld,
    rotation: getSolarOpeningRotation(snapshot),
    scale: snapshot.scale,
  });
}

function applyPlanetActivationSnapshot(
  snapshot: PlanetActivationSnapshot,
): void {
  debugSnapshot.hoveredBody = snapshot.hoveredBody;
  debugSnapshot.activatedBody = snapshot.activatedBody;
  debugSnapshot.pinchState = snapshot.pinchState;
  debugSnapshot.planetActivation = snapshot;
  placeholderSolarSystem.applyBodyInteractionState({
    hoveredBody: snapshot.hoveredBody,
    activatedBody: snapshot.activatedBody,
    focusedBody: isPlanetFocusState(interaction.state)
      ? snapshot.activatedBody
      : null,
  });
}

function applyPlanetFocusSnapshot(
  snapshot: PlanetFocusSnapshot,
  camera: ReturnType<TransparentSceneRenderer['getCamera']>,
  previewLayout: ReturnType<typeof createPreviewLayout>,
): void {
  debugSnapshot.planetFocus = snapshot;

  if (!snapshot.focusedBody || !snapshot.screenPosition) {
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
    updateGuidanceForState(interaction.state);
  } catch (error) {
    console.error(error);
    latestTracking = tracking.getSnapshot();
    guidance.textContent = '摄像头已开启，姿态与手部识别模型加载失败，请检查网络后刷新。';
  }
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
    guidance.textContent = '目标已激活，用选中这只手的拇指和食指连续闭合两次进入单个星球界面';
    return;
  }

  if (state === 'PlanetFocusView') {
    guidance.textContent = '已进入单个星球界面，等居中后离开热区，再重新碰触星球停留 1 秒可跟手';
    return;
  }

  if (state === 'PlanetFocusControlled') {
    guidance.textContent = '星球正在跟手；单手捏合后张开可放下，双手距离可调整大小';
    return;
  }

  if (state === 'PlanetFocusFloating') {
    guidance.textContent = '星球已放下悬浮；手先离开热区，再重新碰触停留 1 秒可跟手';
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
