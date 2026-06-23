import { describe, it, expect } from 'vitest';
import { isFreshTrackingFrame } from '../../src/interaction/freshFrameGate';
import { HandPrimitiveController } from '../../src/interaction/handPrimitives';
import type { TrackingSnapshot } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

function frameAtDistance(distance: number, lastUpdatedAt: number): TrackingSnapshot {
  const half = distance / 2;
  const snapshot = createTrackingSnapshot([
    createHand({ center: point(0.5 + half, 0.5), spread: 1.2 }),
    createHand({ center: point(0.5 - half, 0.5), spread: 1.2 }),
  ]);
  return {
    ...snapshot,
    lastUpdatedAt,
    hands: { ...snapshot.hands, lastUpdatedAt },
  };
}

describe('isFreshTrackingFrame', () => {
  it('passes only when the detection timestamp changes', () => {
    expect(isFreshTrackingFrame(100, null)).toBe(true);
    expect(isFreshTrackingFrame(100, 100)).toBe(false); // stale render frame, same detection
    expect(isFreshTrackingFrame(133, 100)).toBe(true);
    expect(isFreshTrackingFrame(null, 100)).toBe(false); // tracking not ready
  });
});

describe('stale-frame gating does not inject zero-velocity frames', () => {
  const thresholds = DEFAULT_GESTURE_THRESHOLDS;

  it('a duplicate frame drags pull velocity down, which the gate prevents', () => {
    // Without the gate: the render loop re-delivers the same detection (same lastUpdatedAt) with
    // an advanced timestamp, so distance velocity reads near zero on those stale frames.
    const ungated = new HandPrimitiveController();
    ungated.update(frameAtDistance(0.2, 0), thresholds, 0);
    const movedVel =
      ungated.update(frameAtDistance(0.26, 33), thresholds, 33).distanceVelocity ?? 0;
    const staleVel =
      ungated.update(frameAtDistance(0.26, 33), thresholds, 49).distanceVelocity ?? 0;

    expect(movedVel).toBeGreaterThan(0.5);
    expect(staleVel).toBeLessThan(movedVel);

    // With the gate: the duplicate frame is dropped, so velocity stays responsive.
    const gated = new HandPrimitiveController();
    let lastProcessedAt: number | null = null;
    let gatedVel = 0;
    const schedule: ReadonlyArray<readonly [number, number]> = [
      [0.2, 0],
      [0.26, 33],
      [0.26, 33], // stale duplicate — must be gated out
    ];

    for (const [distance, detectionAt] of schedule) {
      const frame = frameAtDistance(distance, detectionAt);
      if (isFreshTrackingFrame(frame.lastUpdatedAt, lastProcessedAt)) {
        lastProcessedAt = frame.lastUpdatedAt;
        gatedVel = gated.update(frame, thresholds, detectionAt).distanceVelocity ?? 0;
      }
    }

    expect(gatedVel).toBeGreaterThan(0.5);
  });
});
