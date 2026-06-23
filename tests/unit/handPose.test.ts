import { describe, it, expect } from 'vitest';
import {
  computeHandPoseIntent,
  computeReleaseGesture,
} from '../../src/interaction/handPose';
import { createHand, point } from '../helpers/syntheticHands';

const openHand = createHand({ center: point(0.5, 0.5), spread: 2.4 });
const fist = createHand({ center: point(0.5, 0.5), spread: 0.08 });

describe('computeHandPoseIntent', () => {
  it('scores an open hand as open and release-ready', () => {
    const pose = computeHandPoseIntent(openHand);
    expect(pose.openHandScore ?? 0).toBeGreaterThan(0.7);
    expect(pose.openFingerCount).toBeGreaterThanOrEqual(4);
    expect(pose.releaseReady).toBe(true);
  });

  it('scores a fist as not open, more gripped, and not release-ready', () => {
    const open = computeHandPoseIntent(openHand);
    const closed = computeHandPoseIntent(fist);
    expect(closed.openHandScore ?? 1).toBeLessThan(open.openHandScore ?? 0);
    expect(closed.gripPoseScore ?? 0).toBeGreaterThan(open.gripPoseScore ?? 0);
    expect(closed.releaseReady).toBe(false);
  });
});

describe('computeReleaseGesture', () => {
  it('is active only when both hands are open', () => {
    const openPose = computeHandPoseIntent(openHand);
    const fistPose = computeHandPoseIntent(fist);
    expect(computeReleaseGesture(openPose, openPose).active).toBe(true);
    expect(computeReleaseGesture(fistPose, fistPose).active).toBe(false);
    expect(computeReleaseGesture(openPose, fistPose).active).toBe(false);
  });
});
