import { describe, expect, it } from 'vitest';
import {
  PlanetReturnWaveController,
  RETURN_WAVE_ARM_DELAY_MS,
  RETURN_WAVE_MIN_DISPLACEMENT,
  RETURN_WAVE_MIN_PEAK_SPEED,
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
  it('accepts a high-impulse, large upper-corner throw that finishes away from the body', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: VALID_UPPER_LEFT_PATH,
    });
    const triggered = outputs.find((output) => output.triggered);

    expect(triggered?.snapshot).toMatchObject({
      state: 'Triggered',
      cornerDirection: 'upper-left',
      reason: 'fast-upper-corner-throw-return',
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

  it('accepts the mirrored throw toward the upper-right corner', () => {
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

  it('rejects a slow diagonal reach even after it accumulates many frames and large travel', () => {
    const controller = new PlanetReturnWaveController();
    const centers = Array.from({ length: 10 }, (_, index) =>
      point(0.58 + index * 0.06, 0.82 - index * 0.06),
    );
    const outputs = runPath({
      controller,
      centers,
      intervalMs: 100,
    });

    expect(outputs.some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.peakSpeed).toBeLessThanOrEqual(1.5);
    expect(outputs.at(-1)?.snapshot.reason).toBe('peak-speed-too-low');
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
    expect(outputs.at(-1)?.snapshot.bodyDistanceTrend).toBeLessThan(0);
    expect(outputs.at(-1)?.snapshot.reason).toBe('sweep-ending-toward-body');
  });

  it('rejects fast horizontal, vertical, and downward motion', () => {
    const paths = [
      Array.from({ length: 6 }, (_, index) =>
        point(0.58 + index * 0.08, 0.82),
      ),
      Array.from({ length: 6 }, (_, index) =>
        point(0.75, 0.82 - index * 0.12),
      ),
      Array.from({ length: 6 }, (_, index) =>
        point(0.75 + index * 0.06, 0.35 + index * 0.08),
      ),
    ];

    paths.forEach((centers) => {
      const controller = new PlanetReturnWaveController();
      const outputs = runPath({ controller, centers });
      expect(outputs.some((output) => output.triggered)).toBe(false);
      expect(outputs.at(-1)?.snapshot.reason).toBe(
        'sweep-not-toward-upper-corner',
      );
    });
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

  it('uses an open-hand score only as a broad pinch/fist sanity check', () => {
    const controller = new PlanetReturnWaveController();
    const outputs = runPath({
      controller,
      centers: VALID_UPPER_LEFT_PATH,
      handAt: (center) => closedHandAt(center),
    });

    expect(outputs.some((output) => output.triggered)).toBe(false);
    expect(outputs.at(-1)?.snapshot.reason).toBe(
      'hand-looks-pinched-or-closed',
    );
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
