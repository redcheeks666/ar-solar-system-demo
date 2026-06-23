import type { TrackedHand, TrackingSnapshot } from '../../src/utils/types';

/** Build a ready TrackingSnapshot from 0-2 tracked hands (pose left empty). */
export function createTrackingSnapshot(hands: TrackedHand[]): TrackingSnapshot {
  return {
    status: 'ready',
    error: null,
    pose: {
      detected: false,
      leftShoulder: null,
      rightShoulder: null,
      landmarks: [],
      lastUpdatedAt: null,
    },
    hands: {
      detectedHands: hands.length,
      left: hands[0] ?? null,
      right: hands[1] ?? null,
      hands,
      lastUpdatedAt: null,
    },
    lastUpdatedAt: null,
  };
}
