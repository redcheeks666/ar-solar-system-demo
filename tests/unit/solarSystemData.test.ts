import { describe, expect, it } from 'vitest';
import {
  CELESTIAL_BODY_DEFINITIONS,
  CELESTIAL_BODY_REGISTRY,
  INTERACTIVE_CELESTIAL_BODY_DEFINITIONS,
  INTERACTIVE_CELESTIAL_BODY_IDS,
  getInteractiveCelestialBodyDefinition,
  getOriginalOrbitTransform,
  isInteractiveCelestialBodyId,
  type InteractiveCelestialBodyId,
} from '../../src/solar/solarSystemData';

const MVP_BODY_IDS: readonly InteractiveCelestialBodyId[] = [
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];

describe('solar system body registry', () => {
  it('defines exactly the nine MVP interactive bodies', () => {
    expect(INTERACTIVE_CELESTIAL_BODY_IDS).toEqual(MVP_BODY_IDS);
    expect(INTERACTIVE_CELESTIAL_BODY_DEFINITIONS.map((body) => body.id)).toEqual(
      MVP_BODY_IDS,
    );
    expect(isInteractiveCelestialBodyId('sun')).toBe(false);
    expect(isInteractiveCelestialBodyId('earth')).toBe(true);
  });

  it('keeps every body in the shared registry with unique ids', () => {
    const ids = CELESTIAL_BODY_DEFINITIONS.map((body) => body.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CELESTIAL_BODY_REGISTRY.size).toBe(CELESTIAL_BODY_DEFINITIONS.length);

    CELESTIAL_BODY_DEFINITIONS.forEach((body) => {
      expect(CELESTIAL_BODY_REGISTRY.get(body.id)).toBe(body);
      expect(body.name.length).toBeGreaterThan(0);
      expect(body.label.length).toBeGreaterThan(0);
    });
  });

  it('provides activation, focus, and return metadata for each interactive body', () => {
    INTERACTIVE_CELESTIAL_BODY_IDS.forEach((id) => {
      const body = getInteractiveCelestialBodyDefinition(id);
      const orbit = getOriginalOrbitTransform(id);

      expect(body.activationHitRadius).toBeGreaterThan(body.radius);
      expect(body.focusDefault.scale).toBeGreaterThan(0);
      expect(Number.isFinite(body.focusDefault.position.x)).toBe(true);
      expect(Number.isFinite(body.focusDefault.position.y)).toBe(true);
      expect(Number.isFinite(body.focusDefault.position.z)).toBe(true);
      expect(orbit.parentId).toBe(body.returnTarget.parentId);
      expect(orbit.orbitRadius).toBe(body.returnTarget.orbitRadius);
      expect(orbit.orbitPhase).toBe(body.returnTarget.orbitPhase);
      expect(
        Math.hypot(orbit.localPosition.x, orbit.localPosition.y),
      ).toBeCloseTo(body.returnTarget.orbitRadius, 6);
    });
  });

  it('keeps the Moon parented to Earth and Saturn visually ringed', () => {
    const moon = getInteractiveCelestialBodyDefinition('moon');
    const earth = getInteractiveCelestialBodyDefinition('earth');
    const saturn = getInteractiveCelestialBodyDefinition('saturn');

    expect(moon.parentId).toBe('earth');
    expect(moon.returnTarget.parentId).toBe('earth');
    expect(moon.radius).toBeLessThan(earth.radius);
    expect(moon.baseColor).not.toBe(earth.baseColor);
    expect(saturn.ring?.outerRadius).toBeGreaterThan(saturn.radius);
    expect(saturn.ring?.innerRadius).toBeGreaterThan(saturn.radius);
  });
});
