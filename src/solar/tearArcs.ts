import {
  AdditiveBlending,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
} from 'three';
import { BLOOM_RENDER_LAYER } from '../rendering/renderLayers';
import { clamp01, lerp } from '../utils/math';
import { SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X } from './solarSystemData';

const ARC_SEGMENT_COUNT = 30;
const ARC_Z = 0.05;
const ARC_RESEED_INTERVAL_SECONDS = 0.085;
const ARC_BASE_AMPLITUDE = 0.14;

interface ArcConfig {
  readonly color: string;
  readonly baseOpacity: number;
  readonly amplitudeScale: number;
  readonly zJitter: number;
}

// Two hot cores plus one wider faint stray for depth.
const ARC_CONFIGS: readonly ArcConfig[] = [
  { color: '#cfeeff', baseOpacity: 0.9, amplitudeScale: 1, zJitter: 0 },
  { color: '#ffe9b0', baseOpacity: 0.7, amplitudeScale: 1.35, zJitter: 0.012 },
  { color: '#7fd4ff', baseOpacity: 0.5, amplitudeScale: 1.9, zJitter: -0.014 },
];

interface TearArc {
  readonly line: Line;
  readonly material: LineBasicMaterial;
  readonly geometry: BufferGeometry;
  readonly positions: Float32Array;
  readonly config: ArcConfig;
  seeds: number[];
}

/**
 * Crackling energy arcs spanning the two hand anchors while the rift is being
 * torn open or collapsed. Pure cosmetics driven by opening progress — no
 * interaction state is read or written.
 */
export class TearArcField {
  readonly root = new Group();

  private readonly arcs: TearArc[] = [];
  private intensity = 0;
  private reseedCountdown = 0;
  private noisePhase = 0;

  constructor() {
    this.root.name = 'solar-tear-arcs';
    this.root.visible = false;

    ARC_CONFIGS.forEach((config, index) => {
      const positions = new Float32Array(ARC_SEGMENT_COUNT * 3);
      const geometry = new BufferGeometry();
      const attribute = new Float32BufferAttribute(positions, 3);
      attribute.setUsage(DynamicDrawUsage);
      geometry.setAttribute('position', attribute);
      const material = new LineBasicMaterial({
        color: config.color,
        opacity: 0,
        blending: AdditiveBlending,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const line = new Line(geometry, material);
      line.name = `solar-tear-arc-${index}`;
      line.frustumCulled = false;
      line.layers.enable(BLOOM_RENDER_LAYER);
      this.root.add(line);

      this.arcs.push({
        line,
        material,
        geometry,
        positions,
        config,
        seeds: createSeeds(),
      });
    });
  }

  /** intensity 0..1; 0 hides the arcs entirely. */
  setIntensity(intensity: number): void {
    this.intensity = clamp01(intensity);
    this.root.visible = this.intensity > 0.02;
  }

  update(deltaSeconds: number): void {
    if (!this.root.visible) {
      return;
    }

    this.noisePhase += deltaSeconds * 9;
    this.reseedCountdown -= deltaSeconds;
    const reseed = this.reseedCountdown <= 0;
    if (reseed) {
      this.reseedCountdown = ARC_RESEED_INTERVAL_SECONDS;
    }

    const span = SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X;

    this.arcs.forEach((arc, arcIndex) => {
      if (reseed) {
        arc.seeds = createSeeds();
      }

      const amplitude =
        ARC_BASE_AMPLITUDE * arc.config.amplitudeScale * this.intensity;

      for (let segment = 0; segment < ARC_SEGMENT_COUNT; segment += 1) {
        const t = segment / (ARC_SEGMENT_COUNT - 1);
        // Pin the ends at the anchors; wobble peaks mid-span.
        const envelope = Math.sin(t * Math.PI);
        const jaggy =
          Math.sin(t * 21 + arc.seeds[0] * 6.28 + this.noisePhase) * 0.55 +
          Math.sin(t * 47 + arc.seeds[1] * 6.28 - this.noisePhase * 1.7) * 0.3 +
          Math.sin(t * 9 + arc.seeds[2] * 6.28) * 0.45;

        arc.positions[segment * 3] = lerp(-span, span, t);
        arc.positions[segment * 3 + 1] = jaggy * amplitude * envelope;
        arc.positions[segment * 3 + 2] =
          ARC_Z +
          arc.config.zJitter +
          Math.sin(t * 13 + arc.seeds[3] * 6.28) * 0.01 * envelope;
      }

      const attribute = arc.geometry.getAttribute('position');
      (attribute.array as Float32Array).set(arc.positions);
      attribute.needsUpdate = true;

      // Per-frame flicker keeps the arcs electric instead of ribbon-like.
      const flicker =
        0.55 + 0.45 * pseudoRandom(arcIndex * 31 + 7, this.noisePhase);
      arc.material.opacity = arc.config.baseOpacity * this.intensity * flicker;
    });
  }

  dispose(): void {
    this.arcs.forEach((arc) => {
      arc.geometry.dispose();
      arc.material.dispose();
    });
  }
}

function createSeeds(): number[] {
  return [Math.random(), Math.random(), Math.random(), Math.random()];
}

function pseudoRandom(index: number, seed: number): number {
  const value = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;

  return value - Math.floor(value);
}
