import { describe, expect, it, vi } from 'vitest';
import { WebGLContextLifecycle } from '../../src/rendering/webglContextLifecycle';

describe('WebGLContextLifecycle', () => {
  it('prevents permanent context loss and reports loss/restoration', () => {
    const target = new EventTarget();
    const onLost = vi.fn();
    const onRestored = vi.fn();
    const lifecycle = new WebGLContextLifecycle(target, {
      onLost,
      onRestored,
    });
    const lostEvent = new Event('webglcontextlost', { cancelable: true });

    target.dispatchEvent(lostEvent);
    target.dispatchEvent(new Event('webglcontextrestored'));

    expect(lostEvent.defaultPrevented).toBe(true);
    expect(onLost).toHaveBeenCalledOnce();
    expect(onRestored).toHaveBeenCalledOnce();
    lifecycle.dispose();
  });

  it('removes both listeners when disposed', () => {
    const target = new EventTarget();
    const onLost = vi.fn();
    const onRestored = vi.fn();
    const lifecycle = new WebGLContextLifecycle(target, {
      onLost,
      onRestored,
    });

    lifecycle.dispose();
    target.dispatchEvent(
      new Event('webglcontextlost', { cancelable: true }),
    );
    target.dispatchEvent(new Event('webglcontextrestored'));

    expect(onLost).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });
});
