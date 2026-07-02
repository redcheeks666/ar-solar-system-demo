import {
  CanvasTexture,
  DoubleSide,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
} from 'three';
import { BACKGROUND_RENDER_LAYER } from '../rendering/renderLayers';
import { clamp01, lerp } from '../utils/math';
import {
  SOLAR_SYSTEM_PREVIEW_TILT_X,
  SOLAR_SYSTEM_PREVIEW_TILT_Y,
  UNIVERSE_RIFT_BACKGROUND_OPACITY,
  UNIVERSE_RIFT_WIDTH,
} from './solarVisualConfig';

const TEXTURE_WIDTH = 1920;
const TEXTURE_HEIGHT = 1080;
const RIFT_VISIBLE_BOUNDS_WIDTH = 1687;
const RIFT_VISIBLE_BOUNDS_HEIGHT = 322;
const BACKDROP_RENDER_ORDER = -20;
const FOCUS_DIM_OPACITY_SCALE = 0.22;
const BACKDROP_LOCAL_Z = -0.16;
const RIFT_CANVAS_ASPECT_RATIO = TEXTURE_HEIGHT / TEXTURE_WIDTH;
const RIFT_PLANE_WIDTH =
  UNIVERSE_RIFT_WIDTH * (TEXTURE_WIDTH / RIFT_VISIBLE_BOUNDS_WIDTH);
const RIFT_PLANE_HEIGHT = RIFT_PLANE_WIDTH * RIFT_CANVAS_ASPECT_RATIO;
const BACKDROP_ELLIPSE_RADIUS_X =
  RIFT_VISIBLE_BOUNDS_WIDTH * 0.43;
const BACKDROP_ELLIPSE_RADIUS_Y =
  RIFT_VISIBLE_BOUNDS_HEIGHT * 0.36;
const DEFAULT_SOLAR_TILT_INVERSE = new Quaternion()
  .setFromEuler(
    new Euler(
      SOLAR_SYSTEM_PREVIEW_TILT_X,
      SOLAR_SYSTEM_PREVIEW_TILT_Y,
      0,
    ),
  )
  .invert();

interface RiftState {
  readonly visibleRequested: boolean;
  readonly openingProgress: number;
  readonly focusDimmed: boolean;
}

interface RiftPerformanceSnapshot {
  readonly vfxFrameUploadMs: number | null;
  readonly vfxFrameUploadCount: number;
}

export class UniverseRiftBackdrop {
  readonly root = new Group();

  private readonly backgroundTexture: CanvasTexture;
  private readonly backgroundGeometry = new PlaneGeometry(
    RIFT_PLANE_WIDTH,
    RIFT_PLANE_HEIGHT,
  );
  private readonly backgroundMaterial: MeshBasicMaterial;
  private readonly geometries: PlaneGeometry[] = [];
  private readonly materials: MeshBasicMaterial[] = [];

  constructor() {
    this.root.name = 'universe-rift-backdrop';
    this.root.visible = false;

    this.backgroundTexture = createRiftBackgroundTexture();
    this.backgroundMaterial = new MeshBasicMaterial({
      map: this.backgroundTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: DoubleSide,
    });
    const backdrop = new Mesh(this.backgroundGeometry, this.backgroundMaterial);
    backdrop.name = 'universe-rift-elliptical-starfield';
    backdrop.position.z = BACKDROP_LOCAL_Z;
    // Keep the generated sky glued to the AE frame rather than the old 3D disk pitch.
    backdrop.quaternion.copy(DEFAULT_SOLAR_TILT_INVERSE);
    backdrop.layers.set(BACKGROUND_RENDER_LAYER);
    backdrop.renderOrder = BACKDROP_RENDER_ORDER;
    this.root.add(backdrop);
    this.geometries.push(this.backgroundGeometry);
    this.materials.push(this.backgroundMaterial);
  }

  update(_deltaSeconds = 0): void {
    // The rift is a child of the solar-system group and shares its transform, so its
    // widest left/right points stay locked to the hand-attached control endpoints.
  }

  setState(state: RiftState): void {
    const reveal =
      state.visibleRequested && state.openingProgress > 0.01
        ? smoothProgressRange(state.openingProgress, 0.03, 0.78)
        : 0;
    const dimScale = state.focusDimmed ? FOCUS_DIM_OPACITY_SCALE : 1;
    const opacityScale = reveal * dimScale;

    this.root.visible = opacityScale > 0.005;
    // No independent scale: the rift shares the solar-system group's transform so its
    // left/right widest points stay aligned with the control endpoints.
    this.backgroundMaterial.opacity = opacityScale;
  }

  dispose(): void {
    this.backgroundTexture.dispose();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
  }

  getPerformanceSnapshot(): RiftPerformanceSnapshot {
    return {
      vfxFrameUploadMs: null,
      vfxFrameUploadCount: 0,
    };
  }
}

function createRiftBackgroundTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to create universe rift texture context.');
  }

  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  context.save();
  context.beginPath();
  context.ellipse(
    TEXTURE_WIDTH / 2,
    TEXTURE_HEIGHT / 2,
    BACKDROP_ELLIPSE_RADIUS_X,
    BACKDROP_ELLIPSE_RADIUS_Y,
    0,
    0,
    Math.PI * 2,
  );
  context.clip();

  context.fillStyle = `rgba(2, 4, 12, ${UNIVERSE_RIFT_BACKGROUND_OPACITY})`;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  drawNebulaGlow(context);
  drawStarField(context, 1200);
  drawMilkyDust(context);
  context.restore();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function drawNebulaGlow(context: CanvasRenderingContext2D): void {
  const blueGlow = context.createRadialGradient(
    TEXTURE_WIDTH * 0.42,
    TEXTURE_HEIGHT * 0.47,
    10,
    TEXTURE_WIDTH * 0.44,
    TEXTURE_HEIGHT * 0.47,
    TEXTURE_WIDTH * 0.42,
  );
  blueGlow.addColorStop(0, 'rgba(76, 128, 190, 0.3)');
  blueGlow.addColorStop(0.42, 'rgba(31, 70, 122, 0.16)');
  blueGlow.addColorStop(1, 'rgba(3, 5, 15, 0)');
  context.fillStyle = blueGlow;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const warmGlow = context.createRadialGradient(
    TEXTURE_WIDTH * 0.54,
    TEXTURE_HEIGHT * 0.51,
    4,
    TEXTURE_WIDTH * 0.54,
    TEXTURE_HEIGHT * 0.51,
    TEXTURE_WIDTH * 0.28,
  );
  warmGlow.addColorStop(0, 'rgba(227, 112, 45, 0.22)');
  warmGlow.addColorStop(0.48, 'rgba(95, 37, 28, 0.1)');
  warmGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = warmGlow;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
}

function drawStarField(
  context: CanvasRenderingContext2D,
  count: number,
): void {
  for (let index = 0; index < count; index += 1) {
    const x = pseudoRandom(index, 3) * TEXTURE_WIDTH;
    const y = pseudoRandom(index, 7) * TEXTURE_HEIGHT;
    const dx = (x - TEXTURE_WIDTH / 2) / (TEXTURE_WIDTH * 0.47);
    const dy = (y - TEXTURE_HEIGHT / 2) / (TEXTURE_HEIGHT * 0.46);

    if (dx * dx + dy * dy > 1) {
      continue;
    }

    const brightness = pseudoRandom(index, 13);
    const radius = lerp(0.45, 1.7, brightness * brightness);
    const alpha = lerp(0.12, 0.74, brightness);
    context.fillStyle =
      brightness > 0.84
        ? `rgba(190, 230, 255, ${alpha})`
        : `rgba(238, 244, 255, ${alpha * 0.72})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawMilkyDust(context: CanvasRenderingContext2D): void {
  context.save();
  context.globalCompositeOperation = 'lighter';
  for (let index = 0; index < 44; index += 1) {
    const t = index / 43;
    const x = lerp(TEXTURE_WIDTH * 0.14, TEXTURE_WIDTH * 0.88, t);
    const y =
      TEXTURE_HEIGHT * 0.49 +
      Math.sin(t * Math.PI * 2.15 + 0.8) * TEXTURE_HEIGHT * 0.045 +
      lerp(-18, 18, pseudoRandom(index, 31));
    const width = lerp(14, 48, pseudoRandom(index, 47));
    const height = lerp(5, 20, pseudoRandom(index, 61));

    context.fillStyle = `rgba(85, 134, 190, ${lerp(0.035, 0.11, pseudoRandom(index, 73))})`;
    context.beginPath();
    context.ellipse(
      x,
      y,
      width,
      height,
      lerp(-0.22, 0.16, pseudoRandom(index, 83)),
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

function smoothProgressRange(
  progress: number,
  start: number,
  end: number,
): number {
  const normalized = clamp01((progress - start) / Math.max(end - start, 0.0001));

  return normalized * normalized * (3 - 2 * normalized);
}

function pseudoRandom(index: number, seed: number): number {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;

  return value - Math.floor(value);
}
