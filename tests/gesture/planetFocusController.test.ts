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

    // Follow position is low-pass smoothed, so it converges over a few frames instead of snapping.
    let moved = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 720, y: 420 })],
      target: target(650, 360),
      timestamp: 2760,
    });
    for (let i = 1; i <= 6; i += 1) {
      moved = step({
        controller,
        state: 'PlanetFocusControlled',
        hands: [handAtPixel({ x: 720, y: 420 })],
        target: target(650, 360),
        timestamp: 2760 + i * 60,
      });
    }
    expect(moved.snapshot.screenPosition?.x).toBeGreaterThan(700);
    expect(moved.snapshot.screenPosition?.y).toBeGreaterThan(400);

    const closed = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 720, y: 420, pinchRatio: 0.12 })],
      target: target(720, 420),
      timestamp: 3200,
    });
    expect(closed.nextState).toBeNull();
    expect(closed.snapshot.pinchState).toBe('closed');

    const released = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 720, y: 420, pinchRatio: 0.82 })],
      target: target(720, 420),
      timestamp: 3300,
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

    // Scale is low-pass smoothed; converge over a few frames at the widened hand distance.
    let scaled = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [
        handAtPixel({ x: 520, y: 360, side: 'left' }),
        handAtPixel({ x: 760, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1560,
    });
    for (let i = 1; i <= 6; i += 1) {
      scaled = step({
        controller,
        state: 'PlanetFocusControlled',
        hands: [
          handAtPixel({ x: 520, y: 360, side: 'left' }),
          handAtPixel({ x: 760, y: 360, side: 'right' }),
        ],
        target: target(640, 360),
        timestamp: 1560 + i * 60,
      });
    }
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
      timestamp: 1980,
    });

    const released = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [
        handAtPixel({ x: 520, y: 360, side: 'left', pinchRatio: 0.82 }),
        handAtPixel({ x: 760, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 2040,
    });
    expect(released.nextState).toBe('PlanetFocusFloating');
    expect(released.snapshot.controlState).toBe('DeselectedWaitForClear');
    expect(released.snapshot.scaleMultiplier).toBeGreaterThan(1.1);
    expect(released.snapshot.transitionReason).toBe('two-hand-pinch-tap-release');
  });

  it('shrinks the focused body below the old scale floor when the four finger tips draw together', () => {
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

    // Engage two-hand follow with the hands spread wide (large base span).
    step({
      controller,
      state: 'PlanetFocusView',
      hands: [
        handAtPixel({ x: 520, y: 360, side: 'left' }),
        handAtPixel({ x: 760, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 500,
    });
    const engaged = step({
      controller,
      state: 'PlanetFocusView',
      hands: [
        handAtPixel({ x: 520, y: 360, side: 'left' }),
        handAtPixel({ x: 760, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(engaged.snapshot.controlState).toBe('TwoHandFollow');

    // Draw the four tips together (hands close + tight pinch); span collapses so the body shrinks
    // well past the previous 0.65 floor, down toward the new 0.3 minimum.
    let shrunk = engaged;
    for (let i = 1; i <= 10; i += 1) {
      shrunk = step({
        controller,
        state: 'PlanetFocusControlled',
        hands: [
          handAtPixel({ x: 620, y: 360, side: 'left', pinchRatio: 0.18 }),
          handAtPixel({ x: 660, y: 360, side: 'right', pinchRatio: 0.18 }),
        ],
        target: target(640, 360),
        timestamp: 1500 + i * 60,
      });
    }
    expect(shrunk.snapshot.controlState).toBe('TwoHandFollow');
    expect(shrunk.snapshot.scaleMultiplier).toBeLessThan(0.5);
    expect(shrunk.snapshot.scaleMultiplier).toBeGreaterThanOrEqual(0.3);
  });

  it('does not change two-hand scale when a hand closes its pinch (scale decoupled from pinch)', () => {
    const controller = new PlanetFocusController();

    step({ controller, state: 'PlanetFocusView', hands: [], target: target(520, 300), timestamp: 0 });
    step({ controller, state: 'PlanetFocusView', hands: [], target: target(640, 360), timestamp: 450 });
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
    const engaged = step({
      controller,
      state: 'PlanetFocusView',
      hands: [
        handAtPixel({ x: 580, y: 360, side: 'left' }),
        handAtPixel({ x: 700, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(engaged.snapshot.controlState).toBe('TwoHandFollow');

    // Keep both hands in place but close their pinches. Scale must stay put (it tracks the distance
    // between the hands, not within-hand pinch), and closing alone must not release.
    let closed = engaged;
    for (let i = 1; i <= 5; i += 1) {
      closed = step({
        controller,
        state: 'PlanetFocusControlled',
        hands: [
          handAtPixel({ x: 580, y: 360, side: 'left', pinchRatio: 0.15 }),
          handAtPixel({ x: 700, y: 360, side: 'right', pinchRatio: 0.15 }),
        ],
        target: target(640, 360),
        timestamp: 1500 + i * 60,
      });
    }
    expect(closed.snapshot.controlState).toBe('TwoHandFollow');
    expect(closed.snapshot.scaleMultiplier).toBeCloseTo(1, 1);
  });

  it('does not release a held body when an open hand near the camera has a small pixel gap', () => {
    const controller = new PlanetFocusController();

    step({ controller, state: 'PlanetFocusView', hands: [], target: target(520, 300), timestamp: 0 });
    step({ controller, state: 'PlanetFocusView', hands: [], target: target(640, 360), timestamp: 450 });
    step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360, side: 'right' })],
      target: target(640, 360),
      timestamp: 500,
    });
    const follow = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360, side: 'right' })],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(follow.nextState).toBe('PlanetFocusControlled');
    expect(follow.snapshot.controlState).toBe('SingleHandFollow');

    // The hand stays OPEN (multi-finger ratio ~0.45) while holding the body, but sits close to the
    // camera so the raw thumb-finger pixel gap is small (~58px <= the old 72px "closed" threshold).
    // Ratio-only pinch-tap must keep this 'open'; the old pixel-OR test read it as a false 'closed'.
    const openSmallGap = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 640, y: 360, side: 'right', pinchRatio: 0.45 })],
      target: target(640, 360),
      timestamp: 1600,
    });
    expect(openSmallGap.nextState).toBeNull();
    expect(openSmallGap.snapshot.controlState).toBe('SingleHandFollow');
    expect(openSmallGap.snapshot.pinchState).toBe('open');

    // A landmark jitter spike widens the pixel gap past the old 94px "open" threshold (ratio ~0.74).
    // Under the old logic that completed a false close->open tap and dropped the body mid-move. The
    // hand never actually pinched (ratio never went under 0.32), so it must NOT release now.
    const jitterSpike = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel({ x: 640, y: 360, side: 'right', pinchRatio: 0.74 })],
      target: target(640, 360),
      timestamp: 1700,
    });
    expect(jitterSpike.nextState).toBeNull();
    expect(jitterSpike.snapshot.controlState).toBe('SingleHandFollow');
  });

  it('keeps single-hand follow when an off-hand appears outside the heat zone', () => {
    const controller = new PlanetFocusController();

    step({ controller, state: 'PlanetFocusView', hands: [], target: target(520, 300), timestamp: 0 });
    step({ controller, state: 'PlanetFocusView', hands: [], target: target(640, 360), timestamp: 450 });
    step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360, side: 'right' })],
      target: target(640, 360),
      timestamp: 500,
    });
    const follow = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360, side: 'right' })],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(follow.nextState).toBe('PlanetFocusControlled');

    // An off-hand enters the frame far from the planet. It shifts the active hand's array index
    // (right:0 -> right:1), but control must continue with the original hand, not drop.
    const offHandAppears = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [
        handAtPixel({ x: 120, y: 120, side: 'left' }),
        handAtPixel({ x: 640, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1560,
    });
    expect(offHandAppears.nextState).toBeNull();
    expect(offHandAppears.snapshot.controlState).toBe('SingleHandFollow');
    expect(offHandAppears.snapshot.transitionReason).toBe('single-hand-following');
  });

  it('downgrades two-hand follow to single when one hand leaves the heat zone', () => {
    const controller = new PlanetFocusController();

    step({ controller, state: 'PlanetFocusView', hands: [], target: target(520, 300), timestamp: 0 });
    step({ controller, state: 'PlanetFocusView', hands: [], target: target(640, 360), timestamp: 450 });
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
    const engaged = step({
      controller,
      state: 'PlanetFocusView',
      hands: [
        handAtPixel({ x: 580, y: 360, side: 'left' }),
        handAtPixel({ x: 700, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(engaged.snapshot.controlState).toBe('TwoHandFollow');

    // Right hand withdraws far out of the heat zone; left hand stays gripping.
    const downgraded = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [
        handAtPixel({ x: 580, y: 360, side: 'left' }),
        handAtPixel({ x: 1150, y: 360, side: 'right' }),
      ],
      target: target(640, 360),
      timestamp: 1560,
    });
    expect(downgraded.nextState).toBeNull();
    expect(downgraded.snapshot.controlState).toBe('SingleHandFollow');
    expect(downgraded.snapshot.controlMode).toBe('single');
    expect(downgraded.snapshot.transitionReason).toBe('two-hand-downgraded-to-single-follow');
  });

  it('keeps an in-progress dwell alive through a brief tracking gap', () => {
    const controller = new PlanetFocusController();

    // Intro centers, then clear the heat zone (no hands) before the dwell can begin.
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

    const dwellStart = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 500,
    });
    expect(dwellStart.snapshot.controlState).toBe('SingleTouchDwell');

    // One frame with no hands (tracking blip) within the grace window must not reset the timer.
    const gap = step({
      controller,
      state: 'PlanetFocusView',
      hands: [],
      target: target(640, 360),
      timestamp: 950,
    });
    expect(gap.snapshot.controlState).toBe('SingleTouchDwell');
    expect(gap.snapshot.transitionReason).toBe('holding-dwell-through-brief-gap');

    step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 1050,
    });

    // The dwell completes 1s after the ORIGINAL start (500), proving the gap did not restart it.
    const follow = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(follow.nextState).toBe('PlanetFocusControlled');
    expect(follow.snapshot.controlState).toBe('SingleHandFollow');
  });

  it('resets the dwell when the hand is gone past the grace window', () => {
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
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 500,
    });

    step({
      controller,
      state: 'PlanetFocusView',
      hands: [],
      target: target(640, 360),
      timestamp: 850,
    });

    // Gap exceeds the grace window -> the dwell is abandoned.
    const reset = step({
      controller,
      state: 'PlanetFocusView',
      hands: [],
      target: target(640, 360),
      timestamp: 1100,
    });
    expect(reset.snapshot.controlState).toBe('FocusIdle');
    expect(reset.snapshot.transitionReason).toBe('waiting-for-focused-body-touch');

    // Re-touch starts a fresh 1s timer; the old elapsed time is not credited.
    step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 1150,
    });
    const stillDwelling = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel({ x: 640, y: 360 })],
      target: target(640, 360),
      timestamp: 1500,
    });
    expect(stillDwelling.nextState).toBeNull();
    expect(stillDwelling.snapshot.controlState).toBe('SingleTouchDwell');
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
