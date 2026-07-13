import { describe, expect, it } from 'vitest';
import { RingGeometry } from 'three';
import { applyRadialRingTextureUvs } from '../../src/solar/ringTextureMapping';

describe('applyRadialRingTextureUvs', () => {
  it('samples a one-dimensional texture from the inner to outer radius', () => {
    const innerRadius = 2;
    const outerRadius = 4;
    const geometry = new RingGeometry(innerRadius, outerRadius, 8, 2);

    applyRadialRingTextureUvs(geometry, innerRadius, outerRadius);

    const positions = geometry.getAttribute('position');
    const uvs = geometry.getAttribute('uv');

    for (let index = 0; index < positions.count; index += 1) {
      const radius = Math.hypot(positions.getX(index), positions.getY(index));
      const expectedU = (radius - innerRadius) / (outerRadius - innerRadius);

      expect(uvs.getX(index)).toBeCloseTo(expectedU, 5);
      expect(uvs.getY(index)).toBeCloseTo(0.5, 5);
    }

    geometry.dispose();
  });
});
