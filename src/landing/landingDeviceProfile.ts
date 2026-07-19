import {
  shouldShowDeviceGate,
  type DeviceGateFacts,
} from '../rendering/deviceGate';

export type LandingExperienceBlockReason =
  | 'webgl2-unavailable'
  | 'desktop-device-required'
  | null;

export function shouldUseStaticLandingBackdrop(
  facts: DeviceGateFacts,
): boolean {
  return shouldShowDeviceGate(facts);
}

export function getLandingExperienceBlockReason(input: {
  readonly deviceFacts: DeviceGateFacts;
  readonly webgl2Available: boolean;
}): LandingExperienceBlockReason {
  if (!input.webgl2Available) {
    return 'webgl2-unavailable';
  }

  return shouldShowDeviceGate(input.deviceFacts)
    ? 'desktop-device-required'
    : null;
}
