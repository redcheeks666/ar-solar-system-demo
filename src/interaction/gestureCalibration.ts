import { clamp } from '../utils/math';
import type {
  GestureCalibrationSnapshot,
  GestureThresholds,
  HandPrimitiveSnapshot,
  HandStartupGestureSnapshot,
  WholeSystemIntentSnapshot,
} from '../utils/types';

const DEFAULT_THRESHOLDS: GestureThresholds = {
  closedDistance: 0.18,
  closedEvidenceDistance: 0.22,
  pullMinDistanceDelta: 0.08,
  endpointEnterRadius: 0.16,
  endpointExitRadius: 0.24,
  reGripMagnetRadius: 0.34,
  releaseReGripClearRadius: 0.24,
  collapseStartDistance: 0.34,
  collapseCompleteDistance: 0.19,
};

const PALM_SCALE_ALPHA = 0.08;
const CLOSED_DISTANCE_ALPHA = 0.08;
const OPEN_DISTANCE_ALPHA = 0.08;

export class GestureCalibrationController {
  private averagePalmScale: number | null = null;
  private closedDistance: number | null = null;
  private comfortableOpenDistance: number | null = null;
  private snapshot: GestureCalibrationSnapshot = {
    thresholds: DEFAULT_THRESHOLDS,
    averagePalmScale: null,
    closedDistance: null,
    comfortableOpenDistance: null,
    calibrated: false,
    reason: 'default-thresholds',
  };

  updateFromPrimitives(primitives: HandPrimitiveSnapshot): GestureCalibrationSnapshot {
    if (primitives.averagePalmScale !== null && primitives.bothHandsVisible) {
      this.averagePalmScale = smoothNullable(
        this.averagePalmScale,
        primitives.averagePalmScale,
        PALM_SCALE_ALPHA,
      );
    }

    if (
      primitives.bothHandsVisible &&
      primitives.distance !== null &&
      primitives.closeIntentScore >= 0.72
    ) {
      this.closedDistance = smoothNullable(
        this.closedDistance,
        primitives.distance,
        CLOSED_DISTANCE_ALPHA,
      );
    }

    this.recompute('primitives');
    return this.snapshot;
  }

  updateFromInteraction(
    startup: HandStartupGestureSnapshot,
    wholeSystem: WholeSystemIntentSnapshot,
  ): GestureCalibrationSnapshot {
    if (startup.distance !== null && startup.bothHandsVisible) {
      if (startup.handsClosed || startup.closeIntentScore >= 0.78) {
        this.closedDistance = smoothNullable(
          this.closedDistance,
          startup.distance,
          CLOSED_DISTANCE_ALPHA,
        );
      }

      if (
        (startup.pullArmed ||
          wholeSystem.controlState === 'VirtualOpeningHandle' ||
          wholeSystem.controlState === 'SolarHandleControl') &&
        startup.distance >
          this.snapshot.thresholds.closedEvidenceDistance +
            this.snapshot.thresholds.pullMinDistanceDelta
      ) {
        this.comfortableOpenDistance = smoothOpenDistance(
          this.comfortableOpenDistance,
          startup.distance,
        );
      }
    }

    this.recompute('interaction');
    return this.snapshot;
  }

  getSnapshot(): GestureCalibrationSnapshot {
    return this.snapshot;
  }

  reset(): void {
    this.averagePalmScale = null;
    this.closedDistance = null;
    this.comfortableOpenDistance = null;
    this.snapshot = {
      thresholds: DEFAULT_THRESHOLDS,
      averagePalmScale: null,
      closedDistance: null,
      comfortableOpenDistance: null,
      calibrated: false,
      reason: 'default-thresholds',
    };
  }

  private recompute(reason: string): void {
    const palmScale = this.averagePalmScale;
    const closedDistance = this.closedDistance;
    const openDistance = this.comfortableOpenDistance;

    const closedDistanceThreshold = clamp(
      Math.max(
        DEFAULT_THRESHOLDS.closedDistance,
        palmScale === null ? 0 : palmScale * 1.75,
        closedDistance === null ? 0 : closedDistance * 1.16,
      ),
      0.14,
      0.27,
    );
    const closedEvidenceDistance = clamp(
      Math.max(
        closedDistanceThreshold + 0.035,
        DEFAULT_THRESHOLDS.closedEvidenceDistance,
        palmScale === null ? 0 : palmScale * 2.05,
        closedDistance === null ? 0 : closedDistance * 1.36,
      ),
      closedDistanceThreshold + 0.025,
      0.32,
    );
    const pullMinDistanceDelta = clamp(
      Math.max(
        DEFAULT_THRESHOLDS.pullMinDistanceDelta,
        palmScale === null ? 0 : palmScale * 0.9,
        openDistance !== null && closedDistance !== null
          ? (openDistance - closedDistance) * 0.22
          : 0,
      ),
      0.055,
      0.14,
    );
    const endpointEnterRadius = clamp(
      Math.max(
        DEFAULT_THRESHOLDS.endpointEnterRadius,
        palmScale === null ? 0 : palmScale * 1.35,
      ),
      0.12,
      0.23,
    );
    const endpointExitRadius = clamp(
      Math.max(
        DEFAULT_THRESHOLDS.endpointExitRadius,
        endpointEnterRadius * 1.45,
        palmScale === null ? 0 : palmScale * 1.85,
      ),
      0.19,
      0.32,
    );
    const reGripMagnetRadius = clamp(
      Math.max(
        DEFAULT_THRESHOLDS.reGripMagnetRadius,
        endpointExitRadius * 1.36,
        palmScale === null ? 0 : palmScale * 2.7,
      ),
      0.26,
      0.44,
    );
    const collapseCompleteDistance = clamp(
      Math.max(
        DEFAULT_THRESHOLDS.collapseCompleteDistance,
        closedDistanceThreshold * 1.05,
        closedDistance === null ? 0 : closedDistance * 1.22,
        palmScale === null ? 0 : palmScale * 1.85,
      ),
      0.16,
      0.28,
    );
    const collapseStartDistance = clamp(
      Math.max(
        DEFAULT_THRESHOLDS.collapseStartDistance,
        collapseCompleteDistance + 0.1,
        openDistance === null ? 0 : openDistance * 0.52,
      ),
      collapseCompleteDistance + 0.07,
      0.52,
    );

    const calibrated = Boolean(palmScale || closedDistance || openDistance);
    const calibrationReason = calibrated
      ? `${reason}: palm=${formatMaybe(palmScale)} closed=${formatMaybe(
          closedDistance,
        )} open=${formatMaybe(openDistance)}`
      : 'default-thresholds';

    this.snapshot = {
      thresholds: {
        closedDistance: closedDistanceThreshold,
        closedEvidenceDistance,
        pullMinDistanceDelta,
        endpointEnterRadius,
        endpointExitRadius,
        reGripMagnetRadius,
        releaseReGripClearRadius: endpointExitRadius,
        collapseStartDistance,
        collapseCompleteDistance,
      },
      averagePalmScale: palmScale,
      closedDistance,
      comfortableOpenDistance: openDistance,
      calibrated,
      reason: calibrationReason,
    };
  }
}

export function getDefaultGestureCalibrationSnapshot(): GestureCalibrationSnapshot {
  return {
    thresholds: DEFAULT_THRESHOLDS,
    averagePalmScale: null,
    closedDistance: null,
    comfortableOpenDistance: null,
    calibrated: false,
    reason: 'default-thresholds',
  };
}

function smoothNullable(
  current: number | null,
  next: number,
  alpha: number,
): number {
  return current === null ? next : current + (next - current) * alpha;
}

function smoothOpenDistance(current: number | null, next: number): number {
  if (current === null) {
    return next;
  }

  if (next > current) {
    return current + (next - current) * OPEN_DISTANCE_ALPHA;
  }

  return current + (next - current) * 0.01;
}

function formatMaybe(value: number | null): string {
  return value === null ? 'n/a' : value.toFixed(3);
}
