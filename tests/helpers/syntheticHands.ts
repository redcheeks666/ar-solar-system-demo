import type { NormalizedPoint, TrackedHand } from '../../src/utils/types';

// Synthetic hand builders, extracted from scripts/verify-m5_5-solar-inspection.ts so the
// verification script and the Vitest suites share one source of truth for fake landmarks.

export function point(x: number, y: number, z = 0): NormalizedPoint {
  return { x, y, z };
}

/**
 * Build a 21-landmark TrackedHand around `center`. `spread` controls finger extension:
 * `spread <= 0.2` curls into a fist, larger values open the hand outward.
 */
export function createHand(input: {
  center: NormalizedPoint;
  spread: number;
  worldLandmarks?: NormalizedPoint[] | null;
}): TrackedHand {
  const { center, spread } = input;
  const palmScale = 0.1;
  const curled = spread <= 0.2;
  const landmarks = Array.from({ length: 21 }, () => point(center.x, center.y, center.z));
  const bases = [
    { mcp: 5, pip: 6, tip: 8, offset: -0.045 },
    { mcp: 9, pip: 10, tip: 12, offset: -0.015 },
    { mcp: 13, pip: 14, tip: 16, offset: 0.015 },
    { mcp: 17, pip: 18, tip: 20, offset: 0.045 },
  ];

  landmarks[0] = point(center.x, center.y + 0.06, center.z);
  landmarks[1] = point(center.x - 0.035, center.y + 0.02, center.z);
  landmarks[2] = curled
    ? point(center.x - 0.025, center.y + 0.025, center.z)
    : point(center.x - 0.055, center.y - spread * 0.01, center.z);
  landmarks[4] = curled
    ? point(center.x - 0.005, center.y + 0.035, center.z)
    : point(center.x - 0.075, center.y - spread * 0.045, center.z);

  for (const finger of bases) {
    const baseX = center.x + finger.offset;
    landmarks[finger.mcp] = point(baseX, center.y, center.z);
    landmarks[finger.pip] = curled
      ? point(baseX, center.y + 0.026, center.z)
      : point(baseX, center.y - spread * 0.035, center.z);
    landmarks[finger.tip] = curled
      ? point(center.x + finger.offset * 0.35, center.y + 0.016, center.z)
      : point(baseX, center.y - spread * 0.075, center.z);
  }

  return {
    side: 'unknown',
    handednessScore: 1,
    center,
    wrist: landmarks[0],
    thumbTip: landmarks[4],
    indexFingerTip: landmarks[8],
    palmScale,
    landmarks,
    worldLandmarks: input.worldLandmarks ?? null,
  };
}
