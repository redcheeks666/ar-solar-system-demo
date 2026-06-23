import { describe, it, expect } from 'vitest';
import { SolarOpeningController } from '../../src/interaction/solarOpeningController';
import { INTERACTION_PLANE_Z } from '../../src/rendering/scene';
import type { InteractionState, TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { createTestCamera, TEST_LAYOUT } from '../helpers/testCamera';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

const camera = createTestCamera();

function twoHands(distance: number): TrackedHand[] {
  const half = distance / 2;
  return [
    createHand({ center: point(0.5 + half, 0.5), spread: 1.4 }),
    createHand({ center: point(0.5 - half, 0.5), spread: 1.4 }),
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

describe('SolarActive lifecycle', () => {
  it('opening completion + release reaches SolarFreeHover without an extra re-grip', () => {
    const controller = new SolarOpeningController();
    let state: InteractionState = 'PullArmed';
    let timestamp = 0;

    for (let i = 0; i < 80 && state !== 'SolarActive'; i += 1) {
      const distance = Math.min(0.25 + i * 0.05, 0.62);
      const update = step(controller, state, twoHands(distance), timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }
    expect(state).toBe('SolarActive');

    // The user lets go (hands leave the frame). It must fall through to free hover instead of
    // staying stuck in SolarActive, so one-hand inspection can begin.
    for (let i = 0; i < 30 && state !== 'SolarFreeHover'; i += 1) {
      const update = step(controller, state, [], timestamp);
      if (update.nextState) {
        state = update.nextState;
      }
      timestamp += 33;
    }
    expect(state).toBe('SolarFreeHover');
  });
});
