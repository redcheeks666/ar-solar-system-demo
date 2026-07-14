const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

export const AE_RIFT_BORDER_SOURCE_WIDTH = 1500;
export const AE_RIFT_BORDER_SOURCE_HEIGHT = 600;
export const AE_RIFT_VERTICAL_TILT_DEGREES = 66.66;

export const UNIVERSE_RIFT_WIDTH = 10.5;
export const UNIVERSE_RIFT_HEIGHT = 9.2;
export const UNIVERSE_RIFT_BACKGROUND_OPACITY = 0.8;
// Overview background presentation only: rift/starfield/nebula, edge sparks, stardust/trails,
// and the DOM room glow render at 68% of their previous alpha. Celestial bodies, Saturn's ring,
// orbit lines, labels, and control endpoints do not consume this value and remain unchanged.
export const SOLAR_BACKGROUND_OPACITY_SCALE = 0.68;

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

// Rift edge shader tuning. Length-like values are fractions of the rift
// plane width so the band reads with the same thickness all around the rim.
export const RIFT_EDGE_FEATHER = 0.02;
export const RIFT_EDGE_NOISE_AMPLITUDE = 0.022;
export const RIFT_EDGE_NOISE_SCALE = 3.4;
export const RIFT_EDGE_NOISE_SPEED = 0.14;
export const RIFT_EDGE_GLOW_WIDTH = 0.014;
export const RIFT_EDGE_GLOW_INTENSITY = 1.25;
export const RIFT_EDGE_GLOW_CYAN = '#7fd8ff';
export const RIFT_EDGE_GLOW_GOLD = '#ffd47c';
export const RIFT_EDGE_BREATHE_SPEED = 1.6;
// Extra glow / boundary wobble while the rift is still being pulled open.
export const RIFT_EDGE_OPENING_GLOW_BOOST = 0.9;
export const RIFT_EDGE_OPENING_WOBBLE_BOOST = 1.2;

// Exponential time constant for easing the focus dim in/out instead of snapping.
export const FOCUS_DIM_EASE_SECONDS = 0.16;

// The rift tear: the shader ellipse grows from a thin seam into the full
// ellipse as opening progress advances, so the boundary itself is the crack.
export const RIFT_REVEAL_PROGRESS_START = 0.02;
export const RIFT_REVEAL_PROGRESS_END = 0.42;
export const RIFT_APERTURE_HORIZONTAL_START = 0.5;
export const RIFT_APERTURE_HORIZONTAL_PROGRESS_START = 0.02;
export const RIFT_APERTURE_HORIZONTAL_PROGRESS_END = 0.6;
export const RIFT_APERTURE_VERTICAL_START = 0.045;
export const RIFT_APERTURE_VERTICAL_PROGRESS_START = 0.06;
export const RIFT_APERTURE_VERTICAL_PROGRESS_END = 0.9;
