import type { NormalizedPoint, TrackedHand, TrackingSnapshot } from '../utils/types';
import { distance2d } from '../utils/math';

/**
 * Single source of truth for visual-left / visual-right hand assignment.
 *
 * Visual-left = the hand the user sees on the LEFT of the mirrored camera preview.
 * Because the preview is mirrored (`transform: scaleX(-1)`), that corresponds to the
 * LARGER camera-frame x. Every gesture module must use this one convention so that
 * debug read-outs, virtual endpoints, and (in M4) 3D endpoints all agree. Do NOT
 * confuse this with MediaPipe handedness labels.
 */
export interface TrackedHandPair {
  left: TrackedHand;
  right: TrackedHand;
}

export interface PointPair {
  left: NormalizedPoint;
  right: NormalizedPoint;
}

export function sortVisualLeftRight<T extends NormalizedPoint>(
  first: T,
  second: T,
): { left: T; right: T } {
  return first.x >= second.x
    ? { left: first, right: second }
    : { left: second, right: first };
}

export function assignVisualHandPair(
  first: TrackedHand,
  second: TrackedHand,
  previousPair: PointPair | null,
): TrackedHandPair {
  if (!previousPair) {
    return first.center.x >= second.center.x
      ? { left: first, right: second }
      : { left: second, right: first };
  }

  const directCost =
    distance2d(first.center, previousPair.left) +
    distance2d(second.center, previousPair.right);
  const swappedCost =
    distance2d(first.center, previousPair.right) +
    distance2d(second.center, previousPair.left);

  return directCost <= swappedCost
    ? { left: first, right: second }
    : { left: second, right: first };
}

export function getVisualTrackedHandPair(
  tracking: TrackingSnapshot,
  previousPair: PointPair | null,
): TrackedHandPair | null {
  const [first, second] = tracking.hands.hands;

  if (first && second) {
    return assignVisualHandPair(first, second, previousPair);
  }

  if (tracking.hands.left && tracking.hands.right) {
    return assignVisualHandPair(
      tracking.hands.left,
      tracking.hands.right,
      previousPair,
    );
  }

  return null;
}
