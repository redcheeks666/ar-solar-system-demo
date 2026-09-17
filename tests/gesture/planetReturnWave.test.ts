import { describe, expect, it } from 'vitest';
import {
  getReturnWaveReacquireRadius,
  PlanetReturnWaveController,
  RETURN_WAVE_ARM_DELAY_MS,
  RETURN_WAVE_MAX_REACQUIRE_RADIUS,
  RETURN_WAVE_MIN_DISPLACEMENT,
  RETURN_WAVE_MIN_PEAK_SPEED,
  RETURN_WAVE_MIN_TERMINAL_IMPULSE_SPEED,
} from '../../src/interaction/planetReturnWave';
import type { FocusedCelestialBodyScreenTarget } from '../../src/solar/solarSystem';
import type {
  InteractionState,
  NormalizedPoint,
  TrackedHand,
} from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { TEST_LAYOUT } from '../helpers/testCamera';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';

const FOCUS_TARGET: FocusedCelestialBodyScreenTarget = {
  id: 'earth',
  screenPosition: { x: 640, y: 360 },
  visible: true,
  bodyRadiusPx: 70,
  hitRadiusPx: 100,
  layout: TEST_LAYOUT,
};

const VALID_UPPER_LEFT_PATH = [
  point(0.58, 0.82),
  point(0.65, 0.73),
  point(0.73, 0.63),
  point(0.81, 0.53),
  point(0.89, 0.43),
];

function openHandAt(
  center: NormalizedPoint,
  side: TrackedHand['side'] = 'right',
): TrackedHand {
  const hand = createHand({ center, spread: 2.4 });
  hand.side = side;
  return hand;
}

function closedHandAt(center: NormalizedPoint): TrackedHand {
  const hand = createHand({ center, spread: 0.1 });
  hand.side = 'right';
  return hand;
}

function update(
  controller: PlanetReturnWaveController,
  input: {
    timestamp: number;
    hands?: TrackedHand[];
    state?: InteractionState;
    target?: FocusedCelestialBodyScreenTarget | null;
  },
) {
  return controller.update({
    tracking: createTrackingSnapshot(input.hands ?? []),
    interactionState: input.state ?? 'PlanetFocusView',
    target: input.target === undefined ? FOCUS_TARGET : input.target,
    layout: TEST_LAYOUT,
    timestamp: input.timestamp,
  });
}

function runPath(input: {
  controller: PlanetReturnWaveController;
  centers: NormalizedPoint[];
  state?: InteractionState;
  startedAt?: number;
  intervalMs?: number;
  handAt?: (center: NormalizedPoint, index: number) => TrackedHand;
}) {
  const startedAt = input.startedAt ?? 0;
  const intervalMs = input.intervalMs ?? 33;
  return input.centers.map((center, index) =>
    update(input.controller, {
      timestamp: startedAt + index * intervalMs,
      hands: [input.handAt?.(center, index) ?? openHandAt(center)],
      state: input.state,
    }),
  );
}

function armFloating(
  controller: PlanetReturnWaveController,
  hand = openHandAt(VALID_UPPER_LEFT_PATH[0]),
): number {
  update(controller, {
    timestamp: 0,
    state: 'PlanetFocusFloating',
    hands: [hand],
  });
  update(controller, {
    timestamp: RETURN_WAVE_ARM_DELAY_MS,
    state: 'PlanetFocusFloating',
    hands: [hand],
  });
  return RETURN_WAVE_ARM_DELAY_MS;
}

describe('PlanetReturnWaveController', () => {
  it('accepts a high-impulse upper-left throw that finishes away from the body', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: VALID_UPPER_LEFT_PATH,
    });
    const triggered = outputs.find((output) => output.triggered);

    expect(triggered?.snapshot).toMatchObject({
      state: 'Triggered',
      cornerDirection: 'upper-left',
      reason: 'fast-away-from-body-throw-return',
      triggered: true,
    });
    expect(triggered?.snapshot.peakSpeed).toBeGreaterThanOrEqual(
      RETURN_WAVE_MIN_PEAK_SPEED,
    );
    expect(triggered?.snapshot.displacement).toBeGreaterThanOrEqual(
      RETURN_WAVE_MIN_DISPLACEMENT,
    );
    expect(triggered?.snapshot.bodyDistanceTrend).toBeGreaterThan(0);
    expect(triggered?.snapshot.stableFrames).toBeGreaterThanOrEqual(3);

    const latched = update(controller, {
      timestamp: 250,
      hands: [openHandAt(point(0.95, 0.35))],
    });
    expect(latched.triggered).toBe(false);
    expect(latched.snapshot.reason).toBe('return-already-triggered');
  });

  it('accepts the mirrored upper-right throw without regressing its diagnostic sector', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: [
        point(0.42, 0.82),
        point(0.35, 0.73),
        point(0.27, 0.63),
        point(0.19, 0.53),
        point(0.11, 0.43),
      ],
    });

    expect(outputs.find((output) => output.triggered)?.snapshot.cornerDirection).toBe(
      'upper-right',
    );
  });

  it('accepts a fast lower-right throw that ends moving away from the body', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: [
        point(0.75, 0.25),
        point(0.68, 0.35),
        point(0.61, 0.45),
        point(0.54, 0.55),
        point(0.47, 0.65),
        point(0.4, 0.75),
      ],
    });
    const triggered = outputs.find((output) => output.triggered);

    expect(triggered?.snapshot).toMatchObject({
      cornerDirection: 'lower-right',
      reason: 'fast-away-from-body-throw-return',
      triggered: true,
    });
    expect(triggered?.snapshot.directionAngleDeg).toBeGreaterThan(0);
    expect(triggered?.snapshot.directionAngleDeg).toBeLessThan(90);
    expect(triggered?.snapshot.bodyDistanceTrend).toBeGreaterThan(0);
  });

  it('accepts coherent fast downward and horizontal throws when they finish away', () => {
    const cases = [
      {
        direction: 'down',
        centers: Array.from({ length: 6 }, (_, index) =>
          point(0.35, 0.15 + index * 0.12),
        ),
      },
      {
        direction: 'right',
        centers: Array.from({ length: 6 }, (_, index) =>
          point(0.75 - index * 0.07, 0.8),
        ),
      },
    ] as const;

    cases.forEach(({ direction, centers }) => {
      const controller = new PlanetReturnWaveController();
      const outputs = runPath({ controller, centers: [...centers] });
      const triggered = outputs.find((output) => output.triggered);

      expect(triggered?.snapshot.cornerDirection).toBe(direction);
      expect(triggered?.snapshot.bodyDistanceTrend).toBeGreaterThan(0);
    });
  });

  it('runs in PlanetFocusView but remains disabled in PlanetFocusControlled', () => {
    const viewController = new PlanetReturnWaveController();
    const viewOutputs = runPath({
      controller: viewController,
      centers: VALID_UPPER_LEFT_PATH,
      state: 'PlanetFocusView',
    });
    expect(viewOutputs.some((output) => output.triggered)).toBe(true);

    const controlledController = new PlanetReturnWaveController();
    const controlledOutputs = runPath({
      controller: controlledController,
      centers: VALID_UPPER_LEFT_PATH,
      state: 'PlanetFocusControlled',
    });
    expect(controlledOutputs.some((output) => output.triggered)).toBe(false);
    expect(controlledOutputs.at(-1)?.snapshot.reason).toBe('inactive-state');
  });

  it('keeps the 250ms post-place-down arm delay in PlanetFocusFloating', () => {
    const controller = new PlanetReturnWaveController();
    const earlyOutputs = runPath({
      controller,
      centers: VALID_UPPER_LEFT_PATH,
      state: 'PlanetFocusFloating',
      intervalMs: 33,
    });
    expect(earlyOutputs.some((output) => output.triggered)).toBe(false);
    expect(earlyOutputs.at(-1)?.snapshot.state).toBe('Arming');

    const armedController = new PlanetReturnWaveController();
    const startedAt = armFloating(armedController);
    const armedOutputs = runPath({
      controller: armedController,
      centers: VALID_UPPER_LEFT_PATH,
      state: 'PlanetFocusFloating',
      startedAt,
    });
    expect(armedOutputs.some((output) => output.triggered)).toBe(true);
  });

  it('rejects a fast diagonal stroke whose physical origin is inside the body hit zone', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: [
        point(0.5, 0.5),
        point(0.58, 0.42),
        point(0.66, 0.34),
        point(0.74, 0.26),
        point(0.82, 0.18),
      ],
    });

    expect(outputs.some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.reason).toBe(
      'sweep-start-inside-body-clearance',
    );
  });

  it('rejects a slow reach toward the body even after it accumulates large travel', () => {
    const controller = new PlanetReturnWaveController();
    const centers = Array.from({ length: 10 }, (_, index) =>
      point(0.15 + index * 0.05, 0.9 - index * 0.05),
    );
    const outputs = runPath({
      controller,
      centers,
      intervalMs: 100,
    });
    const lost = update(controller, {
      timestamp: centers.length * 100,
      hands: [],
    });

    expect([...outputs, lost].some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.peakSpeed).toBeLessThanOrEqual(1.5);
    expect(lost.snapshot.reason).toBe('tracking-gap-held-for-reacquire');
  });

  it('rejects slowly lowering an open hand toward the side of the body', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: Array.from({ length: 9 }, (_, index) =>
        point(0.35, 0.15 + index * 0.08),
      ),
      intervalMs: 100,
    });

    expect(outputs.some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.peakSpeed).toBeLessThanOrEqual(1.5);
  });

  it('completes a detector-sparse single-step throw when the hand disappears next', () => {
    const controller = new PlanetReturnWaveController();
    update(controller, {
      timestamp: 0,
      hands: [openHandAt(point(0.8, 0.85))],
    });
    const impulse = update(controller, {
      timestamp: 33,
      hands: [openHandAt(point(0.48, 0.48))],
    });
    const lost = update(controller, { timestamp: 66, hands: [] });

    expect(impulse.triggered).toBe(false);
    expect(impulse.snapshot).toMatchObject({
      stableFrames: 2,
      handReady: true,
      reason: 'collecting-motion-evidence',
    });
    expect(impulse.snapshot.displacement).toBeGreaterThanOrEqual(0.5);
    expect(impulse.snapshot.peakSpeed).toBeGreaterThanOrEqual(15);
    expect(lost).toMatchObject({
      triggered: true,
      snapshot: {
        state: 'Triggered',
        stableFrames: 2,
        reason: 'fast-away-from-body-throw-ended-on-tracking-loss',
      },
    });
  });

  it('completes a high-speed coherent burst lost in the middle of the frame', () => {
    const controller = new PlanetReturnWaveController();
    const middleEndpoint = point(0.45, 0.49);
    update(controller, {
      timestamp: 0,
      hands: [openHandAt(point(0.75, 0.85))],
    });
    update(controller, {
      timestamp: 33,
      hands: [openHandAt(point(0.735, 0.805))],
    });
    const bridged = update(controller, {
      timestamp: 66,
      hands: [openHandAt(middleEndpoint)],
    });
    const lost = update(controller, { timestamp: 99, hands: [] });

    expect(middleEndpoint.x).toBeGreaterThan(0.1);
    expect(middleEndpoint.x).toBeLessThan(0.9);
    expect(middleEndpoint.y).toBeGreaterThan(0.1);
    expect(middleEndpoint.y).toBeLessThan(0.9);
    expect(bridged.snapshot.stableFrames).toBe(3);
    expect(bridged.snapshot.displacement).toBeGreaterThanOrEqual(0.5);
    expect(bridged.snapshot.peakSpeed).toBeGreaterThanOrEqual(15);
    expect(lost.triggered).toBe(true);
    expect(lost.snapshot.reason).toBe(
      'fast-away-from-body-throw-ended-on-tracking-loss',
    );
  });

  it('rebuilds a candidate after an edge-origin stroke enters the safe frame interior', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: [
        point(0.97, 0.88),
        point(0.94, 0.82),
        point(0.9, 0.75),
        point(0.78, 0.64),
        point(0.62, 0.52),
        point(0.46, 0.4),
        point(0.3, 0.28),
        point(0.14, 0.18),
      ],
    });

    expect(
      outputs.some(
        (output) =>
          output.snapshot.reason === 'sweep-start-too-close-to-frame-edge',
      ),
    ).toBe(true);
    expect(outputs.some((output) => output.triggered)).toBe(true);
  });

  it('rejects a fast open-hand reach that keeps getting closer to the body', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: [
        point(0.9, 0.85),
        point(0.82, 0.78),
        point(0.74, 0.71),
        point(0.66, 0.64),
        point(0.58, 0.57),
        point(0.5, 0.5),
      ],
    });

    expect(outputs.some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.bodyDistanceTrend).toBeLessThanOrEqual(0);
    expect(outputs.at(-1)?.snapshot.reason).toBe('sweep-ending-toward-body');
  });

  it('does not turn a terminal-impulse reach toward the body into a return on hand loss', () => {
    const controller = new PlanetReturnWaveController();
    update(controller, {
      timestamp: 0,
      hands: [openHandAt(point(0.1, 0.9))],
    });
    const impulse = update(controller, {
      timestamp: 33,
      hands: [openHandAt(point(0.28, 0.75))],
    });
    const lost = update(controller, { timestamp: 66, hands: [] });

    expect(impulse.snapshot.peakSpeed).toBeGreaterThanOrEqual(
      RETURN_WAVE_MIN_TERMINAL_IMPULSE_SPEED,
    );
    expect(impulse.snapshot.displacement).toBeGreaterThanOrEqual(
      RETURN_WAVE_MIN_DISPLACEMENT,
    );
    expect(lost.triggered).toBe(false);
    expect(lost.snapshot.reason).toBe('tracking-gap-held-for-reacquire');
  });

  it('bridges three lost frames, counts the cross-gap impulse, and accepts an off-screen endpoint', () => {
    const controller = new PlanetReturnWaveController();
    update(controller, {
      timestamp: 0,
      hands: [openHandAt(point(0.58, 0.82))],
    });
    update(controller, {
      timestamp: 33,
      hands: [openHandAt(point(0.65, 0.73))],
    });
    update(controller, {
      timestamp: 66,
      hands: [openHandAt(point(0.72, 0.64))],
    });
    update(controller, { timestamp: 99, hands: [] });
    update(controller, { timestamp: 132, hands: [] });
    update(controller, { timestamp: 165, hands: [] });
    const reacquired = update(controller, {
      timestamp: 198,
      hands: [openHandAt(point(1.08, 0.18))],
    });

    expect(reacquired.triggered).toBe(true);
    expect(reacquired.snapshot.stableFrames).toBe(4);
    expect(reacquired.snapshot.peakSpeed).toBeGreaterThanOrEqual(
      RETURN_WAVE_MIN_PEAK_SPEED,
    );
    expect(reacquired.snapshot.displacement).toBeGreaterThanOrEqual(0.5);
  });

  it('counts a validated visible-frame jump in displacement, peak speed, and stable frames', () => {
    const controller = new PlanetReturnWaveController();
    update(controller, {
      timestamp: 0,
      hands: [openHandAt(point(0.75, 0.85))],
    });
    update(controller, {
      timestamp: 33,
      hands: [openHandAt(point(0.735, 0.805))],
    });
    const bridged = update(controller, {
      timestamp: 66,
      hands: [openHandAt(point(0.45, 0.49))],
    });

    expect(bridged.snapshot.stableFrames).toBe(3);
    expect(bridged.snapshot.displacement).toBeGreaterThanOrEqual(0.5);
    expect(bridged.snapshot.peakSpeed).toBeGreaterThanOrEqual(15);
    expect(bridged.snapshot.peakSpeed).toBeGreaterThanOrEqual(
      RETURN_WAVE_MIN_TERMINAL_IMPULSE_SPEED,
    );
  });

  it('rejects a large identity jump when palm scale changes abruptly', () => {
    const controller = new PlanetReturnWaveController();
    const start = openHandAt(point(0.8, 0.85));
    const noisyEndpoint = openHandAt(point(0.48, 0.48));
    noisyEndpoint.palmScale = start.palmScale * 2;

    const outputs = [
      update(controller, { timestamp: 0, hands: [start] }),
      update(controller, { timestamp: 33, hands: [noisyEndpoint] }),
      update(controller, { timestamp: 66, hands: [] }),
    ];

    expect(outputs.some((output) => output.triggered)).toBe(false);
  });

  it('rejects a large identity jump that reverses the established direction', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = [
      update(controller, {
        timestamp: 0,
        hands: [openHandAt(point(0.58, 0.82))],
      }),
      update(controller, {
        timestamp: 33,
        hands: [openHandAt(point(0.6, 0.84))],
      }),
      update(controller, {
        timestamp: 66,
        hands: [openHandAt(point(0.2, 0.3))],
      }),
      update(controller, { timestamp: 99, hands: [] }),
    ];

    expect(outputs.some((output) => output.triggered)).toBe(false);
  });

  it('rejects palm-scale and direction discontinuities across a tracking gap', () => {
    const invalidReacquisitions = [
      (hand: TrackedHand) => {
        hand.palmScale *= 2;
        return hand;
      },
      () => openHandAt(point(0.48, 0.94)),
    ];

    invalidReacquisitions.forEach((makeInvalidHand) => {
      const controller = new PlanetReturnWaveController();
      update(controller, {
        timestamp: 0,
        hands: [openHandAt(point(0.58, 0.82))],
      });
      update(controller, {
        timestamp: 33,
        hands: [openHandAt(point(0.65, 0.73))],
      });
      update(controller, { timestamp: 66, hands: [] });
      const invalid = makeInvalidHand(openHandAt(point(0.85, 0.5)));
      const reacquired = update(controller, {
        timestamp: 99,
        hands: [invalid],
      });

      expect(reacquired.triggered).toBe(false);
      expect(reacquired.snapshot.stableFrames).toBeLessThan(3);
    });
  });

  it('prefers the palm-scale and direction-continuous candidate over a closer duplicate', () => {
    const controller = new PlanetReturnWaveController();
    update(controller, {
      timestamp: 0,
      hands: [openHandAt(point(0.58, 0.82))],
    });
    update(controller, {
      timestamp: 33,
      hands: [openHandAt(point(0.65, 0.73))],
    });
    update(controller, { timestamp: 66, hands: [] });
    const duplicate = openHandAt(point(0.66, 0.74));
    duplicate.palmScale *= 2;
    const reacquired = update(controller, {
      timestamp: 99,
      hands: [duplicate, openHandAt(point(0.85, 0.5))],
    });

    expect(reacquired.triggered).toBe(true);
    expect(reacquired.snapshot.stableFrames).toBe(3);
    expect(reacquired.snapshot.bodyDistanceTrend).toBeGreaterThan(0);
  });

  it('caps the 150ms spatial reacquisition radius below one preview short side', () => {
    expect(getReturnWaveReacquireRadius(150)).toBe(
      RETURN_WAVE_MAX_REACQUIRE_RADIUS,
    );
    expect(getReturnWaveReacquireRadius(150)).toBeLessThan(1);
    expect(getReturnWaveReacquireRadius(10_000)).toBe(
      RETURN_WAVE_MAX_REACQUIRE_RADIUS,
    );
  });

  it('keeps hand shape diagnostic while body-relative geometry rejects a closed-hand reach', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: [
        point(0.9, 0.85),
        point(0.82, 0.78),
        point(0.74, 0.71),
        point(0.66, 0.64),
        point(0.58, 0.57),
        point(0.5, 0.5),
      ],
      handAt: (center) => closedHandAt(center),
    });

    expect(outputs.some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.openHandScore).toBeLessThan(0.5);
    expect(outputs.at(-1)?.snapshot.reason).toBe('sweep-ending-toward-body');
  });

  it('tracks by spatial trajectory despite handedness flips, array reorder, and a static off-hand', () => {
    const controller = new PlanetReturnWaveController();
    const staticHand = openHandAt(point(0.2, 0.92), 'left');
    const outputs = VALID_UPPER_LEFT_PATH.map((center, index) => {
      const movingHand = openHandAt(
        center,
        index % 2 === 0 ? 'right' : 'left',
      );
      return update(controller, {
        timestamp: index * 33,
        hands:
          index % 2 === 0
            ? [staticHand, movingHand]
            : [movingHand, staticHand],
      });
    });
    const triggered = outputs.find((output) => output.triggered);

    expect(triggered).toBeDefined();
    expect(triggered?.handKey).toMatch(/^return-hand-\d+$/);
    expect(triggered?.snapshot.peakSpeed).toBeGreaterThan(
      triggered?.snapshot.netSpeed ?? 0,
    );
  });

  it('does not evaluate when the focused body target is unavailable', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = VALID_UPPER_LEFT_PATH.map((center, index) =>
      update(controller, {
        timestamp: index * 33,
        hands: [openHandAt(center)],
        target: null,
      }),
    );

    expect(outputs.some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.reason).toBe(
      'focused-body-target-unavailable',
    );
  });
});
