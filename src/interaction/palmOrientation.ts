import { clamp01, cross, normalize, subtract } from '../utils/math';
import type {
  NormalizedPoint,
  PalmOrientationSnapshot,
  TrackedHand,
} from '../utils/types';
import {
  INDEX_MCP_INDEX,
  MIDDLE_MCP_INDEX,
  PINKY_MCP_INDEX,
  WRIST_INDEX,
} from './handLandmarks';

/**
 * Palm orientation primitives derived from MediaPipe hand landmarks.
 *
 * The palm normal feeds facing-camera / palms-up intent confidence only; it is never a hard
 * gate, because normal webcam palm normals are noisy. Pure functions with no cross-frame state.
 */
export function computePalmOrientation(hand: TrackedHand): PalmOrientationSnapshot {
  const wrist = hand.landmarks[WRIST_INDEX];
  const indexMcp = hand.landmarks[INDEX_MCP_INDEX];
  const middleMcp = hand.landmarks[MIDDLE_MCP_INDEX];
  const pinkyMcp = hand.landmarks[PINKY_MCP_INDEX];

  if (!wrist || !indexMcp || !middleMcp || !pinkyMcp) {
    return createEmptyPalm();
  }

  const palmAcross = subtract(pinkyMcp, indexMcp);
  const palmLength = subtract(middleMcp, wrist);
  const normal = normalize(cross(palmAcross, palmLength));

  if (!normal) {
    return createEmptyPalm();
  }

  return {
    normal,
    facingCameraScore: clamp01(Math.abs(normal.z)),
    upScore: clamp01(Math.abs(normal.y)),
  };
}

export function averagePalmNormal(
  leftNormal: NormalizedPoint | null,
  rightNormal: NormalizedPoint | null,
): NormalizedPoint | null {
  if (!leftNormal && !rightNormal) {
    return null;
  }

  if (!leftNormal) {
    return rightNormal;
  }

  if (!rightNormal) {
    return leftNormal;
  }

  return normalize({
    x: (leftNormal.x + rightNormal.x) / 2,
    y: (leftNormal.y + rightNormal.y) / 2,
    z: (leftNormal.z + rightNormal.z) / 2,
  });
}

export function createEmptyPalm(): PalmOrientationSnapshot {
  return {
    normal: null,
    facingCameraScore: null,
    upScore: null,
  };
}
