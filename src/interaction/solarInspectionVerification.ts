import type {
  InteractionState,
  SolarInspectionSnapshot,
  SolarInspectionVerificationSnapshot,
} from '../utils/types';

export const EMPTY_SOLAR_INSPECTION_VERIFICATION: SolarInspectionVerificationSnapshot = {
  reachedFreeHover: false,
  observedZoomIn: false,
  observedZoomOut: false,
  observedPan: false,
  observedResetHold: false,
  observedReset: false,
  observedDisabledDuringHandleControl: false,
  observedReGripAfterInspection: false,
  completed: false,
  completedAt: null,
  completedCount: 0,
  totalCount: 8,
  remainingItems: 'free-hover, zoom-in, zoom-out, pan, reset-hold, reset, handle-off, re-grip-after-inspection',
  nextItem: 'free-hover',
  lastMatchedIntent: null,
  lastUpdatedAt: null,
  lastInspectionScale: null,
  lastInspectionOffset: null,
};

const SCALE_EVIDENCE_EPSILON = 0.005;
const OFFSET_EVIDENCE_EPSILON = 0.015;
const RESET_SCALE_EPSILON = 0.035;
const RESET_OFFSET_EPSILON = 0.06;

export interface SolarInspectionVerificationChecklistItem {
  id:
    | 'free-hover'
    | 'zoom-in'
    | 'zoom-out'
    | 'pan'
    | 'reset-hold'
    | 'reset'
    | 'handle-off'
    | 're-grip-after-inspection';
  label: string;
  action: string;
  observe: string;
  passCondition: string;
  done: boolean;
}

export function updateSolarInspectionVerification(
  previous: SolarInspectionVerificationSnapshot,
  interactionState: InteractionState,
  solarInspection: SolarInspectionSnapshot,
  timestamp: number,
): SolarInspectionVerificationSnapshot {
  const scaleDelta =
    previous.lastInspectionScale === null
      ? 0
      : solarInspection.inspectionScale - previous.lastInspectionScale;
  const offsetDelta =
    previous.lastInspectionOffset === null
      ? 0
      : distance3(solarInspection.inspectionOffset, previous.lastInspectionOffset);
  const observedZoomInNow =
    solarInspection.intent === 'zoomIn' &&
    scaleDelta > SCALE_EVIDENCE_EPSILON;
  const observedZoomOutNow =
    solarInspection.intent === 'zoomOut' &&
    scaleDelta < -SCALE_EVIDENCE_EPSILON;
  const observedPanNow =
    solarInspection.intent === 'pan' && offsetDelta > OFFSET_EVIDENCE_EPSILON;
  const observedResetHoldNow = solarInspection.intent === 'resetHold';
  const observedResetNow =
    solarInspection.intent === 'reset' && isDefaultInspectionTransform(solarInspection);
  const observedHandleOffNow =
    interactionState === 'SolarHandleControl' &&
    !solarInspection.active &&
    solarInspection.intent === 'inactive';
  const observedReGripNow =
    hasObservedInspectionChange(previous) && observedHandleOffNow;

  const next: SolarInspectionVerificationSnapshot = {
    ...previous,
    reachedFreeHover:
      previous.reachedFreeHover || interactionState === 'SolarFreeHover',
    observedZoomIn: previous.observedZoomIn || observedZoomInNow,
    observedZoomOut: previous.observedZoomOut || observedZoomOutNow,
    observedPan: previous.observedPan || observedPanNow,
    observedResetHold: previous.observedResetHold || observedResetHoldNow,
    observedReset: previous.observedReset || observedResetNow,
    observedDisabledDuringHandleControl:
      previous.observedDisabledDuringHandleControl || observedHandleOffNow,
    observedReGripAfterInspection:
      previous.observedReGripAfterInspection || observedReGripNow,
    lastInspectionScale: solarInspection.inspectionScale,
    lastInspectionOffset: { ...solarInspection.inspectionOffset },
  };

  const matchedIntent = getMatchedIntent(previous, {
    observedZoomInNow,
    observedZoomOutNow,
    observedPanNow,
    observedResetHoldNow,
    observedResetNow,
    observedHandleOffNow,
    observedReGripNow,
  });

  const checklist = getSolarInspectionVerificationChecklist(next);
  next.totalCount = checklist.length;
  next.completedCount = checklist.filter((item) => item.done).length;
  next.remainingItems =
    checklist
      .filter((item) => !item.done)
      .map((item) => item.label)
      .join(', ') || 'none';
  next.nextItem = checklist.find((item) => !item.done)?.label ?? 'none';
  next.completed = next.completedCount === next.totalCount;

  if (next.completed && previous.completedAt === null) {
    next.completedAt = timestamp;
  }

  if (matchedIntent) {
    next.lastMatchedIntent = matchedIntent;
    next.lastUpdatedAt = timestamp;
  }

  return next;
}

export function getSolarInspectionVerificationChecklist(
  snapshot: SolarInspectionVerificationSnapshot,
): SolarInspectionVerificationChecklistItem[] {
  return [
    {
      id: 'free-hover',
      label: 'free-hover',
      action: 'Open the solar system, grip the endpoints, then release into free hover.',
      observe: 'Camera preview, interaction state, and M5.5 checklist.',
      passCondition: 'Solar content remains visible and interaction state reaches SolarFreeHover.',
      done: snapshot.reachedFreeHover,
    },
    {
      id: 'zoom-in',
      label: 'zoom-in',
      action: 'In SolarFreeHover, show exactly one hand and spread fingers while keeping the palm center mostly still.',
      observe: 'Solar inspect, Inspect spread velocity, and Inspect scale / offset.',
      passCondition: 'Solar inspect reaches zoomIn and inspection scale rises above the previous value.',
      done: snapshot.observedZoomIn,
    },
    {
      id: 'zoom-out',
      label: 'zoom-out',
      action: 'In SolarFreeHover, show exactly one hand and contract fingers while keeping the palm center mostly still.',
      observe: 'Solar inspect, Inspect spread velocity, and Inspect scale / offset.',
      passCondition: 'Solar inspect reaches zoomOut and inspection scale decreases from the previous value.',
      done: snapshot.observedZoomOut,
    },
    {
      id: 'pan',
      label: 'pan',
      action: 'After zooming, keep finger spread stable and push one hand left, right, up, or down.',
      observe: 'Solar inspect, Inspect pan score, Inspect palm velocity, and Inspect scale / offset.',
      passCondition: 'Solar inspect reaches pan and inspection offset changes in the push direction.',
      done: snapshot.observedPan,
    },
    {
      id: 'reset-hold',
      label: 'reset-hold',
      action: 'In SolarFreeHover, contract the same hand into a fist and keep holding.',
      observe: 'Solar inspect and Inspect reset hold.',
      passCondition: 'Solar inspect reaches resetHold and reset hold time climbs toward about 2000ms.',
      done: snapshot.observedResetHold,
    },
    {
      id: 'reset',
      label: 'reset',
      action: 'Keep the fist held until the reset completes.',
      observe: 'Solar inspect and Inspect scale / offset.',
      passCondition: 'Solar inspect reaches reset, inspection scale returns near 1.00, and offset returns near 0,0,0.',
      done: snapshot.observedReset,
    },
    {
      id: 'handle-off',
      label: 'handle-off',
      action: 'While in SolarHandleControl, move or spread one hand as if trying M5.5 inspection.',
      observe: 'Solar inspect and camera preview.',
      passCondition: 'Solar inspect stays inactive while SolarHandleControl owns the transform.',
      done: snapshot.observedDisabledDuringHandleControl,
    },
    {
      id: 're-grip-after-inspection',
      label: 're-grip-after-inspection',
      action: 'After zooming or panning in SolarFreeHover, bring both hands back to the visible endpoints.',
      observe: 'Camera preview, interaction state, Solar reason, and endpoint/re-grip debug rows.',
      passCondition: 'State returns to SolarHandleControl at the visually updated endpoints without snapping to the old release center.',
      done: snapshot.observedReGripAfterInspection,
    },
  ];
}

function hasObservedInspectionChange(
  snapshot: SolarInspectionVerificationSnapshot,
): boolean {
  return snapshot.observedZoomIn || snapshot.observedZoomOut || snapshot.observedPan;
}

function getMatchedIntent(
  previous: SolarInspectionVerificationSnapshot,
  evidence: {
    observedZoomInNow: boolean;
    observedZoomOutNow: boolean;
    observedPanNow: boolean;
    observedResetHoldNow: boolean;
    observedResetNow: boolean;
    observedHandleOffNow: boolean;
    observedReGripNow: boolean;
  },
) {
  if (evidence.observedZoomInNow && !previous.observedZoomIn) {
    return 'zoomIn';
  }

  if (evidence.observedZoomOutNow && !previous.observedZoomOut) {
    return 'zoomOut';
  }

  if (evidence.observedPanNow && !previous.observedPan) {
    return 'pan';
  }

  if (evidence.observedResetHoldNow && !previous.observedResetHold) {
    return 'resetHold';
  }

  if (evidence.observedResetNow && !previous.observedReset) {
    return 'reset';
  }

  if (evidence.observedReGripNow && !previous.observedReGripAfterInspection) {
    return 'reGripAfterInspection';
  }

  if (evidence.observedHandleOffNow && !previous.observedDisabledDuringHandleControl) {
    return 'inactive';
  }

  return null;
}

function isDefaultInspectionTransform(
  solarInspection: SolarInspectionSnapshot,
): boolean {
  return (
    Math.abs(solarInspection.inspectionScale - 1) <= RESET_SCALE_EPSILON &&
    distance3(solarInspection.inspectionOffset, { x: 0, y: 0, z: 0 }) <=
      RESET_OFFSET_EPSILON
  );
}

function distance3(
  first: { x: number; y: number; z: number },
  second: { x: number; y: number; z: number },
): number {
  return Math.hypot(
    first.x - second.x,
    first.y - second.y,
    first.z - second.z,
  );
}
