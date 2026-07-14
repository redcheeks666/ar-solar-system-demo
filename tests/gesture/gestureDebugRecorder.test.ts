import { describe, expect, it } from 'vitest';
import {
  captureReplayCamera,
  GestureDebugRecorder,
  type GestureReplayFrameContext,
} from '../../src/interaction/gestureDebugRecorder';
import { EMPTY_PLANET_RETURN_WAVE_SNAPSHOT } from '../../src/interaction/planetReturnWave';
import type {
  DebugSnapshot,
  TrackedHand,
  TrackingSnapshot,
} from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { TEST_LAYOUT, createTestCamera } from '../helpers/testCamera';

function trackingSnapshot(hands: TrackedHand[] = []): TrackingSnapshot {
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
      left: hands.find((hand) => hand.side === 'left') ?? null,
      right: hands.find((hand) => hand.side === 'right') ?? null,
      hands,
      lastUpdatedAt: 1000,
    },
    lastUpdatedAt: 1000,
  };
}

function replayContext(): GestureReplayFrameContext {
  return {
    solar: {
      interactionState: 'SolarFreeHover',
      layout: TEST_LAYOUT,
      camera: captureReplayCamera(createTestCamera()),
      planeZ: 0,
      snapshot: {
        active: true,
        visible: true,
        progress: 1,
        scale: 0.6,
        reason: 'solar-active-waiting-for-both-endpoints',
        leftWorld: null,
        rightWorld: null,
        midpointWorld: { x: 0, y: 0, z: 0 },
        normalizedDistance: 0.5,
        startDistance: 0.2,
        targetDistance: 0.6,
      },
      endpoint: {
        mode: 'enter',
        reason: 'outside-enter-radius',
        handLeftWorld: null,
        handRightWorld: null,
        referenceLeftWorld: null,
        referenceRightWorld: null,
        leftDistanceWorld: null,
        rightDistanceWorld: null,
        radiusWorld: 0.5,
        score: 0,
        bothWithinRadius: false,
        stableMs: 0,
        stableRequiredMs: 500,
      },
    },
    planetFocus: {
      interactionState: 'PlanetFocusControlled',
      focusedBody: 'earth',
      target: {
        id: 'earth',
        screenPosition: { x: 640, y: 360 },
        visible: true,
        bodyRadiusPx: 100,
        hitRadiusPx: 150,
        layout: TEST_LAYOUT,
      },
    },
  };
}

function debugSnapshot(): DebugSnapshot {
  return {
    interactionState: 'PlanetFocusControlled',
    handDistance: null,
    handDistanceVelocity: null,
    startupTransitionReason: 'outside-startup-state',
    bothHandsVisible: false,
    lostHandHoldActive: false,
    handPrimitives: {
      closeIntentScore: 0,
      pullIntentScore: 0,
    },
    gestureCalibration: {
      thresholds: {
        closedDistance: 0.18,
        closedEvidenceDistance: 0.22,
        pullMinDistanceDelta: 0.08,
        endpointEnterRadius: 0.12,
        endpointExitRadius: 0.18,
        reGripMagnetRadius: 0.24,
        releaseReGripClearRadius: 0.3,
        collapseStartDistance: 0.3,
        collapseCompleteDistance: 0.12,
      },
      averagePalmScale: null,
      closedDistance: null,
      comfortableOpenDistance: null,
      calibrated: false,
      reason: 'test',
    },
    wholeSystem: {
      transitionReason: 'missing-hand-pair',
    },
    planetActivation: {
      transitionReason: 'focus-view-active',
    },
    planetFocus: {
      focusedBody: 'earth',
      controlState: 'SingleHandFollow',
      controlMode: 'single',
      activeHandKeys: ['unknown-0'],
      touchHandCount: 1,
      touchDistancePx: 12,
      touchHitRadiusPx: 150,
      dwellMs: 1000,
      dwellRequiredMs: 1000,
      dwellMaxMs: 1000,
      screenPosition: { x: 640, y: 360 },
      scaleMultiplier: 1,
      pinchState: 'open',
      pinchDistancePx: 88,
      pinchRatio: 0.52,
      pinchTapHandKey: null,
      transitionReason: 'single-hand-following',
    },
    planetReturnWave: {
      ...EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
      state: 'Sweeping',
      handKey: 'right-0',
      elapsedMs: 132,
      stableFrames: 5,
      displacement: 0.18,
      medianSpeed: 1.1,
      coherence: 0.96,
      openHandScore: 0.68,
      palmScaleRatio: 1.08,
      score: 0.9,
      reason: 'sweep-displacement-too-small',
    },
    performance: {
      detectMs: 48,
      handDetectMs: 48,
      poseDetectMs: 0,
      workerRoundTripMs: 52,
      handDelegate: 'GPU',
      trackingHz: 20,
      detectionFrameCount: 1,
      droppedVideoFrameCount: 0,
      repeatedVideoFrameCount: 0,
      videoCurrentTimeMs: 1000,
      videoFrameDeltaMs: 33.3,
      renderDeltaMs: 50,
      renderMs: 2,
      trackingUpdateMs: 48,
      controllerMs: 0.2,
      recorderMs: 0,
      solarUpdateMs: 0.1,
      vfxFrameUploadMs: 0,
      vfxFrameUploadCount: 0,
      freshFrameAgeMs: 0,
      freshTrackingFrame: true,
      freshTrackingFrames: 1,
      staleRenderFrames: 0,
    },
  } as DebugSnapshot;
}

function recordedFrames(recorder: GestureDebugRecorder) {
  return (recorder as unknown as { frames: unknown[] }).frames;
}

describe('GestureDebugRecorder', () => {
  it('exports planet focus diagnostics on recorded frames', () => {
    const recorder = new GestureDebugRecorder();

    recorder.toggle();
    recorder.record(1000, trackingSnapshot(), debugSnapshot(), replayContext());

    const frames = recordedFrames(recorder);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      planetFocus: {
        focusedBody: 'earth',
        controlState: 'SingleHandFollow',
        controlMode: 'single',
        dwellMs: 1000,
        transitionReason: 'single-hand-following',
      },
      planetReturnWave: {
        state: 'Sweeping',
        handKey: 'right-0',
        stableFrames: 5,
        displacement: 0.18,
        medianSpeed: 1.1,
        coherence: 0.96,
      },
      replay: {
        solar: {
          interactionState: 'SolarFreeHover',
          endpoint: {
            stableRequiredMs: 500,
          },
        },
      },
    });
  });

  it('exports schema v3 replay inputs and metric world landmarks without camera pixels', () => {
    const recorder = new GestureDebugRecorder();
    const worldLandmarks = Array.from({ length: 21 }, (_, index) =>
      point(index / 100, 0.2, -0.01),
    );
    const hand = createHand({
      center: point(0.5, 0.5),
      spread: 1.2,
      worldLandmarks,
    });

    recorder.toggle();
    recorder.record(
      1000,
      trackingSnapshot([hand]),
      debugSnapshot(),
      replayContext(),
    );

    const payload = recorder.createExport('2026-07-14T00:00:00.000Z');
    expect(payload).toMatchObject({
      version: 3,
      frameCount: 1,
      frames: [
        {
          tracking: {
            hands: [{ worldLandmarks }],
          },
          replay: {
            planetFocus: {
              focusedBody: 'earth',
            },
          },
        },
      ],
    });
    expect(payload.note).toContain('No raw camera video');
  });

  it('starts each recording as a fresh session', () => {
    const recorder = new GestureDebugRecorder();

    recorder.toggle();
    recorder.record(1000, trackingSnapshot(), debugSnapshot(), replayContext());
    expect(recorder.getStatus().frameCount).toBe(1);

    recorder.toggle();
    recorder.toggle();

    expect(recorder.getStatus()).toMatchObject({
      recording: true,
      frameCount: 0,
      lastEvent: 'recording-started',
    });
  });
});
