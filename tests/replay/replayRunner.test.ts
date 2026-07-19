import { describe, expect, it } from 'vitest';
import {
  captureReplayCamera,
  GESTURE_EXPORT_SCHEMA_VERSION,
  type GestureDebugExport,
  type GestureDebugFrame,
  type GestureReplayFrameContext,
} from '../../src/interaction/gestureDebugRecorder';
import type { TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { TEST_LAYOUT, createTestCamera } from '../helpers/testCamera';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';
import {
  extractGestureCurves,
  parseGestureDebugExport,
  replayPlanetActivationController,
  replayPlanetFocusController,
  replayPlanetReturnWave,
  replaySolarController,
} from './replayRunner';

const EMPTY_SOLAR_SNAPSHOT = {
  active: false,
  visible: false,
  progress: 0,
  scale: 1,
  reason: 'inactive',
  leftWorld: null,
  rightWorld: null,
  midpointWorld: null,
  normalizedDistance: null,
  startDistance: null,
  targetDistance: null,
};

const EMPTY_ENDPOINT = {
  mode: 'inactive' as const,
  reason: 'inactive',
  handLeftWorld: null,
  handRightWorld: null,
  referenceLeftWorld: null,
  referenceRightWorld: null,
  leftDistanceWorld: null,
  rightDistanceWorld: null,
  radiusWorld: null,
  score: 0,
  bothWithinRadius: false,
  stableMs: 0,
  stableRequiredMs: 500,
};

function replayContext(
  solarState: GestureReplayFrameContext['solar']['interactionState'],
  focus: GestureReplayFrameContext['planetFocus'] = null,
): GestureReplayFrameContext {
  return {
    solar: {
      interactionState: solarState,
      layout: TEST_LAYOUT,
      camera: captureReplayCamera(createTestCamera()),
      planeZ: 0,
      snapshot: EMPTY_SOLAR_SNAPSHOT,
      endpoint: EMPTY_ENDPOINT,
    },
    planetFocus: focus,
  };
}

function frame(input: {
  t: number;
  hands?: TrackedHand[];
  replay: GestureReplayFrameContext;
}): GestureDebugFrame {
  const hands = input.hands ?? [];

  return {
    t: input.t,
    tracking: {
      status: 'ready',
      detectedHands: hands.length,
      hands: hands.map((hand) => ({
        side: hand.side,
        handednessScore: hand.handednessScore,
        palmScale: hand.palmScale,
        center: hand.center,
        landmarks: hand.landmarks,
        worldLandmarks: hand.worldLandmarks,
      })),
    },
    primitives: {
      closeIntentScore: 0,
      pullIntentScore: 0,
    },
    calibration: {
      thresholds: DEFAULT_GESTURE_THRESHOLDS,
      averagePalmScale: null,
      closedDistance: null,
      comfortableOpenDistance: null,
      calibrated: false,
      reason: 'test',
    },
    startup: {
      state: input.replay.solar.interactionState,
      distance: null,
      velocity: null,
      closeIntentScore: 0,
      pullIntentScore: 0,
      transitionReason: 'test',
      bothHandsVisible: hands.length === 2,
      lostHandHoldActive: false,
    },
    wholeSystem: {
      controlConfidence: 0.61,
      reGripConfidence: 0.59,
      endpointHitScore: 0.7,
      pinchPenalty: 0.18,
      leftPinchRatio: 0.19,
      rightPinchRatio: 0.4,
      transitionReason: 'test',
    } as GestureDebugFrame['wholeSystem'],
    planetActivation: {
      transitionReason: 'test',
    } as GestureDebugFrame['planetActivation'],
    planetFocus: {
      pinchRatio: 0.39,
      pinchDistancePx: 58,
      transitionReason: 'single-hand-following',
    } as GestureDebugFrame['planetFocus'],
    performance: {} as GestureDebugFrame['performance'],
    replay: input.replay,
  };
}

function recording(frames: GestureDebugFrame[]): GestureDebugExport {
  return {
    version: GESTURE_EXPORT_SCHEMA_VERSION,
    createdAt: '2026-07-14T00:00:00.000Z',
    frameCount: frames.length,
    note: 'test',
    frames,
  };
}

describe('gesture replay runner', () => {
  it('replays pull-open through the product SolarOpeningController', () => {
    const frames = Array.from({ length: 100 }, (_, index) => {
      const distance = Math.min(0.25 + index * 0.05, 0.62);
      const half = distance / 2;
      return frame({
        t: index * 33,
        hands: [
          createHand({ center: point(0.5 + half, 0.5), spread: 1.4 }),
          createHand({ center: point(0.5 - half, 0.5), spread: 1.4 }),
        ],
        replay: replayContext('PullArmed'),
      });
    });

    const results = replaySolarController(recording(frames));

    expect(results.some((result) => result.stateAfter === 'SolarActive')).toBe(true);
    expect(results.some((result) => result.snapshot.visible)).toBe(true);
  });

  it('replays ratio-only DoubleClose through PlanetActivationController', () => {
    const target = {
      id: 'earth' as const,
      label: 'Earth',
      screenPosition: { x: 640, y: 360 },
      visible: true,
      hitRadiusPx: 72,
      originalOrbit: {
        parentId: null,
        orbitRadius: 1,
        orbitPhase: 0,
        localPosition: { x: 1, y: 0, z: 0 },
      },
    };
    const hand = (ratio: number) => {
      const tracked = createHand({ center: point(0.5, 0.5), spread: 1.2 });
      const halfDistance = (tracked.palmScale * ratio) / 2;
      tracked.thumbTip = point(0.5 - halfDistance, 0.5);
      tracked.indexFingerTip = point(0.5 + halfDistance, 0.5);
      tracked.landmarks[4] = tracked.thumbTip;
      tracked.landmarks[8] = tracked.indexFingerTip;
      return tracked;
    };
    const activationContext = (
      state: GestureReplayFrameContext['solar']['interactionState'],
    ) => {
      const context = replayContext(state);
      context.planetActivation = {
        interactionState: state,
        targets: [target],
      };
      return context;
    };
    const sequence = [
      [0, 0.1, 'SolarFreeHover'],
      [220, 0.75, 'PlanetActivated'],
      [253, 0.75, 'PlanetActivated'],
      [300, 0.126, 'PlanetActivated'],
      [333, 0.126, 'PlanetActivated'],
      [430, 0.75, 'PlanetActivated'],
      [463, 0.75, 'PlanetActivated'],
      [530, 0.25, 'PlanetActivated'],
      [563, 0.25, 'PlanetActivated'],
      [630, 0.75, 'PlanetActivated'],
      [665, 0.75, 'PlanetActivated'],
      [705, 0.75, 'PlanetActivated'],
    ] as const;
    const frames = sequence.map(([t, ratio, state]) =>
      frame({
        t,
        hands: [hand(ratio)],
        replay: activationContext(state),
      }),
    );

    const replay = replayPlanetActivationController(recording(frames));

    expect(replay.at(-1)?.stateAfter).toBe('PlanetFocusView');
    expect(replay.at(-1)?.snapshot.doubleCloseProminence).toBeCloseTo(0.5, 2);
  });

  it('replays anchored activation movement without switching transit bodies', () => {
    const targets = [
      {
        id: 'mercury' as const,
        label: 'Mercury',
        screenPosition: { x: 420, y: 360 },
        visible: true,
        hitRadiusPx: 64,
        originalOrbit: {
          parentId: null,
          orbitRadius: 0.5,
          orbitPhase: 0,
          localPosition: { x: 0.5, y: 0, z: 0 },
        },
      },
      {
        id: 'venus' as const,
        label: 'Venus',
        screenPosition: { x: 560, y: 360 },
        visible: true,
        hitRadiusPx: 64,
        originalOrbit: {
          parentId: null,
          orbitRadius: 0.75,
          orbitPhase: 0,
          localPosition: { x: 0.75, y: 0, z: 0 },
        },
      },
      {
        id: 'mars' as const,
        label: 'Mars',
        screenPosition: { x: 700, y: 360 },
        visible: true,
        hitRadiusPx: 64,
        originalOrbit: {
          parentId: null,
          orbitRadius: 1.25,
          orbitPhase: 0,
          localPosition: { x: 1.25, y: 0, z: 0 },
        },
      },
    ];
    const handAt = (screenX: number, ratio: number) => {
      const centerX = 1 - screenX / TEST_LAYOUT.stageWidth;
      const tracked = createHand({ center: point(centerX, 0.5), spread: 1.2 });
      const halfDistance = (tracked.palmScale * ratio) / 2;
      tracked.thumbTip = point(centerX - halfDistance, 0.5);
      tracked.indexFingerTip = point(centerX + halfDistance, 0.5);
      tracked.landmarks[4] = tracked.thumbTip;
      tracked.landmarks[8] = tracked.indexFingerTip;
      return tracked;
    };
    const activationContext = (
      state: GestureReplayFrameContext['solar']['interactionState'],
    ) => {
      const context = replayContext(state);
      context.planetActivation = { interactionState: state, targets };
      return context;
    };
    const sequence = [
      [0, 420, 'SolarFreeHover'],
      [33, 500, 'PlanetActivated'],
      [66, 575, 'PlanetActivated'],
      [99, 650, 'PlanetActivated'],
      [132, 700, 'PlanetActivated'],
      [165, 700, 'PlanetActivated'],
      [198, 700, 'PlanetActivated'],
      [231, 700, 'PlanetActivated'],
    ] as const;
    const replay = replayPlanetActivationController(
      recording(
        sequence.map(([t, x, state], index) =>
          frame({
            t,
            hands: [handAt(x, index === 0 ? 0.12 : 0.28)],
            replay: activationContext(state),
          }),
        ),
      ),
    );

    expect(replay.slice(0, -1).every(
      (result) => result.snapshot.activatedBody === 'mercury',
    )).toBe(true);
    expect(replay.some(
      (result) => result.snapshot.activatedBody === 'venus',
    )).toBe(false);
    expect(replay.at(-1)?.snapshot.activatedBody).toBe('mars');
    expect(replay.at(-1)?.snapshot.transitionReason).toBe(
      'activation-switched-body-after-hand-settle',
    );
  });

  it('replays focus entry, heat-zone clear, and single-hand dwell', () => {
    const target = {
      id: 'earth' as const,
      screenPosition: { x: 640, y: 360 },
      visible: true,
      bodyRadiusPx: 90,
      hitRadiusPx: 180,
      layout: TEST_LAYOUT,
    };
    const focus = {
      interactionState: 'PlanetFocusView' as const,
      focusedBody: 'earth' as const,
      target,
    };
    const hand = createHand({ center: point(0.5, 0.5), spread: 1.4 });
    const frames = [
      frame({ t: 0, replay: replayContext('SolarFreeHover', focus) }),
      ...Array.from({ length: 40 }, (_, index) =>
        frame({
          t: 33 + index * 33,
          hands: [hand],
          replay: replayContext('SolarFreeHover', focus),
        }),
      ),
    ];

    const results = replayPlanetFocusController(recording(frames));

    expect(
      results.some((result) => result.stateAfter === 'PlanetFocusControlled'),
    ).toBe(true);
    expect(
      results.some(
        (result) => result.snapshot.controlState === 'SingleHandFollow',
      ),
    ).toBe(true);
  });

  it('replays a recorder session that starts from PlanetFocusFloating', () => {
    const target = {
      id: 'earth' as const,
      screenPosition: { x: 640, y: 360 },
      visible: true,
      bodyRadiusPx: 90,
      hitRadiusPx: 180,
      layout: TEST_LAYOUT,
    };
    const focus = {
      interactionState: 'PlanetFocusFloating' as const,
      focusedBody: 'earth' as const,
      target,
    };
    const hand = createHand({ center: point(0.5, 0.5), spread: 1.4 });
    const frames = [
      frame({ t: 0, replay: replayContext('SolarFreeHover', focus) }),
      ...Array.from({ length: 40 }, (_, index) =>
        frame({
          t: 33 + index * 33,
          hands: [hand],
          replay: replayContext('SolarFreeHover', focus),
        }),
      ),
    ];

    const results = replayPlanetFocusController(recording(frames));

    expect(
      results.some((result) => result.stateAfter === 'PlanetFocusControlled'),
    ).toBe(true);
    expect(
      results.some(
        (result) => result.snapshot.controlState === 'SingleHandFollow',
      ),
    ).toBe(true);
  });

  it('replays return throws from PlanetFocusView with the recorded body target', () => {
    const target = {
      id: 'earth' as const,
      screenPosition: { x: 640, y: 360 },
      visible: true,
      bodyRadiusPx: 70,
      hitRadiusPx: 100,
      layout: TEST_LAYOUT,
    };
    const focus = {
      interactionState: 'PlanetFocusView' as const,
      focusedBody: 'earth' as const,
      target,
    };
    const centers = [
      point(0.58, 0.82),
      point(0.65, 0.73),
      point(0.73, 0.63),
      point(0.81, 0.53),
      point(0.89, 0.43),
    ];
    const frames = centers.map((center, index) =>
      frame({
        t: index * 33,
        hands: [createHand({ center, spread: 2.4 })],
        replay: replayContext('SolarFreeHover', focus),
      }),
    );

    const results = replayPlanetReturnWave(recording(frames));

    expect(results.some((result) => result.triggered)).toBe(true);
    expect(results.find((result) => result.triggered)?.inputState).toBe(
      'PlanetFocusView',
    );
  });

  it('extracts legacy and active endpoint curves without conflating them', () => {
    const first = frame({ t: 100, replay: replayContext('SolarFreeHover') });
    first.replay.solar.endpoint = {
      ...EMPTY_ENDPOINT,
      mode: 'enter',
      score: 0.82,
      stableMs: 330,
    };

    expect(extractGestureCurves(recording([first]))[0]).toMatchObject({
      legacyEndpointScore: 0.7,
      activeEndpointScore: 0.82,
      activeEndpointStableMs: 330,
      pinchPenalty: 0.18,
      focusPinchRatio: 0.39,
    });
  });

  it('rejects old schema logs with a re-record instruction', () => {
    expect(() =>
      parseGestureDebugExport(JSON.stringify({ version: 2, frames: [] })),
    ).toThrow(/Re-record/);
  });
});
