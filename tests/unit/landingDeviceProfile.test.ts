import { describe, expect, it } from 'vitest';
import {
  getLandingExperienceBlockReason,
  shouldUseStaticLandingBackdrop,
} from '../../src/landing/landingDeviceProfile';

const DESKTOP = {
  coarsePointer: false,
  maxTouchPoints: 0,
  viewportWidth: 1440,
};

describe('landing device degradation', () => {
  it('keeps the dynamic backdrop and experience entry on desktop', () => {
    expect(shouldUseStaticLandingBackdrop(DESKTOP)).toBe(false);
    expect(
      getLandingExperienceBlockReason({
        deviceFacts: DESKTOP,
        webgl2Available: true,
      }),
    ).toBeNull();
  });

  it.each([
    { ...DESKTOP, coarsePointer: true },
    { ...DESKTOP, maxTouchPoints: 5, viewportWidth: 1024 },
    { ...DESKTOP, viewportWidth: 720 },
  ])('uses a static backdrop and blocks mobile entry for %o', (deviceFacts) => {
    expect(shouldUseStaticLandingBackdrop(deviceFacts)).toBe(true);
    expect(
      getLandingExperienceBlockReason({
        deviceFacts,
        webgl2Available: true,
      }),
    ).toBe('desktop-device-required');
  });

  it('reports WebGL2 first when rendering support is missing', () => {
    expect(
      getLandingExperienceBlockReason({
        deviceFacts: DESKTOP,
        webgl2Available: false,
      }),
    ).toBe('webgl2-unavailable');
  });
});
