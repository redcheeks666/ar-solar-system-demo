import { describe, it, expect } from 'vitest';
import { PerspectiveCamera } from 'three';
import {
  SolarOpeningController,
  type SolarOpeningUpdate,
} from '../../src/interaction/solarOpeningController';
import { INTERACTION_PLANE_Z } from '../../src/rendering/scene';
import type { InteractionState } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { TEST_LAYOUT, createTestCamera } from '../helpers/testCamera';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

function step(
  controller: SolarOpeningController,
  camera: PerspectiveCamera,
  state: InteractionState,
  distance: number,
  timestamp: number,
): SolarOpeningUpdate {
  const half = distance / 2;
  return controller.update({
    tracking: createTrackingSnapshot([
      createHand({ center: point(0.5 + half, 0.5), spread: 1.4 }),
      createHand({ center: point(0.5 - half, 0.5), spread: 1.4 }),
    ]),
    interactionState: state,
    thresholds: DEFAULT_GESTURE_THRESHOLDS,
    layout: TEST_LAYOUT,
    camera,
    planeZ: INTERACTION_PLANE_Z,
    timestamp,
  });
}

describe('SolarOpeningController', () => {
  it('opens to SolarActive as hand distance grows (pull-open happy path)', () => {
    const controller = new SolarOpeningController();
    const camera = createTestCamera();
    let state: InteractionState = 'PullArmed';
    let timestamp = 0;
    let last: SolarOpeningUpdate | null = null;

    for (let i = 0; i < 100 && state !== 'SolarActive'; i += 1) {
      const distance = Math.min(0.25 + i * 0.05, 0.62);
      last = step(controller, camera, state, distance, timestamp);
      if (last.nextState) {
        state = last.nextState;
      }
      timestamp += 33;
    }

    expect(state).toBe('SolarActive');
    expect(last?.snapshot.progress).toBe(1);
    expect(last?.snapshot.visible).toBe(true);
  });

  it('holds opening progress when hand distance holds (no auto-complete)', () => {
    const controller = new SolarOpeningController();
    const camera = createTestCamera();

    // Arm, then enter opening.
    let state: InteractionState = step(controller, camera, 'PullArmed', 0.25, 0).nextState!;
    let last: SolarOpeningUpdate | null = null;
    let timestamp = 33;

    // Hold the hands at a fixed mid-pull distance for many frames.
    for (let i = 0; i < 40; i += 1) {
      last = step(controller, camera, state, 0.4, timestamp);
      if (last.nextState) {
        state = last.nextState;
      }
      timestamp += 33;
    }

    expect(state).toBe('SolarOpening');
    expect(last?.snapshot.progress ?? 0).toBeGreaterThan(0.2);
    expect(last?.snapshot.progress ?? 1).toBeLessThan(0.9);
  });

  it('shows no solar content while hands are only closed', () => {
    const controller = new SolarOpeningController();
    const camera = createTestCamera();
    const update = step(controller, camera, 'HandsClosed', 0.12, 0);

    expect(update.snapshot.active).toBe(false);
    expect(update.snapshot.visible).toBe(false);
    expect(update.snapshot.progress).toBe(0);
    expect(update.nextState).toBeNull();
  });
});
