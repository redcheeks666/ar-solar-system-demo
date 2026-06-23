import { describe, it, expect } from 'vitest';
import {
  GestureInputFramePairer,
  buildTrackedHand,
} from '../../src/interaction/gestureInputFrame';
import { createHand, point } from '../helpers/syntheticHands';

describe('buildTrackedHand', () => {
  it('builds a hand from landmarks and returns null when landmarks are missing', () => {
    const hand = createHand({ center: point(0.5, 0.5), spread: 1.2 });
    const built = buildTrackedHand(hand.landmarks, 'left', 0.9);

    expect(built).not.toBeNull();
    expect(built!.palmScale).toBeGreaterThan(0);
    expect(buildTrackedHand([], 'left', 0.9)).toBeNull();
  });
});

describe('GestureInputFramePairer (pairing before smoothing)', () => {
  const leftHand = () => createHand({ center: point(0.7, 0.5), spread: 1.2 });
  const rightHand = () => createHand({ center: point(0.3, 0.5), spread: 1.2 });

  it('keeps visual-left identity when MediaPipe array order / handedness flips', () => {
    const pairer = new GestureInputFramePairer();

    // Lock identity over a few stable frames.
    for (let i = 0; i < 3; i += 1) {
      pairer.stabilize([leftHand(), rightHand()]);
    }

    // Flip the array order every frame (as MediaPipe order/handedness can), same positions.
    const visualLeftX: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const hands = i % 2 === 0 ? [rightHand(), leftHand()] : [leftHand(), rightHand()];
      const [visualLeft] = pairer.stabilize(hands);
      visualLeftX.push(visualLeft.center.x);
    }

    // The visual-left slot must keep tracking the x≈0.7 hand regardless of array order.
    for (const x of visualLeftX) {
      expect(x).toBeGreaterThan(0.55);
    }
  });

  it('returns no hands and resets when there are no raw hands', () => {
    const pairer = new GestureInputFramePairer();
    pairer.stabilize([leftHand(), rightHand()]);
    expect(pairer.stabilize([])).toEqual([]);
  });
});
