import { clamp01 } from '../utils/math';
import { SOLAR_BACKGROUND_OPACITY_SCALE } from '../solar/solarVisualConfig';

const SUN_GLOW_PEAK_OPACITY = 0.5 * SOLAR_BACKGROUND_OPACITY_SCALE;
const REVEAL_SMOOTHING_SECONDS = 0.22;
const STYLE_EPSILON = 0.004;

export interface SunRoomGlowInput {
  /** 0..1 rift reveal driving the virtual sun's room-light intensity. */
  readonly reveal: number;
  readonly focusActive: boolean;
  /** Solar-system center (= sun) in stage pixels, if projectable. */
  readonly sunStagePosition: { x: number; y: number } | null;
  readonly stageSize: { width: number; height: number };
  readonly deltaSeconds: number;
}

/**
 * DOM-level warm glow that follows the virtual sun as if it lit the room.
 * This leaves the camera feed's brightness and saturation untouched.
 */
export class SunRoomGlow {
  private smoothedReveal = 0;
  private appliedOpacity = -1;
  private appliedX = -1;
  private appliedY = -1;

  constructor(private readonly element: HTMLElement) {}

  update(input: SunRoomGlowInput): void {
    const blend =
      1 - Math.exp(-Math.max(input.deltaSeconds, 0) / REVEAL_SMOOTHING_SECONDS);
    this.smoothedReveal +=
      (clamp01(input.reveal) - this.smoothedReveal) * blend;

    const { sunStagePosition, stageSize } = input;
    const visible =
      this.smoothedReveal > 0.35 &&
      !input.focusActive &&
      sunStagePosition !== null &&
      stageSize.width > 0 &&
      stageSize.height > 0;
    const opacity = visible
      ? this.smoothedReveal * SUN_GLOW_PEAK_OPACITY
      : 0;

    if (Math.abs(opacity - this.appliedOpacity) > STYLE_EPSILON) {
      this.appliedOpacity = opacity;
      this.element.style.opacity = opacity.toFixed(3);
    }

    if (!visible) {
      return;
    }

    const x = clamp01(sunStagePosition.x / stageSize.width) * 100;
    const y = clamp01(sunStagePosition.y / stageSize.height) * 100;

    if (Math.abs(x - this.appliedX) > 0.2 || Math.abs(y - this.appliedY) > 0.2) {
      this.appliedX = x;
      this.appliedY = y;
      this.element.style.setProperty('--sun-glow-x', `${x.toFixed(1)}%`);
      this.element.style.setProperty('--sun-glow-y', `${y.toFixed(1)}%`);
    }
  }

  reset(): void {
    this.smoothedReveal = 0;
    this.appliedOpacity = -1;
    this.appliedX = -1;
    this.appliedY = -1;
    this.element.style.opacity = '0';
  }
}
