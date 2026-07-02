import { describe, expect, it } from 'vitest';
import { GestureDebugRecorder } from '../../src/interaction/gestureDebugRecorder';
import type { DebugSnapshot, TrackingSnapshot } from '../../src/utils/types';

function trackingSnapshot(): TrackingSnapshot {
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
      detectedHands: 0,
      left: null,
      right: null,
      hands: [],
      lastUpdatedAt: null,
    },
    lastUpdatedAt: null,
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
      returnGestureMs: 0,
      returnGestureRequiredMs: 0,
      returnGestureScore: 0,
      returnGestureHandKey: null,
      transitionReason: 'single-hand-following',
    },
    performance: {
      detectMs: 48,
      handDetectMs: 48,
      poseDetectMs: 0,
      trackingHz: 20,
      detectionFrameCount: 1,
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
    recorder.record(1000, trackingSnapshot(), debugSnapshot());

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
    });
  });

  it('starts each recording as a fresh session', () => {
    const recorder = new GestureDebugRecorder();

    recorder.toggle();
    recorder.record(1000, trackingSnapshot(), debugSnapshot());
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
