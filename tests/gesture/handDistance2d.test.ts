import { describe, it, expect } from 'vitest';
import { HandPrimitiveController } from '../../src/interaction/handPrimitives';
import { HandStartupGestureController } from '../../src/interaction/handStartupGesture';
import type { InteractionState } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

describe('screen hand distance is 2D (ignores image-landmark z)', () => {
  it('pair distance uses x/y only, unaffected by large opposite depth (z)', () => {
    const primitives = new HandPrimitiveController();
    // 0.30 apart on screen, but with big opposite depth noise that a 3D hypot would inflate (~0.85).
    const frame = createTrackingSnapshot([
      createHand({ center: point(0.65, 0.5, 0.4), spread: 1.2 }),
      createHand({ center: point(0.35, 0.5, -0.4), spread: 1.2 }),
    ]);

    const snapshot = primitives.update(frame, DEFAULT_GESTURE_THRESHOLDS, 0);
    expect(snapshot.distance ?? 0).toBeCloseTo(0.3, 5);
  });

  it('startup still reaches PullArmed when only depth (z) jitters frame-to-frame', () => {
    const controller = new HandStartupGestureController();
    let state: InteractionState = 'EmptyIdle';
    const seen = new Set<InteractionState>([state]);
    let timestamp = 0;
    let index = 0;

    const drive = (distance: number): void => {
      const half = distance / 2;
      const jitter = index % 2 === 0 ? 0.5 : -0.5;
      const frame = createTrackingSnapshot([
        createHand({ center: point(0.5 + half, 0.5, jitter), spread: 1.2 }),
        createHand({ center: point(0.5 - half, 0.5, -jitter), spread: 1.2 }),
      ]);
      const update = controller.update(frame, state, timestamp, DEFAULT_GESTURE_THRESHOLDS);
      if (update.nextState) {
        state = update.nextState;
        seen.add(state);
      }
      timestamp += 16;
      index += 1;
    };

    for (let i = 0; i < 30; i += 1) {
      drive(0.12);
    }
    for (let i = 0; i < 30; i += 1) {
      drive(Math.min(0.12 + i * 0.03, 0.5));
    }

    expect(seen.has('HandsClosed')).toBe(true);
    expect(seen.has('PullArmed')).toBe(true);
  });
});
