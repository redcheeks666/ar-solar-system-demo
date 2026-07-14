import { describe, expect, it } from 'vitest';
import {
  EMPTY_INDEX_FINGER_UI_HOLD,
  findIndexFingerUiHit,
  updateIndexFingerUiHold,
  type UiButtonStageRect,
} from '../../src/interaction/indexFingerUiHold';
import type { NormalizedPoint, TrackedHand } from '../../src/utils/types';
import { createHand, point } from '../helpers/syntheticHands';
import { TEST_LAYOUT } from '../helpers/testCamera';

const SWITCH_CARD_RECT: UiButtonStageRect = {
  x: 32,
  y: 58,
  width: 344,
  height: 80,
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

describe('Earth-Moon focus switch card index-finger hold', () => {
  it('hits the compact top-left switch card using mirrored stage pixels', () => {
    const hit = findIndexFingerUiHit({
      hands: [handWithIndexAtPixel({ x: 88, y: 96, side: 'right' })],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
    });

    expect(hit?.handKey).toBe('right-0');
    expect(hit?.point.x).toBeCloseTo(88);
    expect(hit?.point.y).toBeCloseTo(96);
    expect(hit?.hitScore).toBeGreaterThan(0.25);
  });

  it('charges for 0.5 seconds while the index finger remains on the card', () => {
    const hand = handWithIndexAtPixel({ x: 88, y: 96 });
    const first = updateIndexFingerUiHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
      previous: EMPTY_INDEX_FINGER_UI_HOLD,
      requiredMs: 500,
      timestamp: 2000,
    });
    const charging = updateIndexFingerUiHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
      previous: first.hold,
      requiredMs: 500,
      timestamp: 2250,
    });
    const charged = updateIndexFingerUiHold({
      active: true,
      hands: [hand],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
      previous: first.hold,
      requiredMs: 500,
      timestamp: 2500,
    });

    expect(charging.progress).toBeCloseTo(0.5);
    expect(charging.triggered).toBe(false);
    expect(charged.progress).toBe(1);
    expect(charged.triggered).toBe(true);
    expect(charged.reason).toBe('charged');
  });

  it('resets when the index finger leaves before the threshold', () => {
    const first = updateIndexFingerUiHold({
      active: true,
      hands: [handWithIndexAtPixel({ x: 88, y: 96 })],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
      previous: EMPTY_INDEX_FINGER_UI_HOLD,
      requiredMs: 500,
      timestamp: 2000,
    });
    const leftCard = updateIndexFingerUiHold({
      active: true,
      hands: [handWithIndexAtPixel({ x: 520, y: 320 })],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
      previous: first.hold,
      requiredMs: 500,
      timestamp: 2250,
    });

    expect(leftCard.progress).toBe(0);
    expect(leftCard.triggered).toBe(false);
    expect(leftCard.hold.startedAt).toBeNull();
    expect(leftCard.reason).toBe('waiting-for-index-finger');
  });

  it('restarts the stable hold when a different hand takes over the card', () => {
    const first = updateIndexFingerUiHold({
      active: true,
      hands: [
        handWithIndexAtPixel({ x: 88, y: 96, side: 'left' }),
        handWithIndexAtPixel({ x: 520, y: 320, side: 'right' }),
      ],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
      previous: EMPTY_INDEX_FINGER_UI_HOLD,
      requiredMs: 500,
      timestamp: 2000,
    });
    const switchedHand = updateIndexFingerUiHold({
      active: true,
      hands: [
        handWithIndexAtPixel({ x: 520, y: 320, side: 'left' }),
        handWithIndexAtPixel({ x: 88, y: 96, side: 'right' }),
      ],
      layout: TEST_LAYOUT,
      rect: SWITCH_CARD_RECT,
      previous: first.hold,
      requiredMs: 500,
      timestamp: 2400,
    });

    expect(first.hold.handKey).toBe('left-0');
    expect(switchedHand.hold.handKey).toBe('right-1');
    expect(switchedHand.progress).toBe(0);
    expect(switchedHand.triggered).toBe(false);
    expect(switchedHand.hold.startedAt).toBe(2400);
  });
});
