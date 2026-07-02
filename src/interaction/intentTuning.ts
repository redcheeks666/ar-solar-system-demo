/**
 * Central tunable configuration for the whole-system interaction protocol.
 *
 * Every threshold and blend weight that gates a state transition, classifies an intent, or
 * combines a confidence score lives here instead of being inlined in `wholeSystemIntent.ts`.
 * This is the surface you adjust when debugging gesture behavior. Keep values here only;
 * do not reintroduce magic numbers into the scoring functions.
 */

// --- Control state machine -------------------------------------------------
export const CONTROL_ENTER_THRESHOLD = 0.7;
export const CONTROL_EXIT_THRESHOLD = 0.35;
export const RELEASE_CONFIRM_MS = 480;
export const RELEASE_STABLE_MS = 280;
export const REGRIP_STABLE_MS = 220;
export const COLLAPSE_STABLE_MS = 180;

// --- Collapse intent -------------------------------------------------------
export const COLLAPSE_ENTER_SCORE = 0.72;
export const COLLAPSE_EXIT_SCORE = 0.36;
export const COLLAPSE_DISTANCE_WEIGHT = 0.72;
export const COLLAPSE_INWARD_WEIGHT = 0.28;
export const COLLAPSE_INWARD_RELAXED_SCORE = 0.42;

// --- Release (fallback + cancel) -------------------------------------------
export const FALLBACK_RELEASE_CONFIDENCE = 0.78;
export const RELEASE_CANCEL_REGRIP_CONFIDENCE = 0.62;
export const RELEASE_CONFIDENCE_LOST_HAND = 0.28;
export const RELEASE_CONFIDENCE_ENDPOINT_MISS = 0.62;

// --- Open-hand release gesture ---------------------------------------------
export const RELEASE_OPEN_SCORE_THRESHOLD = 0.82;
export const RELEASE_GRIP_CANCEL_THRESHOLD = 0.44;
export const RELEASE_MIN_OPEN_FINGERS = 4;

// --- Opened-solar place-down (two-hand fist -> open) ------------------------
// Placing the opened solar system down in SolarHandleControl is a deliberate
// "both hands make a fist, then open again once" gesture. Both hands must clear
// the fist score to arm, then clear the open score (with enough extended
// fingers) to confirm the place-down. Kept separate from the legacy open-hand
// release thresholds above so tuning one does not move the other.
export const SOLAR_PLACE_DOWN_FIST_SCORE_MIN = 0.55;
export const SOLAR_PLACE_DOWN_OPEN_SCORE_MIN = 0.6;
export const SOLAR_PLACE_DOWN_OPEN_MIN_FINGERS = 3;

// --- Availability ----------------------------------------------------------
export const AVAILABILITY_LOST_HAND_SCORE = 0.55;

// --- Control confidence blend ----------------------------------------------
export const CONTROL_CONF_ENDPOINT_WEIGHT = 0.38;
export const CONTROL_CONF_AVAILABILITY_WEIGHT = 0.2;
export const CONTROL_CONF_TRACKING_WEIGHT = 0.14;
export const CONTROL_CONF_PALM_WEIGHT = 0.14;
export const CONTROL_CONF_BASE = 0.12;
export const CONTROL_CONF_INERTIA_WEIGHT = 0.06;
export const CONTROL_CONF_PALM_FLOOR = 0.45;
export const CONTROL_CONF_PALM_UP_FACTOR = 0.8;

// --- Re-grip confidence blend ----------------------------------------------
export const REGRIP_CONF_ENDPOINT_WEIGHT = 0.52;
export const REGRIP_CONF_AVAILABILITY_WEIGHT = 0.22;
export const REGRIP_CONF_TRACKING_WEIGHT = 0.12;
export const REGRIP_CONF_PALM_WEIGHT = 0.14;
export const REGRIP_CONF_PALM_FLOOR = 0.35;
export const REGRIP_CONF_PALM_UP_FACTOR = 0.75;
export const WIDE_MAGNET_MIN_REGRIP_CONFIDENCE = 0.62;

// --- Grip-hold protection --------------------------------------------------
export const GRIP_HOLD_MIN_ENDPOINT_SCORE = 0.22;
export const GRIP_HOLD_MIN_GRIP_SCORE = 0.24;
export const GRIP_HOLD_MAX_OPEN_FINGERS = 4;
export const GRIP_HOLD_MIN_PALM_UP = 0.44;
export const GRIP_HOLD_MIN_ROTATION = 0.18;

// --- Release-block reasons -------------------------------------------------
export const RELEASE_BLOCK_MIN_ENDPOINT_SCORE = 0.32;
export const ROTATION_HOLD_MIN_PALM_UP = 0.38;
export const ROTATION_HOLD_MIN_ROTATION_SCORE = 0.28;
export const CUPPED_GRIP_MIN_PALM_UP = 0.48;
export const CUPPED_GRIP_MIN_GRIP_SCORE = 0.24;
export const CUPPED_GRIP_MAX_OPEN_FINGERS = 5;
export const CUPPED_GRIP_MAX_OPEN_SCORE = 0.9;

// --- Scale intent ----------------------------------------------------------
export const SCALE_VELOCITY_DEADBAND = 0.025;
export const SCALE_VELOCITY_FULL_SCORE = 0.22;
export const SCALE_INTENT_MIN_SCORE = 0.18;
export const SCALE_MOVEMENT_WEIGHT = 0.78;
export const SCALE_PALM_FACING_WEIGHT = 0.22;

// --- Rotation intent -------------------------------------------------------
export const ROTATION_VELOCITY_DEADBAND = 0.9;
export const ROTATION_VELOCITY_FULL_SCORE = 3.4;
export const PALM_NORMAL_ROTATION_DEADBAND = 0.45;
export const PALM_NORMAL_ROTATION_FULL_SCORE = 2.4;
export const ROTATION_INTENT_MIN_SCORE = 0.18;
export const ROTATION_3D_POSTURE_THRESHOLD = 0.28;
export const ROTATION_PALM_MOTION_BASE = 0.62;
export const ROTATION_PALM_MOTION_POSTURE_WEIGHT = 0.38;
export const ROTATION_COMBINED_BASE = 0.72;
export const ROTATION_COMBINED_POSTURE_WEIGHT = 0.28;

// --- Spatial palm posture --------------------------------------------------
export const SPATIAL_PALM_FACING_PIVOT = 0.72;
export const SPATIAL_NOT_FACING_WEIGHT = 0.66;

// --- Pinch (separates whole-system control from planet pinch-grab) ----------
export const PINCH_RATIO_THRESHOLD = 0.2;
export const PINCH_PENALTY_BOTH = 0.28;
export const PINCH_PENALTY_SINGLE = 0.18;

// --- Hand-pose feature scoring (open-hand / grip-pose) ---------------------
export const FINGER_STRAIGHT_MIN = 0.45;
export const FINGER_STRAIGHT_MAX = 0.92;
export const FINGER_EXTENSION_MIN = 0.58;
export const FINGER_EXTENSION_MAX = 1.08;
export const FINGER_AWAY_MIN = 0.62;
export const FINGER_AWAY_MAX = 1.22;
export const FINGER_STRAIGHT_WEIGHT = 0.48;
export const FINGER_EXTENSION_WEIGHT = 0.34;
export const FINGER_AWAY_WEIGHT = 0.18;
export const FINGER_OPEN_THRESHOLD = 0.62;
export const FINGER_CURLED_THRESHOLD = 0.5;
export const THUMB_STRAIGHT_MIN = 0.35;
export const THUMB_STRAIGHT_MAX = 0.88;
export const THUMB_AWAY_MIN = 0.58;
export const THUMB_AWAY_MAX = 1.2;
export const THUMB_STRAIGHT_WEIGHT = 0.42;
export const THUMB_AWAY_WEIGHT = 0.58;
export const THUMB_OPEN_THRESHOLD = 0.62;
export const OPEN_HAND_FINGER_WEIGHT = 0.88;
export const OPEN_HAND_THUMB_WEIGHT = 0.12;
export const GRIP_POSE_OPEN_WEIGHT = 0.46;
export const GRIP_POSE_CURLED_WEIGHT = 0.54;
