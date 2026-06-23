import { describe, it, expect } from 'vitest';
import { computeHandPoseIntent } from '../../src/interaction/handPose';
import type { TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';

describe('hand-shape prefers world landmarks when available', () => {
  it('open-hand scoring follows world landmarks even if image landmarks look like a fist', () => {
    const imageFist = createHand({ center: point(0.5, 0.5), spread: 0.08 });
    const worldOpen = createHand({ center: point(0.5, 0.5), spread: 2.4 });

    // Image landmarks read as a fist, but the (more reliable) world landmarks read as an open hand.
    const handWithWorld: TrackedHand = {
      ...imageFist,
      worldLandmarks: worldOpen.landmarks,
    };

    expect(computeHandPoseIntent(handWithWorld).releaseReady).toBe(true);

    // Control: the same image fist with no world landmarks falls back to image and stays closed.
    expect(computeHandPoseIntent({ ...imageFist, worldLandmarks: null }).releaseReady).toBe(false);
  });
});
