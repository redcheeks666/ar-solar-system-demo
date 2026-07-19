import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  parseGestureDebugExport,
  replayPlanetActivationController,
  replayPlanetFocusController,
  replayPlanetReturnWave,
  replaySolarController,
} from './replayRunner';

const aRecordingPath = process.env.GESTURE_REPLAY_A;
const bRecordingPath = process.env.GESTURE_REPLAY_B;
const positivePinchRecordingPath = process.env.GESTURE_REPLAY_PINCH_POSITIVE;
const trueReturnWaveRecordingPath =
  process.env.GESTURE_REPLAY_RETURN_WAVE_TRUE;
const falseReturnWaveRecordingPath =
  process.env.GESTURE_REPLAY_RETURN_WAVE_FALSE;
const doubleCloseSuccessRecordingPath =
  process.env.GESTURE_REPLAY_DOUBLE_CLOSE_SUCCESS;
const doubleCloseRetryRecordingPath =
  process.env.GESTURE_REPLAY_DOUBLE_CLOSE_RETRY;
const activationWristAnchorRecordingPath =
  process.env.GESTURE_REPLAY_ACTIVATION_WRIST_ANCHOR;

if (!activationWristAnchorRecordingPath) {
  describe('local activation wrist-anchor regression', () => {
    it('stays opt-in when the activation recording path is not supplied', () => {
      expect(activationWristAnchorRecordingPath).toBeUndefined();
    });
  });
} else {
  describe('local activation wrist-anchor regression', () => {
    it('keeps in-place DoubleClose reachable through recorded fingertip motion', () => {
      const recording = parseGestureDebugExport(
        readFileSync(activationWristAnchorRecordingPath, 'utf8'),
      );
      const replay = replayPlanetActivationController(recording);
      const doubleCloseFrame = replay.find((frame) =>
        frame.snapshot.transitionReason.startsWith('double-close-'),
      );
      const focusFrame = replay.find(
        (frame) => frame.stateAfter === 'PlanetFocusView',
      );

      console.info(
        JSON.stringify({
          scenario: 'activation-wrist-anchor',
          replayedDoubleCloseAt: doubleCloseFrame?.t ?? null,
          replayedFocusAt: focusFrame?.t ?? null,
        }),
      );
      expect(doubleCloseFrame).toBeDefined();
      expect(focusFrame).toBeDefined();
    });
  });
}

if (!doubleCloseSuccessRecordingPath || !doubleCloseRetryRecordingPath) {
  describe('local DoubleClose recording regressions', () => {
    it('stays opt-in when the paired recording paths are not supplied', () => {
      expect(
        Boolean(
          doubleCloseSuccessRecordingPath && doubleCloseRetryRecordingPath,
        ),
      ).toBe(false);
    });
  });
} else {
  describe('local DoubleClose recording regressions', () => {
    it('keeps the successful DoubleClose focus entry at least as fast', () => {
      const recording = parseGestureDebugExport(
        readFileSync(doubleCloseSuccessRecordingPath, 'utf8'),
      );
      const replay = replayPlanetActivationController(recording);
      const recordedFocusAt = recording.frames.find(
        (frame) =>
          frame.replay.solar.interactionState === 'PlanetFocusView',
      )?.t;
      const replayedFocusAt = replay.find(
        (frame) => frame.stateAfter === 'PlanetFocusView',
      )?.t;

      console.info(
        JSON.stringify({
          scenario: 'double-close-success',
          recordedFocusAt,
          replayedFocusAt,
        }),
      );
      expect(recordedFocusAt).toBeDefined();
      expect(replayedFocusAt).toBeDefined();
      expect(replayedFocusAt as number).toBeLessThanOrEqual(
        recordedFocusAt as number,
      );
    });

    it('accepts the repeated human DoubleClose that previously never focused', () => {
      const recording = parseGestureDebugExport(
        readFileSync(doubleCloseRetryRecordingPath, 'utf8'),
      );
      const replay = replayPlanetActivationController(recording);
      const focusFrame = replay.find(
        (frame) => frame.stateAfter === 'PlanetFocusView',
      );

      console.info(
        JSON.stringify({
          scenario: 'double-close-retry',
          replayedFocusAt: focusFrame?.t ?? null,
          valley: focusFrame?.snapshot.doubleCloseValleyRatio ?? null,
          peak: focusFrame?.snapshot.doubleClosePeakRatio ?? null,
          prominence:
            focusFrame?.snapshot.doubleCloseProminence ?? null,
        }),
      );
      expect(focusFrame).toBeDefined();
    });
  });
}

if (!aRecordingPath || !bRecordingPath) {
  describe('local A/B gesture recording regressions', () => {
    it('stays opt-in when no personal recording paths are supplied', () => {
      expect(Boolean(aRecordingPath && bRecordingPath)).toBe(false);
    });
  });
} else {
  describe('local A/B gesture recording regressions', () => {
    it('keeps A in handle control after the endpoint dwell', () => {
      const recording = parseGestureDebugExport(
        readFileSync(aRecordingPath as string, 'utf8'),
      );
      const replay = replaySolarController(recording);
      const recordedMaxWidthReleases = recording.frames.filter(
        (frame) =>
          frame.replay.solar.snapshot.reason ===
          'solar-handle-placed-down-beyond-max-width',
      ).length;
      const handleEntries = replay.filter(
        (frame) => frame.snapshot.reason === 'solar-handle-control-started',
      ).length;
      const maxWidthReleases = replay.filter(
        (frame) =>
          frame.snapshot.reason ===
          'solar-handle-placed-down-beyond-max-width',
      ).length;
      const handleFrames = replay.filter(
        (frame) => frame.stateAfter === 'SolarHandleControl',
      ).length;

      console.info(
        JSON.stringify({
          scenario: 'A',
          recordedMaxWidthReleases,
          replayedMaxWidthReleases: maxWidthReleases,
          handleEntries,
          handleFrames,
        }),
      );
      expect(handleEntries).toBeGreaterThan(0);
      expect(maxWidthReleases).toBe(0);
      expect(handleFrames).toBeGreaterThan(5);
    });

    it('replays B with the preserved original PinchTap semantics', () => {
      const recording = parseGestureDebugExport(
        readFileSync(bRecordingPath as string, 'utf8'),
      );
      const replay = replayPlanetFocusController(recording);
      const recordedPinchTapReleases = recording.frames.filter((frame) =>
        frame.planetFocus.transitionReason.endsWith('pinch-tap-release'),
      ).length;
      const replayedReleaseFrames = replay.filter((frame) =>
        frame.snapshot.transitionReason.endsWith('pinch-tap-release'),
      );
      const controlledFrames = replay.filter(
        (frame) => frame.stateAfter === 'PlanetFocusControlled',
      ).length;

      console.info(
        JSON.stringify({
          scenario: 'B',
          recordedPinchTapReleases,
          replayedPinchTapReleases: replayedReleaseFrames.length,
          controlledFrames,
        }),
      );
      expect(replayedReleaseFrames).toHaveLength(recordedPinchTapReleases);
      expect(controlledFrames).toBeGreaterThan(5);
    });
  });
}

if (!trueReturnWaveRecordingPath || !falseReturnWaveRecordingPath) {
  describe('local true-wave / false-reach recording regressions', () => {
    it('stays opt-in when the paired recording paths are not supplied', () => {
      expect(
        Boolean(trueReturnWaveRecordingPath && falseReturnWaveRecordingPath),
      ).toBe(false);
    });
  });
} else {
  describe('local true-wave / false-reach recording regressions', () => {
    it('recognizes each of the three PlanetFocusView throws inside its motion window', () => {
      const recording = parseGestureDebugExport(
        readFileSync(trueReturnWaveRecordingPath, 'utf8'),
      );
      const waveWindows = [
        { sliceStart: 48, sliceEnd: 70, motionStart: 56, motionEnd: 68 },
        { sliceStart: 143, sliceEnd: 166, motionStart: 151, motionEnd: 164 },
        { sliceStart: 231, sliceEnd: 255, motionStart: 239, motionEnd: 253 },
      ];

      waveWindows.forEach((window, attemptIndex) => {
        const frames = recording.frames.slice(
          window.sliceStart,
          window.sliceEnd + 1,
        );
        const replay = replayPlanetReturnWave({
          ...recording,
          frames,
          frameCount: frames.length,
        });
        const triggered = replay.find((frame) => frame.triggered);
        const recordingIndex = triggered
          ? recording.frames.findIndex((frame) => frame.t === triggered.t)
          : -1;

        console.info(
          JSON.stringify({
            scenario: `true-return-wave-${attemptIndex + 1}`,
            recordingIndex,
            peakSpeed: triggered?.snapshot.peakSpeed ?? null,
            displacement: triggered?.snapshot.displacement ?? null,
            bodyDistanceTrend:
              triggered?.snapshot.bodyDistanceTrend ?? null,
          }),
        );
        expect(triggered).toBeDefined();
        expect(recordingIndex).toBeGreaterThanOrEqual(window.motionStart);
        expect(recordingIndex).toBeLessThanOrEqual(window.motionEnd);
      });
    });

    it('does not treat reaching toward Earth as a return throw', () => {
      const recording = parseGestureDebugExport(
        readFileSync(falseReturnWaveRecordingPath, 'utf8'),
      );
      const replay = replayPlanetReturnWave(recording);

      expect(replay.some((frame) => frame.triggered)).toBe(false);
    });
  });
}

if (!positivePinchRecordingPath) {
  describe('local intentional PinchTap recording regression', () => {
    it('stays opt-in when no positive recording path is supplied', () => {
      expect(positivePinchRecordingPath).toBeUndefined();
    });
  });
} else {
  describe('local intentional PinchTap recording regression', () => {
    it('accepts the deliberate two-hand-follow PinchTap earlier than the recorded controller', () => {
      const recording = parseGestureDebugExport(
        readFileSync(positivePinchRecordingPath, 'utf8'),
      );
      const replay = replayPlanetFocusController(recording);
      const recordedFollowStart = recording.frames.find(
        (frame) => frame.planetFocus.controlState === 'TwoHandFollow',
      )?.t;
      const recordedRelease = recording.frames.find((frame) =>
        frame.planetFocus.transitionReason.endsWith('pinch-tap-release'),
      )?.t;
      const replayedRelease = replay.find((frame) =>
        frame.snapshot.transitionReason.endsWith('pinch-tap-release'),
      )?.t;

      console.info(
        JSON.stringify({
          scenario: 'intentional-two-hand-pinch-tap',
          recordedReleaseAfterMs:
            recordedFollowStart !== undefined && recordedRelease !== undefined
              ? recordedRelease - recordedFollowStart
              : null,
          replayedReleaseAfterMs:
            recordedFollowStart !== undefined && replayedRelease !== undefined
              ? replayedRelease - recordedFollowStart
              : null,
        }),
      );
      expect(recordedRelease).toBeDefined();
      expect(replayedRelease).toBeDefined();
      expect(replayedRelease as number).toBeLessThan(recordedRelease as number);
    });
  });
}
