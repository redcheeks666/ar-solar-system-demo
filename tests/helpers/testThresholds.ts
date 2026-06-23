import { getDefaultGestureCalibrationSnapshot } from '../../src/interaction/gestureCalibration';
import type { GestureThresholds } from '../../src/utils/types';

/**
 * Fixed default gesture thresholds. Controller tests inject these instead of running the
 * session-adaptive calibration, so the logic is tested independently and deterministically.
 */
export const DEFAULT_GESTURE_THRESHOLDS: GestureThresholds =
  getDefaultGestureCalibrationSnapshot().thresholds;
