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
  | 'BodyHover'
  | 'BodyGrabbed'
  | 'BodyDetached'
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
  landmarks: NormalizedPoint[];
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
  bothHandsVisible: boolean;
  lostHandHoldActive: boolean;
  handsClosed: boolean;
  pullArmed: boolean;
}

export interface DebugSnapshot {
  fps: number;
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
  hoveredBody: string | null;
  grabbedBody: string | null;
  pinchState: string;
  throwVelocity: number | null;
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

export interface RenderFrameSnapshot {
  fps: number;
  canvasSize: {
    width: number;
    height: number;
  };
}
