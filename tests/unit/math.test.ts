import { describe, expect, it } from 'vitest';
import {
  average,
  averageNullable,
  averagePoints,
  clamp,
  clamp01,
  cosineSimilarity,
  cross,
  distance2d,
  distance3d,
  inverseLerp,
  lerp,
  normalize,
  subtract,
  unwrapAngle,
} from '../../src/utils/math';
import { point } from '../helpers/syntheticHands';

describe('scalar math helpers', () => {
  it('clamps values to explicit and unit ranges', () => {
    expect(clamp(-2, 0, 1)).toBe(0);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.25)).toBe(0.25);
    expect(clamp01(1.5)).toBe(1);
  });

  it('linearly interpolates and extrapolates without clamping alpha', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerp(10, 20, 1.5)).toBe(25);
  });

  it('inverse lerp clamps to [0, 1] and handles equal endpoints as a step', () => {
    expect(inverseLerp(10, 20, 5)).toBe(0);
    expect(inverseLerp(10, 20, 15)).toBe(0.5);
    expect(inverseLerp(10, 20, 25)).toBe(1);
    expect(inverseLerp(10, 10, 9.99)).toBe(0);
    expect(inverseLerp(10, 10, 10)).toBe(1);
  });

  it('averages nullable values using the existing single-sided fallback behavior', () => {
    expect(average(4, 8)).toBe(6);
    expect(averageNullable(null, null)).toBe(0);
    expect(averageNullable(4, null)).toBe(4);
    expect(averageNullable(null, 8)).toBe(8);
    expect(averageNullable(4, 8)).toBe(6);
  });
});

describe('vector math helpers', () => {
  it('averages points and computes 2D/3D distances', () => {
    expect(averagePoints([point(0, 0, 0), point(2, 4, 6)])).toEqual(
      point(1, 2, 3),
    );
    expect(distance2d(point(0, 0), point(3, 4))).toBe(5);
    expect(distance3d(point(0, 0, 0), point(2, 3, 6))).toBe(7);
  });

  it('subtracts and crosses plain landmark-style points', () => {
    expect(subtract(point(4, 3, 2), point(1, 1, 5))).toEqual(point(3, 2, -3));
    expect(cross(point(1, 0, 0), point(0, 1, 0))).toEqual(point(0, 0, 1));
  });

  it('normalizes nonzero vectors and returns null for near-zero vectors', () => {
    expect(normalize(point(3, 4, 0))).toEqual(point(0.6, 0.8, 0));
    expect(normalize(point(0, 0, 0))).toBeNull();
    expect(normalize(point(0.000001, 0, 0))).toBeNull();
  });

  it('returns clamped cosine similarity and treats zero vectors as unrelated', () => {
    expect(cosineSimilarity(point(1, 0, 0), point(1, 0, 0))).toBe(1);
    expect(cosineSimilarity(point(1, 0, 0), point(0, 1, 0))).toBe(0);
    expect(cosineSimilarity(point(1, 0, 0), point(-1, 0, 0))).toBe(0);
    expect(cosineSimilarity(point(0, 0, 0), point(1, 0, 0))).toBe(0);
  });

  it('unwraps one turn when an angle crosses the +/-PI boundary', () => {
    expect(unwrapAngle(Math.PI + 0.25)).toBeCloseTo(-Math.PI + 0.25);
    expect(unwrapAngle(-Math.PI - 0.25)).toBeCloseTo(Math.PI - 0.25);
    expect(unwrapAngle(0.75)).toBe(0.75);
  });
});
