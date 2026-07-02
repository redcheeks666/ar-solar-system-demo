const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

export const AE_RIFT_BORDER_SOURCE_WIDTH = 1500;
export const AE_RIFT_BORDER_SOURCE_HEIGHT = 600;
export const AE_RIFT_VERTICAL_TILT_DEGREES = 66.66;

export const UNIVERSE_RIFT_WIDTH = 10.5;
export const UNIVERSE_RIFT_HEIGHT = 9.2;
export const UNIVERSE_RIFT_BACKGROUND_OPACITY = 0.8;

const AE_RIFT_PROJECTED_HEIGHT_RATIO =
  (AE_RIFT_BORDER_SOURCE_HEIGHT / AE_RIFT_BORDER_SOURCE_WIDTH) *
  Math.cos(degreesToRadians(AE_RIFT_VERTICAL_TILT_DEGREES));
const RUNTIME_RIFT_SOURCE_HEIGHT_RATIO =
  UNIVERSE_RIFT_HEIGHT / UNIVERSE_RIFT_WIDTH;

// Screen-space position Y is vertical, but the overview disk's vertical
// pitch/ellipse compression is a rotation around the horizontal X axis.
// The AE slider value is applied to an already flattened 1500x600 ellipse, so
// the runtime 3D pitch must be the equivalent angle for this rift's base size.
export const SOLAR_SYSTEM_PREVIEW_TILT_X_DEGREES = -radiansToDegrees(
  Math.acos(AE_RIFT_PROJECTED_HEIGHT_RATIO / RUNTIME_RIFT_SOURCE_HEIGHT_RATIO),
);
export const SOLAR_SYSTEM_PREVIEW_TILT_X = degreesToRadians(
  SOLAR_SYSTEM_PREVIEW_TILT_X_DEGREES,
);
// Keep this as only a tiny yaw, not the user-approved vertical pitch.
export const SOLAR_SYSTEM_PREVIEW_TILT_Y = 0.08;
