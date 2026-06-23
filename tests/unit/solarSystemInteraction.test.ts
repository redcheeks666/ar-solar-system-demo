import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Vector3 } from 'three';
import { CodePlaceholderSolarSystem } from '../../src/solar/solarSystem';

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
});
