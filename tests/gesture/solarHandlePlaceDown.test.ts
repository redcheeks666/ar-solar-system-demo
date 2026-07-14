import { describe, it, expect } from 'vitest';
import { SolarOpeningController } from '../../src/interaction/solarOpeningController';
import { INTERACTION_PLANE_Z } from '../../src/rendering/scene';
import type { InteractionState, TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { createTestCamera, TEST_LAYOUT } from '../helpers/testCamera';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

const camera = createTestCamera();

// spread 1.4 = open hands (high open-hand score), spread 0.1 = fists (high grip).
function twoHands(distance: number, spread = 1.4): TrackedHand[] {
  const half = distance / 2;
  return [
    createHand({ center: point(0.5 + half, 0.5), spread }),
    createHand({ center: point(0.5 - half, 0.5), spread }),
  ];
}

function step(
  controller: SolarOpeningController,
  state: InteractionState,
  hands: TrackedHand[],
  timestamp: number,
) {
  return controller.update({
    tracking: createTrackingSnapshot(hands),
    interactionState: state,
    thresholds: DEFAULT_GESTURE_THRESHOLDS,
    layout: TEST_LAYOUT,
    camera,
    planeZ: INTERACTION_PLANE_Z,
    timestamp,
  });
}

// Pull open with both hands, then hold the endpoints until SolarHandleControl is
// re-acquired. Hold distance 0.6 stays under the near-edge place-down boundary.
function openToHandleControl(controller: SolarOpeningController): {
  state: InteractionState;
  timestamp: number;
} {
  let state: InteractionState = 'PullArmed';
  let timestamp = 0;

  for (let i = 0; i < 40 && state !== 'SolarActive'; i += 1) {
    const distance = Math.min(0.25 + i * 0.05, 0.6);
    const update = step(controller, state, twoHands(distance), timestamp);
    if (update.nextState) {
      state = update.nextState;
    }
    timestamp += 33;
  }

  for (let i = 0; i < 30 && state !== 'SolarHandleControl'; i += 1) {
    const update = step(controller, state, twoHands(0.6), timestamp);
    if (update.nextState) {
      state = update.nextState;
    }
    timestamp += 33;
  }

  return { state, timestamp };
}

describe('SolarHandleControl place-down semantics', () => {
  it('places down on a deliberate two-hand fist -> open gesture', () => {
    const controller = new SolarOpeningController();
    let { state, timestamp } = openToHandleControl(controller);
    expect(state).toBe('SolarHandleControl');

    // Both hands clench into fists: armed, but not placed down yet.
    for (let i = 0; i < 4; i += 1) {
      const update = step(controller, state, twoHands(0.6, 0.1), timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }
    expect(state).toBe('SolarHandleControl');

    // Hands reopen once: this confirms the place-down into free hover.
    for (let i = 0; i < 6 && state !== 'SolarFreeHover'; i += 1) {
      const update = step(controller, state, twoHands(0.6, 1.4), timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }
    expect(state).toBe('SolarFreeHover');
  });

  it('auto-places down only after a sustained near-edge two-hand span', () => {
    const controller = new SolarOpeningController();
    let { state, timestamp } = openToHandleControl(controller);
    expect(state).toBe('SolarHandleControl');

    // Hold beyond the 0.90 enter boundary for longer than the 180ms dwell.
    for (let i = 0; i < 8 && state !== 'SolarFreeHover'; i += 1) {
      const distance = 0.94;
      const update = step(controller, state, twoHands(distance), timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }
    expect(state).toBe('SolarFreeHover');
  });

  it('ignores a one-frame wide-span spike and resets below the exit boundary', () => {
    const controller = new SolarOpeningController();
    let { state, timestamp } = openToHandleControl(controller);
    expect(state).toBe('SolarHandleControl');

    for (const distance of [0.94, 0.89, 0.84, 0.94, 0.84]) {
      const update = step(controller, state, twoHands(distance), timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }

    expect(state).toBe('SolarHandleControl');
  });

  it('keeps controlling without placing down while hands stay open and in range', () => {
    const controller = new SolarOpeningController();
    let { state, timestamp } = openToHandleControl(controller);
    expect(state).toBe('SolarHandleControl');

    // Open hands keep moving the system; leaving exact endpoints is no longer a
    // release, so it must stay in SolarHandleControl (no place-down, no collapse).
    for (let i = 0; i < 20; i += 1) {
      const distance = 0.5 + (i % 2) * 0.06;
      const update = step(controller, state, twoHands(distance), timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }
    expect(state).toBe('SolarHandleControl');
  });

  it('re-acquires the handle only after ~0.5s of stable endpoint hold', () => {
    const controller = new SolarOpeningController();
    let state: InteractionState = 'PullArmed';
    let timestamp = 0;

    for (let i = 0; i < 40 && state !== 'SolarActive'; i += 1) {
      const distance = Math.min(0.25 + i * 0.05, 0.6);
      const update = step(controller, state, twoHands(distance), timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }
    expect(state).toBe('SolarActive');

    const holdStart = timestamp;
    let enteredAt: number | null = null;

    // SolarFreeHover re-grip reuses this same endpoint-enter dwell, so the
    // ~0.5s requirement is shared.
    for (let i = 0; i < 30 && enteredAt === null; i += 1) {
      const update = step(controller, state, twoHands(0.6), timestamp);
      if (update.nextState) {
        state = update.nextState;
        if (state === 'SolarHandleControl') {
          enteredAt = timestamp;
        }
      }
      timestamp += 33;
    }

    expect(state).toBe('SolarHandleControl');
    expect(enteredAt! - holdStart).toBeGreaterThanOrEqual(450);
    expect(controller.getEndpointDebugSnapshot()).toMatchObject({
      mode: 'enter',
      reason: 'endpoint-hit-stable',
      bothWithinRadius: true,
      stableRequiredMs: 500,
    });
    expect(controller.getEndpointDebugSnapshot().stableMs).toBeGreaterThanOrEqual(500);
  });
});
