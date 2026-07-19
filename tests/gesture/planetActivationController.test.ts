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
  palmScale?: number,
): TrackedHand {
  const center = normalizedFromPixel(x, y);
  const hand = createHand({ center, spread: 1.2 });
  hand.palmScale = palmScale ?? hand.palmScale;
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

function runDoubleClose(input: {
  valley1: number;
  valley2: number;
  peak?: number;
  palmScale?: number;
  valleyFrames?: number;
}) {
  const controller = new PlanetActivationController();
  const targets = [target('earth', 640, 360)];
  const hand = (ratio: number) =>
    handAtPixel(640, 360, ratio, input.palmScale);

  const activated = step({
    controller,
    state: 'SolarFreeHover',
    hands: [hand(0.1)],
    targets,
    timestamp: 0,
  });
  step({
    controller,
    state: 'PlanetActivated',
    hands: [hand(0.75)],
    targets,
    timestamp: 220,
  });
  step({
    controller,
    state: 'PlanetActivated',
    hands: [hand(0.75)],
    targets,
    timestamp: 253,
  });

  const valleyFrames = input.valleyFrames ?? 2;
  let timestamp = 300;
  let firstClose = activated;
  for (let index = 0; index < valleyFrames; index += 1) {
    firstClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [hand(input.valley1)],
      targets,
      timestamp,
    });
    timestamp += 33;
  }

  const peak = input.peak ?? 0.75;
  timestamp = 430;
  step({
    controller,
    state: 'PlanetActivated',
    hands: [hand(peak)],
    targets,
    timestamp,
  });
  const peakReady = step({
    controller,
    state: 'PlanetActivated',
    hands: [hand(peak)],
    targets,
    timestamp: timestamp + 33,
  });

  timestamp = 530;
  let secondClose = peakReady;
  for (let index = 0; index < valleyFrames; index += 1) {
    secondClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [hand(input.valley2)],
      targets,
      timestamp,
    });
    timestamp += 33;
  }

  step({
    controller,
    state: 'PlanetActivated',
    hands: [hand(0.75)],
    targets,
    timestamp: 630,
  });
  step({
    controller,
    state: 'PlanetActivated',
    hands: [hand(0.75)],
    targets,
    timestamp: 665,
  });
  const focus = step({
    controller,
    state: 'PlanetActivated',
    hands: [hand(0.75)],
    targets,
    timestamp: 705,
  });

  return { activated, firstClose, peakReady, secondClose, focus };
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

  it('pinch-activates a hovered body and keeps it locked through nearby hand-shape changes', () => {
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
    expect(openedNearBody.snapshot.pinchState).toBe('open');
    expect(openedNearBody.snapshot.hoverPointKind).toBe('pinchMidpoint');

    const movedAway = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1000, 360, 0.3)],
      targets,
      timestamp: 260,
    });
    expect(movedAway.nextState).toBeNull();
    expect(movedAway.snapshot.activatedBody).toBe('venus');
    expect(movedAway.snapshot.activationMotionPhase).toBe('Locked');

    const stillMoving = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1080, 360, 0.3)],
      targets,
      timestamp: 293,
    });
    expect(stillMoving.nextState).toBeNull();
    expect(stillMoving.snapshot.activatedBody).toBe('venus');
    expect(stillMoving.snapshot.transitionReason).toBe(
      'activation-seeking-moving',
    );
  });

  it('enters PlanetFocusView only after two closeDown events and the final release', () => {
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
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 250,
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
      timestamp: 400,
    });
    expect(firstClose.nextState).toBeNull();
    expect(firstClose.snapshot.doubleCloseCount).toBe(1);
    expect(firstClose.snapshot.transitionReason).toBe('double-close-first-close');

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 500,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 580,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 660,
    });
    const secondClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 760,
    });

    expect(secondClose.nextState).toBeNull();
    expect(secondClose.snapshot.doubleCloseCount).toBe(2);
    expect(secondClose.snapshot.transitionReason).toBe(
      'double-close-second-close-waiting-for-release',
    );

    const heldSecondClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.1)],
      targets,
      timestamp: 860,
    });
    expect(heldSecondClose.nextState).toBeNull();

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 920,
    });
    const focus = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 1000,
    });

    expect(focus.nextState).toBe('PlanetFocusView');
    expect(focus.snapshot.activatedBody).toBe('earth');
    expect(focus.snapshot.doubleCloseCount).toBe(2);
    expect(focus.snapshot.pinchState).toBe('open');
    expect(focus.snapshot.transitionReason).toBe(
      'double-close-release-enter-focus',
    );
  });

  it('enters focus when in-place DoubleClose moves the pinch point but not the wrist', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360, 128)];
    const hand = (pinchX: number, tipDistancePx: number) =>
      handWithPinchMidpoint({
        centerX: 640,
        centerY: 360,
        pinchX,
        pinchY: 360,
        tipDistancePx,
      });
    const updates = [];

    updates.push(step({
      controller,
      state: 'SolarFreeHover',
      hands: [hand(640, 24)],
      targets,
      timestamp: 0,
    }));

    for (const [timestamp, pinchX, tipDistancePx] of [
      [220, 700, 80],
      [253, 680, 80],
      [300, 600, 32],
      [333, 610, 32],
      [430, 700, 80],
      [463, 690, 80],
      [530, 590, 32],
      [563, 600, 32],
      [630, 700, 80],
      [665, 680, 80],
      [705, 690, 80],
    ] as const) {
      updates.push(step({
        controller,
        state: 'PlanetActivated',
        hands: [hand(pinchX, tipDistancePx)],
        targets,
        timestamp,
      }));
    }

    expect(updates.every(
      (update) => update.snapshot.activationMotionPhase === 'Locked',
    )).toBe(true);
    expect(updates.every(
      (update) => update.snapshot.settleTarget === null,
    )).toBe(true);
    expect(updates.at(-4)?.snapshot.doubleCloseCount).toBe(2);
    expect(updates.at(-1)?.nextState).toBe('PlanetFocusView');
    expect(updates.at(-1)?.snapshot.transitionReason).toBe(
      'double-close-release-enter-focus',
    );
  });

  it('does not enter Seeking when pinch open-close motion changes only fingertip interaction points', () => {
    const controller = new PlanetActivationController();
    const targets = [target('jupiter', 640, 360, 160)];
    const hand = (pinchX: number, tipDistancePx: number) =>
      handWithPinchMidpoint({
        centerX: 640,
        centerY: 360,
        pinchX,
        pinchY: 360,
        tipDistancePx,
      });

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [hand(640, 24)],
      targets,
      timestamp: 0,
    });

    for (const [timestamp, pinchX, tipDistancePx] of [
      [33, 750, 96],
      [66, 530, 28],
      [99, 735, 88],
      [132, 545, 32],
    ] as const) {
      const update = step({
        controller,
        state: 'PlanetActivated',
        hands: [hand(pinchX, tipDistancePx)],
        targets,
        timestamp,
      });

      expect(update.snapshot.activationMotionPhase).toBe('Locked');
      expect(update.snapshot.handDisplacement).toBeCloseTo(0, 6);
      expect(update.snapshot.handSpeed).toBeCloseTo(0, 6);
      expect(update.snapshot.settleTarget).toBeNull();
    }
  });

  it('keeps DoubleClose progress through one wrist outlier and a same-body re-anchor', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360, 140)];

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.2)],
      targets,
      timestamp: 0,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.75)],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.75)],
      targets,
      timestamp: 253,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.25)],
      targets,
      timestamp: 300,
    });
    const firstClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.25)],
      targets,
      timestamp: 333,
    });
    expect(firstClose.snapshot.doubleCloseCount).toBe(1);

    const oneFrameOutlier = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(700, 360, 0.75)],
      targets,
      timestamp: 430,
    });
    expect(oneFrameOutlier.snapshot.handDisplacement).toBeGreaterThan(
      oneFrameOutlier.snapshot.handLockRadius,
    );
    expect(oneFrameOutlier.snapshot.activationMotionPhase).toBe('Locked');
    expect(oneFrameOutlier.snapshot.doubleCloseCount).toBe(1);

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(700, 360, 0.75)],
      targets,
      timestamp: 463,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(700, 360, 0.75)],
      targets,
      timestamp: 496,
    });
    const reanchored = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(700, 360, 0.75)],
      targets,
      timestamp: 529,
    });

    expect(reanchored.snapshot.activationMotionPhase).toBe('Locked');
    expect(reanchored.snapshot.activatedBody).toBe('earth');
    expect(reanchored.snapshot.doubleCloseCount).toBe(1);
    expect(reanchored.snapshot.transitionReason).toBe(
      'activation-reanchored-after-hand-settle',
    );
  });

  it('enters PlanetFocusView when the reopen is deliberate but below the activation release ratio', () => {
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
      hands: [handAtPixel(640, 360, 0.55)],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.55)],
      targets,
      timestamp: 250,
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
      timestamp: 400,
    });
    expect(firstClose.snapshot.doubleCloseCount).toBe(1);

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.55)],
      targets,
      timestamp: 500,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.55)],
      targets,
      timestamp: 580,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.24)],
      targets,
      timestamp: 660,
    });
    const secondClose = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.24)],
      targets,
      timestamp: 760,
    });

    expect(secondClose.nextState).toBeNull();
    expect(secondClose.snapshot.doubleCloseCount).toBe(2);

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.55)],
      targets,
      timestamp: 820,
    });
    const focus = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.55)],
      targets,
      timestamp: 900,
    });

    expect(focus.nextState).toBe('PlanetFocusView');
    expect(focus.snapshot.doubleCloseCount).toBe(2);
    expect(focus.snapshot.transitionReason).toBe(
      'double-close-release-enter-focus',
    );
  });

  it('uses palm-relative peak prominence rather than a raw pixel delta', () => {
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
          tipDistancePx: 140,
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
          tipDistancePx: 140,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 250,
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
      timestamp: 400,
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
          tipDistancePx: 120,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 500,
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
          tipDistancePx: 120,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 580,
    });
    expect(smallReopen.nextState).toBeNull();
    expect(smallReopen.snapshot.doubleCloseCount).toBe(1);
    expect(smallReopen.snapshot.transitionReason).toBe('double-close-peak-ready');

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
      timestamp: 660,
    });
    const secondClose = step({
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
      timestamp: 760,
    });

    expect(secondClose.nextState).toBeNull();
    expect(secondClose.snapshot.doubleCloseCount).toBe(2);

    step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 640,
          centerY: 360,
          pinchX: 640,
          pinchY: 360,
          tipDistancePx: 120,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 820,
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
          tipDistancePx: 120,
          palmScale: 0.18,
        }),
      ],
      targets,
      timestamp: 900,
    });

    expect(focus.nextState).toBe('PlanetFocusView');
    expect(focus.snapshot.doubleCloseCount).toBe(2);
    expect(focus.snapshot.transitionReason).toBe(
      'double-close-release-enter-focus',
    );
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
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 250,
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
      timestamp: 400,
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

  it.each([
    { label: 'unequal depths', valley1: 0.126, valley2: 0.25, peak: 0.75 },
    { label: 'two deep closes', valley1: 0.1, valley2: 0.08, peak: 0.7 },
    { label: 'two shallow closes', valley1: 0.32, valley2: 0.3, peak: 0.6 },
  ])('accepts $label from a two-frame valley-peak-valley sequence', (gesture) => {
    const result = runDoubleClose({
      valley1: gesture.valley1,
      valley2: gesture.valley2,
      peak: gesture.peak,
      valleyFrames: 2,
    });

    expect(result.activated.nextState).toBe('PlanetActivated');
    expect(result.firstClose.snapshot.doubleCloseCount).toBe(1);
    expect(result.peakReady.snapshot.doubleClosePeakRatio).toBeCloseTo(
      gesture.peak,
      3,
    );
    expect(result.secondClose.snapshot.doubleCloseCount).toBe(2);
    expect(result.secondClose.snapshot.doubleCloseProminence).toBeGreaterThanOrEqual(
      0.25,
    );
    expect(result.focus.nextState).toBe('PlanetFocusView');
  });

  it('is invariant to palm scale because DoubleClose uses ratio only', () => {
    const farHand = runDoubleClose({
      valley1: 0.2,
      valley2: 0.28,
      palmScale: 0.07,
    });
    const nearHand = runDoubleClose({
      valley1: 0.2,
      valley2: 0.28,
      palmScale: 0.19,
    });

    expect(farHand.secondClose.snapshot.doubleCloseCount).toBe(2);
    expect(nearHand.secondClose.snapshot.doubleCloseCount).toBe(2);
    expect(farHand.focus.nextState).toBe('PlanetFocusView');
    expect(nearHand.focus.nextState).toBe('PlanetFocusView');
  });

  it('rejects high-frequency 0.30-0.45 jitter without a prominent peak', () => {
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
      hands: [handAtPixel(640, 360, 0.7)],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.7)],
      targets,
      timestamp: 253,
    });

    let last = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.3)],
      targets,
      timestamp: 300,
    });
    const jitter = [0.34, 0.41, 0.31, 0.45, 0.33, 0.4, 0.3, 0.44];
    jitter.forEach((ratio, index) => {
      last = step({
        controller,
        state: 'PlanetActivated',
        hands: [handAtPixel(640, 360, ratio)],
        targets,
        timestamp: 333 + index * 33,
      });
    });

    expect(last.snapshot.doubleCloseCount).toBe(1);
    expect(last.nextState).not.toBe('PlanetFocusView');
    expect(last.snapshot.doubleClosePeakRatio ?? 0).toBeLessThan(0.5);
  });

  it('keeps a recognized first close when hand jitter stays locked and a neighbour drifts underneath', () => {
    const controller = new PlanetActivationController();
    const targets = [
      target('jupiter', 560, 360, 60),
      target('saturn', 760, 360, 100),
    ];
    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(560, 360, 0.1)],
      targets,
      timestamp: 0,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(560, 360, 0.7)],
      targets,
      timestamp: 220,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(560, 360, 0.7)],
      targets,
      timestamp: 253,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(560, 360, 0.2)],
      targets,
      timestamp: 300,
    });
    const drifted = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(575, 360, 0.2)],
      targets: [
        target('jupiter', 760, 360, 60),
        target('saturn', 575, 360, 100),
      ],
      timestamp: 333,
    });

    expect(drifted.snapshot.activatedBody).toBe('jupiter');
    expect(drifted.snapshot.hoveredBody).toBe('jupiter');
    expect(drifted.snapshot.doubleCloseCount).toBe(1);
    expect(drifted.snapshot.hoverPointKind).toBe('pinchMidpoint');
    expect(drifted.snapshot.activationMotionPhase).toBe('Locked');
    expect(drifted.snapshot.handDisplacement).toBeLessThan(
      drifted.snapshot.handLockRadius,
    );
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

  it('does not switch while a closed hand is still traversing into a neighbour hit zone', () => {
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
    expect(mars.snapshot.hoveredBody).toBe('earth');
    expect(mars.snapshot.activatedBody).toBe('earth');
    expect(mars.snapshot.doubleCloseCount).toBe(0);
    expect(mars.snapshot.hoverPointKind).toBe('pinchMidpoint');

    const stillTraversing = step({
      controller,
      state: 'PlanetActivated',
      hands: [
        handWithPinchMidpoint({
          centerX: 820,
          centerY: 360,
          pinchX: 820,
          pinchY: 360,
          tipDistancePx: 42,
        }),
      ],
      targets,
      timestamp: 66,
    });
    expect(stillTraversing.snapshot.activationMotionPhase).toBe('Seeking');
    expect(stillTraversing.snapshot.settleFrameCount).toBe(0);
  });

  it('uses wrist translation to switch only after the hand settles on the neighbour', () => {
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

    for (const [timestamp, x] of [
      [33, 690],
      [66, 735],
      [99, 780],
    ] as const) {
      const crossing = step({
        controller,
        state: 'PlanetActivated',
        hands: [handAtPixel(x, 360, 0.2)],
        targets,
        timestamp,
      });
      expect(crossing.snapshot.activatedBody).toBe('earth');
      expect(crossing.snapshot.activationMotionPhase).toBe(
        timestamp < 99 ? 'Locked' : 'Seeking',
      );
    }

    const settling1 = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(780, 360, 0.2)],
      targets,
      timestamp: 132,
    });
    const settling2 = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(780, 360, 0.2)],
      targets,
      timestamp: 165,
    });
    const switched = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(780, 360, 0.2)],
      targets,
      timestamp: 198,
    });

    expect(settling1.snapshot.activatedBody).toBe('earth');
    expect(settling2.snapshot.activatedBody).toBe('earth');
    expect(switched.snapshot.activatedBody).toBe('mars');
    expect(switched.snapshot.activationMotionPhase).toBe('Locked');
    expect(switched.snapshot.settleTarget).toBe('mars');
    expect(switched.snapshot.transitionReason).toBe(
      'activation-switched-body-after-hand-settle',
    );
  });

  it('commits only the final body after moving continuously across a dense row', () => {
    const controller = new PlanetActivationController();
    const targets = [
      target('mercury', 420, 360, 64),
      target('venus', 560, 360, 64),
      target('mars', 700, 360, 64),
    ];

    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(420, 360, 0.12)],
      targets,
      timestamp: 0,
    });

    for (const [timestamp, x] of [
      [33, 500],
      [66, 575],
      [99, 650],
      [132, 700],
    ] as const) {
      const crossing = step({
        controller,
        state: 'PlanetActivated',
        hands: [handAtPixel(x, 360, 0.28)],
        targets,
        timestamp,
      });
      expect(crossing.snapshot.activatedBody).toBe('mercury');
      expect(crossing.snapshot.activatedBody).not.toBe('venus');
    }

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(700, 360, 0.28)],
      targets,
      timestamp: 165,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(700, 360, 0.28)],
      targets,
      timestamp: 198,
    });
    const landed = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(700, 360, 0.28)],
      targets,
      timestamp: 231,
    });

    expect(landed.snapshot.activatedBody).toBe('mars');
    expect(landed.snapshot.transitionReason).toBe(
      'activation-switched-body-after-hand-settle',
    );
  });

  it('keeps activation locked when targets drift but the relaxed hand stays near its anchor', () => {
    const controller = new PlanetActivationController();
    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.12)],
      targets: [
        target('earth', 640, 360, 72),
        target('mars', 800, 360, 72),
      ],
      timestamp: 0,
    });

    let locked = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(650, 360, 0.3)],
      targets: [
        target('earth', 860, 360, 72),
        target('mars', 650, 360, 100),
      ],
      timestamp: 400,
    });
    locked = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(658, 360, 0.3)],
      targets: [
        target('earth', 920, 360, 72),
        target('mars', 658, 360, 100),
      ],
      timestamp: 1400,
    });

    expect(locked.nextState).toBeNull();
    expect(locked.snapshot.activatedBody).toBe('earth');
    expect(locked.snapshot.hoveredBody).toBe('earth');
    expect(locked.snapshot.activationMotionPhase).toBe('Locked');
    expect(locked.snapshot.settleTarget).toBeNull();
  });

  it('cancels after a naturally relaxed hand moves to empty space and settles', () => {
    const controller = new PlanetActivationController();
    const targets = [
      target('earth', 420, 360, 72),
      target('mars', 620, 360, 72),
    ];
    step({
      controller,
      state: 'SolarActive',
      hands: [handAtPixel(420, 360, 0.12)],
      targets,
      timestamp: 0,
    });

    for (const [timestamp, x] of [
      [33, 560],
      [66, 760],
      [99, 1000],
    ] as const) {
      const moving = step({
        controller,
        state: 'PlanetActivated',
        hands: [handAtPixel(x, 360, 0.3)],
        targets,
        timestamp,
      });
      expect(moving.snapshot.activatedBody).toBe('earth');
    }

    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1000, 360, 0.3)],
      targets,
      timestamp: 132,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1000, 360, 0.3)],
      targets,
      timestamp: 165,
    });
    const emptyDwell = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1000, 360, 0.3)],
      targets,
      timestamp: 198,
    });
    expect(emptyDwell.snapshot.settleTarget).toBe('empty');
    expect(emptyDwell.snapshot.activatedBody).toBe('earth');

    const cancelled = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(1000, 360, 0.3)],
      targets,
      timestamp: 363,
    });
    expect(cancelled.nextState).toBe('SolarActive');
    expect(cancelled.snapshot.activatedBody).toBeNull();
    expect(cancelled.snapshot.pinchRatio).toBeCloseTo(0.3, 2);
    expect(cancelled.snapshot.transitionReason).toBe(
      'activation-cancelled-after-empty-settle',
    );
  });

  it('allows a deliberate stationary open hand to cancel without moving', () => {
    const controller = new PlanetActivationController();
    const targets = [target('earth', 640, 360, 72)];
    step({
      controller,
      state: 'SolarFreeHover',
      hands: [handAtPixel(640, 360, 0.12)],
      targets,
      timestamp: 0,
    });
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.6)],
      targets,
      timestamp: 33,
    });
    const pending = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.6)],
      targets,
      timestamp: 100,
    });
    const cancelled = step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.6)],
      targets,
      timestamp: 520,
    });

    expect(pending.snapshot.activationMotionPhase).toBe('Locked');
    expect(pending.snapshot.activatedBody).toBe('earth');
    expect(cancelled.nextState).toBe('BodyHover');
    expect(cancelled.snapshot.activatedBody).toBeNull();
    expect(cancelled.snapshot.transitionReason).toBe(
      'activation-cancelled-by-stationary-open-release',
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

  it('does not let a small thumb-index pixel gap alone (open fingers, hand far away) count as a close', () => {
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

    // Arm the double-close detector with a real open.
    step({
      controller,
      state: 'PlanetActivated',
      hands: [handAtPixel(640, 360, 0.8)],
      targets,
      timestamp: 220,
    });

    // Hand held far from the camera: the thumb-index PIXEL gap is tiny (<= the old 56px "closed"
    // threshold), but the fingers are mid-open in palm-relative terms (ratio ~0.39, above the 0.33
    // closed ratio). The old pixel-OR test counted this as a close and could march into focus; the
    // ratio-only test must keep doubleCloseCount at 0.
    const farAmbiguousHand = () =>
      handWithPinchMidpoint({
        centerX: 640,
        centerY: 360,
        pinchX: 640,
        pinchY: 360,
        tipDistancePx: 50,
        palmScale: 0.10,
      });

    let last = activated;
    for (let i = 0; i < 10; i += 1) {
      last = step({
        controller,
        state: 'PlanetActivated',
        hands: [farAmbiguousHand()],
        targets,
        timestamp: 320 + i * 90,
      });
    }

    expect(last.snapshot.activatedBody).toBe('earth');
    expect(last.snapshot.doubleCloseCount).toBe(0);
    expect(last.nextState).not.toBe('PlanetFocusView');
  });
});
