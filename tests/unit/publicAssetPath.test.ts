import { describe, expect, it } from 'vitest';
import { withPublicBasePath } from '../../src/utils/publicAssetPath';

describe('withPublicBasePath', () => {
  it('keeps root-hosted public assets at the origin root', () => {
    expect(withPublicBasePath('/mediapipe/wasm', '/')).toBe(
      '/mediapipe/wasm',
    );
  });

  it('places public assets under an overridden deployment base', () => {
    expect(withPublicBasePath('/assets/solar/fx/glow.png', '/ar-solar/')).toBe(
      '/ar-solar/assets/solar/fx/glow.png',
    );
  });

  it('normalizes a missing trailing slash defensively', () => {
    expect(withPublicBasePath('/mediapipe/models/hand.task', '/demo')).toBe(
      '/demo/mediapipe/models/hand.task',
    );
  });
});
