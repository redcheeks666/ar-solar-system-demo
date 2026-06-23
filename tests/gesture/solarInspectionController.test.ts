import { describe, expect, it } from 'vitest';
import {
  SolarInspectionController,
  type SolarInspectionUpdate,
} from '../../src/interaction/solarInspectionController';
import { mapNormalizedToWorld } from '../../src/interaction/coordinateMapping';
import { createSolarInspectionVerificationReport } from '../../src/interaction/solarInspectionReport';
import type { SolarOpeningSnapshot } from '../../src/interaction/solarOpeningController';
import {
  EMPTY_SOLAR_INSPECTION_VERIFICATION,
  updateSolarInspectionVerification,
} from '../../src/interaction/solarInspectionVerification';
import { INTERACTION_PLANE_Z } from '../../src/rendering/scene';
import type { TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { TEST_LAYOUT, createTestCamera } from '../helpers/testCamera';

const camera = createTestCamera();

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
    layout: TEST_LAYOUT,
    camera,
    planeZ: INTERACTION_PLANE_Z,
    timestamp: input.timestamp,
  });
}

describe('SolarInspectionController', () => {
  it('stays inactive outside SolarFreeHover', () => {
    const controller = new SolarInspectionController();
    const update = step(controller, {
      state: 'SolarHandleControl',
      timestamp: 0,
      hand: createHand({ center: point(0.5, 0.5), spread: 1.4 }),
    });

    expect(update.snapshot.intent).toBe('inactive');
    expect(update.solarSnapshot.scale).toBe(1);
    expect(update.solarSnapshot.midpointWorld?.x).toBe(0);
  });

  it('locks onto a dominant hand instead of resetting when two hands are present', () => {
    const controller = new SolarInspectionController();
    const update = step(controller, {
      state: 'SolarFreeHover',
      timestamp: 0,
      hands: [
        createHand({ center: point(0.45, 0.5), spread: 1.1 }),
        createHand({ center: point(0.55, 0.5), spread: 1.1 }),
      ],
    });

    // Two hands no longer block inspection: a dominant hand is locked and tracked.
    expect(update.snapshot.reason).not.toBe('waiting-for-a-hand');
    expect(update.snapshot.palmCenter.x).not.toBeNull();
  });

  it('a weak second-hand blip does not reset active single-hand inspection', () => {
    const controller = new SolarInspectionController();
    const solarSnapshot = baseSolarSnapshot;

    // Arm a one-hand push pan.
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
    const panned = step(controller, {
      state: 'SolarFreeHover',
      timestamp: 200,
      hand: createHand({ center: point(0.6, 0.5), spread: 1.5 }),
      solarSnapshot,
    });
    expect(panned.snapshot.intent).toBe('pan');

    // A weak second hand flashes in at the frame edge for one frame; the dominant hand keeps
    // panning instead of the whole gesture resetting.
    const blip = step(controller, {
      state: 'SolarFreeHover',
      timestamp: 280,
      hands: [
        createHand({ center: point(0.64, 0.5), spread: 1.5 }),
        createHand({ center: point(0.08, 0.1), spread: 1.1 }),
      ],
      solarSnapshot,
    });
    expect(blip.snapshot.intent).toBe('pan');
  });

  it('zooms in from one-hand spread with a per-frame scale cap', () => {
    const controller = new SolarInspectionController();
    const solarSnapshot = baseSolarSnapshot;
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

    expect(update.snapshot.intent).toBe('zoomIn');
    expect(update.solarSnapshot.scale).toBeGreaterThan(solarSnapshot.scale);
    expect(update.solarSnapshot.scale).toBeLessThanOrEqual(1.17);
    expect(update.snapshot.fingerSpreadVelocity ?? 0).toBeGreaterThan(0);
  });

  it('zooms out from one-hand contraction after a stable open hand', () => {
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

    expect(update.snapshot.intent).toBe('zoomOut');
    expect(update.solarSnapshot.scale).toBeLessThan(zoomedSnapshot.scale);
    expect(update.snapshot.fingerSpreadVelocity ?? 0).toBeLessThan(0);
  });

  it('pans from a stable open-hand push', () => {
    const controller = new SolarInspectionController();
    const solarSnapshot = baseSolarSnapshot;
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

    expect(update.snapshot.intent).toBe('pan');
    expect(update.snapshot.panScore).toBeGreaterThan(0);
    expect(update.solarSnapshot.midpointWorld?.x).not.toBe(
      solarSnapshot.midpointWorld?.x,
    );
  });

  it('low-pass smooths pan offset below raw hand displacement', () => {
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
      TEST_LAYOUT,
      camera,
      INTERACTION_PLANE_Z,
    );
    const endWorld = mapNormalizedToWorld(
      endCenter,
      TEST_LAYOUT,
      camera,
      INTERACTION_PLANE_Z,
    );

    expect(startWorld).not.toBeNull();
    expect(endWorld).not.toBeNull();
    expect(update.snapshot.intent).toBe('pan');

    const fullHandDeltaX = endWorld!.x - startWorld!.x;
    const actualDeltaX =
      (update.solarSnapshot.midpointWorld?.x ?? 0) -
      (baseSolarSnapshot.midpointWorld?.x ?? 0);

    expect(Math.abs(actualDeltaX)).toBeGreaterThan(0);
    expect(Math.abs(actualDeltaX)).toBeLessThan(Math.abs(fullHandDeltaX));
  });

  it('slow spread only idles or zooms in, without pan or zoom-out flicker', () => {
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

    expect(intents.every((intent) => intent === 'idle' || intent === 'zoomIn')).toBe(
      true,
    );
    expect(intents).toContain('zoomIn');
  });

  it('slow stable push only idles or pans, without zoom flicker', () => {
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

    expect(intents.every((intent) => intent === 'idle' || intent === 'pan')).toBe(
      true,
    );
    expect(intents).toContain('pan');
  });

  it('keeps inspection zoom inside configured min and max bounds', () => {
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

    expect(solarSnapshot.scale).toBeLessThanOrEqual(2.5);

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

    expect(solarSnapshot.scale).toBeGreaterThanOrEqual(0.6);
  });

  it('resets inspected scale and offset after a held fist', () => {
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

    expect(holding).not.toBeNull();

    const reset = step(controller, {
      state: 'SolarFreeHover',
      timestamp: holdingTimestamp + 2050,
      hand: createHand({ center: point(0.5, 0.5), spread: 0.08 }),
      solarSnapshot: inspectedSnapshot,
    });

    expect(reset.snapshot.intent).toBe('reset');
    expect(reset.solarSnapshot.scale).toBe(defaultSnapshot.scale);
    expect(reset.snapshot.inspectionScale).toBe(1);
    expect(reset.snapshot.inspectionOffset).toEqual({ x: 0, y: 0, z: 0 });
    expect(reset.solarSnapshot.midpointWorld?.x).toBe(
      defaultSnapshot.midpointWorld?.x,
    );
    expect(reset.solarSnapshot.midpointWorld?.y).toBe(
      defaultSnapshot.midpointWorld?.y,
    );
  });

  it('verification tracker completes after all M5.5 signals and exports a safe report', () => {
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

    expect(resetHoldUpdate).not.toBeNull();
    signalUpdates.push(
      step(resetController, {
        state: 'SolarFreeHover',
        timestamp: resetHoldUpdate!.snapshot.resetHoldMs + 3700,
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

    expect(verification.reachedFreeHover).toBe(true);
    expect(verification.observedZoomIn).toBe(true);
    expect(verification.observedZoomOut).toBe(true);
    expect(verification.observedPan).toBe(true);
    expect(verification.observedResetHold).toBe(true);
    expect(verification.observedReset).toBe(true);
    expect(verification.observedDisabledDuringHandleControl).toBe(true);
    expect(verification.observedReGripAfterInspection).toBe(true);
    expect(verification.completedCount).toBe(8);
    expect(verification.totalCount).toBe(8);
    expect(verification.remainingItems).toBe('none');
    expect(verification.nextItem).toBe('none');
    expect(verification.completed).toBe(true);
    expect(verification.completedAt).not.toBeNull();

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

    expect(report.version).toBe(1);
    expect(report.passed).toBe(true);
    expect(report.remainingItems).toBe('none');
    expect(report.nextItem).toBe('none');
    expect(report.checklist).toHaveLength(8);
    expect(report.checklist.every((item) => item.done)).toBe(true);
    expect(report.checklist.map((item) => item.id)).toEqual([
      'free-hover',
      'zoom-in',
      'zoom-out',
      'pan',
      'reset-hold',
      'reset',
      'handle-off',
      're-grip-after-inspection',
    ]);
    expect(JSON.stringify(report)).not.toContain('landmarks');
  });

  it('verification tracker requires inspection before re-grip credit', () => {
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

    expect(verification.observedDisabledDuringHandleControl).toBe(true);
    expect(verification.observedReGripAfterInspection).toBe(false);
    expect(verification.remainingItems).toContain('re-grip-after-inspection');
  });
});
