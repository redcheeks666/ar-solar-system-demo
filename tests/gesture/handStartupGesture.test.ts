import { describe, it, expect } from 'vitest';
import { HandStartupGestureController } from '../../src/interaction/handStartupGesture';
import type { InteractionState } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

function handsAtDistance(distance: number) {
  const half = distance / 2;
  return createTrackingSnapshot([
    createHand({ center: point(0.5 + half, 0.5), spread: 1.2 }),
    createHand({ center: point(0.5 - half, 0.5), spread: 1.2 }),
  ]);
}

describe('HandStartupGestureController', () => {
  it('goes EmptyIdle -> HandsClosed -> PullArmed when hands close then pull apart', () => {
    const controller = new HandStartupGestureController();
    let state: InteractionState = 'EmptyIdle';
    const seen = new Set<InteractionState>([state]);
    let timestamp = 0;

    const drive = (distance: number): void => {
      const update = controller.update(
        handsAtDistance(distance),
        state,
        timestamp,
        DEFAULT_GESTURE_THRESHOLDS,
      );
      if (update.nextState) {
        state = update.nextState;
        seen.add(state);
      }
      timestamp += 16;
    };

    // Hold both hands close together long enough to pass the closed-stable window.
    for (let i = 0; i < 30; i += 1) {
      drive(0.12);
    }
    // Then pull apart steadily.
    for (let i = 0; i < 30; i += 1) {
      drive(Math.min(0.12 + i * 0.03, 0.5));
    }

    expect(seen.has('HandsClosed')).toBe(true);
    expect(seen.has('PullArmed')).toBe(true);
    expect(state).toBe('PullArmed');
  });

  it('does not arm when hands stay close together (no pull)', () => {
    const controller = new HandStartupGestureController();
    let state: InteractionState = 'EmptyIdle';
    let timestamp = 0;

    for (let i = 0; i < 40; i += 1) {
      const update = controller.update(
        handsAtDistance(0.12),
        state,
        timestamp,
        DEFAULT_GESTURE_THRESHOLDS,
      );
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 16;
    }

    expect(state).toBe('HandsClosed');
    expect(state).not.toBe('PullArmed');
  });
});
