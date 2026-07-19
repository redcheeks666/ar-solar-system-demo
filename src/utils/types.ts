export type CameraPermissionStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error';

export type InteractionState =
  | 'CameraReady'
  | 'EmptyIdle'
  | 'HandsClosed'
  | 'PullArmed'
  | 'SolarOpening'
  | 'SolarActive'
  | 'SolarFreeHover'
  | 'SolarHandleControl'
  | 'SolarClosing'
  | 'BodyHover'
  | 'PlanetActivated'
  | 'PlanetFocusView'
  | 'PlanetFocusControlled'
  | 'PlanetFocusFloating'
  | 'BodyReturning';

export type TrackingStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NormalizedPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type TrackedHandSide = 'left' | 'right' | 'unknown';

export interface PoseTrackingSnapshot {
  detected: boolean;
  leftShoulder: NormalizedPoint | null;
  rightShoulder: NormalizedPoint | null;
  landmarks: NormalizedPoint[];
  lastUpdatedAt: number | null;
}

export interface TrackedHand {
  side: TrackedHandSide;
  handednessScore: number;
  center: NormalizedPoint;
  wrist: NormalizedPoint;
  thumbTip: NormalizedPoint;
  indexFingerTip: NormalizedPoint;
  palmScale: number;
  /** Image-space landmarks (normalized 0-1, image-relative z). Used for screen-plane gestures. */
  landmarks: NormalizedPoint[];
  /**
   * MediaPipe world landmarks (metric, palm-relative origin) when available, else null. More
   * stable than image z for hand-shape geometry (open-hand / fist / pinch).
   */
  worldLandmarks: NormalizedPoint[] | null;
}

export interface HandTrackingSnapshot {
  detectedHands: number;
  left: TrackedHand | null;
  right: TrackedHand | null;
  hands: TrackedHand[];
  lastUpdatedAt: number | null;
}

export interface TrackingSnapshot {
  status: TrackingStatus;
  error: string | null;
  pose: PoseTrackingSnapshot;
  hands: HandTrackingSnapshot;
  lastUpdatedAt: number | null;
}

export interface HandStartupGestureSnapshot {
  leftHand: NormalizedPoint | null;
  rightHand: NormalizedPoint | null;
  midpoint: NormalizedPoint | null;
  direction: NormalizedPoint | null;
  distance: number | null;
  distanceVelocity: number | null;
  closeIntentScore: number;
  pullIntentScore: number;
  bothHandsVisible: boolean;
  lostHandHoldActive: boolean;
  handsClosed: boolean;
  pullArmed: boolean;
  transitionReason: string;
}

export type WholeSystemControlState =
  | 'Inactive'
  | 'VirtualOpeningHandle'
  | 'SolarHandleControl'
  | 'ReleaseCandidate'
  | 'SolarFreeHover'
  | 'ReGripCandidate'
  | 'SolarClosing';

export type WholeSystemScaleIntent = 'none' | 'scaleUp' | 'scaleDown';

export type WholeSystemRotationIntent = 'none' | 'rotate2d' | 'rotate3d';

export type WholeSystemReleaseBlockReason =
  | 'none'
  | 'rotationHold'
  | 'cuppedGrip';

export type WholeSystemReGripReason = 'none' | 'endpoint' | 'wideMagnet';

export interface PalmOrientationSnapshot {
  normal: NormalizedPoint | null;
  facingCameraScore: number | null;
  upScore: number | null;
}

export interface HandPoseIntentSnapshot {
  openHandScore: number | null;
  gripPoseScore: number | null;
  openFingerCount: number;
  releaseReady: boolean;
}

export interface WholeSystemIntentSnapshot {
  controlState: WholeSystemControlState;
  controlConfidence: number;
  releaseConfidence: number;
  reGripConfidence: number;
  endpointHitScore: number;
  /** Ratio used by the legacy whole-system pinch diagnostic for the visual-left hand. */
  leftPinchRatio: number | null;
  /** Ratio used by the legacy whole-system pinch diagnostic for the visual-right hand. */
  rightPinchRatio: number | null;
  /** Exact penalty subtracted from the legacy control/re-grip confidence diagnostics. */
  pinchPenalty: number;
  trackingConfidence: number;
  scaleIntent: WholeSystemScaleIntent;
  scaleIntentScore: number;
  rotationIntent: WholeSystemRotationIntent;
  rotationIntentScore: number;
  collapseIntentScore: number;
  leftPalm: PalmOrientationSnapshot;
  rightPalm: PalmOrientationSnapshot;
  leftHandPose: HandPoseIntentSnapshot;
  rightHandPose: HandPoseIntentSnapshot;
  releaseGestureActive: boolean;
  releaseGestureLatched: boolean;
  releaseGestureScore: number;
  releaseStableMs: number;
  releaseBlockReason: WholeSystemReleaseBlockReason;
  gripHoldActive: boolean;
  reGripReason: WholeSystemReGripReason;
  virtualLeftEndpoint: NormalizedPoint | null;
  virtualRightEndpoint: NormalizedPoint | null;
  leftEndpointMatched: boolean;
  rightEndpointMatched: boolean;
  transitionReason: string;
}

export interface GestureThresholds {
  closedDistance: number;
  closedEvidenceDistance: number;
  pullMinDistanceDelta: number;
  endpointEnterRadius: number;
  endpointExitRadius: number;
  reGripMagnetRadius: number;
  releaseReGripClearRadius: number;
  collapseStartDistance: number;
  collapseCompleteDistance: number;
}

export type SolarEndpointDebugMode = 'inactive' | 'enter' | 'follow';

/** Diagnostics from the endpoint gate that actually drives free-hover re-grip. */
export interface SolarEndpointDebugSnapshot {
  mode: SolarEndpointDebugMode;
  reason: string;
  handLeftWorld: NormalizedPoint | null;
  handRightWorld: NormalizedPoint | null;
  referenceLeftWorld: NormalizedPoint | null;
  referenceRightWorld: NormalizedPoint | null;
  leftDistanceWorld: number | null;
  rightDistanceWorld: number | null;
  radiusWorld: number | null;
  score: number;
  bothWithinRadius: boolean;
  stableMs: number;
  stableRequiredMs: number;
}

export interface HandPrimitiveSnapshot {
  leftHand: NormalizedPoint | null;
  rightHand: NormalizedPoint | null;
  midpoint: NormalizedPoint | null;
  direction: NormalizedPoint | null;
  distance: number | null;
  distanceVelocity: number | null;
  handAxisAngle: number | null;
  averagePalmScale: number | null;
  trackingConfidence: number;
  closeIntentScore: number;
  pullIntentScore: number;
  bothHandsVisible: boolean;
  visibleHandCount: number;
  transitionReason: string;
}

export interface GestureCalibrationSnapshot {
  thresholds: GestureThresholds;
  averagePalmScale: number | null;
  closedDistance: number | null;
  comfortableOpenDistance: number | null;
  calibrated: boolean;
  reason: string;
}

export interface GestureRecordingStatus {
  recording: boolean;
  frameCount: number;
  maxFrames: number;
  lastEvent: string | null;
}

export interface MediaPipePerformanceSnapshot {
  detectMs: number | null;
  handDetectMs: number | null;
  poseDetectMs: number | null;
  workerRoundTripMs: number | null;
  handDelegate: 'GPU' | 'CPU' | null;
  trackingHz: number | null;
  detectionFrameCount: number;
  droppedVideoFrameCount: number;
  repeatedVideoFrameCount: number;
  videoCurrentTimeMs: number | null;
  videoFrameDeltaMs: number | null;
}

export interface PerformanceDebugSnapshot extends MediaPipePerformanceSnapshot {
  renderDeltaMs: number;
  renderMs: number | null;
  trackingUpdateMs: number | null;
  controllerMs: number | null;
  recorderMs: number | null;
  solarUpdateMs: number | null;
  vfxFrameUploadMs: number | null;
  vfxFrameUploadCount: number;
  freshFrameAgeMs: number | null;
  freshTrackingFrame: boolean;
  freshTrackingFrames: number;
  staleRenderFrames: number;
}

export interface DebugSnapshot {
  fps: number;
  performance: PerformanceDebugSnapshot;
  cameraStatus: CameraPermissionStatus;
  trackingStatus: TrackingStatus;
  trackingError: string | null;
  poseDetected: boolean;
  leftHandDetected: boolean;
  rightHandDetected: boolean;
  poseLandmarkCount: number;
  leftHandCenter: {
    x: number | null;
    y: number | null;
  };
  rightHandCenter: {
    x: number | null;
    y: number | null;
  };
  handMidpoint: {
    x: number | null;
    y: number | null;
  };
  handDirection: {
    x: number | null;
    y: number | null;
  };
  handDistanceVelocity: number | null;
  startupTransitionReason: string;
  handPrimitives: HandPrimitiveSnapshot;
  gestureCalibration: GestureCalibrationSnapshot;
  gestureRecording: GestureRecordingStatus;
  bothHandsVisible: boolean;
  lostHandHoldActive: boolean;
  interactionState: InteractionState;
  chestAnchor: {
    x: number | null;
    y: number | null;
  };
  handDistance: number | null;
  openProgress: number;
  solarScale: number;
  solarReason: string;
  solarStartDistance: number | null;
  solarTargetDistance: number | null;
  solarEndpoint: SolarEndpointDebugSnapshot;
  hoveredBody: string | null;
  activatedBody: string | null;
  pinchState: string;
  planetActivation: PlanetActivationDebugSnapshot;
  planetFocus: PlanetFocusDebugSnapshot;
  planetReturnWave: PlanetReturnWaveDebugSnapshot;
  throwVelocity: number | null;
  wholeSystem: WholeSystemIntentSnapshot;
  rendererReady: boolean;
  canvasSize: {
    width: number;
    height: number;
  };
  videoSourceSize: {
    width: number | null;
    height: number | null;
  };
  videoDisplaySize: {
    width: number;
    height: number;
  };
  videoDisplayRatio: number | null;
  videoObjectFit: string;
  canvasDisplaySize: {
    width: number;
    height: number;
  };
  canvasBufferSize: {
    width: number;
    height: number;
  };
  overlayDisplaySize: {
    width: number;
    height: number;
  };
}

export interface PlanetActivationDebugSnapshot {
  /** Existing runtime fields are optional here so older schema-v3 recordings remain readable. */
  hoveredBody?: string | null;
  activatedBody?: string | null;
  pinchState?: string;
  activeHandKey: string | null;
  pinchDistance: number | null;
  pinchDistancePx: number | null;
  pinchRatio: number | null;
  pinchStartThreshold: number;
  pinchEndThreshold: number;
  hoverDistancePx: number | null;
  hoverHitRadiusPx: number | null;
  hoverScreenPosition: {
    x: number;
    y: number;
  } | null;
  hoverPointKind: string | null;
  activatedOriginalOrbit: {
    parentId: string | null;
    orbitRadius: number;
    orbitPhase: number;
    localPosition: {
      x: number;
      y: number;
      z: number;
    };
  } | null;
  trackingLossMs: number;
  /** Additive activation-motion diagnostics; optional so existing schema-v3 recordings replay. */
  activationMotionPhase?: string;
  handAnchorScreen?: {
    x: number;
    y: number;
  } | null;
  /** Hand travel and speed are normalized by the preview short side. */
  handDisplacement?: number | null;
  handLockRadius?: number;
  handSpeed?: number | null;
  settleSpeedThreshold?: number;
  settleFrameCount?: number;
  settleRequiredFrames?: number;
  settleTarget?: string | null;
  doubleCloseCount: number;
  /** Additive schema-v3 diagnostics for the ratio-only valley-peak-valley detector. */
  doubleCloseValleyRatio?: number | null;
  doubleClosePeakRatio?: number | null;
  doubleCloseProminence?: number | null;
  doubleCloseTimeoutRemainingMs?: number | null;
  doubleCloseFailureReason?: string | null;
  transitionReason: string;
}

export type PlanetFocusControlState =
  | 'Inactive'
  | 'IntroCooldown'
  | 'WaitingForHeatZoneClear'
  | 'FocusIdle'
  | 'SingleTouchDwell'
  | 'SingleHandFollow'
  | 'TwoHandTouchDwell'
  | 'TwoHandFollow'
  | 'DeselectedWaitForClear'
  | 'Floating';

export type PlanetFocusControlMode = 'none' | 'single' | 'two';

export type PlanetFocusPinchState =
  | 'idle'
  | 'open'
  | 'closed'
  | 'released';

export interface PlanetFocusDebugSnapshot {
  focusedBody: string | null;
  controlState: PlanetFocusControlState;
  controlMode: PlanetFocusControlMode;
  activeHandKeys: string[];
  touchHandCount: number;
  touchDistancePx: number | null;
  touchHitRadiusPx: number | null;
  dwellMs: number;
  dwellRequiredMs: number;
  dwellMaxMs: number;
  screenPosition: {
    x: number;
    y: number;
  } | null;
  scaleMultiplier: number;
  pinchState: PlanetFocusPinchState;
  pinchDistancePx: number | null;
  pinchRatio: number | null;
  pinchTapHandKey: string | null;
  transitionReason: string;
}

export type PlanetReturnWaveState =
  | 'Inactive'
  | 'Arming'
  | 'Watching'
  | 'Sweeping'
  | 'Triggered';

export type PlanetReturnWaveCornerDirection =
  | 'upper-left'
  | 'upper-right';

export interface PlanetReturnWaveDebugSnapshot {
  state: PlanetReturnWaveState;
  handKey: string | null;
  /** Visible time for diagnostics only; it is not a return-intent gate. */
  handVisibleMs: number;
  /** Whether the active candidate has the required multi-frame evidence. */
  handReady: boolean;
  elapsedMs: number;
  stableFrames: number;
  /** Net sweep displacement in preview-short-side units. */
  displacement: number | null;
  /** Median of the most recent sweep speeds, in preview-short-sides per second. */
  medianSpeed: number | null;
  /** Net displacement divided by elapsed time, in preview-short-sides per second. */
  netSpeed: number | null;
  /** Net displacement divided by path length; 1 is a perfectly coherent direction. */
  coherence: number | null;
  /** Absolute horizontal component of the net sweep, in preview-short-side units. */
  horizontalDisplacement: number | null;
  /** Upward component of the net sweep, in preview-short-side units. */
  upwardDisplacement: number | null;
  /** Display-space corner targeted by the net sweep. */
  cornerDirection: PlanetReturnWaveCornerDirection | null;
  openHandScore: number | null;
  palmScaleRatio: number | null;
  /** Legacy schema field; the return detector now has one physical throw path. */
  triggerMode: null;
  score: number;
  triggered: boolean;
  reason: string;
  /** Maximum observed step speed, including a spatially validated tracking-gap bridge. */
  peakSpeed?: number | null;
  /** Candidate-start distance to the focused body, in preview-short-side units. */
  startDistanceToBody?: number | null;
  /** Candidate-end distance to the focused body, in preview-short-side units. */
  endDistanceToBody?: number | null;
  /** Recent end-of-stroke body-distance change; positive means the throw finishes moving away. */
  bodyDistanceTrend?: number | null;
  /** Focused-body hit radius, in preview-short-side units. */
  bodyHitRadius?: number | null;
}

export interface RenderFrameSnapshot {
  fps: number;
  deltaMs: number;
  deltaSeconds: number;
  renderMs: number | null;
  timestampMs: number;
  canvasSize: {
    width: number;
    height: number;
  };
}
