import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  Points,
  PointsMaterial,
  Texture,
  Vector2,
} from 'three';
import { BLOOM_RENDER_LAYER } from '../rendering/renderLayers';
import { clamp01, lerp } from '../utils/math';
import { SOLAR_BACKGROUND_OPACITY_SCALE } from './solarVisualConfig';
import { getTextureAssetPath } from './planetTextureMaterials';
import { SOLAR_FX_TEXTURES, type TextureAsset } from './solarAssetManifest';
import {
  RIFT_EDGE_GLOW_CYAN,
  RIFT_EDGE_GLOW_GOLD,
} from './solarVisualConfig';
import { loadTexture } from './textureAssets';

const SPARK_POINT_SIZE = 0.042;
const SPARK_MIN_LIFETIME_SECONDS = 0.7;
const SPARK_MAX_LIFETIME_SECONDS = 1.9;
const SPARK_MIN_DRIFT = 0.08;
const SPARK_MAX_DRIFT = 0.3;
// Fraction of the pool that stays alive once the rift has settled.
const CALM_ACTIVE_FRACTION = 0.26;

interface SparkLayerConfig {
  readonly name: string;
  readonly count: number;
  readonly color: string;
  readonly textureAsset: TextureAsset;
  readonly peakOpacity: number;
}

interface Spark {
  angle: number;
  lifePhase: number;
  lifetimeSeconds: number;
  drift: number;
  tangentDrift: number;
  seed: number;
}

interface SparkLayer {
  readonly points: Points;
  readonly material: PointsMaterial;
  readonly geometry: BufferGeometry;
  readonly positions: Float32Array;
  readonly colors: Float32Array;
  readonly baseColor: Color;
  readonly sparks: Spark[];
  readonly peakOpacity: number;
}

/**
 * Embers spraying off the rift's elliptical rim. The spawn ring follows the
 * live aperture, so sparks track the crack as it tears open or collapses, and
 * the emission rate surges with the shader's `openingEnergy`.
 */
export class RiftEdgeSparks {
  readonly root = new Group();

  private readonly layers: SparkLayer[] = [];
  private readonly textures: Texture[] = [];
  private readonly rimRadii: Vector2;
  private spawnCounter = 0;

  constructor(rimRadiusX: number, rimRadiusY: number) {
    this.root.name = 'rift-edge-sparks';
    this.rimRadii = new Vector2(rimRadiusX, rimRadiusY);

    const layerConfigs: readonly SparkLayerConfig[] = [
      {
        name: 'rift-edge-sparks-cyan',
        count: 84,
        color: RIFT_EDGE_GLOW_CYAN,
        textureAsset: SOLAR_FX_TEXTURES.cyanParticle,
        peakOpacity: 0.85,
      },
      {
        name: 'rift-edge-sparks-gold',
        count: 56,
        color: RIFT_EDGE_GLOW_GOLD,
        textureAsset: SOLAR_FX_TEXTURES.goldParticle,
        peakOpacity: 0.72,
      },
    ];

    layerConfigs.forEach((config) => this.addLayer(config));
  }

  update(
    deltaSeconds: number,
    aperture: Vector2,
    openingEnergy: number,
    opacityScale: number,
  ): void {
    const visible = opacityScale > 0.01;
    this.root.visible = visible;

    if (!visible) {
      return;
    }

    const energy = clamp01(openingEnergy);
    const activeFraction = lerp(CALM_ACTIVE_FRACTION, 1, energy);
    const churn = 1 + energy * 1.6;

    this.layers.forEach((layer) => {
      const activeCount = Math.round(layer.sparks.length * activeFraction);

      layer.sparks.forEach((spark, index) => {
        spark.lifePhase += (deltaSeconds / spark.lifetimeSeconds) * churn;
        if (spark.lifePhase >= 1) {
          this.respawnSpark(spark);
        }

        const active = index < activeCount;
        const life = spark.lifePhase;
        const rimX = Math.cos(spark.angle) * this.rimRadii.x * aperture.x;
        const rimY = Math.sin(spark.angle) * this.rimRadii.y * aperture.y;
        const rimLength = Math.hypot(rimX, rimY) || 1;
        const outX = rimX / rimLength;
        const outY = rimY / rimLength;
        const drift = spark.drift * life;
        const swirl =
          Math.sin(life * 9 + spark.seed * 6.28) * 0.02 * (1 + energy);

        layer.positions[index * 3] =
          rimX + outX * drift - outY * (spark.tangentDrift * life + swirl);
        layer.positions[index * 3 + 1] =
          rimY + outY * drift + outX * (spark.tangentDrift * life + swirl);
        layer.positions[index * 3 + 2] = (spark.seed - 0.5) * 0.05;

        // Additive points: fading the vertex color fades the spark.
        const fade = active ? Math.sin(life * Math.PI) : 0;
        layer.colors[index * 3] = layer.baseColor.r * fade;
        layer.colors[index * 3 + 1] = layer.baseColor.g * fade;
        layer.colors[index * 3 + 2] = layer.baseColor.b * fade;
      });

      const positionAttribute = layer.geometry.getAttribute('position');
      (positionAttribute.array as Float32Array).set(layer.positions);
      positionAttribute.needsUpdate = true;
      const colorAttribute = layer.geometry.getAttribute('color');
      (colorAttribute.array as Float32Array).set(layer.colors);
      colorAttribute.needsUpdate = true;

      layer.material.opacity =
        layer.peakOpacity *
        opacityScale *
        SOLAR_BACKGROUND_OPACITY_SCALE *
        lerp(0.6, 1, energy);
    });
  }

  dispose(): void {
    this.layers.forEach((layer) => {
      layer.geometry.dispose();
      layer.material.dispose();
    });
    this.textures.forEach((texture) => texture.dispose());
  }

  private addLayer(config: SparkLayerConfig): void {
    const sparks: Spark[] = [];
    for (let index = 0; index < config.count; index += 1) {
      const spark: Spark = {
        angle: 0,
        lifePhase: 0,
        lifetimeSeconds: 1,
        drift: 0,
        tangentDrift: 0,
        seed: 0,
      };
      this.respawnSpark(spark);
      // Stagger initial phases so the ring is populated from the first frame.
      spark.lifePhase = pseudoRandom(index, 91);
      sparks.push(spark);
    }

    const positions = new Float32Array(config.count * 3);
    const colors = new Float32Array(config.count * 3);
    const geometry = new BufferGeometry();
    const positionAttribute = new Float32BufferAttribute(positions, 3);
    positionAttribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute('position', positionAttribute);
    const colorAttribute = new Float32BufferAttribute(colors, 3);
    colorAttribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute('color', colorAttribute);

    const material = new PointsMaterial({
      size: SPARK_POINT_SIZE,
      vertexColors: true,
      opacity: 0,
      sizeAttenuation: true,
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const points = new Points(geometry, material);
    points.name = config.name;
    points.frustumCulled = false;
    points.layers.enable(BLOOM_RENDER_LAYER);
    this.root.add(points);

    this.layers.push({
      points,
      material,
      geometry,
      positions,
      colors,
      baseColor: new Color(config.color),
      sparks,
      peakOpacity: config.peakOpacity,
    });
    this.loadLayerTexture(config.textureAsset, material);
  }

  private respawnSpark(spark: Spark): void {
    this.spawnCounter += 1;
    spark.angle = pseudoRandom(this.spawnCounter, 3) * Math.PI * 2;
    spark.lifePhase = 0;
    spark.lifetimeSeconds = lerp(
      SPARK_MIN_LIFETIME_SECONDS,
      SPARK_MAX_LIFETIME_SECONDS,
      pseudoRandom(this.spawnCounter, 7),
    );
    spark.drift = lerp(
      SPARK_MIN_DRIFT,
      SPARK_MAX_DRIFT,
      pseudoRandom(this.spawnCounter, 13),
    );
    spark.tangentDrift = lerp(-0.05, 0.05, pseudoRandom(this.spawnCounter, 19));
    spark.seed = pseudoRandom(this.spawnCounter, 29);
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

function pseudoRandom(index: number, seed: number): number {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;

  return value - Math.floor(value);
}
