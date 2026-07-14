import type { PerspectiveCamera } from 'three';
import type { PreviewLayout } from './coordinateMapping';
import type { SolarOpeningSnapshot } from './solarOpeningController';
import type {
  CelestialBodyScreenTarget,
  FocusedCelestialBodyScreenTarget,
} from '../solar/solarSystem';
import type { InteractiveCelestialBodyId } from '../solar/solarSystemData';
import type {
  DebugSnapshot,
  InteractionState,
  NormalizedPoint,
  SolarEndpointDebugSnapshot,
  TrackingSnapshot,
} from '../utils/types';

const MAX_FRAMES = 1200;
export const GESTURE_EXPORT_SCHEMA_VERSION = 3;

export interface ReplayCameraSnapshot {
  fov: number;
  aspect: number;
  near: number;
  far: number;
  zoom: number;
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
}

export interface GestureReplayFrameContext {
  solar: {
    interactionState: InteractionState;
    layout: PreviewLayout;
    camera: ReplayCameraSnapshot;
    planeZ: number;
    snapshot: SolarOpeningSnapshot;
    endpoint: SolarEndpointDebugSnapshot;
  };
  /** Additive v3 input context; older v3 recordings reconstruct targets from diagnostics. */
  planetActivation?: {
    interactionState: InteractionState;
    targets: CelestialBodyScreenTarget[];
  };
  planetFocus: {
    interactionState: InteractionState;
    focusedBody: InteractiveCelestialBodyId;
    target: FocusedCelestialBodyScreenTarget | null;
  } | null;
}

export interface GestureDebugFrame {
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
      worldLandmarks: NormalizedPoint[] | null;
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
  planetActivation: DebugSnapshot['planetActivation'];
  planetFocus: DebugSnapshot['planetFocus'];
  /** Additive v3 diagnostic; older v3 recordings omit it but retain all replay inputs. */
  planetReturnWave?: DebugSnapshot['planetReturnWave'];
  performance: DebugSnapshot['performance'];
  replay: GestureReplayFrameContext;
}

export interface GestureDebugExport {
  version: typeof GESTURE_EXPORT_SCHEMA_VERSION;
  createdAt: string;
  frameCount: number;
  note: string;
  frames: GestureDebugFrame[];
}

export function captureReplayCamera(
  camera: PerspectiveCamera,
): ReplayCameraSnapshot {
  return {
    fov: camera.fov,
    aspect: camera.aspect,
    near: camera.near,
    far: camera.far,
    zoom: camera.zoom,
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    },
    quaternion: {
      x: camera.quaternion.x,
      y: camera.quaternion.y,
      z: camera.quaternion.z,
      w: camera.quaternion.w,
    },
  };
}

export class GestureDebugRecorder {
  private recording = false;
  private frames: GestureDebugFrame[] = [];
  private lastEvent: string | null = null;

  toggle(): boolean {
    if (!this.recording) {
      this.frames = [];
      this.recording = true;
      this.lastEvent = 'recording-started';
    } else {
      this.recording = false;
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
    replay: GestureReplayFrameContext,
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
          worldLandmarks: hand.worldLandmarks?.map(roundPoint) ?? null,
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
      planetActivation: snapshot.planetActivation,
      planetFocus: snapshot.planetFocus,
      planetReturnWave: snapshot.planetReturnWave,
      performance: snapshot.performance,
      replay,
    };

    this.frames.push(frame);

    if (this.frames.length > MAX_FRAMES) {
      this.frames.shift();
    }

    this.lastEvent = `${frame.startup.transitionReason} / ${frame.wholeSystem.transitionReason} / ${frame.planetActivation.transitionReason} / ${frame.planetFocus.transitionReason}`;
  }

  exportJson(): void {
    const payload = this.createExport();
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

  createExport(createdAt = new Date().toISOString()): GestureDebugExport {
    return {
      version: GESTURE_EXPORT_SCHEMA_VERSION,
      createdAt,
      frameCount: this.frames.length,
      note: 'Structured gesture diagnostics and deterministic controller replay inputs only. No raw camera video is included.',
      frames: this.frames,
    };
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
