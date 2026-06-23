import { PerspectiveCamera } from 'three';
import {
  SolarInspectionController,
  type SolarInspectionUpdate,
} from '../src/interaction/solarInspectionController';
import { mapNormalizedToWorld } from '../src/interaction/coordinateMapping';
import { createSolarInspectionVerificationReport } from '../src/interaction/solarInspectionReport';
import type { SolarOpeningSnapshot } from '../src/interaction/solarOpeningController';
import {
  EMPTY_SOLAR_INSPECTION_VERIFICATION,
  updateSolarInspectionVerification,
} from '../src/interaction/solarInspectionVerification';
import { INTERACTION_PLANE_Z } from '../src/rendering/scene';
import type {
  NormalizedPoint,
  TrackedHand,
  TrackingSnapshot,
} from '../src/utils/types';

const layout = {
  stageWidth: 1280,
  stageHeight: 720,
  sourceWidth: 1280,
  sourceHeight: 720,
  mirrored: true,
};

const camera = new PerspectiveCamera(45, layout.stageWidth / layout.stageHeight, 0.1, 100);
camera.position.set(0, 0, 6);
camera.updateProjectionMatrix();
camera.updateMatrixWorld(true);

const baseSolarSnapshot: SolarOpeningSnapshot = {
  active: true,
  visible: true,
  progress: 1,
  scale: 1,
  reason: 'test-free-hover',
  leftWorld: { x: -1, y: 0, z: 0 },
  rightWorld: { x: 1, y: 0, z: 0 },
  midpointWorld: { x: 0, y: 0, z: 0 },
  normalizedDistance: 0.5,
  startDistance: 0.2,
  targetDistance: 0.5,
  rotationZ: 0,
};

const cases: Array<{
  name: string;
  run: () => void;
}> = [
  {
    name: 'inactive outside SolarFreeHover',
    run: () => {
      const controller = new SolarInspectionController();
      const update = step(controller, {
        state: 'SolarHandleControl',
        timestamp: 0,
        hand: createHand({ center: point(0.5, 0.5), spread: 1.4 }),
      });

      assert(update.snapshot.intent === 'inactive', 'expected inactive intent');
      assert(update.solarSnapshot.scale === 1, 'non-free-hover state must not scale');
      assert(update.solarSnapshot.midpointWorld?.x === 0, 'non-free-hover state must not pan');
    },
  },
  {
    name: 'requires exactly one hand',
    run: () => {
      const controller = new SolarInspectionController();
      const update = step(controller, {
        state: 'SolarFreeHover',
        timestamp: 0,
        hands: [
          createHand({ center: point(0.45, 0.5), spread: 1.1 }),
          createHand({ center: point(0.55, 0.5), spread: 1.1 }),
        ],
      });

      assert(update.snapshot.intent === 'idle', 'two hands should idle inspection');
      assert(
        update.snapshot.reason === 'waiting-for-exactly-one-hand',
        'two hands should report exact-one-hand wait',
      );
    },
  },
  {
    name: 'one-hand spread zooms in',
    run: () => {
      const controller = new SolarInspectionController();
      let solarSnapshot = baseSolarSnapshot;
      step(controller, {
        state: 'SolarFreeHover',
        timestamp: 0,
        hand: createHand({ center: point(0.5, 0.5), spread: 0.7 }),
        solarSnapshot,
      });
      const update = step(controller, {
        state: 'SolarFreeHover',
        timestamp: 100,
        hand: createHand({ center: point(0.5, 0.5), spread: 2.4 }),
        solarSnapshot,
      });

      assert(update.snapshot.intent === 'zoomIn', `expected zoomIn, got ${update.snapshot.intent}`);
      assert(update.solarSnapshot.scale > solarSnapshot.scale, 'spread should increase scale');
      assert(update.solarSnapshot.scale <= 1.17, 'zoom-in should respect the per-frame scale-rate cap');
      assert((update.snapshot.fingerSpreadVelocity ?? 0) > 0, 'spread velocity should be positive');
    },
  },
  {
    name: 'one-hand contraction zooms out',
    run: () => {
      const controller = new SolarInspectionController();
      const zoomedSnapshot = { ...baseSolarSnapshot, scale: 1.6 };
      step(controller, {
        state: 'SolarFreeHover',
        timestamp: 0,
        hand: createHand({ center: point(0.5, 0.5), spread: 2.4 }),
        solarSnapshot: zoomedSnapshot,
      });
      step(controller, {
        state: 'SolarFreeHover',
        timestamp: 180,
        hand: createHand({ center: point(0.5, 0.5), spread: 2.4 }),
        solarSnapshot: zoomedSnapshot,
      });
      const update = step(controller, {
        state: 'SolarFreeHover',
        timestamp: 320,
        hand: createHand({ center: point(0.5, 0.5), spread: 0.7 }),
        solarSnapshot: zoomedSnapshot,
      });

      assert(update.snapshot.intent === 'zoomOut', `expected zoomOut, got ${update.snapshot.intent}`);
      assert(update.solarSnapshot.scale < zoomedSnapshot.scale, 'contract should decrease scale');
      assert((update.snapshot.fingerSpreadVelocity ?? 0) < 0, 'spread velocity should be negative');
    },
  },
  {
    name: 'stable open-hand push pans',
    run: () => {
      const controller = new SolarInspectionController();
      let solarSnapshot = baseSolarSnapshot;
      step(controller, {
        state: 'SolarFreeHover',
        timestamp: 0,
        hand: createHand({ center: point(0.5, 0.5), spread: 1.5 }),
        solarSnapshot,
      });
      step(controller, {
        state: 'SolarFreeHover',
        timestamp: 80,
        hand: createHand({ center: point(0.54, 0.5), spread: 1.5 }),
        solarSnapshot,
      });
      const update = step(controller, {
        state: 'SolarFreeHover',
        timestamp: 200,
        hand: createHand({ center: point(0.6, 0.5), spread: 1.5 }),
        solarSnapshot,
      });

      assert(update.snapshot.intent === 'pan', `expected pan, got ${update.snapshot.intent}`);
      assert(update.snapshot.panScore > 0, 'pan should expose a positive pan score');
      assert(
        update.solarSnapshot.midpointWorld?.x !== solarSnapshot.midpointWorld?.x,
        'push should change midpoint x',
      );
    },
  },
  {
    name: 'pan offset is low-pass smoothed',
    run: () => {
      const controller = new SolarInspectionController();
      const startCenter = point(0.5, 0.5);
      const endCenter = point(0.548, 0.5);
      let update = step(controller, {
        state: 'SolarFreeHover',
        timestamp: 0,
        hand: createHand({ center: startCenter, spread: 1.5 }),
      });

      for (let index = 1; index <= 8; index += 1) {
        update = step(controller, {
          state: 'SolarFreeHover',
          timestamp: index * 16,
          hand: createHand({
            center: point(0.5 + index * 0.006, 0.5),
            spread: 1.5,
          }),
        });
      }
      const startWorld = mapNormalizedToWorld(
        startCenter,
        layout,
        camera,
        INTERACTION_PLANE_Z,
      );
      const endWorld = mapNormalizedToWorld(
        endCenter,
        layout,
        camera,
        INTERACTION_PLANE_Z,
      );

      assert(startWorld !== null && endWorld !== null, 'expected valid hand world points');
      assert(update.snapshot.intent === 'pan', `expected pan, got ${update.snapshot.intent}`);

      const fullHandDeltaX = endWorld.x - startWorld.x;
      const actualDeltaX =
        (update.solarSnapshot.midpointWorld?.x ?? 0) -
        (baseSolarSnapshot.midpointWorld?.x ?? 0);

      assert(Math.abs(actualDeltaX) > 0, 'smoothed pan should still move the midpoint');
      assert(
        Math.abs(actualDeltaX) < Math.abs(fullHandDeltaX),
        'one-frame pan should be smoothed below the raw hand displacement',
      );
    },
  },
  {
    name: 'slow spread does not flicker into pan or zoom-out',
    run: () => {
      const controller = new SolarInspectionController();
      const intents: string[] = [];
      let solarSnapshot = baseSolarSnapshot;

      for (let index = 0; index < 10; index += 1) {
        const update = step(controller, {
          state: 'SolarFreeHover',
          timestamp: index * 140,
          hand: createHand({
            center: point(0.5, 0.5),
            spread: 0.7 + index * 0.18,
          }),
          solarSnapshot,
        });

        intents.push(update.snapshot.intent);
        solarSnapshot = update.solarSnapshot;
      }

      assert(
        intents.every((intent) => intent === 'idle' || intent === 'zoomIn'),
        `slow spread should only idle or zoom in, got ${intents.join(', ')}`,
      );
      assert(intents.includes('zoomIn'), 'slow spread should eventually zoom in');
    },
  },
  {
    name: 'slow stable push does not flicker into zoom',
    run: () => {
      const controller = new SolarInspectionController();
      const intents: string[] = [];
      let solarSnapshot = baseSolarSnapshot;

      for (let index = 0; index < 10; index += 1) {
        const update = step(controller, {
          state: 'SolarFreeHover',
          timestamp: index * 120,
          hand: createHand({
            center: point(0.5 + index * 0.014, 0.5),
            spread: 1.5,
          }),
          solarSnapshot,
        });

        intents.push(update.snapshot.intent);
        solarSnapshot = update.solarSnapshot;
      }

      assert(
        intents.every((intent) => intent === 'idle' || intent === 'pan'),
        `stable push should only idle or pan, got ${intents.join(', ')}`,
      );
      assert(intents.includes('pan'), 'stable push should eventually pan');
    },
  },
  {
    name: 'inspection zoom stays within configured bounds',
    run: () => {
      const controller = new SolarInspectionController();
      let solarSnapshot = baseSolarSnapshot;

      for (let index = 0; index < 40; index += 1) {
        const update = step(controller, {
          state: 'SolarFreeHover',
          timestamp: index * 120,
          hand: createHand({
            center: point(0.5, 0.5),
            spread: index % 2 === 0 ? 0.65 : 2.6,
          }),
          solarSnapshot,
        });
        solarSnapshot = update.solarSnapshot;
      }

      assert(
        solarSnapshot.scale <= 2.5,
        `zoom-in sequence should stay under max scale, got ${solarSnapshot.scale}`,
      );

      for (let index = 40; index < 95; index += 1) {
        const update = step(controller, {
          state: 'SolarFreeHover',
          timestamp: index * 120,
          hand: createHand({
            center: point(0.5, 0.5),
            spread: index % 2 === 0 ? 2.6 : 0.65,
          }),
          solarSnapshot,
        });
        solarSnapshot = update.solarSnapshot;
      }

      assert(
        solarSnapshot.scale >= 0.6,
        `zoom-out sequence should stay above min scale, got ${solarSnapshot.scale}`,
      );
    },
  },
  {
    name: 'fist hold resets default transform',
    run: () => {
      const controller = new SolarInspectionController();
      const defaultSnapshot = baseSolarSnapshot;
      step(controller, {
        state: 'SolarFreeHover',
        timestamp: 0,
        hand: createHand({ center: point(0.5, 0.5), spread: 1.4 }),
        solarSnapshot: defaultSnapshot,
      });

      const inspectedSnapshot: SolarOpeningSnapshot = {
        ...defaultSnapshot,
        scale: 1.8,
        midpointWorld: { x: 1.2, y: -0.6, z: 0 },
      };
      let holding: SolarInspectionUpdate | null = null;
      let holdingTimestamp = 0;

      for (const timestamp of [300, 450, 600, 750, 900, 1050]) {
        const update = step(controller, {
          state: 'SolarFreeHover',
          timestamp,
          hand: createHand({ center: point(0.5, 0.5), spread: 0.08 }),
          solarSnapshot: inspectedSnapshot,
        });

        if (update.snapshot.intent === 'resetHold') {
          holding = update;
          holdingTimestamp = timestamp;
          break;
        }
      }

      assert(holding !== null, 'fist should enter resetHold before timeout');

      const reset = step(controller, {
        state: 'SolarFreeHover',
        timestamp: holdingTimestamp + 2050,
        hand: createHand({ center: point(0.5, 0.5), spread: 0.08 }),
        solarSnapshot: inspectedSnapshot,
      });

      assert(reset.snapshot.intent === 'reset', `expected reset, got ${reset.snapshot.intent}`);
      assert(reset.solarSnapshot.scale === defaultSnapshot.scale, 'reset should restore default scale');
      assert(reset.snapshot.inspectionScale === 1, 'reset debug scale should return to 1');
      assert(
        reset.snapshot.inspectionOffset.x === 0 &&
          reset.snapshot.inspectionOffset.y === 0 &&
          reset.snapshot.inspectionOffset.z === 0,
        'reset debug offset should return to zero',
      );
      assert(
        reset.solarSnapshot.midpointWorld?.x === defaultSnapshot.midpointWorld?.x &&
          reset.solarSnapshot.midpointWorld?.y === defaultSnapshot.midpointWorld?.y,
        'reset should restore default midpoint',
      );
    },
  },
  {
    name: 'verification tracker completes after all M5.5 signals',
    run: () => {
      let verification = EMPTY_SOLAR_INSPECTION_VERIFICATION;
      const signalUpdates: SolarInspectionUpdate[] = [];

      signalUpdates.push(
        step(new SolarInspectionController(), {
          state: 'SolarHandleControl',
          timestamp: 0,
          hand: createHand({ center: point(0.5, 0.5), spread: 1.4 }),
        }),
      );

      const zoomInController = new SolarInspectionController();
      step(zoomInController, {
        state: 'SolarFreeHover',
        timestamp: 100,
        hand: createHand({ center: point(0.5, 0.5), spread: 0.7 }),
      });
      signalUpdates.push(
        step(zoomInController, {
          state: 'SolarFreeHover',
          timestamp: 220,
          hand: createHand({ center: point(0.5, 0.5), spread: 2.4 }),
        }),
      );

      const zoomOutController = new SolarInspectionController();
      const zoomedSnapshot = { ...baseSolarSnapshot, scale: 1.6 };
      step(zoomOutController, {
        state: 'SolarFreeHover',
        timestamp: 100,
        hand: createHand({ center: point(0.5, 0.5), spread: 2.4 }),
        solarSnapshot: zoomedSnapshot,
      });
      step(zoomOutController, {
        state: 'SolarFreeHover',
        timestamp: 280,
        hand: createHand({ center: point(0.5, 0.5), spread: 2.4 }),
        solarSnapshot: zoomedSnapshot,
      });
      signalUpdates.push(
        step(zoomOutController, {
          state: 'SolarFreeHover',
          timestamp: 420,
          hand: createHand({ center: point(0.5, 0.5), spread: 0.7 }),
          solarSnapshot: zoomedSnapshot,
        }),
      );

      const panController = new SolarInspectionController();
      step(panController, {
        state: 'SolarFreeHover',
        timestamp: 520,
        hand: createHand({ center: point(0.5, 0.5), spread: 1.5 }),
      });
      step(panController, {
        state: 'SolarFreeHover',
        timestamp: 600,
        hand: createHand({ center: point(0.54, 0.5), spread: 1.5 }),
      });
      signalUpdates.push(
        step(panController, {
          state: 'SolarFreeHover',
          timestamp: 720,
          hand: createHand({ center: point(0.6, 0.5), spread: 1.5 }),
        }),
      );

      const resetController = new SolarInspectionController();
      step(resetController, {
        state: 'SolarFreeHover',
        timestamp: 760,
        hand: createHand({ center: point(0.5, 0.5), spread: 1.4 }),
      });
      const inspectedSnapshot: SolarOpeningSnapshot = {
        ...baseSolarSnapshot,
        scale: 1.8,
        midpointWorld: { x: 1.2, y: -0.6, z: 0 },
      };
      let resetHoldUpdate: SolarInspectionUpdate | null = null;
      for (const timestamp of [820, 980, 1140, 1300, 1460, 1620]) {
        const update = step(resetController, {
          state: 'SolarFreeHover',
          timestamp,
          hand: createHand({ center: point(0.5, 0.5), spread: 0.08 }),
          solarSnapshot: inspectedSnapshot,
        });

        if (update.snapshot.intent === 'resetHold') {
          resetHoldUpdate = update;
          signalUpdates.push(update);
          break;
        }
      }

      assert(resetHoldUpdate !== null, 'tracker scenario should reach resetHold');
      signalUpdates.push(
        step(resetController, {
          state: 'SolarFreeHover',
          timestamp: (resetHoldUpdate.snapshot.resetHoldMs ?? 0) + 3700,
          hand: createHand({ center: point(0.5, 0.5), spread: 0.08 }),
          solarSnapshot: inspectedSnapshot,
        }),
      );
      signalUpdates.push(
        step(new SolarInspectionController(), {
          state: 'SolarHandleControl',
          timestamp: 4200,
          hand: createHand({ center: point(0.5, 0.5), spread: 1.4 }),
        }),
      );

      for (const update of signalUpdates) {
        const state =
          update.snapshot.intent === 'inactive'
            ? 'SolarHandleControl'
            : 'SolarFreeHover';
        verification = updateSolarInspectionVerification(
          verification,
          state,
          update.snapshot,
          update.snapshot.resetHoldMs,
        );
      }

      assert(verification.reachedFreeHover, 'tracker should see SolarFreeHover');
      assert(verification.observedZoomIn, 'tracker should observe zoomIn');
      assert(verification.observedZoomOut, 'tracker should observe zoomOut');
      assert(verification.observedPan, 'tracker should observe pan');
      assert(verification.observedResetHold, 'tracker should observe resetHold');
      assert(verification.observedReset, 'tracker should observe reset');
      assert(
        verification.observedDisabledDuringHandleControl,
        'tracker should observe handle-control disabled state',
      );
      assert(
        verification.observedReGripAfterInspection,
        'tracker should observe re-grip after an inspection transform',
      );
      assert(verification.completedCount === 8, 'tracker should count all eight checklist items');
      assert(verification.totalCount === 8, 'tracker total should stay at eight checklist items');
      assert(verification.remainingItems === 'none', 'tracker should report no remaining items');
      assert(verification.nextItem === 'none', 'tracker should report no next item when complete');
      assert(verification.completed, 'tracker should mark checklist complete');
      assert(verification.completedAt !== null, 'tracker should record completion time');

      const report = createSolarInspectionVerificationReport({
        createdAt: '2026-06-23T00:00:00.000Z',
        cameraStatus: 'granted',
        trackingStatus: 'ready',
        interactionState: 'SolarFreeHover',
        solar: {
          openProgress: 1,
          scale: 1,
          reason: 'test-report',
        },
        inspection: signalUpdates[signalUpdates.length - 1].snapshot,
        verification,
      });

      assert(report.version === 1, 'report should use version 1');
      assert(report.passed, 'report should mark completed verification as passed');
      assert(report.remainingItems === 'none', 'report should preserve remaining items');
      assert(report.nextItem === 'none', 'report should preserve next item');
      assert(report.checklist.length === 8, 'report should include eight checklist items');
      assert(
        report.checklist.every((item) => item.done),
        'report checklist should mark every completed item done',
      );
      assert(
        report.checklist.map((item) => item.id).join(',') ===
          'free-hover,zoom-in,zoom-out,pan,reset-hold,reset,handle-off,re-grip-after-inspection',
        'report checklist should preserve stable item ids',
      );
      assert(
        !JSON.stringify(report).includes('landmarks'),
        'M5.5 summary report should not include landmark arrays',
      );
    },
  },
  {
    name: 'verification tracker requires inspection before re-grip credit',
    run: () => {
      let verification = EMPTY_SOLAR_INSPECTION_VERIFICATION;
      const handleUpdate = step(new SolarInspectionController(), {
        state: 'SolarHandleControl',
        timestamp: 0,
        hand: createHand({ center: point(0.5, 0.5), spread: 1.4 }),
      });

      verification = updateSolarInspectionVerification(
        verification,
        'SolarHandleControl',
        handleUpdate.snapshot,
        0,
      );

      assert(
        verification.observedDisabledDuringHandleControl,
        'handle control should still prove inspection is disabled',
      );
      assert(
        !verification.observedReGripAfterInspection,
        'initial handle control must not count as re-grip after inspection',
      );
      assert(
        verification.remainingItems.includes('re-grip-after-inspection'),
        're-grip-after-inspection should remain pending before zoom or pan',
      );
    },
  },
];

for (const testCase of cases) {
  testCase.run();
  console.log(`PASS ${testCase.name}`);
}

function step(
  controller: SolarInspectionController,
  input: {
    state: 'SolarFreeHover' | 'SolarHandleControl';
    timestamp: number;
    hand?: TrackedHand;
    hands?: TrackedHand[];
    solarSnapshot?: SolarOpeningSnapshot;
  },
): SolarInspectionUpdate {
  return controller.update({
    tracking: createTrackingSnapshot(input.hands ?? (input.hand ? [input.hand] : [])),
    interactionState: input.state,
    solarSnapshot: input.solarSnapshot ?? baseSolarSnapshot,
    layout,
    camera,
    planeZ: INTERACTION_PLANE_Z,
    timestamp: input.timestamp,
  });
}

function createTrackingSnapshot(hands: TrackedHand[]): TrackingSnapshot {
  return {
    status: 'ready',
    error: null,
    pose: {
      detected: false,
      leftShoulder: null,
      rightShoulder: null,
      landmarks: [],
      lastUpdatedAt: null,
    },
    hands: {
      detectedHands: hands.length,
      left: hands[0] ?? null,
      right: hands[1] ?? null,
      hands,
      lastUpdatedAt: null,
    },
    lastUpdatedAt: null,
  };
}

function createHand(input: { center: NormalizedPoint; spread: number }): TrackedHand {
  const { center, spread } = input;
  const palmScale = 0.1;
  const curled = spread <= 0.2;
  const landmarks = Array.from({ length: 21 }, () => point(center.x, center.y, center.z));
  const bases = [
    { mcp: 5, pip: 6, tip: 8, offset: -0.045 },
    { mcp: 9, pip: 10, tip: 12, offset: -0.015 },
    { mcp: 13, pip: 14, tip: 16, offset: 0.015 },
    { mcp: 17, pip: 18, tip: 20, offset: 0.045 },
  ];

  landmarks[0] = point(center.x, center.y + 0.06, center.z);
  landmarks[1] = point(center.x - 0.035, center.y + 0.02, center.z);
  landmarks[2] = curled
    ? point(center.x - 0.025, center.y + 0.025, center.z)
    : point(center.x - 0.055, center.y - spread * 0.01, center.z);
  landmarks[4] = curled
    ? point(center.x - 0.005, center.y + 0.035, center.z)
    : point(center.x - 0.075, center.y - spread * 0.045, center.z);

  for (const finger of bases) {
    const baseX = center.x + finger.offset;
    landmarks[finger.mcp] = point(baseX, center.y, center.z);
    landmarks[finger.pip] = curled
      ? point(baseX, center.y + 0.026, center.z)
      : point(baseX, center.y - spread * 0.035, center.z);
    landmarks[finger.tip] = curled
      ? point(center.x + finger.offset * 0.35, center.y + 0.016, center.z)
      : point(baseX, center.y - spread * 0.075, center.z);
  }

  return {
    side: 'unknown',
    handednessScore: 1,
    center,
    wrist: landmarks[0],
    thumbTip: landmarks[4],
    indexFingerTip: landmarks[8],
    palmScale,
    landmarks,
  };
}

function point(x: number, y: number, z = 0): NormalizedPoint {
  return { x, y, z };
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
