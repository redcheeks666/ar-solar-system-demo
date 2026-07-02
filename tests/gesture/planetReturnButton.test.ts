import { describe, expect, it } from 'vitest';
import {
  EMPTY_PLANET_RETURN_BUTTON_HOLD,
  findPlanetReturnButtonIndexFingerHit,
  updatePlanetReturnButtonHold,
  type PlanetReturnButtonStageRect,
} from '../../src/interaction/planetReturnButton';
import type { NormalizedPoint, TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { TEST_LAYOUT } from '../helpers/testCamera';

const BUTTON_RECT: PlanetReturnButtonStageRect = {
  x: 16,
  y: 16,
  width: 188,
  height: 42,
};

function normalizedFromPixel(x: number, y: number): NormalizedPoint {
  return point(1 - x / TEST_LAYOUT.stageWidth, y / TEST_LAYOUT.stageHeight);
}

function handWithIndexAtPixel(input: {
  x: number;
  y: number;
  side?: TrackedHand['side'];
}): TrackedHand {
  const center = normalizedFromPixel(input.x + 24, input.y + 24);
  const hand = createHand({ center, spread: 1.2 });
  const indexFingerTip = normalizedFromPixel(input.x, input.y);

  hand.side = input.side ?? 'unknown';
  hand.indexFingerTip = indexFingerTip;
  hand.landmarks[8] = indexFingerTip;

  return hand;
}

describe('planet return button index-finger hold', () => {
  it('hits the top-left return button using mirrored index-finger stage pixels', () => {
    const hit = findPlanetReturnButtonIndexFingerHit({
      hands: [handWithIndexAtPixel({ x: 60, y: 34, side: 'right' })],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      hitSlopPx: 0,
    });

    expect(hit).toMatchObject({
      handKey: 'right-0',
      point: { x: 60, y: 34 },
    });
    expect(hit?.hitScore).toBeGreaterThan(0.45);
  });

  it('charges for 1 second while the index finger stays on the button', () => {
    const hand = handWithIndexAtPixel({ x: 60, y: 34 });
    const first = updatePlanetReturnButtonHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      previous: EMPTY_PLANET_RETURN_BUTTON_HOLD,
      requiredMs: 1000,
      timestamp: 2000,
    });

    expect(first.progress).toBe(0);
    expect(first.triggered).toBe(false);

    const charging = updatePlanetReturnButtonHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      previous: first.hold,
      requiredMs: 1000,
      timestamp: 2750,
    });

    expect(charging.progress).toBeCloseTo(0.75);
    expect(charging.triggered).toBe(false);

    const charged = updatePlanetReturnButtonHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      previous: first.hold,
      requiredMs: 1000,
      timestamp: 3000,
    });

    expect(charged.progress).toBe(1);
    expect(charged.triggered).toBe(true);
    expect(charged.reason).toBe('charged');
  });

  it('can reuse the same hold helper for a 0.5 second focus switch button', () => {
    const hand = handWithIndexAtPixel({ x: 60, y: 34 });
    const first = updatePlanetReturnButtonHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      previous: EMPTY_PLANET_RETURN_BUTTON_HOLD,
      requiredMs: 500,
      timestamp: 2000,
    });
    const charged = updatePlanetReturnButtonHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      previous: first.hold,
      requiredMs: 500,
      timestamp: 2500,
    });

    expect(charged.progress).toBe(1);
    expect(charged.triggered).toBe(true);
    expect(charged.reason).toBe('charged');
  });

  it('resets when the index finger leaves the button before the threshold', () => {
    const first = updatePlanetReturnButtonHold({
      active: true,
      hands: [handWithIndexAtPixel({ x: 60, y: 34 })],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      previous: EMPTY_PLANET_RETURN_BUTTON_HOLD,
      requiredMs: 1000,
      timestamp: 2000,
    });
    const leftButton = updatePlanetReturnButtonHold({
      active: true,
      hands: [handWithIndexAtPixel({ x: 380, y: 260 })],
      layout: TEST_LAYOUT,
      rect: BUTTON_RECT,
      previous: first.hold,
      requiredMs: 1000,
      timestamp: 2600,
    });

    expect(leftButton.progress).toBe(0);
    expect(leftButton.triggered).toBe(false);
    expect(leftButton.hold.startedAt).toBeNull();
    expect(leftButton.reason).toBe('waiting-for-index-finger');
  });
});
