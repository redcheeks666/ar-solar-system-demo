import { describe, expect, it } from 'vitest';
import {
  averagePalmNormal,
  computePalmOrientation,
  createEmptyPalm,
} from '../../src/interaction/palmOrientation';
import {
  INDEX_MCP_INDEX,
  MIDDLE_MCP_INDEX,
  PINKY_MCP_INDEX,
  WRIST_INDEX,
} from '../../src/interaction/handLandmarks';
import type { TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';

function palmUpHand(): TrackedHand {
  const hand = createHand({ center: point(0.5, 0.5), spread: 1.2 });
  const landmarks = [...hand.landmarks];
  landmarks[WRIST_INDEX] = point(0.5, 0.5, 0);
  landmarks[INDEX_MCP_INDEX] = point(0.45, 0.5, 0);
  landmarks[PINKY_MCP_INDEX] = point(0.55, 0.5, 0);
  landmarks[MIDDLE_MCP_INDEX] = point(0.5, 0.5, 0.08);

  return { ...hand, landmarks };
}

describe('computePalmOrientation', () => {
  it('scores the shared synthetic hand as facing the camera', () => {
    const palm = computePalmOrientation(
      createHand({ center: point(0.5, 0.5), spread: 1.2 }),
    );

    expect(palm.normal).not.toBeNull();
    expect(Math.abs(palm.normal!.z)).toBeCloseTo(1);
    expect(palm.facingCameraScore).toBe(1);
    expect(palm.upScore).toBe(0);
  });

  it('scores a palm-up synthetic landmark plane with high upScore', () => {
    const palm = computePalmOrientation(palmUpHand());

    expect(palm.normal).not.toBeNull();
    expect(Math.abs(palm.normal!.y)).toBeCloseTo(1);
    expect(palm.facingCameraScore).toBe(0);
    expect(palm.upScore).toBe(1);
  });

  it('returns an empty palm when required landmarks are missing or degenerate', () => {
    const hand = createHand({ center: point(0.5, 0.5), spread: 1.2 });
    expect(computePalmOrientation({ ...hand, landmarks: [] })).toEqual(createEmptyPalm());

    const flatLandmarks = [...hand.landmarks];
    flatLandmarks[WRIST_INDEX] = point(0.5, 0.5, 0);
    flatLandmarks[INDEX_MCP_INDEX] = point(0.5, 0.5, 0);
    flatLandmarks[PINKY_MCP_INDEX] = point(0.5, 0.5, 0);
    flatLandmarks[MIDDLE_MCP_INDEX] = point(0.5, 0.5, 0);
    expect(computePalmOrientation({ ...hand, landmarks: flatLandmarks })).toEqual(
      createEmptyPalm(),
    );
  });
});

describe('averagePalmNormal', () => {
  it('passes through the single available normal and returns null when both are missing', () => {
    const normal = point(0, 1, 0);

    expect(averagePalmNormal(null, null)).toBeNull();
    expect(averagePalmNormal(normal, null)).toBe(normal);
    expect(averagePalmNormal(null, normal)).toBe(normal);
  });

  it('normalizes the average of two available palm normals', () => {
    const averaged = averagePalmNormal(point(1, 0, 0), point(0, 1, 0));

    expect(averaged).not.toBeNull();
    expect(averaged!.x).toBeCloseTo(Math.SQRT1_2);
    expect(averaged!.y).toBeCloseTo(Math.SQRT1_2);
    expect(averaged!.z).toBe(0);
  });
});
