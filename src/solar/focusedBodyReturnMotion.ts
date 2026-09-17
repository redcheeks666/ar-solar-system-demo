import type { PlanetReturnWaveDebugSnapshot } from '../utils/types';
import {
  getFocusedBodyReturnThrowStrength,
  type FocusedBodyReturnMotion,
} from './focusedCelestialBody';

export type PlanetReturnWaveMotionInput = Pick<
  PlanetReturnWaveDebugSnapshot,
  | 'cornerDirection'
  | 'horizontalDisplacement'
  | 'upwardDisplacement'
  | 'peakSpeed'
>;

export function createFocusedBodyReturnMotionFromWave(
  snapshot: PlanetReturnWaveMotionInput | null,
): FocusedBodyReturnMotion | null {
  if (
    !snapshot?.cornerDirection ||
    snapshot.horizontalDisplacement === null ||
    snapshot.upwardDisplacement === null ||
    !Number.isFinite(snapshot.horizontalDisplacement) ||
    !Number.isFinite(snapshot.upwardDisplacement)
  ) {
    return null;
  }

  const horizontalSign =
    snapshot.cornerDirection === 'left' ||
    snapshot.cornerDirection.endsWith('-left')
      ? -1
      : 1;
  const x = horizontalSign * snapshot.horizontalDisplacement;
  // The detector exposes a positive upward component even though display-space
  // y grows downward, so it maps directly to positive world y.
  const y = snapshot.upwardDisplacement;
  const length = Math.hypot(x, y);
  if (length <= 0.000001) {
    return null;
  }

  return {
    throwDirection: {
      x: x / length,
      y: y / length,
      z: 0,
    },
    throwStrength: getFocusedBodyReturnThrowStrength(
      snapshot.peakSpeed ?? null,
    ),
  };
}
