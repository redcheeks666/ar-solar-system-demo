import { describe, expect, it } from 'vitest';
import { shouldShowDeviceGate } from '../../src/rendering/deviceGate';

describe('shouldShowDeviceGate', () => {
  it('does not interrupt a normal desktop browser', () => {
    expect(
      shouldShowDeviceGate({
        coarsePointer: false,
        maxTouchPoints: 0,
        viewportWidth: 1440,
      }),
    ).toBe(false);
  });

  it('shows guidance for a coarse-pointer device', () => {
    expect(
      shouldShowDeviceGate({
        coarsePointer: true,
        maxTouchPoints: 0,
        viewportWidth: 1440,
      }),
    ).toBe(true);
  });

  it('shows guidance for a touch device with a tablet-sized viewport', () => {
    expect(
      shouldShowDeviceGate({
        coarsePointer: false,
        maxTouchPoints: 5,
        viewportWidth: 1180,
      }),
    ).toBe(true);
  });

  it('shows guidance for a narrow viewport without assuming touch', () => {
    expect(
      shouldShowDeviceGate({
        coarsePointer: false,
        maxTouchPoints: 0,
        viewportWidth: 600,
      }),
    ).toBe(true);
  });

  it('does not gate a large fine-pointer touch-capable desktop', () => {
    expect(
      shouldShowDeviceGate({
        coarsePointer: false,
        maxTouchPoints: 10,
        viewportWidth: 1920,
      }),
    ).toBe(false);
  });
});
