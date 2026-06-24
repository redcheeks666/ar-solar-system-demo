import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MeshBasicMaterial, Vector3 } from 'three';
import { CAMERA_FOV, CAMERA_Z } from '../../src/rendering/scene';
import {
  FOCUS_BODY_WORLD_Z,
  FOCUS_INTRO_DURATION_SECONDS,
  getFocusedBodyScreenHeightFraction,
} from '../../src/solar/focusedCelestialBody';
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
      const leftEndpoint = solarSystem.group.getObjectByName(
        'visual-left-control-endpoint',
      );
      expect(
        solarSystem.group.getObjectByName('planet-focus-backdrop'),
      ).toBeUndefined();
      expect(focusRoot?.visible).toBe(true);
      expect(leftEndpoint?.visible).toBe(false);
      expect(focusMesh).toBeDefined();
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
        expect(focusRoot?.visible).toBe(true);
      });
    } finally {
      solarSystem.dispose();
    }
  });
});
