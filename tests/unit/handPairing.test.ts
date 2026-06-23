import { describe, expect, it } from 'vitest';
import {
  assignVisualHandPair,
  getVisualTrackedHandPair,
  sortVisualLeftRight,
} from '../../src/interaction/handPairing';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';

describe('visual hand pairing', () => {
  it('treats larger camera x as the visual-left hand in the mirrored preview', () => {
    const cameraRight = point(0.82, 0.48);
    const cameraLeft = point(0.18, 0.48);

    expect(sortVisualLeftRight(cameraLeft, cameraRight)).toEqual({
      left: cameraRight,
      right: cameraLeft,
    });
  });

  it('uses visual x order for a fresh two-hand tracking snapshot', () => {
    const lowerX = createHand({ center: point(0.24, 0.5), spread: 1.2 });
    const higherX = createHand({ center: point(0.76, 0.5), spread: 1.2 });
    const pair = getVisualTrackedHandPair(
      createTrackingSnapshot([lowerX, higherX]),
      null,
    );

    expect(pair?.left).toBe(higherX);
    expect(pair?.right).toBe(lowerX);
  });

  it('keeps a stable previous-pair assignment even when input order changes', () => {
    const previousPair = {
      left: point(0.78, 0.52),
      right: point(0.22, 0.52),
    };
    const visualRight = createHand({ center: point(0.24, 0.51), spread: 1.1 });
    const visualLeft = createHand({ center: point(0.76, 0.51), spread: 1.1 });

    const pair = assignVisualHandPair(visualRight, visualLeft, previousPair);

    expect(pair.left).toBe(visualLeft);
    expect(pair.right).toBe(visualRight);
  });

  it('flips the previous-pair assignment after the hands visibly cross', () => {
    const previousPair = {
      left: point(0.78, 0.52),
      right: point(0.22, 0.52),
    };
    const crossedToVisualRight = createHand({
      center: point(0.32, 0.52),
      spread: 1.1,
    });
    const crossedToVisualLeft = createHand({
      center: point(0.68, 0.52),
      spread: 1.1,
    });

    const pair = assignVisualHandPair(
      crossedToVisualRight,
      crossedToVisualLeft,
      previousPair,
    );

    expect(pair.left).toBe(crossedToVisualLeft);
    expect(pair.right).toBe(crossedToVisualRight);
  });
});
