import { describe, expect, it } from 'vitest';
import { WholeSystemIntentController } from '../../src/interaction/wholeSystemIntent';
import type {
  HandStartupGestureSnapshot,
  InteractionState,
  WholeSystemIntentSnapshot,
} from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { createTrackingSnapshot } from '../helpers/trackingSnapshots';
import { DEFAULT_GESTURE_THRESHOLDS } from '../helpers/testThresholds';

function startupAtDistance(input: {
  distance: number;
  distanceVelocity?: number;
  pullArmed?: boolean;
  handsClosed?: boolean;
  bothHandsVisible?: boolean;
  lostHandHoldActive?: boolean;
}): HandStartupGestureSnapshot {
  const half = input.distance / 2;
  const leftHand = point(0.5 + half, 0.5);
  const rightHand = point(0.5 - half, 0.5);

  return {
    leftHand,
    rightHand,
    midpoint: point(0.5, 0.5),
    direction: point(-1, 0),
    distance: input.distance,
    distanceVelocity: input.distanceVelocity ?? 0,
    closeIntentScore: input.handsClosed ? 1 : 0,
    pullIntentScore:
      input.distanceVelocity !== undefined && input.distanceVelocity > 0 ? 1 : 0,
    bothHandsVisible: input.bothHandsVisible ?? true,
    lostHandHoldActive: input.lostHandHoldActive ?? false,
    handsClosed: input.handsClosed ?? false,
    pullArmed: input.pullArmed ?? false,
    transitionReason: 'test-snapshot',
  };
}

function trackingAtDistance(distance: number, spread: number) {
  const half = distance / 2;
  return createTrackingSnapshot([
    createHand({ center: point(0.5 + half, 0.5), spread }),
    createHand({ center: point(0.5 - half, 0.5), spread }),
  ]);
}

function updateWholeSystem(input: {
  controller: WholeSystemIntentController;
  distance: number;
  timestamp: number;
  spread?: number;
  distanceVelocity?: number;
  pullArmed?: boolean;
  interactionState?: InteractionState;
}): WholeSystemIntentSnapshot {
  return input.controller.update(
    trackingAtDistance(input.distance, input.spread ?? 1.2),
    startupAtDistance({
      distance: input.distance,
      distanceVelocity: input.distanceVelocity,
      pullArmed: input.pullArmed,
    }),
    input.interactionState ?? 'SolarActive',
    input.timestamp,
    DEFAULT_GESTURE_THRESHOLDS,
    1,
  );
}

function driveToHandleControl(
  controller: WholeSystemIntentController,
): WholeSystemIntentSnapshot {
  updateWholeSystem({
    controller,
    distance: 0.42,
    timestamp: 0,
    pullArmed: true,
  });
  return updateWholeSystem({
    controller,
    distance: 0.42,
    timestamp: 240,
    pullArmed: true,
  });
}

function driveOpenHandReleaseToFreeHover(
  controller: WholeSystemIntentController,
): WholeSystemIntentSnapshot {
  driveToHandleControl(controller);
  updateWholeSystem({
    controller,
    distance: 0.42,
    timestamp: 260,
    spread: 2.4,
  });
  updateWholeSystem({
    controller,
    distance: 0.42,
    timestamp: 560,
    spread: 2.4,
  });
  return updateWholeSystem({
    controller,
    distance: 0.42,
    timestamp: 1060,
    spread: 2.4,
  });
}

describe('WholeSystemIntentController', () => {
  it('stabilizes a pull-armed virtual handle into SolarHandleControl', () => {
    const controller = new WholeSystemIntentController();

    const first = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 0,
      pullArmed: true,
    });
    const stable = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 240,
      pullArmed: true,
    });

    expect(first.controlState).toBe('VirtualOpeningHandle');
    expect(first.transitionReason).toBe('virtual-handle-stabilizing');
    expect(first.virtualLeftEndpoint?.x).toBeCloseTo(0.71);
    expect(first.virtualLeftEndpoint?.y).toBeCloseTo(0.5);
    expect(first.virtualRightEndpoint?.x).toBeCloseTo(0.29);
    expect(first.virtualRightEndpoint?.y).toBeCloseTo(0.5);
    expect(stable.controlState).toBe('SolarHandleControl');
    expect(stable.transitionReason).toBe('virtual-handle-control-stable');
    expect(stable.controlConfidence).toBe(1);
    expect(stable.leftEndpointMatched).toBe(true);
    expect(stable.rightEndpointMatched).toBe(true);
  });

  it('requires stable open hands before release, then confirms free hover with release latch', () => {
    const controller = new WholeSystemIntentController();
    driveToHandleControl(controller);

    const firstOpenFrame = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 260,
      spread: 2.4,
    });
    const stableOpenHands = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 560,
      spread: 2.4,
    });
    const freeHover = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 1060,
      spread: 2.4,
    });

    expect(firstOpenFrame.controlState).toBe('SolarHandleControl');
    expect(firstOpenFrame.releaseGestureActive).toBe(false);
    expect(firstOpenFrame.releaseStableMs).toBe(0);
    expect(stableOpenHands.controlState).toBe('ReleaseCandidate');
    expect(stableOpenHands.releaseGestureActive).toBe(true);
    expect(stableOpenHands.releaseGestureLatched).toBe(true);
    expect(stableOpenHands.transitionReason).toBe('open-hand-release-stable');
    expect(freeHover.controlState).toBe('SolarFreeHover');
    expect(freeHover.releaseGestureLatched).toBe(true);
    expect(freeHover.transitionReason).toBe('release-confirmed-free-hover');
  });

  it('blocks re-grip while release is latched, clears after hand exit, then restores control', () => {
    const controller = new WholeSystemIntentController();
    const freeHover = driveOpenHandReleaseToFreeHover(controller);

    const stillNearEndpoints = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 1080,
      spread: 2.4,
      interactionState: 'SolarFreeHover',
    });
    const movedAway = updateWholeSystem({
      controller,
      distance: 0.9,
      timestamp: 1100,
      spread: 1.2,
      interactionState: 'SolarFreeHover',
    });
    const reGripEntered = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 1120,
      spread: 1.2,
      interactionState: 'SolarFreeHover',
    });
    const reGripStable = updateWholeSystem({
      controller,
      distance: 0.42,
      timestamp: 1360,
      spread: 1.2,
      interactionState: 'SolarFreeHover',
    });

    expect(freeHover.releaseGestureLatched).toBe(true);
    expect(stillNearEndpoints.controlState).toBe('SolarFreeHover');
    expect(stillNearEndpoints.transitionReason).toBe(
      'release-lock-waiting-for-hand-exit',
    );
    expect(stillNearEndpoints.releaseGestureLatched).toBe(true);
    expect(movedAway.releaseGestureLatched).toBe(false);
    expect(movedAway.transitionReason).toBe('free-hover-waiting-for-regrip');
    expect(reGripEntered.controlState).toBe('ReGripCandidate');
    expect(reGripEntered.reGripReason).toBe('endpoint');
    expect(reGripEntered.transitionReason).toBe('regrip-confidence-entered');
    expect(reGripStable.controlState).toBe('SolarHandleControl');
    expect(reGripStable.transitionReason).toBe('regrip-stable-control-restored');
  });

  it('enters reverse collapse from inward motion and resets when fully closed', () => {
    const controller = new WholeSystemIntentController();
    driveToHandleControl(controller);

    const collapseStabilizing = updateWholeSystem({
      controller,
      distance: 0.18,
      distanceVelocity: -0.2,
      timestamp: 300,
      spread: 1.2,
    });
    const closing = updateWholeSystem({
      controller,
      distance: 0.18,
      distanceVelocity: -0.2,
      timestamp: 500,
      spread: 1.2,
    });
    const reset = updateWholeSystem({
      controller,
      distance: 0.18,
      distanceVelocity: -0.2,
      timestamp: 520,
      spread: 1.2,
      interactionState: 'SolarClosing',
    });

    expect(collapseStabilizing.controlState).toBe('SolarHandleControl');
    expect(collapseStabilizing.transitionReason).toBe(
      'collapse-intent-stabilizing',
    );
    expect(closing.controlState).toBe('SolarClosing');
    expect(closing.transitionReason).toBe('collapse-intent-stable');
    expect(reset.controlState).toBe('Inactive');
    expect(reset.virtualLeftEndpoint).toBeNull();
    expect(reset.virtualRightEndpoint).toBeNull();
    expect(reset.transitionReason).toBe('collapse-complete-reset-empty');
  });
});
