import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three';
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

// Reused across calls so per-frame mapping does not allocate. The plane normal is fixed to +Z;
// only its `constant` is updated per call to represent the plane z = planeZ.
const raycaster = new Raycaster();
const ndcPoint = new Vector2();
const intersectionTarget = new Vector3();
const interactionPlane = new Plane(new Vector3(0, 0, 1), 0);

/**
 * Map a normalized point to a world position on the interaction plane (z = planeZ) so that it
 * projects exactly onto its on-screen pixel.
 *
 * Uses three's Raycaster to invert the camera's actual projection + view matrices, so it stays
 * correct for any camera pose (position / rotation / fov) instead of assuming a fixed,
 * axis-aligned camera. Returns null when the layout has no size or the ray never meets the plane
 * (camera looking parallel to it).
 */
export function mapNormalizedToWorld(
  point: NormalizedPoint,
  layout: PreviewLayout,
  camera: Camera,
  planeZ: number,
): Vec3 | null {
  if (layout.stageWidth <= 0 || layout.stageHeight <= 0) {
    return null;
  }

  const pixel = mapNormalizedToStagePixel(point, layout);
  ndcPoint.set(
    (pixel.x / layout.stageWidth) * 2 - 1,
    1 - (pixel.y / layout.stageHeight) * 2,
  );
  raycaster.setFromCamera(ndcPoint, camera);
  interactionPlane.constant = -planeZ;

  const hit = raycaster.ray.intersectPlane(interactionPlane, intersectionTarget);

  if (!hit) {
    return null;
  }

  return { x: hit.x, y: hit.y, z: hit.z };
}
