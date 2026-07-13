import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Points,
  PointsMaterial,
  Texture,
} from 'three';
import { clamp01, lerp } from '../utils/math';
import { getTextureAssetPath } from './planetTextureMaterials';
import { SOLAR_FX_TEXTURES, type TextureAsset } from './solarAssetManifest';
import type { CelestialBodyDefinition } from './solarSystemData';
import { FOCUS_DIM_EASE_SECONDS } from './solarVisualConfig';
import { loadTexture } from './textureAssets';

export const SOLAR_PARTICLE_COUNT = 420;

const WHITE_STARDUST_COUNT = 180;
const SOFT_STARDUST_COUNT = 126;
const CYAN_TRAIL_COUNT = 54;
const GOLD_TRAIL_COUNT = 54;
const MICRO_FLARE_COUNT = 6;
const PARTICLE_RENDER_ORDER = 18;
const FOCUS_DIM_OPACITY_SCALE = 0.16;
const PARTICLE_OPENING_START = 0.25;
const PARTICLE_OPENING_FULL = 0.72;
const SUCTION_COLLAPSED_SCALE = 0.06;
const SUCTION_SPIN_MULTIPLIER = 4.2;
const SUCTION_EASE_IN_SECONDS = 0.55;
const SUCTION_EASE_OUT_SECONDS = 0.22;

interface ParticleLayer {
  readonly points: Points;
  readonly material: PointsMaterial;
  readonly targetOpacity: number;
}

interface ParticleState {
  readonly visibleRequested: boolean;
  readonly openingProgress: number;
  readonly focusDimmed: boolean;
}

export class SolarParticleField {
  readonly root = new Group();

  private readonly stardustRoot = new Group();
  private readonly trailRoot = new Group();
  private readonly layers: ParticleLayer[] = [];
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: PointsMaterial[] = [];
  private readonly textures: Texture[] = [];
  private baseOpacity = 0;
  private dimTarget = 1;
  private dimCurrent = 1;
  private closingActive = false;
  private suctionScale = 1;

  constructor(definitions: readonly CelestialBodyDefinition[]) {
    this.root.name = 'solar-particles-root';
    this.root.visible = false;
    this.stardustRoot.name = 'solar-stardust-root';
    this.trailRoot.name = 'solar-planet-trail-root';
    this.root.add(this.stardustRoot, this.trailRoot);

    this.addParticleLayer({
      name: 'solar-stardust-white-points',
      parent: this.stardustRoot,
      positions: createStardustPositions(WHITE_STARDUST_COUNT, 1),
      size: 0.018,
      color: '#f8fbff',
      opacity: 0.18,
      textureAsset: SOLAR_FX_TEXTURES.whiteParticle,
    });
    this.addParticleLayer({
      name: 'solar-stardust-field-points',
      parent: this.stardustRoot,
      positions: createStardustPositions(SOFT_STARDUST_COUNT, 17),
      size: 0.024,
      color: '#d9f4ff',
      opacity: 0.12,
      textureAsset: SOLAR_FX_TEXTURES.stardustParticles,
    });
    this.addParticleLayer({
      name: 'solar-cyan-trail-points',
      parent: this.trailRoot,
      positions: createTrailPositions(definitions, CYAN_TRAIL_COUNT, 29),
      size: 0.022,
      color: '#77e8ff',
      opacity: 0.22,
      textureAsset: SOLAR_FX_TEXTURES.cyanParticle,
    });
    this.addParticleLayer({
      name: 'solar-gold-trail-points',
      parent: this.trailRoot,
      positions: createTrailPositions(definitions, GOLD_TRAIL_COUNT, 53),
      size: 0.024,
      color: '#ffd277',
      opacity: 0.2,
      textureAsset: SOLAR_FX_TEXTURES.goldParticle,
    });
    this.addParticleLayer({
      name: 'solar-micro-flare-points',
      parent: this.trailRoot,
      positions: createTrailPositions(definitions, MICRO_FLARE_COUNT, 83),
      size: 0.032,
      color: '#fff1b8',
      opacity: 0.11,
      textureAsset: SOLAR_FX_TEXTURES.microFlare,
    });
  }

  update(deltaSeconds: number): void {
    const blend = 1 - Math.exp(-deltaSeconds / FOCUS_DIM_EASE_SECONDS);
    this.dimCurrent += (this.dimTarget - this.dimCurrent) * blend;
    this.applyOpacity();

    if (!this.root.visible) {
      return;
    }

    // Collapse pulls the whole dust field into the seam like a vortex: the
    // roots shrink toward the center while spinning up.
    const suctionTarget = this.closingActive ? SUCTION_COLLAPSED_SCALE : 1;
    const suctionBlend =
      1 -
      Math.exp(
        -deltaSeconds /
          (this.closingActive ? SUCTION_EASE_IN_SECONDS : SUCTION_EASE_OUT_SECONDS),
      );
    this.suctionScale += (suctionTarget - this.suctionScale) * suctionBlend;
    this.stardustRoot.scale.setScalar(this.suctionScale);
    this.trailRoot.scale.setScalar(this.suctionScale);
    const spinBoost = this.closingActive
      ? SUCTION_SPIN_MULTIPLIER
      : 1 + (SUCTION_SPIN_MULTIPLIER - 1) * (1 - this.suctionScale);

    this.stardustRoot.rotation.z += deltaSeconds * 0.018 * spinBoost;
    this.stardustRoot.rotation.y += deltaSeconds * 0.006;
    this.trailRoot.rotation.z += deltaSeconds * 0.055 * spinBoost;
  }

  setClosingActive(active: boolean): void {
    this.closingActive = active;
  }

  setState(state: ParticleState): void {
    this.baseOpacity =
      state.visibleRequested && state.openingProgress > PARTICLE_OPENING_START
        ? smoothProgressRange(
            state.openingProgress,
            PARTICLE_OPENING_START,
            PARTICLE_OPENING_FULL,
          )
        : 0;
    this.dimTarget = state.focusDimmed ? FOCUS_DIM_OPACITY_SCALE : 1;
    if (this.baseOpacity <= 0) {
      // A fresh reveal must not inherit a half-eased dim from the last session.
      this.dimCurrent = this.dimTarget;
    }
    this.applyOpacity();
  }

  private applyOpacity(): void {
    const opacityScale = this.baseOpacity * this.dimCurrent;

    this.root.visible = opacityScale > 0.01;
    this.layers.forEach((layer) => {
      layer.points.visible = this.root.visible;
      layer.material.opacity = layer.targetOpacity * opacityScale;
    });
  }

  dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private addParticleLayer(input: {
    readonly name: string;
    readonly parent: Group;
    readonly positions: Float32Array;
    readonly size: number;
    readonly color: string;
    readonly opacity: number;
    readonly textureAsset: TextureAsset;
  }): void {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(input.positions, 3));
    const material = new PointsMaterial({
      color: input.color,
      opacity: 0,
      size: input.size,
      sizeAttenuation: true,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const points = new Points(geometry, material);
    points.name = input.name;
    points.renderOrder = PARTICLE_RENDER_ORDER;
    points.visible = false;
    input.parent.add(points);

    this.layers.push({
      points,
      material,
      targetOpacity: input.opacity,
    });
    this.geometries.push(geometry);
    this.materials.push(material);
    this.loadLayerTexture(input.textureAsset, material);
  }

  private loadLayerTexture(
    textureAsset: TextureAsset,
    material: PointsMaterial,
  ): void {
    const texturePath = getTextureAssetPath(textureAsset);
    if (!texturePath) {
      return;
    }

    void loadTexture(texturePath).then((texture) => {
      if (!texture) {
        return;
      }

      this.textures.push(texture);
      material.map = texture;
      material.needsUpdate = true;
    });
  }
}

function createStardustPositions(count: number, seedOffset: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const angle = pseudoRandom(index, seedOffset + 3) * Math.PI * 2;
    const radius = lerp(0.52, 3.48, Math.sqrt(pseudoRandom(index, seedOffset + 7)));
    const verticalJitter = lerp(-0.16, 0.16, pseudoRandom(index, seedOffset + 11));
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius * 0.7 + verticalJitter;
    positions[index * 3 + 2] = lerp(-0.055, 0.085, pseudoRandom(index, seedOffset + 19));
  }

  return positions;
}

function createTrailPositions(
  definitions: readonly CelestialBodyDefinition[],
  count: number,
  seedOffset: number,
): Float32Array {
  const orbitDefinitions = definitions.filter(
    (definition) => definition.parentId === null && definition.orbitRadius > 0,
  );
  const positions = new Float32Array(count * 3);

  for (let index = 0; index < count; index += 1) {
    const definition = orbitDefinitions[index % orbitDefinitions.length];
    const arcProgress = (index % 6) / 6;
    const trailOffset = lerp(-0.42, -0.05, arcProgress);
    const orbitJitter = lerp(-0.006, 0.006, pseudoRandom(index, seedOffset + 13));
    const angle = definition.orbitPhase + trailOffset;
    const radius = definition.orbitRadius + orbitJitter;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius;
    positions[index * 3 + 2] = lerp(-0.016, 0.024, pseudoRandom(index, seedOffset + 31));
  }

  return positions;
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
