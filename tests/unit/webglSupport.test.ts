import { describe, expect, it, vi } from 'vitest';
import { isWebGL2Available } from '../../src/rendering/webglSupport';

describe('isWebGL2Available', () => {
  it('returns true when a WebGL2 context is available', () => {
    const context = {};
    const getContext = vi.fn(() => context);

    expect(isWebGL2Available(() => ({ getContext }))).toBe(true);
    expect(getContext).toHaveBeenCalledWith('webgl2');
  });

  it('returns false when WebGL2 context creation returns null', () => {
    expect(
      isWebGL2Available(() => ({ getContext: vi.fn(() => null) })),
    ).toBe(false);
  });

  it('returns false when context creation throws', () => {
    expect(
      isWebGL2Available(() => ({
        getContext: vi.fn(() => {
          throw new Error('WebGL disabled');
        }),
      })),
    ).toBe(false);
  });
});
