import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three';
import { BLOOM_RENDER_LAYER } from '../rendering/renderLayers';
import { clamp01, lerp } from '../utils/math';
import { getTextureAssetPath } from './planetTextureMaterials';
import { SOLAR_FX_TEXTURES } from './solarAssetManifest';
import { FOCUS_DIM_EASE_SECONDS } from './solarVisualConfig';
import { loadTexture } from './textureAssets';

// Elliptical path with the sun at one focus: perihelion inside Mercury's
// orbit, aphelion just inside the outermost planets.
const PERIHELION = 0.88;
const APHELION = 3.2;
const SEMI_MAJOR_AXIS = (PERIHELION + APHELION) / 2;
const FOCUS_OFFSET = SEMI_MAJOR_AXIS - PERIHELION;
const SEMI_MINOR_AXIS = Math.sqrt(
  SEMI_MAJOR_AXIS * SEMI_MAJOR_AXIS - FOCUS_OFFSET * FOCUS_OFFSET,
);
// Kepler-ish sweep: angular speed scales with 1/r², clamped so the perihelion
// pass stays readable instead of teleporting.
const SWEEP_RATE = 0.72;
const MAX_ANGULAR_SPEED = 1.15;
const ORBIT_PLANE_TILT = 0.2;
const HEAD_SPRITE_SIZE = 0.16;
const TAIL_POINT_COUNT = 72;
const TAIL_MIN_LENGTH = 0.42;
const TAIL_MAX_LENGTH = 1.15;
const TAIL_WIDTH = 0.05;
const TAIL_POINT_SIZE = 0.03;
const FOCUS_DIM_OPACITY_SCALE = 0.14;
const COMET_OPENING_START = 0.35;
const COMET_OPENING_FULL = 0.8;
const HEAD_PEAK_OPACITY = 0.92;
const TAIL_PEAK_OPACITY = 0.75;
interface CometState {
  readonly visibleRequested: boolean;
  readonly openingProgress: number;
  readonly focusDimmed: boolean;
}

/**
 * A periodic comet swinging through the system on an eccentric orbit, tail
 * always pointing away from the sun. Loops forever; every perihelion pass is
 * a small event without any interaction impact.
 */
export class CometFlyby {
  readonly root = new Group();

  private readonly orbitGroup = new Group();
  private readonly headSprite: Sprite;
  private readonly headMaterial: SpriteMaterial;
  private readonly tailPoints: Points;
  private readonly tailGeometry = new BufferGeometry();
  private readonly tailMaterial: PointsMaterial;
  private readonly tailPositions = new Float32Array(TAIL_POINT_COUNT * 3);
  private readonly textures: Texture[] = [];
  private eccentricAnomaly = Math.PI;
  private baseOpacity = 0;
  private dimTarget = 1;
  private dimCurrent = 1;
  constructor() {
    this.root.name = 'comet-flyby-root';
    this.root.visible = false;
    this.orbitGroup.name = 'comet-flyby-orbit';
    this.orbitGroup.rotation.x = ORBIT_PLANE_TILT;
    this.root.add(this.orbitGroup);

    this.headMaterial = new SpriteMaterial({
      color: '#d9f2ff',
      opacity: 0,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.headSprite = new Sprite(this.headMaterial);
    this.headSprite.name = 'comet-flyby-head';
    this.headSprite.scale.setScalar(HEAD_SPRITE_SIZE);
    this.headSprite.layers.enable(BLOOM_RENDER_LAYER);
    this.orbitGroup.add(this.headSprite);

    this.tailGeometry.setAttribute(
      'position',
      new Float32BufferAttribute(this.tailPositions, 3),
    );
    this.tailGeometry.setAttribute(
      'color',
      new Float32BufferAttribute(createTailColors(), 3),
    );
    this.tailMaterial = new PointsMaterial({
      size: TAIL_POINT_SIZE,
      vertexColors: true,
      opacity: 0,
      sizeAttenuation: true,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.tailPoints = new Points(this.tailGeometry, this.tailMaterial);
    this.tailPoints.name = 'comet-flyby-tail';
    this.tailPoints.frustumCulled = false;
    this.orbitGroup.add(this.tailPoints);

    this.loadSpriteTextures();
  }

  update(deltaSeconds: number): void {
    const blend = 1 - Math.exp(-deltaSeconds / FOCUS_DIM_EASE_SECONDS);
    this.dimCurrent += (this.dimTarget - this.dimCurrent) * blend;
    this.applyOpacity();

    if (!this.root.visible) {
      return;
    }

    const head = TEMP_HEAD_POSITION.set(
      SEMI_MAJOR_AXIS * Math.cos(this.eccentricAnomaly) - FOCUS_OFFSET,
      SEMI_MINOR_AXIS * Math.sin(this.eccentricAnomaly),
      0,
    );
    const sunDistance = Math.max(head.length(), 0.2);
    this.eccentricAnomaly +=
      Math.min(SWEEP_RATE / (sunDistance * sunDistance), MAX_ANGULAR_SPEED) *
      deltaSeconds;

    this.headSprite.position.copy(head);
    this.writeTailPositions(head, sunDistance);
  }

  setState(state: CometState): void {
    this.baseOpacity =
      state.visibleRequested && state.openingProgress > COMET_OPENING_START
        ? smoothProgressRange(
            state.openingProgress,
            COMET_OPENING_START,
            COMET_OPENING_FULL,
          )
        : 0;
    this.dimTarget = state.focusDimmed ? FOCUS_DIM_OPACITY_SCALE : 1;
    if (this.baseOpacity <= 0) {
      this.dimCurrent = this.dimTarget;
    }
    this.applyOpacity();
  }

  dispose(): void {
    this.tailGeometry.dispose();
    this.tailMaterial.dispose();
    this.headMaterial.dispose();
    this.textures.forEach((texture) => texture.dispose());
  }

  private applyOpacity(): void {
    const opacityScale = this.baseOpacity * this.dimCurrent;

    this.root.visible = opacityScale > 0.01;
    this.headMaterial.opacity = opacityScale * HEAD_PEAK_OPACITY;
    this.tailMaterial.opacity = opacityScale * TAIL_PEAK_OPACITY;
  }

  private writeTailPositions(head: Vector3, sunDistance: number): void {
    // The tail points away from the sun (origin) and stretches near perihelion.
    const tailDirection = TEMP_TAIL_DIRECTION.copy(head).normalize();
    const proximity = clamp01(
      1 - (sunDistance - PERIHELION) / (APHELION - PERIHELION),
    );
    const tailLength = lerp(TAIL_MIN_LENGTH, TAIL_MAX_LENGTH, proximity ** 1.4);

    for (let index = 0; index < TAIL_POINT_COUNT; index += 1) {
      const along = (index + 1) / TAIL_POINT_COUNT;
      const spread = along ** 0.8 * tailLength;
      const wobble = TAIL_WIDTH * along;

      this.tailPositions[index * 3] =
        head.x +
        tailDirection.x * spread +
        (pseudoRandom(index, 5) - 0.5) * wobble;
      this.tailPositions[index * 3 + 1] =
        head.y +
        tailDirection.y * spread +
        (pseudoRandom(index, 11) - 0.5) * wobble;
      this.tailPositions[index * 3 + 2] =
        (pseudoRandom(index, 17) - 0.5) * wobble;
    }

    const attribute = this.tailGeometry.getAttribute('position');
    (attribute.array as Float32Array).set(this.tailPositions);
    attribute.needsUpdate = true;
  }

  private loadSpriteTextures(): void {
    const texturePath = getTextureAssetPath(SOLAR_FX_TEXTURES.microFlare);
    if (!texturePath) {
      return;
    }

    void loadTexture(texturePath).then((texture) => {
      if (!texture) {
        return;
      }

      this.textures.push(texture);
      this.headMaterial.map = texture;
      this.headMaterial.needsUpdate = true;
    });

    const particlePath = getTextureAssetPath(SOLAR_FX_TEXTURES.cyanParticle);
    if (!particlePath) {
      return;
    }

    void loadTexture(particlePath).then((texture) => {
      if (!texture) {
        return;
      }

      this.textures.push(texture);
      this.tailMaterial.map = texture;
      this.tailMaterial.needsUpdate = true;
    });
  }
}

const TEMP_HEAD_POSITION = new Vector3();
const TEMP_TAIL_DIRECTION = new Vector3();

function createTailColors(): Float32Array {
  const colors = new Float32Array(TAIL_POINT_COUNT * 3);
  const nearColor = new Color('#cfeeff');
  const farColor = new Color('#2a5f8f');
  const mixed = new Color();

  for (let index = 0; index < TAIL_POINT_COUNT; index += 1) {
    const along = index / (TAIL_POINT_COUNT - 1);
    mixed.copy(nearColor).lerp(farColor, along ** 0.7);
    // Additive rendering: darker vertex colors read as more transparent.
    const fade = 1 - along * 0.82;
    colors[index * 3] = mixed.r * fade;
    colors[index * 3 + 1] = mixed.g * fade;
    colors[index * 3 + 2] = mixed.b * fade;
  }

  return colors;
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
