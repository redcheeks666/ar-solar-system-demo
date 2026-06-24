import { describe, expect, it } from 'vitest';
import {
  PlanetActivationController,
} from '../../src/interaction/planetActivationController';
import type { CelestialBodyScreenTarget } from '../../src/solar/solarSystem';
import type {
  InteractionState,
  NormalizedPoint,
  TrackedHand,
} from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { TEST_LAYOUT } from '../helpers/testCamera';

function target(
  id: CelestialBodyScreenTarget['id'],
  x: number,
  y: number,
  hitRadiusPx = 60,
): CelestialBodyScreenTarget {
  return {
    id,
    label: id,
    screenPosition: { x, y },
    visible: true,
    hitRadiusPx,
    originalOrbit: {
      parentId: id === 'moon' ? 'earth' : null,
      orbitRadius: id === 'moon' ? 0.18 : 1,
      orbitPhase: 0.5,
      localPosition: { x: 1, y: 0, z: 0 },
    },
  };
}

function normalizedFromPixel(x: number, y: number): NormalizedPoint {
  return point(1 - x / TEST_LAYOUT.stageWidth, y / TEST_LAYOUT.stageHeight);
}

function handAtPixel(
  x: number,
  y: number,
  pinchRatio: number,
): TrackedHand {
  const center = normalizedFromPixel(x, y);
  const hand = createHand({ center, spread: 1.2 });
  const halfDistance = (hand.palmScale * pinchRatio) / 2;
  hand.thumbTip = point(center.x - halfDistance, center.y, 0);
  hand.indexFingerTip = point(center.x + halfDistance, center.y, 0);
  hand.landmarks[4] = hand.thumbTip;
  hand.landmarks[8] = hand.indexFingerTip;

  return hand;
}

function handWithPinchMidpoint(input: {
  centerX: number;
  centerY: number;
  pinchX: number;
  pinchY: number;
  tipDistancePx: number;
  palmScale?: number;
}): TrackedHand {
  const center = normalizedFromPixel(input.centerX, input.centerY);
  const hand = createHand({ center, spread: 1.2 });
  hand.palmScale = input.palmScale ?? hand.palmScale;
  const thumb = normalizedFromPixel(
    input.pinchX - input.tipDistancePx / 2,
    input.pinchY,
  );
  const index = normalizedFromPixel(
    input.pinchX + input.tipDistancePx / 2,
    input.pinchY,
  );
  hand.thumbTip = thumb;
  hand.indexFingerTip = index;
  hand.landmarks[4] = thumb;
  hand.landmarks[8] = index;

  return hand;
}

function step(input: {
  controller: PlanetActivationController;
  state: InteractionState;
  hands: TrackedHand[];
  targets: CelestialBodyScreenTarget[];
  timestamp?: number;
}) {
  return input.controller.update({
    tracking: createTrackingSnapshot(input.hands),
    interactionState: input.state,
    targets: input.targets,
    layout: TEST_LAYOUT,
    timestamp: input.timestamp ?? 0,
  });
}

describe('PlanetActivationController', () => {
  it('hovers the nearest valid body and enters BodyHover', () => {
    const controller = new PlanetActivationController();
    const update = step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(642, 360, 0.5)],
      targets: [target('earth', 640, 360), target('mars', 900, 360)],
    });

    expect(update.nextState).toBe('BodyHover');
    expect(update.snapshot.hoveredBody).toBe('earth');
    expect(update.snapshot.activatedBody).toBeNull();
    expect(update.snapshot.pinchState).toBe('open');
  });

  it('keeps the current hover inside the exit radius to avoid flicker', () => {
    const controller = new PlanetActivationController();
    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.5)],
      targets: [target('earth', 640, 360), target('mars', 760, 360)],
    });

    const stable = step({
      controller,
      state: 'BodyHover',
      hands: [handAtPixel(650, 360, 0.5)],
      targets: [target('earth', 640, 360), target('mars', 650, 360)],
      timestamp: 33,
    });
    expect(stable.snapshot.hoveredBody).toBe('earth');

    const switched = step({
      controller,
      state: 'BodyHover',
      hands: [handAtPixel(760, 360, 0.5)],
      targets: [target('earth', 640, 360), target('mars', 760, 360)],
      timestamp: 66,
    });
    expect(switched.snapshot.hoveredBody).toBe('mars');
  });

  it('pinch-activates a hovered body and keeps it selected while the same hand opens near the body', () => {
    const controller = new PlanetActivationController();
    const targets = [target('venus', 640, 360)];

    const activated = step({
      controller,
      state: 'SolarActive',
      hands: [handAtPixel(640, 360, 0.12)],
      targets,
      timestamp: 0,
    });
    expect(activated.nextState).toBe('PlanetActivated');
    expect(activated.snapshot.activatedBody).toBe('venus');
    expect(activated.snapshot.pinchState).toBe('pinching');

    const stillLocked = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(690, 360, 0.54)],
      targets,
      timestamp: 33,
    });
    expect(stillLocked.nextState).toBeNull();
    expect(stillLocked.snapshot.activatedBody).toBe('venus');

    const openedNearBody = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.75)],
      targets,
      timestamp: 220,
    });
    expect(openedNearBody.nextState).toBeNull();
    expect(openedNearBody.snapshot.activatedBody).toBe('venus');
    expect(openedNearBody.snapshot.pinchState).toBe('close-ready');

    const brieflyAway = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1000, 360, 0.75)],
      targets,
      timestamp: 260,
    });
    expect(brieflyAway.nextState).toBeNull();
    expect(brieflyAway.snapshot.activatedBody).toBe('venus');

    const releasedAway = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1000, 360, 0.75)],
      targets,
      timestamp: 1280,
    });
    expect(releasedAway.nextState).toBe('SolarActive');
    expect(releasedAway.snapshot.activatedBody).toBeNull();
  });

  it('enters PlanetFocusView after the selected hand performs two closeDown events', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360)];

    const activated = step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 0,
    });
    expect(activated.nextState).toBe('PlanetActivated');

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 280,
    });
    const firstClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 330,
    });
    expect(firstClose.nextState).toBeNull();
    expect(firstClose.snapshot.doubleCloseCount).toBe(1);
    expect(firstClose.snapshot.transitionReason).toBe('double-close-first-close');

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 430,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 510,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 560,
    });
    const focus = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 610,
    });

    expect(focus.nextState).toBe('PlanetFocusView');
    expect(focus.snapshot.activatedBody).toBe('earth');
    expect(focus.snapshot.doubleCloseCount).toBe(2);
    expect(focus.snapshot.transitionReason).toBe('double-close-enter-focus');
  });

  it('enters PlanetFocusView when the user performs small double-click pinches without fully opening', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360)];

    const activated = step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 0,
    });
    expect(activated.nextState).toBe('PlanetActivated');

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.38)],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.24)],
      targets,
      timestamp: 280,
    });
    const firstClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.24)],
      targets,
      timestamp: 330,
    });
    expect(firstClose.snapshot.doubleCloseCount).toBe(1);

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.38)],
      targets,
      timestamp: 430,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.38)],
      targets,
      timestamp: 510,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.24)],
      targets,
      timestamp: 560,
    });
    const focus = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.24)],
      targets,
      timestamp: 610,
    });

    expect(focus.nextState).toBe('PlanetFocusView');
    expect(focus.snapshot.doubleCloseCount).toBe(2);
    expect(focus.snapshot.transitionReason).toBe('double-close-enter-focus');
  });

  it('enters PlanetFocusView when the real-camera reopen is only a few pixels above the first close', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360)];

    const activated = step({
      controller,
      state: 'SolarFreeHover',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 42,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 0,
    });
    expect(activated.nextState).toBe('PlanetActivated');

    step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 90,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 52,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 280,
    });
    const firstClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 52,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 330,
    });
    expect(firstClose.snapshot.doubleCloseCount).toBe(1);

    step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 61,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 430,
    });
    const smallReopen = step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 61,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 510,
    });
    expect(smallReopen.nextState).toBeNull();
    expect(smallReopen.snapshot.doubleCloseCount).toBe(1);
    expect(smallReopen.snapshot.transitionReason).toBe(
      'double-close-open-ready',
    );

    step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 52,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 560,
    });
    const focus = step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 52,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 610,
    });

    expect(focus.nextState).toBe('PlanetFocusView');
    expect(focus.snapshot.doubleCloseCount).toBe(2);
    expect(focus.snapshot.transitionReason).toBe('double-close-enter-focus');
  });

  it('does not count a held closed pinch as two closeDown events', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360)];

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 0,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 280,
    });
    const firstClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 330,
    });
    const heldClosed = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 900,
    });

    expect(firstClose.snapshot.doubleCloseCount).toBe(1);
    expect(heldClosed.nextState).toBeNull();
    expect(heldClosed.snapshot.doubleCloseCount).toBe(1);
  });

  it('keeps the activated body while already in PlanetFocusView', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360)];

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 0,
    });
    const focusView = step({
      controller,
      state: 'PlanetFocusView',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 1000,
    });

    expect(focusView.nextState).toBeNull();
    expect(focusView.snapshot.activatedBody).toBe('earth');
    expect(focusView.snapshot.transitionReason).toBe('focus-view-active');
  });

  it('keeps the activated body while moving through planet focus substates', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360)];

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 0,
    });

    const controlled = step({
      controller,
      state: 'PlanetFocusControlled',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 1000,
    });
    const floating = step({
      controller,
      state: 'PlanetFocusFloating',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 1033,
    });

    expect(controlled.nextState).toBeNull();
    expect(controlled.snapshot.activatedBody).toBe('earth');
    expect(controlled.snapshot.transitionReason).toBe('focus-view-active');
    expect(floating.nextState).toBeNull();
    expect(floating.snapshot.activatedBody).toBe('earth');
    expect(floating.snapshot.transitionReason).toBe('focus-view-active');
  });

  it('uses the pinch midpoint instead of palm center for body activation', () => {
    const controller = new PlanetActivationController();
    const update = step({
      controller,
      state: 'SolarFreeHover',
      hands: [
        handWithPinchMidpoint({
          centerX: 880,
          centerY: 520,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 48,
        }),
      ],
      targets: [target('saturn', 640, 360, 64)],
      timestamp: 0,
    });

    expect(update.nextState).toBe('PlanetActivated');
    expect(update.snapshot.hoveredBody).toBe('saturn');
    expect(update.snapshot.activatedBody).toBe('saturn');
    expect(update.snapshot.hoverPointKind).toBe('pinchMidpoint');
    expect(update.snapshot.hoverDistancePx).toBeCloseTo(0, 6);
  });

  it('switches activation to a newly touched body so the previous body can resume orbiting', () => {
    const controller = new PlanetActivationController();
    const targets = [
      target('earth', 640, 360, 72),
      target('mars', 780, 360, 72),
    ];

    const earth = step({
      controller,
      state: 'SolarFreeHover',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 42,
        }),
      ],
      targets,
      timestamp: 0,
    });
    expect(earth.snapshot.activatedBody).toBe('earth');

    const mars = step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 780,
          centerY: 360,
          pinchX: 780,
          pinchY: 360,
          tipDistancePx: 42,
        }),
      ],
      targets,
      timestamp: 33,
    });
    expect(mars.nextState).toBeNull();
    expect(mars.snapshot.hoveredBody).toBe('mars');
    expect(mars.snapshot.activatedBody).toBe('mars');
    expect(mars.snapshot.transitionReason).toBe('activation-switched-body');
  });

  it('does not switch activation when an open same-hand gesture passes over another body', () => {
    const controller = new PlanetActivationController();
    const targets = [
      target('earth', 640, 360, 72),
      target('mars', 780, 360, 72),
    ];

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 42,
        }),
      ],
      targets,
      timestamp: 0,
    });

    const openOverMars = step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 780,
          centerY: 360,
          pinchX: 780,
          pinchY: 360,
          tipDistancePx: 76,
        }),
      ],
      targets,
      timestamp: 220,
    });
    expect(openOverMars.nextState).toBeNull();
    expect(openOverMars.snapshot.activatedBody).toBe('earth');
    expect(openOverMars.snapshot.transitionReason).toBe(
      'double-close-open-ready',
    );

    const closedOnMars = step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 780,
          centerY: 360,
          pinchX: 780,
          pinchY: 360,
          tipDistancePx: 42,
        }),
      ],
      targets,
      timestamp: 300,
    });
    expect(closedOnMars.snapshot.activatedBody).toBe('mars');
    expect(closedOnMars.snapshot.transitionReason).toBe(
      'activation-switched-body',
    );
  });

  it('holds activation through brief hand loss and clears after the tolerance window', () => {
    const controller = new PlanetActivationController();
    const targets = [target('moon', 640, 360, 72)];

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 0,
    });

    const briefLoss = step({
      controller,
      state: 'PlanetActivated',
      hands: [],
      targets,
      timestamp: 120,
    });
    expect(briefLoss.nextState).toBeNull();
    expect(briefLoss.snapshot.activatedBody).toBe('moon');
    expect(briefLoss.snapshot.pinchState).toBe('held-during-loss');

    const expiredLoss = step({
      controller,
      state: 'PlanetActivated',
      hands: [],
      targets,
      timestamp: 520,
    });
    expect(expiredLoss.nextState).toBe('SolarFreeHover');
    expect(expiredLoss.snapshot.activatedBody).toBeNull();
  });

  it('does not run during whole-system endpoint control', () => {
    const controller = new PlanetActivationController();
    const update = step({
      controller,
      state: 'SolarHandleControl',
      hands: [handAtPixel(640, 360, 0.1)],
      targets: [target('earth', 640, 360)],
    });

    expect(update.nextState).toBeNull();
    expect(update.snapshot.hoveredBody).toBeNull();
    expect(update.snapshot.transitionReason).toBe('inactive-state');
  });
});
