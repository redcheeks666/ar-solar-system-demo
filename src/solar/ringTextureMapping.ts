import { BufferAttribute, RingGeometry } from 'three';
import { clamp } from '../utils/math';

const MIN_RING_WIDTH = 0.000001;

/** Maps a one-dimensional inner-to-outer ring strip by vertex radius. */
export function applyRadialRingTextureUvs(
  geometry: RingGeometry,
  innerRadius: number,
  outerRadius: number,
): void {
  const positions = geometry.getAttribute('position');
  const uvs = geometry.getAttribute('uv') as BufferAttribute;
  const ringWidth = Math.max(outerRadius - innerRadius, MIN_RING_WIDTH);

  for (let index = 0; index < positions.count; index += 1) {
    const radius = Math.hypot(positions.getX(index), positions.getY(index));
    const radialPosition = clamp((radius - innerRadius) / ringWidth, 0, 1);
    uvs.setXY(index, radialPosition, 0.5);
  }

  uvs.needsUpdate = true;
}
