import { describe, expect, it } from 'vitest';
import {
  GestureCalibrationController,
  getDefaultGestureCalibrationSnapshot,
} from '../../src/interaction/gestureCalibration';
import { EMPTY_HAND_PRIMITIVES } from '../../src/interaction/handPrimitives';
import { EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT } from '../../src/interaction/wholeSystemIntent';
import type { HandStartupGestureSnapshot } from '../../src/utils/types';
import { point } from '../helpers/syntheticHands';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

function startupSnapshot(
  input: Partial<HandStartupGestureSnapshot>,
): HandStartupGestureSnapshot {
  return {
    leftHand: point(0.6, 0.5),
    rightHand: point(0.4, 0.5),
    midpoint: point(0.5, 0.5),
    direction: point(-1, 0),
    distance: 0.2,
    distanceVelocity: 0,
    closeIntentScore: 0,
    pullIntentScore: 0,
    bothHandsVisible: true,
    lostHandHoldActive: false,
    handsClosed: false,
    pullArmed: false,
    transitionReason: 'test',
    ...input,
  };
}

describe('GestureCalibrationController', () => {
  it('starts from the fixed default thresholds used by deterministic controller tests', () => {
    const controller = new GestureCalibrationController();

    expect(controller.getSnapshot()).toEqual(getDefaultGestureCalibrationSnapshot());
    expect(controller.getSnapshot().thresholds).toEqual(DEFAULT_GESTURE_THRESHOLDS);
  });

  it('ignores primitive evidence unless both hands are visible', () => {
    const controller = new GestureCalibrationController();
    const snapshot = controller.updateFromPrimitives({
      ...EMPTY_HAND_PRIMITIVES,
      visibleHandCount: 1,
      averagePalmScale: 0.14,
      distance: 0.2,
      closeIntentScore: 1,
      transitionReason: 'one-hand-visible',
    });

    expect(snapshot).toEqual(getDefaultGestureCalibrationSnapshot());
  });

  it('learns palm scale and closed distance from close two-hand primitive evidence', () => {
    const controller = new GestureCalibrationController();
    const snapshot = controller.updateFromPrimitives({
      ...EMPTY_HAND_PRIMITIVES,
      bothHandsVisible: true,
      visibleHandCount: 2,
      averagePalmScale: 0.14,
      distance: 0.2,
      closeIntentScore: 0.9,
      transitionReason: 'hands-close',
    });

    expect(snapshot.calibrated).toBe(true);
    expect(snapshot.reason).toBe('primitives: palm=0.140 closed=0.200 open=n/a');
    expect(snapshot.averagePalmScale).toBe(0.14);
    expect(snapshot.closedDistance).toBe(0.2);
    expect(snapshot.comfortableOpenDistance).toBeNull();
    expect(snapshot.thresholds.closedDistance).toBeCloseTo(0.245);
    expect(snapshot.thresholds.closedEvidenceDistance).toBeCloseTo(0.287);
    expect(snapshot.thresholds.pullMinDistanceDelta).toBeCloseTo(0.126);
    expect(snapshot.thresholds.endpointEnterRadius).toBeCloseTo(0.189);
    expect(snapshot.thresholds.endpointExitRadius).toBeCloseTo(0.27405);
    expect(snapshot.thresholds.reGripMagnetRadius).toBeCloseTo(0.378);
    expect(snapshot.thresholds.releaseReGripClearRadius).toBeCloseTo(0.27405);
    expect(snapshot.thresholds.collapseCompleteDistance).toBeCloseTo(0.259);
    expect(snapshot.thresholds.collapseStartDistance).toBeCloseTo(0.359);
  });

  it('smooths repeated primitive observations instead of replacing them outright', () => {
    const controller = new GestureCalibrationController();
    controller.updateFromPrimitives({
      ...EMPTY_HAND_PRIMITIVES,
      bothHandsVisible: true,
      visibleHandCount: 2,
      averagePalmScale: 0.1,
      distance: 0.16,
      closeIntentScore: 0.9,
      transitionReason: 'first-close',
    });

    const snapshot = controller.updateFromPrimitives({
      ...EMPTY_HAND_PRIMITIVES,
      bothHandsVisible: true,
      visibleHandCount: 2,
      averagePalmScale: 0.2,
      distance: 0.24,
      closeIntentScore: 0.9,
      transitionReason: 'second-close',
    });

    expect(snapshot.averagePalmScale).toBeCloseTo(0.108);
    expect(snapshot.closedDistance).toBeCloseTo(0.1664);
    expect(snapshot.reason).toBe('primitives: palm=0.108 closed=0.166 open=n/a');
  });

  it('learns comfortable open distance from pull-armed interaction evidence', () => {
    const controller = new GestureCalibrationController();
    controller.updateFromInteraction(
      startupSnapshot({
        distance: 0.18,
        closeIntentScore: 0.9,
        handsClosed: true,
      }),
      EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT,
    );

    const snapshot = controller.updateFromInteraction(
      startupSnapshot({
        distance: 0.9,
        pullArmed: true,
      }),
      EMPTY_WHOLE_SYSTEM_INTENT_SNAPSHOT,
    );

    expect(snapshot.calibrated).toBe(true);
    expect(snapshot.reason).toBe('interaction: palm=n/a closed=0.180 open=0.900');
    expect(snapshot.closedDistance).toBe(0.18);
    expect(snapshot.comfortableOpenDistance).toBe(0.9);
    expect(snapshot.thresholds.pullMinDistanceDelta).toBe(0.14);
    expect(snapshot.thresholds.collapseStartDistance).toBeCloseTo(0.468);
  });

  it('resets learned thresholds back to the default snapshot', () => {
    const controller = new GestureCalibrationController();
    controller.updateFromPrimitives({
      ...EMPTY_HAND_PRIMITIVES,
      bothHandsVisible: true,
      visibleHandCount: 2,
      averagePalmScale: 0.14,
      distance: 0.2,
      closeIntentScore: 0.9,
      transitionReason: 'hands-close',
    });

    controller.reset();

    expect(controller.getSnapshot()).toEqual(getDefaultGestureCalibrationSnapshot());
  });
});
