import type { DebugSnapshot, NormalizedPoint, TrackingSnapshot } from '../utils/types';

const MAX_FRAMES = 1200;

interface GestureDebugFrame {
  t: number;
  tracking: {
    status: string;
    detectedHands: number;
    hands: Array<{
      side: string;
      handednessScore: number;
      palmScale: number;
      center: NormalizedPoint;
      landmarks: NormalizedPoint[];
    }>;
  };
  primitives: DebugSnapshot['handPrimitives'];
  calibration: DebugSnapshot['gestureCalibration'];
  startup: {
    state: string;
    distance: number | null;
    velocity: number | null;
    closeIntentScore: number;
    pullIntentScore: number;
    transitionReason: string;
    bothHandsVisible: boolean;
    lostHandHoldActive: boolean;
  };
  wholeSystem: DebugSnapshot['wholeSystem'];
}

export class GestureDebugRecorder {
  private recording = false;
  private frames: GestureDebugFrame[] = [];
  private lastEvent: string | null = null;

  toggle(): boolean {
    this.recording = !this.recording;

    if (this.recording) {
      this.lastEvent = 'recording-started';
    } else {
      this.lastEvent = 'recording-stopped';
    }

    return this.recording;
  }

  clear(): void {
    this.frames = [];
    this.lastEvent = 'recording-cleared';
  }

  record(
    timestamp: number,
    tracking: TrackingSnapshot,
    snapshot: DebugSnapshot,
  ): void {
    if (!this.recording) {
      return;
    }

    const frame: GestureDebugFrame = {
      t: Math.round(timestamp),
      tracking: {
        status: tracking.status,
        detectedHands: tracking.hands.detectedHands,
        hands: tracking.hands.hands.map((hand) => ({
          side: hand.side,
          handednessScore: round(hand.handednessScore),
          palmScale: round(hand.palmScale),
          center: roundPoint(hand.center),
          landmarks: hand.landmarks.map(roundPoint),
        })),
      },
      primitives: snapshot.handPrimitives,
      calibration: snapshot.gestureCalibration,
      startup: {
        state: snapshot.interactionState,
        distance: roundMaybe(snapshot.handDistance),
        velocity: roundMaybe(snapshot.handDistanceVelocity),
        closeIntentScore: round(snapshot.handPrimitives.closeIntentScore),
        pullIntentScore: round(snapshot.handPrimitives.pullIntentScore),
        transitionReason: snapshot.startupTransitionReason,
        bothHandsVisible: snapshot.bothHandsVisible,
        lostHandHoldActive: snapshot.lostHandHoldActive,
      },
      wholeSystem: snapshot.wholeSystem,
    };

    this.frames.push(frame);

    if (this.frames.length > MAX_FRAMES) {
      this.frames.shift();
    }

    this.lastEvent = `${frame.startup.transitionReason} / ${frame.wholeSystem.transitionReason}`;
  }

  exportJson(): void {
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      frameCount: this.frames.length,
      note: 'Structured gesture diagnostics only. No raw camera video is included.',
      frames: this.frames,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `ar-solar-gesture-log-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    this.lastEvent = `exported-${this.frames.length}-frames`;
  }

  getStatus(): DebugSnapshot['gestureRecording'] {
    return {
      recording: this.recording,
      frameCount: this.frames.length,
      maxFrames: MAX_FRAMES,
      lastEvent: this.lastEvent,
    };
  }
}

function roundPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: round(point.x),
    y: round(point.y),
    z: round(point.z),
    visibility:
      point.visibility === undefined ? undefined : round(point.visibility),
  };
}

function roundMaybe(value: number | null): number | null {
  return value === null ? null : round(value);
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
