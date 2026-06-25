import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, Points, ShaderMaterial, Sprite, Vector3 } from 'three';
import { CAMERA_FOV, CAMERA_Z } from '../../src/rendering/scene';
import {
  FOCUS_BODY_WORLD_Z,
  FOCUS_INTRO_DURATION_SECONDS,
  FOCUS_RETURN_DURATION_SECONDS,
  getFocusedBodyScreenHeightFraction,
} from '../../src/solar/focusedCelestialBody';
import { SOLAR_PARTICLE_COUNT } from '../../src/solar/solarParticles';
import { CodePlaceholderSolarSystem } from '../../src/solar/solarSystem';
import type { InteractiveCelestialBodyId } from '../../src/solar/solarSystemData';

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
      const thinCrack = solarSystem.group.getObjectByName(
        'solar-opening-thin-space-crack',
      );
      const energyRift = solarSystem.group.getObjectByName(
        'solar-opening-blue-gold-energy-rift',
      );
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

      expect(openingVfx?.visible).toBe(false);

      solarSystem.setVisible(true);
      solarSystem.setOpeningProgress(0);
      expect(solarSystem.group.visible).toBe(false);
      expect(openingVfx?.visible).toBe(false);

      solarSystem.setOpeningProgress(0.12);
      expect(solarSystem.group.visible).toBe(true);
      expect(openingVfx?.visible).toBe(true);
      expect(thinCrack?.visible).toBe(true);
      expect(leftAnchor?.visible).toBe(true);
      expect(rightAnchor?.visible).toBe(true);
      expect(leftAnchor?.position.x).toBeCloseTo(leftEndpoint?.position.x ?? 0, 5);
      expect(rightAnchor?.position.x).toBeCloseTo(rightEndpoint?.position.x ?? 0, 5);

      solarSystem.setOpeningProgress(0.48);
      expect(energyRift?.visible).toBe(true);
      expect(energyRift?.scale.x).toBeGreaterThan(0.5);

      solarSystem.setOpeningProgress(0.72);
      expect(burstRift?.visible).toBe(true);
      expect(shockwave?.visible).toBe(true);

      solarSystem.setOpeningProgress(1);
      expect(thinCrack?.visible).toBe(false);
      expect(energyRift?.visible).toBe(false);
      expect(burstRift?.visible).toBe(false);
      expect(shockwave?.visible).toBe(false);
      expect(leftAnchor?.visible).toBe(false);
      expect(rightAnchor?.visible).toBe(false);
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

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'earth',
        focusedBody: 'earth',
      });
      expect(whiteStardust.material.opacity).toBeLessThan(openingOpacity);
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
      const orbitMaterial = (orbit as Mesh).material as MeshBasicMaterial;
      const labelMaterial = (label as Sprite).material;
      const hoverRingOpacity = hoverRingMaterial.opacity;
      const hoverOrbitOpacity = orbitMaterial.opacity;

      expect(hoverRing.visible).toBe(true);
      expect(label.visible).toBe(true);
      expect(labelMaterial.opacity).toBe(1);

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'mars',
      });

      expect(hoverRingMaterial.opacity).toBeGreaterThan(hoverRingOpacity);
      expect(orbitMaterial.opacity).toBeGreaterThan(hoverOrbitOpacity);

      solarSystem.applyBodyInteractionState({
        hoveredBody: null,
        activatedBody: 'mars',
        focusedBody: 'earth',
      });

      expect(hoverRingMaterial.opacity).toBeLessThan(hoverRingOpacity);
      expect(orbitMaterial.opacity).toBeLessThan(hoverOrbitOpacity);
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
      rotation: { x: -0.42, y: 0.28, z: 0.18 },
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
      rotation: { x: -0.34, y: -0.2, z: -0.16 },
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
        0.5,
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
        2 / 3,
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
      rotation: { x: -0.5, y: 0.18, z: 0.06 },
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
      rotation: { x: -0.5, y: 0.18, z: 0.06 },
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
          expect(
            focusRoot?.getObjectByName('focus-saturn-saturn-ring'),
          ).toBeDefined();
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
