import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Points,
  RingGeometry,
  ShaderMaterial,
  Sprite,
  Vector3,
} from 'three';
import { CAMERA_FOV, CAMERA_Z } from '../../src/rendering/scene';
import {
  BACKGROUND_RENDER_LAYER,
  BLOOM_RENDER_LAYER,
} from '../../src/rendering/renderLayers';
import {
  FOCUS_BODY_WORLD_Z,
  FOCUS_INTRO_DURATION_SECONDS,
  FOCUS_RETURN_DURATION_SECONDS,
  getFocusedBodyReturnThrowStrength,
  getFocusedBodyScreenHeightFraction,
} from '../../src/solar/focusedCelestialBody';
import { createFocusedBodyReturnMotionFromWave } from '../../src/solar/focusedBodyReturnMotion';
import { SOLAR_PARTICLE_COUNT } from '../../src/solar/solarParticles';
import { CodePlaceholderSolarSystem } from '../../src/solar/solarSystem';
import type { InteractiveCelestialBodyId } from '../../src/solar/solarSystemData';
import { TEST_LAYOUT, createTestCamera } from '../helpers/testCamera';
import {
  AE_RIFT_BORDER_SOURCE_HEIGHT,
  AE_RIFT_BORDER_SOURCE_WIDTH,
  AE_RIFT_VERTICAL_TILT_DEGREES,
  SOLAR_SYSTEM_PREVIEW_TILT_X_DEGREES,
  SOLAR_BACKGROUND_OPACITY_SCALE,
  UNIVERSE_RIFT_HEIGHT,
  UNIVERSE_RIFT_WIDTH,
} from '../../src/solar/solarVisualConfig';

function createCanvasContextStub(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  vi.stubGlobal('document', {
    createElement: (tagName: string) => {
      if (tagName !== 'canvas') {
        throw new Error(`Unexpected element in solar-system test: ${tagName}`);
      }

      return {
        width: 0,
        height: 0,
        getContext: () => createCanvasContextStub(),
      };
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const FOCUS_VIEWPORT_HEIGHT =
  2 *
  (CAMERA_Z - FOCUS_BODY_WORLD_Z) *
  Math.tan((CAMERA_FOV * Math.PI) / 360);

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

function getFocusedBodyHeightFraction(
  solarSystem: CodePlaceholderSolarSystem,
  id: InteractiveCelestialBodyId,
): number {
  const definition = solarSystem.getBodyDefinition(id);
  const focusRoot = solarSystem.group.getObjectByName(`focus-${id}-root`);
  expect(focusRoot).toBeDefined();
  const worldScale = focusRoot!.getWorldScale(new Vector3());

  return (definition.radius * 2 * Math.abs(worldScale.y)) / FOCUS_VIEWPORT_HEIGHT;
}

describe('CodePlaceholderSolarSystem interaction state', () => {
  it('maps display-space upper corners into matching world-space throw directions', () => {
    const baseWave = {
      horizontalDisplacement: 0.4,
      upwardDisplacement: 0.3,
      peakSpeed: 6,
    } as const;
    const left = createFocusedBodyReturnMotionFromWave({
      ...baseWave,
      cornerDirection: 'upper-left',
    });
    const right = createFocusedBodyReturnMotionFromWave({
      ...baseWave,
      cornerDirection: 'upper-right',
    });

    expect(left?.throwDirection).toEqual({ x: -0.8, y: 0.6, z: 0 });
    expect(right?.throwDirection).toEqual({ x: 0.8, y: 0.6, z: 0 });
    expect(
      createFocusedBodyReturnMotionFromWave({
        ...baseWave,
        cornerDirection: null,
      }),
    ).toBeNull();
  });

  it('matches the AE-approved pre-flattened rift angle with an equivalent runtime pitch', () => {
    const aeProjectedHeightRatio =
      (AE_RIFT_BORDER_SOURCE_HEIGHT / AE_RIFT_BORDER_SOURCE_WIDTH) *
      Math.cos(degreesToRadians(AE_RIFT_VERTICAL_TILT_DEGREES));
    const runtimeProjectedHeightRatio =
      (UNIVERSE_RIFT_HEIGHT / UNIVERSE_RIFT_WIDTH) *
      Math.cos(Math.abs(degreesToRadians(SOLAR_SYSTEM_PREVIEW_TILT_X_DEGREES)));

    expect(Math.abs(SOLAR_SYSTEM_PREVIEW_TILT_X_DEGREES)).toBeGreaterThan(
      AE_RIFT_VERTICAL_TILT_DEGREES,
    );
    expect(runtimeProjectedHeightRatio).toBeCloseTo(
      aeProjectedHeightRatio,
      6,
    );
  });

  it('uses compressed presentation-scale body sizes for overview readability', () => {
    const solarSystem = new CodePlaceholderSolarSystem();

    try {
      const mercury = solarSystem.getBodyDefinition('mercury');
      const earth = solarSystem.getBodyDefinition('earth');
      const moon = solarSystem.getBodyDefinition('moon');
      const mars = solarSystem.getBodyDefinition('mars');
      const jupiter = solarSystem.getBodyDefinition('jupiter');
      const saturn = solarSystem.getBodyDefinition('saturn');

      expect(mercury.radius).toBeGreaterThanOrEqual(0.14);
      expect(moon.radius).toBeGreaterThanOrEqual(0.09);
      expect(mars.radius).toBeGreaterThan(mercury.radius);
      expect(earth.radius).toBeGreaterThan(mars.radius);
      expect(jupiter.radius).toBeGreaterThan(earth.radius);
      expect(saturn.radius).toBeGreaterThan(earth.radius);
      expect(jupiter.radius / earth.radius).toBeLessThan(2);
      expect(moon.orbitRadius).toBeGreaterThan(earth.radius + moon.radius);
    } finally {
      solarSystem.dispose();
    }
  });

  it('maps the Moon overview hit point into the Earth-Moon focus entry', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      const targets = solarSystem.getInteractiveBodyScreenTargets(
        createTestCamera(),
        TEST_LAYOUT,
      );
      const earthTargets = targets.filter((target) => target.id === 'earth');

      expect(targets.some((target) => target.id === 'moon')).toBe(false);
      expect(earthTargets.length).toBeGreaterThanOrEqual(2);
      expect(
        earthTargets[0].screenPosition.x !== earthTargets[1].screenPosition.x ||
          earthTargets[0].screenPosition.y !== earthTargets[1].screenPosition.y,
      ).toBe(true);
    } finally {
      solarSystem.dispose();
    }
  });

  it('pauses only the activated orbit, keeps self-rotation, and resumes the previous body when activation switches', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      const earthSpin = solarSystem.group.getObjectByName('earth-spin');
      expect(earthSpin).toBeDefined();

      const earthStart = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      ).clone();
      const earthSpinStart = earthSpin?.rotation.y ?? 0;

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
      });
      solarSystem.update(1);

      const earthPaused = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      ).clone();

      expect(earthPaused.distanceTo(earthStart)).toBeLessThan(0.000001);
      expect(earthSpin?.rotation.y).toBeGreaterThan(earthSpinStart);

      solarSystem.applyBodyInteractionState({
        hoveredBody: 'mars',
        activatedBody: 'mars',
      });
      solarSystem.update(1);

      const earthResumed = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      );

      expect(earthResumed.distanceTo(earthPaused)).toBeGreaterThan(0.1);
    } finally {
      solarSystem.dispose();
    }
  });

  it('keeps the Earth solar orbit fixed on Earth activation while the Moon still orbits Earth', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      const earthSpin = solarSystem.group.getObjectByName('earth-spin');
      const moonSpin = solarSystem.group.getObjectByName('moon-spin');
      expect(earthSpin).toBeDefined();
      expect(moonSpin).toBeDefined();

      const earthStart = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      ).clone();
      const moonStart = solarSystem.getBodyWorldPosition(
        'moon',
        new Vector3(),
      ).clone();
      const earthSpinStart = earthSpin?.rotation.y ?? 0;
      const moonSpinStart = moonSpin?.rotation.y ?? 0;

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
      });
      solarSystem.update(1);

      const earthAfter = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      );
      const moonAfter = solarSystem.getBodyWorldPosition(
        'moon',
        new Vector3(),
      );

      expect(earthAfter.distanceTo(earthStart)).toBeLessThan(0.000001);
      expect(moonAfter.distanceTo(moonStart)).toBeGreaterThan(0.1);
      expect(earthSpin?.rotation.y).toBeGreaterThan(earthSpinStart);
      expect(moonSpin?.rotation.y).toBeGreaterThan(moonSpinStart);
    } finally {
      solarSystem.dispose();
    }
  });

  it('freezes both Earth solar orbit and Moon local orbit on Moon activation while both keep self-rotating', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      const earthSpin = solarSystem.group.getObjectByName('earth-spin');
      const moonSpin = solarSystem.group.getObjectByName('moon-spin');
      expect(earthSpin).toBeDefined();
      expect(moonSpin).toBeDefined();

      const earthStart = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      ).clone();
      const moonStart = solarSystem.getBodyWorldPosition(
        'moon',
        new Vector3(),
      ).clone();
      const earthSpinStart = earthSpin?.rotation.y ?? 0;
      const moonSpinStart = moonSpin?.rotation.y ?? 0;

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'moon',
      });
      solarSystem.update(1);

      const earthAfter = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      );
      const moonAfter = solarSystem.getBodyWorldPosition(
        'moon',
        new Vector3(),
      );

      expect(earthAfter.distanceTo(earthStart)).toBeLessThan(0.000001);
      expect(moonAfter.distanceTo(moonStart)).toBeLessThan(0.000001);
      expect(earthSpin?.rotation.y).toBeGreaterThan(earthSpinStart);
      expect(moonSpin?.rotation.y).toBeGreaterThan(moonSpinStart);
    } finally {
      solarSystem.dispose();
    }
  });

  it('maps opening progress to rift and endpoint anchor VFX without auto-completing', () => {
    const solarSystem = new CodePlaceholderSolarSystem();

    try {
      const openingVfx = solarSystem.group.getObjectByName('solar-opening-vfx');
      const riftRoot = solarSystem.group.getObjectByName(
        'universe-rift-backdrop',
      );
      const starfield = solarSystem.group.getObjectByName(
        'universe-rift-elliptical-starfield',
      ) as Mesh;
      const starfieldUniforms = (starfield.material as ShaderMaterial).uniforms;
      const burstRift = solarSystem.group.getObjectByName(
        'solar-opening-burst-rift',
      );
      const shockwave = solarSystem.group.getObjectByName(
        'solar-opening-cyan-shockwave-ring',
      );
      const leftAnchor = solarSystem.group.getObjectByName(
        'solar-opening-left-hand-blue-anchor-glow',
      );
      const rightAnchor = solarSystem.group.getObjectByName(
        'solar-opening-right-hand-gold-anchor-glow',
      );
      const leftEndpoint = solarSystem.group.getObjectByName(
        'visual-left-control-endpoint',
      );
      const rightEndpoint = solarSystem.group.getObjectByName(
        'visual-right-control-endpoint',
      );

      // The tearing crack now lives in the rift backdrop shader; the old crack
      // sprites are gone.
      expect(
        solarSystem.group.getObjectByName('solar-opening-thin-space-crack'),
      ).toBeUndefined();
      expect(
        solarSystem.group.getObjectByName('solar-opening-blue-gold-energy-rift'),
      ).toBeUndefined();
      expect(openingVfx?.visible).toBe(false);

      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(0);
      expect(solarSystem.group.visible).toBe(false);
      expect(openingVfx?.visible).toBe(false);

      solarSystem.setOpeningProgress(0.12);
      expect(solarSystem.group.visible).toBe(true);
      expect(openingVfx?.visible).toBe(true);
      expect(riftRoot?.visible).toBe(true);
      const seamApertureY = starfieldUniforms.aperture.value.y as number;
      expect(seamApertureY).toBeLessThan(0.2);
      expect(leftAnchor?.visible).toBe(true);
      expect(rightAnchor?.visible).toBe(true);
      expect(leftAnchor?.position.x).toBeCloseTo(leftEndpoint?.position.x ?? 0, 5);
      expect(rightAnchor?.position.x).toBeCloseTo(rightEndpoint?.position.x ?? 0, 5);

      solarSystem.setOpeningProgress(0.48);
      expect(starfieldUniforms.aperture.value.y as number).toBeGreaterThan(
        seamApertureY,
      );

      solarSystem.setOpeningProgress(0.72);
      expect(burstRift?.visible).toBe(true);
      expect(shockwave?.visible).toBe(true);

      solarSystem.setOpeningProgress(1);
      expect(starfieldUniforms.aperture.value.x).toBeCloseTo(1, 5);
      expect(starfieldUniforms.aperture.value.y).toBeCloseTo(1, 5);
      expect(riftRoot?.scale.x).toBeCloseTo(1, 5);
      expect(burstRift?.visible).toBe(false);
      expect(shockwave?.visible).toBe(false);
      expect(leftAnchor?.visible).toBe(false);
      expect(rightAnchor?.visible).toBe(false);
    } finally {
      solarSystem.dispose();
    }
  });

  it('plays an implosion pulse instead of reversed opening shockwaves while closing', () => {
    const solarSystem = new CodePlaceholderSolarSystem();

    try {
      const burstRift = solarSystem.group.getObjectByName(
        'solar-opening-burst-rift',
      );
      const cyanShockwave = solarSystem.group.getObjectByName(
        'solar-opening-cyan-shockwave-ring',
      );
      const blueGoldShockwave = solarSystem.group.getObjectByName(
        'solar-opening-blue-gold-shockwave-ring',
      );

      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(1);
      solarSystem.setClosingActive(true);

      // Passing back through the opening shockwave window must not re-fire it.
      solarSystem.setOpeningProgress(0.75);
      expect(burstRift?.visible).toBe(false);
      expect(cyanShockwave?.visible).toBe(false);
      expect(blueGoldShockwave?.visible).toBe(false);

      // The implosion beats fire near the end of the collapse instead.
      solarSystem.setOpeningProgress(0.2);
      expect(burstRift?.visible).toBe(true);
      expect(cyanShockwave?.visible).toBe(true);
      expect(blueGoldShockwave?.visible).toBe(false);

      solarSystem.setOpeningProgress(0.02);
      expect(burstRift?.visible).toBe(false);
      expect(cyanShockwave?.visible).toBe(false);
    } finally {
      solarSystem.dispose();
    }
  });

  it('shows lightweight stardust and trail particles only after opening is underway', () => {
    const solarSystem = new CodePlaceholderSolarSystem();

    try {
      const particleRoot = solarSystem.group.getObjectByName(
        'solar-particles-root',
      );
      const whiteStardust = solarSystem.group.getObjectByName(
        'solar-stardust-white-points',
      ) as Points;
      const cyanTrails = solarSystem.group.getObjectByName(
        'solar-cyan-trail-points',
      ) as Points;

      expect(particleRoot?.visible).toBe(false);
      expect(whiteStardust).toBeDefined();
      expect(cyanTrails).toBeDefined();
      const particlePointCount = [
        'solar-stardust-white-points',
        'solar-stardust-field-points',
        'solar-cyan-trail-points',
        'solar-gold-trail-points',
        'solar-micro-flare-points',
      ].reduce((total, objectName) => {
        const points = solarSystem.group.getObjectByName(objectName) as Points;
        const position = points.geometry.getAttribute('position');

        return total + position.count;
      }, 0);
      expect(particlePointCount).toBe(SOLAR_PARTICLE_COUNT);

      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(0.24);
      expect(particleRoot?.visible).toBe(false);

      solarSystem.setOpeningProgress(0.5);
      expect(particleRoot?.visible).toBe(true);
      expect(whiteStardust.visible).toBe(true);
      expect(cyanTrails.visible).toBe(true);
      const openingOpacity = whiteStardust.material.opacity;
      expect(openingOpacity).toBeLessThanOrEqual(
        0.18 * SOLAR_BACKGROUND_OPACITY_SCALE,
      );

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
        focusedBody: 'earth',
      });
      // The focus dim eases in over time instead of snapping.
      const preEaseOpacity = whiteStardust.material.opacity;
      solarSystem.update(1);
      expect(preEaseOpacity).toBeGreaterThan(whiteStardust.material.opacity);
      expect(whiteStardust.material.opacity).toBeLessThan(openingOpacity);
    } finally {
      solarSystem.dispose();
    }
  });

  it('reveals the universe rift backdrop with opening progress and dims it during focus', () => {
    const solarSystem = new CodePlaceholderSolarSystem();

    try {
      const riftRoot = solarSystem.group.getObjectByName('universe-rift-backdrop');
      const starfield = solarSystem.group.getObjectByName(
        'universe-rift-elliptical-starfield',
      ) as Mesh;

      expect(riftRoot?.visible).toBe(false);
      expect(starfield).toBeDefined();
      expect(
        solarSystem.group.getObjectByName('universe-rift-border-soft-glow'),
      ).toBeUndefined();
      expect(
        solarSystem.group.getObjectByName('universe-rift-ae-border-glow'),
      ).toBeUndefined();
      expect(
        solarSystem.group.getObjectByName('universe-rift-ae-border-sequence'),
      ).toBeUndefined();
      expect(
        solarSystem.group.getObjectByName('universe-rift-ae-border-support'),
      ).toBeUndefined();
      expect(starfield.position.z).toBeLessThan(0);
      expect(starfield.layers.isEnabled(BACKGROUND_RENDER_LAYER)).toBe(true);
      const starfieldMaterial = starfield.material as ShaderMaterial;
      expect(starfieldMaterial).toBeInstanceOf(ShaderMaterial);
      expect(starfieldMaterial.depthTest).toBe(false);
      expect(starfieldMaterial.depthWrite).toBe(false);

      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(0.005);
      expect(riftRoot?.visible).toBe(false);

      solarSystem.setOpeningProgress(0.7);
      expect(riftRoot?.visible).toBe(true);
      const overviewOpacity = starfieldMaterial.uniforms.opacity.value as number;
      expect(overviewOpacity).toBeGreaterThan(0.1);
      expect(overviewOpacity).toBeLessThanOrEqual(
        SOLAR_BACKGROUND_OPACITY_SCALE,
      );
      expect(solarSystem.getBodyRenderState('earth')).toMatchObject({
        opacity: 1,
      });

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
        focusedBody: 'earth',
      });
      // The focus dim eases in over update time instead of snapping.
      solarSystem.update(1);
      expect(starfieldMaterial.uniforms.opacity.value as number).toBeLessThan(
        overviewOpacity,
      );
    } finally {
      solarSystem.dispose();
    }
  });

  it('uses HUD target-lock, label, and orbit opacity states for hover and activation', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      const targetLockHud =
        solarSystem.group.getObjectByName('mars-target-lock-hud');
      const hoverRing = solarSystem.group.getObjectByName('mars-hover-ring');
      const label = solarSystem.group.getObjectByName('mars-label');
      const orbit = solarSystem.group.getObjectByName('mars-orbit-ring');

      expect(targetLockHud).toBeDefined();
      expect(hoverRing).toBeDefined();
      expect(label).toBeDefined();
      expect(orbit).toBeDefined();

      solarSystem.applyBodyInteractionState({
        hoveredBody: 'mars',
        activatedBody: null,
      });

      const hoverRingMaterial = (hoverRing as Mesh).material as MeshBasicMaterial;
      // The orbit ring is a trail shader; its state opacity lives in a uniform.
      const orbitMaterial = (orbit as Mesh).material as ShaderMaterial;
      const labelMaterial = (label as Sprite).material;
      const hoverRingOpacity = hoverRingMaterial.opacity;
      const hoverOrbitOpacity = orbitMaterial.uniforms.opacity.value as number;

      expect(hoverRing.visible).toBe(true);
      expect(label.visible).toBe(true);
      expect(labelMaterial.opacity).toBe(1);

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'mars',
      });

      expect(hoverRingMaterial.opacity).toBeGreaterThan(hoverRingOpacity);
      expect(orbitMaterial.uniforms.opacity.value as number).toBeGreaterThan(
        hoverOrbitOpacity,
      );

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'mars',
        focusedBody: 'earth',
      });

      expect(hoverRingMaterial.opacity).toBeLessThan(hoverRingOpacity);
      expect(orbitMaterial.uniforms.opacity.value as number).toBeLessThan(
        hoverOrbitOpacity,
      );
      expect(labelMaterial.opacity).toBeLessThan(1);
    } finally {
      solarSystem.dispose();
    }
  });

  it('shows a focused body overlay while lowering background body opacity', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);
    solarSystem.setTransform({
      position: { x: 1.1, y: 0.85, z: 0 },
      scale: 1.35,
    });

    try {
      const marsStart = solarSystem.getBodyWorldPosition(
        'mars',
        new Vector3(),
      ).clone();
      const earthFocusSource = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      ).clone();

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
        focusedBody: 'earth',
      });

      const focusRoot = solarSystem.group.getObjectByName('focus-earth-root');
      const focusSpin = solarSystem.group.getObjectByName('focus-earth-spin');
      const focusMesh = solarSystem.group.getObjectByName(
        'focus-earth-placeholder-sphere',
      );
      const earthCloudShell = solarSystem.group.getObjectByName(
        'focus-earth-cloud-shell',
      );
      const earthNightLightsShell = solarSystem.group.getObjectByName(
        'focus-earth-night-lights-shell',
      );
      const earthTerminatorShadowShell = solarSystem.group.getObjectByName(
        'focus-earth-terminator-shadow-shell',
      );
      const earthAtmosphereShell = solarSystem.group.getObjectByName(
        'focus-earth-atmosphere-shell',
      );
      const leftEndpoint = solarSystem.group.getObjectByName(
        'visual-left-control-endpoint',
      );
      expect(
        solarSystem.group.getObjectByName('planet-focus-backdrop'),
      ).toBeUndefined();
      expect(focusRoot?.visible).toBe(true);
      expect(leftEndpoint?.visible).toBe(false);
      expect(focusMesh).toBeDefined();
      expect(earthCloudShell).toBeDefined();
      expect(earthNightLightsShell).toBeDefined();
      expect(earthTerminatorShadowShell).toBeDefined();
      expect(earthAtmosphereShell).toBeDefined();
      expect(focusMesh).toHaveProperty('material');
      expect((focusMesh as { material: unknown }).material).toBeInstanceOf(
        MeshBasicMaterial,
      );
      expect(focusRoot!.getWorldPosition(new Vector3()).distanceTo(
        earthFocusSource,
      )).toBeLessThan(0.000001);

      solarSystem.update(FOCUS_INTRO_DURATION_SECONDS / 2);
      const focusMidpoint = focusRoot!.getWorldPosition(new Vector3());
      expect(focusMidpoint.distanceTo(earthFocusSource)).toBeGreaterThan(0.01);
      expect(focusMidpoint.distanceTo(new Vector3(0, 0, FOCUS_BODY_WORLD_Z))).toBeGreaterThan(
        0.01,
      );

      solarSystem.update(FOCUS_INTRO_DURATION_SECONDS / 2);
      expect(focusRoot!.getWorldPosition(new Vector3()).y).toBeCloseTo(0, 5);
      expect(focusRoot!.getWorldPosition(new Vector3()).z).toBeCloseTo(
        FOCUS_BODY_WORLD_Z,
        5,
      );
      expect(getFocusedBodyHeightFraction(solarSystem, 'earth')).toBeCloseTo(
        getFocusedBodyScreenHeightFraction(solarSystem.getBodyDefinition('earth')),
        5,
      );
      expect(solarSystem.getBodyRenderState('mars')).toMatchObject({
        opacity: 0.18,
        transparent: true,
        depthWrite: false,
      });
      expect(solarSystem.getBodyRenderState('earth')).toMatchObject({
        opacity: 0.18,
        transparent: true,
        depthWrite: false,
      });

      const earthStart = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      ).clone();
      const focusSpinStart = focusSpin?.rotation.y ?? 0;

      solarSystem.update(1);

      const earthAfter = solarSystem.getBodyWorldPosition(
        'earth',
        new Vector3(),
      );
      const marsAfter = solarSystem.getBodyWorldPosition(
        'mars',
        new Vector3(),
      );

      expect(earthAfter.distanceTo(earthStart)).toBeLessThan(0.000001);
      expect(marsAfter.distanceTo(marsStart)).toBeGreaterThan(0.1);
      expect(focusSpin?.rotation.y).toBeGreaterThan(focusSpinStart);

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: null,
        focusedBody: null,
      });
      expect(solarSystem.getBodyRenderState('mars')).toMatchObject({
        opacity: 1,
        transparent: false,
        depthWrite: true,
      });
    } finally {
      solarSystem.dispose();
    }
  });

  it('sizes focused bodies between half and two thirds of the screen height', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);
    solarSystem.setTransform({
      position: { x: -1.4, y: -0.72, z: 0 },
      scale: 1.8,
    });

    try {
      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'moon',
        focusedBody: 'moon',
      });
      solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
      const moonRoot = solarSystem.group.getObjectByName('focus-moon-root');
      expect(moonRoot!.getWorldPosition(new Vector3()).y).toBeCloseTo(0, 5);
      expect(getFocusedBodyHeightFraction(solarSystem, 'moon')).toBeCloseTo(
        getFocusedBodyScreenHeightFraction(solarSystem.getBodyDefinition('moon')),
        5,
      );

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'jupiter',
        focusedBody: 'jupiter',
      });
      solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
      const jupiterRoot =
        solarSystem.group.getObjectByName('focus-jupiter-root');
      expect(jupiterRoot!.getWorldPosition(new Vector3()).y).toBeCloseTo(0, 5);
      expect(getFocusedBodyHeightFraction(solarSystem, 'jupiter')).toBeCloseTo(
        getFocusedBodyScreenHeightFraction(
          solarSystem.getBodyDefinition('jupiter'),
        ),
        5,
      );
    } finally {
      solarSystem.dispose();
    }
  });

  it('moves and scales only the focused body overlay during focus control', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);
    solarSystem.setTransform({
      position: { x: 0.2, y: -0.15, z: 0 },
      scale: 1.15,
    });

    try {
      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
        focusedBody: 'earth',
      });
      solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);

      const focusRoot = solarSystem.group.getObjectByName('focus-earth-root');
      const groupPosition = solarSystem.group.position.clone();
      const groupScale = solarSystem.group.scale.clone();
      const baseHeightFraction = getFocusedBodyHeightFraction(
        solarSystem,
        'earth',
      );

      solarSystem.setFocusedBodyPlacement({
        focusedBody: 'earth',
        worldPosition: { x: 0.46, y: -0.24, z: FOCUS_BODY_WORLD_Z },
        scaleMultiplier: 1.18,
      });

      expect(focusRoot!.getWorldPosition(new Vector3()).x).toBeCloseTo(0.46, 5);
      expect(focusRoot!.getWorldPosition(new Vector3()).y).toBeCloseTo(-0.24, 5);
      expect(getFocusedBodyHeightFraction(solarSystem, 'earth')).toBeCloseTo(
        baseHeightFraction * 1.18,
        5,
      );
      expect(solarSystem.group.position.distanceTo(groupPosition)).toBeLessThan(
        0.000001,
      );
      expect(solarSystem.group.scale.distanceTo(groupScale)).toBeLessThan(
        0.000001,
      );
    } finally {
      solarSystem.dispose();
    }
  });

  it('animates the focused body back to its solar-system position and restores focus dimming after return', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);
    solarSystem.setTransform({
      position: { x: 0.2, y: -0.15, z: 0 },
      scale: 1.15,
    });

    try {
      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
        focusedBody: 'earth',
      });
      solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
      solarSystem.setFocusedBodyPlacement({
        focusedBody: 'earth',
        worldPosition: { x: 0.5, y: -0.26, z: FOCUS_BODY_WORLD_Z },
        scaleMultiplier: 1.35,
      });

      const focusRoot = solarSystem.group.getObjectByName('focus-earth-root');
      const sourcePosition = solarSystem
        .getBodyWorldPosition('earth', new Vector3())
        .clone();
      const sourceWorldScale = solarSystem.group.getWorldScale(new Vector3()).x;
      const beforeReturnDistance = focusRoot!.getWorldPosition(new Vector3()).distanceTo(
        sourcePosition,
      );

      expect(beforeReturnDistance).toBeGreaterThan(0.05);
      expect(solarSystem.startFocusedBodyReturn({ focusedBody: 'earth' })).toBe(true);
      solarSystem.setFocusedBodyPlacement({
        focusedBody: 'earth',
        worldPosition: { x: -0.72, y: 0.34, z: FOCUS_BODY_WORLD_Z },
        scaleMultiplier: 1.8,
      });
      solarSystem.update(FOCUS_RETURN_DURATION_SECONDS / 2);
      expect(solarSystem.isFocusedBodyReturnComplete('earth')).toBe(false);
      expect(focusRoot!.getWorldPosition(new Vector3()).distanceTo(sourcePosition)).toBeLessThan(
        beforeReturnDistance,
      );

      solarSystem.update(FOCUS_RETURN_DURATION_SECONDS / 2);
      expect(solarSystem.isFocusedBodyReturnComplete('earth')).toBe(true);
      expect(focusRoot!.getWorldPosition(new Vector3()).distanceTo(sourcePosition)).toBeLessThan(
        0.000001,
      );
      expect(focusRoot!.getWorldScale(new Vector3()).x).toBeCloseTo(
        sourceWorldScale,
        5,
      );

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: null,
        focusedBody: null,
      });
      expect(focusRoot?.visible).toBe(false);
      expect(solarSystem.getBodyRenderState('earth')).toMatchObject({
        opacity: 1,
        transparent: false,
        depthWrite: true,
      });
    } finally {
      solarSystem.dispose();
    }
  });

  it('launches toward the requested display corner before curving back to orbit', () => {
    const runCornerLaunch = (horizontalSign: -1 | 1) => {
      const solarSystem = new CodePlaceholderSolarSystem();
      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(1);

      try {
        solarSystem.update(1 / 60);
        solarSystem.update(1 / 60);
        solarSystem.applyBodyInteractionState({
          hoveredBody: null,
          activatedBody: 'earth',
          focusedBody: 'earth',
        });
        solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
        solarSystem.setFocusedBodyPlacement({
          focusedBody: 'earth',
          worldPosition: { x: 0, y: 0, z: FOCUS_BODY_WORLD_Z },
          scaleMultiplier: 1,
        });

        const focusRoot = solarSystem.group.getObjectByName('focus-earth-root')!;
        const start = focusRoot.getWorldPosition(new Vector3()).clone();
        expect(
          solarSystem.startFocusedBodyReturn({
            focusedBody: 'earth',
            returnMotion: {
              throwDirection: { x: horizontalSign, y: 1, z: 0 },
              throwStrength: getFocusedBodyReturnThrowStrength(6),
            },
          }),
        ).toBe(true);

        solarSystem.update(FOCUS_RETURN_DURATION_SECONDS * 0.045);
        const anticipated = focusRoot.getWorldPosition(new Vector3()).clone();
        expect(Math.sign(anticipated.x - start.x)).toBe(-horizontalSign);
        expect(anticipated.y).toBeLessThan(start.y);

        solarSystem.update(FOCUS_RETURN_DURATION_SECONDS * 0.09);
        const launched = focusRoot.getWorldPosition(new Vector3());
        expect(Math.sign(launched.x - start.x)).toBe(horizontalSign);
        expect(launched.y).toBeGreaterThan(start.y);
      } finally {
        solarSystem.dispose();
      }
    };

    runCornerLaunch(-1);
    runCornerLaunch(1);
  });

  it('uses peak speed for visible launch strength and a finite radial fallback', () => {
    const sampleLaunchDistance = (peakSpeed: number | null) => {
      const solarSystem = new CodePlaceholderSolarSystem();
      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(1);

      try {
        solarSystem.update(1 / 60);
        solarSystem.update(1 / 60);
        solarSystem.applyBodyInteractionState({
          hoveredBody: null,
          activatedBody: 'jupiter',
          focusedBody: 'jupiter',
        });
        solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
        solarSystem.setFocusedBodyPlacement({
          focusedBody: 'jupiter',
          worldPosition: { x: 0, y: 0, z: FOCUS_BODY_WORLD_Z },
          scaleMultiplier: 1,
        });
        const focusRoot = solarSystem.group.getObjectByName('focus-jupiter-root')!;
        const start = focusRoot.getWorldPosition(new Vector3()).clone();
        solarSystem.startFocusedBodyReturn({
          focusedBody: 'jupiter',
          returnMotion:
            peakSpeed === null
              ? null
              : {
                  throwDirection: { x: 1, y: 1, z: 0 },
                  throwStrength: getFocusedBodyReturnThrowStrength(peakSpeed),
                },
        });
        solarSystem.update(FOCUS_RETURN_DURATION_SECONDS * 0.135);
        const position = focusRoot.getWorldPosition(new Vector3());
        expect([position.x, position.y, position.z].every(Number.isFinite)).toBe(true);
        return position.distanceTo(start);
      } finally {
        solarSystem.dispose();
      }
    };

    expect(sampleLaunchDistance(6)).toBeGreaterThan(sampleLaunchDistance(3));
    expect(sampleLaunchDistance(null)).toBeGreaterThan(0.01);
  });

  it('merges Earth and Moon along their sampled world-space orbit tangents', () => {
    const assertTangentMerge = (
      focusedBody: 'earth' | 'moon',
      activatedBody: 'earth' | 'moon',
    ) => {
      const solarSystem = new CodePlaceholderSolarSystem();
      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(1);

      try {
        solarSystem.update(1 / 60);
        const before = solarSystem
          .getBodyWorldPosition(focusedBody, new Vector3())
          .clone();
        solarSystem.update(1 / 120);
        let expectedTangent = solarSystem
          .getBodyWorldPosition(focusedBody, new Vector3())
          .clone()
          .sub(before)
          .normalize();
        solarSystem.applyBodyInteractionState({
          hoveredBody: null,
          activatedBody,
          focusedBody,
        });
        solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
        if (focusedBody === 'moon') {
          const latestBefore = solarSystem
            .getBodyWorldPosition('moon', new Vector3())
            .clone();
          solarSystem.update(1 / 120);
          expectedTangent = solarSystem
            .getBodyWorldPosition('moon', new Vector3())
            .clone()
            .sub(latestBefore)
            .normalize();
        }
        solarSystem.setFocusedBodyPlacement({
          focusedBody,
          worldPosition: { x: 0.18, y: -0.12, z: FOCUS_BODY_WORLD_Z },
          scaleMultiplier: 1.2,
        });
        solarSystem.startFocusedBodyReturn({
          focusedBody,
          returnMotion: {
            throwDirection: { x: -1, y: 1, z: 0 },
            throwStrength: getFocusedBodyReturnThrowStrength(5),
          },
        });

        solarSystem.update(FOCUS_RETURN_DURATION_SECONDS * 0.96);
        const focusRoot = solarSystem.group.getObjectByName(
          `focus-${focusedBody}-root`,
        )!;
        const beforeMerge = focusRoot.getWorldPosition(new Vector3()).clone();
        solarSystem.update(FOCUS_RETURN_DURATION_SECONDS * 0.04);
        const mergeDirection = focusRoot
          .getWorldPosition(new Vector3())
          .clone()
          .sub(beforeMerge)
          .normalize();

        expect(mergeDirection.dot(expectedTangent)).toBeGreaterThan(0.82);
      } finally {
        solarSystem.dispose();
      }
    };

    assertTangentMerge('earth', 'earth');
    assertTangentMerge('moon', 'earth');
  });

  it('reuses bloom-layer return VFX and clears them after repeated returns', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      const vfxRoot = solarSystem.group.getObjectByName('focus-earth-return-vfx-root')!;
      const initialChildCount = vfxRoot.children.length;
      const afterimages = vfxRoot.children.filter((child) =>
        child.name.includes('return-afterimage'),
      );
      const ripple = vfxRoot.getObjectByName('focus-earth-return-capture-ripple')!;
      const orbitRing = solarSystem.group.getObjectByName('earth-orbit-ring') as Mesh;
      const orbitMaterial = orbitRing.material as ShaderMaterial;
      const sunPlasma = solarSystem.group.getObjectByName('sun-plasma-core') as Mesh;
      const sunMaterial = sunPlasma.material as ShaderMaterial;
      expect(afterimages).toHaveLength(4);
      expect(
        afterimages.every((child) =>
          child.layers.isEnabled(BLOOM_RENDER_LAYER),
        ),
      ).toBe(true);
      expect(ripple.layers.isEnabled(BLOOM_RENDER_LAYER)).toBe(true);

      for (let cycle = 0; cycle < 2; cycle += 1) {
        solarSystem.update(1 / 60);
        solarSystem.update(1 / 60);
        solarSystem.applyBodyInteractionState({
          hoveredBody: null,
          activatedBody: 'earth',
          focusedBody: 'earth',
        });
        solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
        solarSystem.startFocusedBodyReturn({
          focusedBody: 'earth',
          returnMotion: {
            throwDirection: { x: 1, y: 1, z: 0 },
            throwStrength: getFocusedBodyReturnThrowStrength(5),
          },
        });
        let sawAfterimage = false;
        for (let frame = 0; frame < 60; frame += 1) {
          solarSystem.update(FOCUS_RETURN_DURATION_SECONDS / 60);
          sawAfterimage ||= afterimages.some((child) => child.visible);
        }
        expect(solarSystem.isFocusedBodyReturnComplete('earth')).toBe(true);
        expect(sawAfterimage).toBe(true);
        expect(orbitRing.layers.isEnabled(BLOOM_RENDER_LAYER)).toBe(true);
        expect(orbitMaterial.uniforms.intensity.value).toBeGreaterThan(1);
        expect(sunMaterial.uniforms.flareBoost.value).toBeGreaterThan(0);
        expect(ripple.visible).toBe(true);
        solarSystem.applyBodyInteractionState({
          hoveredBody: null,
          activatedBody: null,
          focusedBody: null,
        });
        for (let frame = 0; frame < 40; frame += 1) {
          solarSystem.update(1 / 60);
        }
        expect(vfxRoot.children).toHaveLength(initialChildCount);
        expect(afterimages.every((child) => !child.visible)).toBe(true);
        expect(ripple.visible).toBe(false);
        expect(orbitRing.layers.isEnabled(BLOOM_RENDER_LAYER)).toBe(false);
        expect(orbitMaterial.uniforms.intensity.value).toBe(1);
      }
    } finally {
      solarSystem.dispose();
    }
  });

  it('keeps the focused return animation alive if focus state is cleared mid-return', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'jupiter',
        focusedBody: 'jupiter',
      });
      solarSystem.update(FOCUS_INTRO_DURATION_SECONDS);
      solarSystem.setFocusedBodyPlacement({
        focusedBody: 'jupiter',
        worldPosition: { x: -0.42, y: 0.18, z: FOCUS_BODY_WORLD_Z },
        scaleMultiplier: 1.4,
      });

      const focusRoot = solarSystem.group.getObjectByName('focus-jupiter-root');
      expect(focusRoot?.visible).toBe(true);
      expect(solarSystem.startFocusedBodyReturn({ focusedBody: 'jupiter' })).toBe(true);

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: null,
        focusedBody: null,
      });
      expect(focusRoot?.visible).toBe(true);

      solarSystem.update(FOCUS_RETURN_DURATION_SECONDS);
      expect(solarSystem.isFocusedBodyReturnComplete('jupiter')).toBe(true);

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: null,
        focusedBody: null,
      });
      expect(focusRoot?.visible).toBe(false);
    } finally {
      solarSystem.dispose();
    }
  });

  it('creates a reusable focused body overlay for every interactive body', () => {
    const solarSystem = new CodePlaceholderSolarSystem();

    try {
      solarSystem.getInteractiveBodyDefinitions().forEach((definition) => {
        solarSystem.applyBodyInteractionState({
          hoveredBody: null,
          activatedBody: definition.id,
          focusedBody: definition.id,
        });

        const focusRoot = solarSystem.group.getObjectByName(
          `focus-${definition.id}-root`,
        );
        const focusMesh = focusRoot?.getObjectByName(
          `focus-${definition.id}-placeholder-sphere`,
        );
        const atmosphere = focusRoot?.getObjectByName(
          `focus-${definition.id}-atmosphere-shell`,
        );
        expect(focusRoot?.visible).toBe(true);
        expect(focusMesh).toBeDefined();
        expect(atmosphere).toBeDefined();
        if (definition.id !== 'earth') {
          expect(
            focusRoot?.getObjectByName(`focus-${definition.id}-cloud-shell`),
          ).toBeUndefined();
        }

        const expectedOverlayByBody: Partial<Record<InteractiveCelestialBodyId, string>> = {
          venus: 'haze',
          mars: 'dust',
          jupiter: 'bands',
          neptune: 'winds',
        };
        const expectedOverlay = expectedOverlayByBody[definition.id];
        if (expectedOverlay) {
          expect(
            focusRoot?.getObjectByName(
              `focus-${definition.id}-${expectedOverlay}-shell`,
            ),
          ).toBeDefined();
        }

        if (definition.id === 'saturn') {
          const focusMesh = focusRoot?.getObjectByName(
            'focus-saturn-placeholder-sphere',
          ) as Mesh;
          const tiltGroup = focusRoot?.getObjectByName('focus-saturn-tilt');
          const ring = focusRoot?.getObjectByName('focus-saturn-ring');
          const backHalf = ring?.getObjectByName(
            'focus-saturn-ring-back',
          ) as Mesh<RingGeometry, MeshBasicMaterial>;
          const frontHalf = ring?.getObjectByName(
            'focus-saturn-ring-front',
          ) as Mesh<RingGeometry, MeshBasicMaterial>;

          expect(ring?.parent).toBe(tiltGroup);
          expect(tiltGroup?.rotation.z).toBeCloseTo(definition.axialTilt);
          expect(ring?.rotation.x).toBeCloseTo(Math.PI * 0.38);
          expect(backHalf.parent).toBe(ring);
          expect(frontHalf.parent).toBe(ring);
          expect(backHalf.renderOrder).toBeLessThan(focusMesh.renderOrder);
          expect(frontHalf.renderOrder).toBeGreaterThan(
            (atmosphere as Mesh).renderOrder,
          );
          expect(backHalf.geometry.parameters.thetaStart).toBeCloseTo(Math.PI);
          expect(backHalf.geometry.parameters.thetaLength).toBeCloseTo(Math.PI);
          expect(frontHalf.geometry.parameters.thetaStart).toBeCloseTo(0);
          expect(frontHalf.geometry.parameters.thetaLength).toBeCloseTo(Math.PI);
          expect(frontHalf.material).toBe(backHalf.material);
          expect(frontHalf.material.depthTest).toBe(false);
          expect(frontHalf.material.depthWrite).toBe(false);
          expect(frontHalf.material.side).toBe(DoubleSide);
          expect(frontHalf.layers.mask).toBe(backHalf.layers.mask);

          [backHalf.geometry, frontHalf.geometry].forEach((geometry) => {
            const uvs = geometry.getAttribute('uv');
            const uValues = Array.from(
              { length: uvs.count },
              (_, index) => uvs.getX(index),
            );
            expect(Math.min(...uValues)).toBeCloseTo(0);
            expect(Math.max(...uValues)).toBeCloseTo(1);
          });
        }
      });
    } finally {
      solarSystem.dispose();
    }
  });

  it('creates a plasma sun core with time-driven shader layers', () => {
    const solarSystem = new CodePlaceholderSolarSystem();
    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);

    try {
      const plasmaCore = solarSystem.group.getObjectByName('sun-plasma-core');
      const coronaShell = solarSystem.group.getObjectByName('sun-corona-shell');
      const lensFlare = solarSystem.group.getObjectByName(
        'sun-lens-flare-sprite',
      );

      expect(plasmaCore).toBeDefined();
      expect(coronaShell).toBeDefined();
      expect(lensFlare).toBeDefined();
      expect((plasmaCore as Mesh).material).toBeInstanceOf(ShaderMaterial);
      expect((coronaShell as Mesh).material).toBeInstanceOf(ShaderMaterial);

      const plasmaMaterial = (plasmaCore as Mesh).material as ShaderMaterial;
      const coronaMaterial = (coronaShell as Mesh).material as ShaderMaterial;
      const initialTime = plasmaMaterial.uniforms.time.value as number;

      solarSystem.update(0.25);

      expect(plasmaMaterial.uniforms.time.value).toBeGreaterThan(initialTime);
      expect(coronaMaterial.uniforms.time.value).toBe(
        plasmaMaterial.uniforms.time.value,
      );
    } finally {
      solarSystem.dispose();
    }
  });
});
