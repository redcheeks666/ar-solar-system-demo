import { describe, expect, it } from 'vitest';
import { HandTrackingResultProcessor } from '../../src/tracking/handTracker';
import type { RawWorkerHand } from '../../src/tracking/handLandmarkerWorkerProtocol';
import { createHand, point } from '../helpers/syntheticHands';

function rawHand(
  x: number,
  side: RawWorkerHand['side'],
  score: number,
): RawWorkerHand {
  const hand = createHand({
    center: point(x, 0.5),
    spread: 1.2,
    worldLandmarks: Array.from({ length: 21 }, () => point(x, 0.5, 0.1)),
  });

  return {
    landmarks: hand.landmarks,
    worldLandmarks: hand.worldLandmarks,
    side,
    handednessScore: score,
  };
}

describe('HandTrackingResultProcessor', () => {
  it('keeps the existing main-thread visual pairing and world-landmark shape', () => {
    const processor = new HandTrackingResultProcessor();
    const snapshot = processor.process(
      [rawHand(0.3, 'right', 0.91), rawHand(0.7, 'left', 0.93)],
      120,
    );

    expect(snapshot.detectedHands).toBe(2);
    expect(snapshot.lastUpdatedAt).toBe(120);
    expect(snapshot.hands[0]?.center.x).toBeGreaterThan(0.5);
    expect(snapshot.hands[1]?.center.x).toBeLessThan(0.5);
    expect(snapshot.left?.handednessScore).toBe(0.93);
    expect(snapshot.right?.handednessScore).toBe(0.91);
    expect(snapshot.left?.worldLandmarks).toHaveLength(21);
  });

  it('resets pairing history when the Worker reports no hands', () => {
    const processor = new HandTrackingResultProcessor();
    processor.process([rawHand(0.7, 'left', 0.9)], 100);

    const empty = processor.process([], 133);
    expect(empty).toEqual({
      detectedHands: 0,
      left: null,
      right: null,
      hands: [],
      lastUpdatedAt: 133,
    });

    const reacquired = processor.process([rawHand(0.3, 'right', 0.8)], 166);
    expect(reacquired.detectedHands).toBe(1);
    expect(reacquired.right).not.toBeNull();
  });
});
