import { describe, it, expect } from 'vitest';
import {
  computeContainRect,
  estimateWorldRadiusInStagePixels,
  mapNormalizedToStagePixel,
  mapNormalizedToWorld,
  mapWorldToStagePixel,
} from '../../src/interaction/coordinateMapping';
import { TEST_LAYOUT, createTestCamera } from '../helpers/testCamera';

describe('computeContainRect (object-fit: contain)', () => {
  it('fills the whole stage when source and stage are both 16:9', () => {
    expect(computeContainRect(TEST_LAYOUT)).toEqual({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
    });
  });

  it('pillarboxes a 4:3 source inside a 16:9 stage', () => {
    const rect = computeContainRect({
      ...TEST_LAYOUT,
      sourceWidth: 640,
      sourceHeight: 480,
    });
    expect(rect).toEqual({ x: 160, y: 0, width: 960, height: 720 });
  });

  it('falls back to the full stage when the source size is unknown', () => {
    const rect = computeContainRect({
      ...TEST_LAYOUT,
      sourceWidth: 0,
      sourceHeight: 0,
    });
    expect(rect).toEqual({ x: 0, y: 0, width: 1280, height: 720 });
  });
});

describe('mapNormalizedToStagePixel (mirror-aware)', () => {
  it('maps the center to the stage center', () => {
    expect(mapNormalizedToStagePixel({ x: 0.5, y: 0.5, z: 0 }, TEST_LAYOUT)).toEqual({
      x: 640,
      y: 360,
    });
  });

  it('mirrors x: camera-left (x=0) shows on the right edge, and vice versa', () => {
    expect(mapNormalizedToStagePixel({ x: 0, y: 0.5, z: 0 }, TEST_LAYOUT).x).toBe(1280);
    expect(mapNormalizedToStagePixel({ x: 1, y: 0.5, z: 0 }, TEST_LAYOUT).x).toBe(0);
  });
});

describe('mapNormalizedToWorld', () => {
  const camera = createTestCamera();

  it('maps the center to the world origin on the interaction plane', () => {
    const world = mapNormalizedToWorld({ x: 0.5, y: 0.5, z: 0 }, TEST_LAYOUT, camera, 0);
    expect(world).not.toBeNull();
    expect(world!.x).toBeCloseTo(0, 5);
    expect(world!.y).toBeCloseTo(0, 5);
    expect(world!.z).toBeCloseTo(0, 5);
  });

  it('maps mirrored x consistently: x=1 left of center, x=0 right of center', () => {
    const fromLeftEdge = mapNormalizedToWorld({ x: 1, y: 0.5, z: 0 }, TEST_LAYOUT, camera, 0);
    const fromRightEdge = mapNormalizedToWorld({ x: 0, y: 0.5, z: 0 }, TEST_LAYOUT, camera, 0);
    expect(fromLeftEdge!.x).toBeLessThan(0);
    expect(fromRightEdge!.x).toBeGreaterThan(0);
  });

  it('returns null when the layout has no displayed size', () => {
    expect(
      mapNormalizedToWorld({ x: 0.5, y: 0.5, z: 0 }, { ...TEST_LAYOUT, stageWidth: 0 }, camera, 0),
    ).toBeNull();
  });
});

describe('mapWorldToStagePixel', () => {
  const camera = createTestCamera();

  it('projects the world origin to stage center', () => {
    const pixel = mapWorldToStagePixel({ x: 0, y: 0, z: 0 }, TEST_LAYOUT, camera);
    expect(pixel).not.toBeNull();
    expect(pixel!.x).toBeCloseTo(640, 3);
    expect(pixel!.y).toBeCloseTo(360, 3);
    expect(pixel!.visible).toBe(true);
  });

  it('estimates world radius in screen pixels', () => {
    const radius = estimateWorldRadiusInStagePixels(
      { x: 0, y: 0, z: 0 },
      0.25,
      TEST_LAYOUT,
      camera,
    );
    expect(radius).not.toBeNull();
    expect(radius!).toBeGreaterThan(20);
  });
});
