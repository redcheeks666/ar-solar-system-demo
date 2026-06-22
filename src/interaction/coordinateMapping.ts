import type { NormalizedPoint } from '../utils/types';

/**
 * Single source of truth for mapping normalized MediaPipe coordinates to the on-screen
 * preview and to the Three.js interaction plane.
 *
 * The preview is a 16:9 stage where the video uses `object-fit: contain` and is mirrored
 * (`transform: scaleX(-1)`). The WebGL/landmark canvases are NOT CSS-mirrored, so the
 * mirror is applied here in math instead. Both the debug landmark overlay and (in M4) the
 * 3D solar-system endpoints must map through this module so that hands, virtual endpoints,
 * and 3D content stay pixel-aligned regardless of camera aspect ratio.
 */
export interface PreviewLayout {
  /** Displayed preview-stage / canvas width in CSS pixels. */
  stageWidth: number;
  /** Displayed preview-stage / canvas height in CSS pixels. */
  stageHeight: number;
  /** Raw camera frame width (`video.videoWidth`); 0 when not yet known. */
  sourceWidth: number;
  /** Raw camera frame height (`video.videoHeight`); 0 when not yet known. */
  sourceHeight: number;
  /** Whether the preview is mirrored for selfie view. */
  mirrored: boolean;
}

export interface PerspectiveViewport {
  fovDegrees: number;
  cameraZ: number;
  planeZ: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * The rectangle (in stage pixels) actually covered by the camera image under
 * `object-fit: contain`. Falls back to the full stage when sizes are unknown.
 */
export function computeContainRect(layout: PreviewLayout): Rect {
  const { stageWidth, stageHeight, sourceWidth, sourceHeight } = layout;

  if (stageWidth <= 0 || stageHeight <= 0 || sourceWidth <= 0 || sourceHeight <= 0) {
    return {
      x: 0,
      y: 0,
      width: Math.max(stageWidth, 0),
      height: Math.max(stageHeight, 0),
    };
  }

  const stageAspect = stageWidth / stageHeight;
  const sourceAspect = sourceWidth / sourceHeight;

  if (sourceAspect > stageAspect) {
    // Source is wider than the stage: letterbox top/bottom.
    const height = stageWidth / sourceAspect;
    return { x: 0, y: (stageHeight - height) / 2, width: stageWidth, height };
  }

  // Source is taller/narrower than the stage: pillarbox left/right.
  const width = stageHeight * sourceAspect;
  return { x: (stageWidth - width) / 2, y: 0, width, height: stageHeight };
}

/** Map a normalized point to displayed stage pixels (mirror + contain aware). */
export function mapNormalizedToStagePixel(
  point: NormalizedPoint,
  layout: PreviewLayout,
): { x: number; y: number } {
  const rect = computeContainRect(layout);
  const mirroredX = layout.mirrored ? 1 - point.x : point.x;

  return {
    x: rect.x + mirroredX * rect.width,
    y: rect.y + point.y * rect.height,
  };
}

/**
 * Map a normalized point to a world position on the interaction plane so that it projects
 * exactly onto its on-screen pixel for the given perspective camera.
 */
export function mapNormalizedToWorld(
  point: NormalizedPoint,
  layout: PreviewLayout,
  viewport: PerspectiveViewport,
): Vec3 {
  const pixel = mapNormalizedToStagePixel(point, layout);
  const ndcX = layout.stageWidth > 0 ? (pixel.x / layout.stageWidth) * 2 - 1 : 0;
  const ndcY = layout.stageHeight > 0 ? 1 - (pixel.y / layout.stageHeight) * 2 : 0;
  const aspect = layout.stageHeight > 0 ? layout.stageWidth / layout.stageHeight : 1;
  const distance = viewport.cameraZ - viewport.planeZ;
  const halfHeight = Math.tan((viewport.fovDegrees * Math.PI) / 360) * distance;
  const halfWidth = halfHeight * aspect;

  return {
    x: ndcX * halfWidth,
    y: ndcY * halfHeight,
    z: viewport.planeZ,
  };
}
