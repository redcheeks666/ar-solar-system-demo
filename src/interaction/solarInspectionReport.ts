import type {
  CameraPermissionStatus,
  InteractionState,
  SolarInspectionSnapshot,
  SolarInspectionVerificationSnapshot,
  TrackingStatus,
} from '../utils/types';
import {
  getSolarInspectionVerificationChecklist,
  type SolarInspectionVerificationChecklistItem,
} from './solarInspectionVerification';

export interface SolarInspectionReportInput {
  createdAt: string;
  cameraStatus: CameraPermissionStatus;
  trackingStatus: TrackingStatus;
  interactionState: InteractionState;
  solar: {
    openProgress: number;
    scale: number;
    reason: string;
  };
  inspection: SolarInspectionSnapshot;
  verification: SolarInspectionVerificationSnapshot;
}

export interface SolarInspectionVerificationReport
  extends SolarInspectionReportInput {
  version: 1;
  note: string;
  passed: boolean;
  remainingItems: string;
  nextItem: string;
  checklist: SolarInspectionVerificationChecklistItem[];
}

export function createSolarInspectionVerificationReport(
  input: SolarInspectionReportInput,
): SolarInspectionVerificationReport {
  return {
    version: 1,
    note: 'M5.5 verification summary only. No raw camera video is included.',
    ...input,
    passed: input.verification.completed,
    remainingItems: input.verification.remainingItems,
    nextItem: input.verification.nextItem,
    checklist: getSolarInspectionVerificationChecklist(input.verification),
  };
}
