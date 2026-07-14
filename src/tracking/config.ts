// Self-hosted copies synced by scripts/sync-mediapipe-assets.mjs (predev /
// prebuild), so the demo never depends on CDNs at runtime.
export const MEDIAPIPE_WASM_URL = '/mediapipe/wasm';

export const HAND_LANDMARKER_MODEL_URL = '/mediapipe/models/hand_landmarker.task';

export const HAND_LANDMARKER_NUM_HANDS = 2;
export const MIN_HAND_DETECTION_CONFIDENCE = 0.35;
export const MIN_HAND_PRESENCE_CONFIDENCE = 0.35;
export const MIN_HAND_TRACKING_CONFIDENCE = 0.4;

export const POSE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

// Pose (shoulder) landmarks currently drive no interaction logic — startup,
// whole-system position/scale control, and free-hover are all hand-only. The
// whole-system overview angle is fixed. Running the pose model every frame just
// steals CPU from hand tracking and hurts gesture stability, so it is disabled
// by default. Flip ENABLE_POSE_TRACKING to true (it will run throttled) when
// M4+ actually uses body-relative placement.
export const ENABLE_POSE_TRACKING = false;
export const POSE_DETECTION_INTERVAL_MS = 250;
