import { describe, expect, it } from 'vitest';
import {
  PlanetFocusController,
} from '../../src/interaction/planetFocusController';
import type { FocusedCelestialBodyScreenTarget } from '../../src/solar/solarSystem';
import type {
  InteractionState,
  NormalizedPoint,
  TrackedHand,
} from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { TEST_LAYOUT } from '../helpers/testCamera';

function target(
  x: number,
  y: number,
  hitRadiusPx = 150,
): FocusedCelestialBodyScreenTarget {
  return {
    id: 'earth',
    screenPosition: { x, y },
    visible: true,
    bodyRadiusPx: hitRadiusPx - 36,
    hitRadiusPx,
    layout: TEST_LAYOUT,
  };
}

function normalizedFromPixel(x: number, y: number): NormalizedPoint {
  return point(1 - x / TEST_LAYOUT.stageWidth, y / TEST_LAYOUT.stageHeight);
}

function handAtPixel(input: {
  x: number;
  y: number;
  pinchRatio?: number;
  side?: TrackedHand['side'];
}): TrackedHand {
  const center = normalizedFromPixel(input.x, input.y);
  const hand = createHand({ center, spread: 1.2 });
  const pinchRatio = input.pinchRatio ?? 0.8;
  const halfDistance = (hand.palmScale * pinchRatio) / 2;
  const thumbTip = point(center.x - halfDistance, center.y, 0);
  const fingerTip = point(center.x + halfDistance, center.y, 0);

  hand.side = input.side ?? 'unknown';
  hand.thumbTip = thumbTip;
  hand.indexFingerTip = fingerTip;
  hand.landmarks[4] = thumbTip;
  hand.landmarks[8] = fingerTip;
  hand.landmarks[12] = fingerTip;
  hand.landmarks[16] = fingerTip;
  hand.landmarks[20] = fingerTip;

  return hand;
}

function step(input: {
  controller: PlanetFocusController;
  state: InteractionState;
  hands: TrackedHand[];
  target: FocusedCelestialBodyScreenTarget | null;
  timestamp: number;
}) {
  return input.controller.update({
    tracking: createTrackingSnapshot(input.hands),
    interactionState: input.state,
    focusedBody: 'earth',
    target: input.target,
    layout: TEST_LAYOUT,
    timestamp: input.timestamp,
  });
}

describe('PlanetFocusController', () => {
  it('waits for focus intro and a heat-zone clear before starting single-hand follow', () => {
    const controller = new PlanetFocusController();

    const cooldown = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 520, y: 300 })],
      target: target(520, 300),
      timestamp: 0,
    });
    expect(cooldown.nextState).toBeNull();
    expect(cooldown.snapshot.controlState).toBe('IntroCooldown');
    expect(cooldown.snapshot.transitionReason).toBe('waiting-for-focused-body-centered');

    const stillTouchingAfterIntro = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 450,
    });
    expect(stillTouchingAfterIntro.nextState).toBeNull();
    expect(stillTouchingAfterIntro.snapshot.controlState).toBe('WaitingForHeatZoneClear');

    const stillBlocked = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(stillBlocked.nextState).toBeNull();
    expect(stillBlocked.snapshot.controlState).toBe('WaitingForHeatZoneClear');

    const cleared = step({
      controller,
      state: 'PlanetFocusView',
      hands: [],
      target: target(640, 360),
      timestamp: 1600,
    });
    expect(cleared.nextState).toBeNull();
    expect(cleared.snapshot.controlState).toBe('FocusIdle');

    const dwellStart = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 1700,
    });
    expect(dwellStart.nextState).toBeNull();
    expect(dwellStart.snapshot.controlState).toBe('SingleTouchDwell');

    const beforeReady = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 645, y: 360 })],
      target: target(640, 360),
      timestamp: 2600,
    });
    expect(beforeReady.nextState).toBeNull();

    const follow = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 650, y: 360 })],
      target: target(640, 360),
      timestamp: 2700,
    });
    expect(follow.nextState).toBe('PlanetFocusControlled');
    expect(follow.snapshot.controlState).toBe('SingleHandFollow');

    const moved = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 720, y: 420 })],
      target: target(650, 360),
      timestamp: 2760,
    });
    expect(moved.snapshot.screenPosition?.x).toBeGreaterThan(700);
    expect(moved.snapshot.screenPosition?.y).toBeGreaterThan(400);

    const closed = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 720, y: 420, pinchRatio: 0.12 })],
      target: target(720, 420),
      timestamp: 2830,
    });
    expect(closed.nextState).toBeNull();
    expect(closed.snapshot.pinchState).toBe('closed');

    const released = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 720, y: 420, pinchRatio: 0.82 })],
      target: target(720, 420),
      timestamp: 2920,
    });
    expect(released.nextState).toBe('PlanetFocusFloating');
    expect(released.snapshot.controlState).toBe('DeselectedWaitForClear');
    expect(released.snapshot.transitionReason).toBe('single-hand-pinch-tap-release');

    const blockedAfterRelease = step({
      controller,
      state: 'PlanetFocusFloating',
      hands: [handAtPixel({ x: 720, y: 420 })],
      target: target(720, 420),
      timestamp: 4100,
    });
    expect(blockedAfterRelease.nextState).toBeNull();
    expect(blockedAfterRelease.snapshot.controlState).toBe('DeselectedWaitForClear');

    const clearedAfterRelease = step({
      controller,
      state: 'PlanetFocusFloating',
      hands: [],
      target: target(720, 420),
      timestamp: 4200,
    });
    expect(clearedAfterRelease.nextState).toBeNull();
    expect(clearedAfterRelease.snapshot.controlState).toBe('Floating');

    step({
      controller,
      state: 'PlanetFocusFloating',
      hands: [handAtPixel({ x: 720, y: 420 })],
      target: target(720, 420),
      timestamp: 4300,
    });

    const reacquired = step({
      controller,
      state: 'PlanetFocusFloating',
      hands: [handAtPixel({ x: 720, y: 420 })],
      target: target(720, 420),
      timestamp: 5300,
    });
    expect(reacquired.nextState).toBe('PlanetFocusControlled');
    expect(reacquired.snapshot.controlState).toBe('SingleHandFollow');
  });

  it('starts two-hand follow after both hands dwell, scales with hand distance, and releases from either hand pinch tap', () => {
    const controller = new PlanetFocusController();

    step({
      controller,
      state: 'PlanetFocusView',
      hands: [],
      target: target(520, 300),
      timestamp: 0,
    });
    step({
      controller,
      state: 'PlanetFocusView',
      hands: [],
      target: target(640, 360),
      timestamp: 450,
    });

    step({
      controller,
      state: 'PlanetFocusView',
      hands: [
        handAtPixel({ x: 580, y: 360, side: 'left' }),
        handAtPixel({ x: 700, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 500,
    });

    const follow = step({
      controller,
      state: 'PlanetFocusView',
      hands: [
        handAtPixel({ x: 580, y: 360, side: 'left' }),
        handAtPixel({ x: 700, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(follow.nextState).toBe('PlanetFocusControlled');
    expect(follow.snapshot.controlState).toBe('TwoHandFollow');
    expect(follow.snapshot.controlMode).toBe('two');

    const scaled = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [
        handAtPixel({ x: 520, y: 360, side: 'left' }),
        handAtPixel({ x: 760, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1560,
    });
    expect(scaled.snapshot.scaleMultiplier).toBeGreaterThan(1.1);
    expect(scaled.snapshot.screenPosition?.x).toBeCloseTo(640, 0);

    step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [
        handAtPixel({ x: 520, y: 360, side: 'left', pinchRatio: 0.12 }),
        handAtPixel({ x: 760, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1630,
    });

    const released = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [
        handAtPixel({ x: 520, y: 360, side: 'left', pinchRatio: 0.82 }),
        handAtPixel({ x: 760, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1720,
    });
    expect(released.nextState).toBe('PlanetFocusFloating');
    expect(released.snapshot.controlState).toBe('DeselectedWaitForClear');
    expect(released.snapshot.scaleMultiplier).toBeGreaterThan(1.1);
    expect(released.snapshot.transitionReason).toBe('two-hand-pinch-tap-release');
  });

  it('ignores hands outside the focused-body heat zone', () => {
    const controller = new PlanetFocusController();

    step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 200, y: 120 })],
      target: target(640, 360),
      timestamp: 0,
    });
    step({
      controller,
      state: 'PlanetFocusView',
      hands: [],
      target: target(640, 360),
      timestamp: 450,
    });

    const update = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 200, y: 120 })],
      target: target(640, 360),
      timestamp: 620,
    });

    expect(update.nextState).toBeNull();
    expect(update.snapshot.controlState).toBe('FocusIdle');
    expect(update.snapshot.transitionReason).toBe('waiting-for-focused-body-touch');
  });
});
