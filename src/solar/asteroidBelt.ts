import {
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { clamp01, lerp } from '../utils/math';
import { FOCUS_DIM_EASE_SECONDS } from './solarVisualConfig';

// Between the Mars (1.88) and Jupiter (2.05) orbits.
const BELT_INNER_RADIUS = 1.925;
const BELT_OUTER_RADIUS = 2.005;
const BELT_ROCK_COUNT = 320;
const BELT_Z_JITTER = 0.03;
const BELT_MIN_ROCK_SCALE = 0.008;
const BELT_MAX_ROCK_SCALE = 0.024;
const BELT_ROTATION_SPEED = 0.045;
const BELT_PEAK_OPACITY = 0.88;
const BELT_OPENING_START = 0.3;
const BELT_OPENING_FULL = 0.75;
const FOCUS_DIM_OPACITY_SCALE = 0.14;

interface BeltState {
  readonly visibleRequested: boolean;
  readonly openingProgress: number;
  readonly focusDimmed: boolean;
}

/**
 * Instanced rock ring between Mars and Jupiter. One draw call; the rocks are
 * lit by the sun point light, so the belt cheaply sells depth and scale.
 */
export class AsteroidBelt {
  readonly root = new Group();

  private readonly mesh: InstancedMesh;
  private readonly geometry = new IcosahedronGeometry(1, 0);
  private readonly material: MeshStandardMaterial;
  private baseOpacity = 0;
  private dimTarget = 1;
  private dimCurrent = 1;

  constructor() {
    this.root.name = 'asteroid-belt-root';
    this.root.visible = false;

    this.material = new MeshStandardMaterial({
      color: 0x9a9184,
      roughness: 0.95,
      metalness: 0.05,
      emissive: 0x1c1f2b,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.mesh = new InstancedMesh(this.geometry, this.material, BELT_ROCK_COUNT);
    this.mesh.name = 'asteroid-belt-rocks';
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    // Instances span the whole ring; the base geometry bounds would cull them.
    this.mesh.frustumCulled = false;
    this.populateInstances();
    this.root.add(this.mesh);
  }

  update(deltaSeconds: number): void {
    const blend = 1 - Math.exp(-deltaSeconds / FOCUS_DIM_EASE_SECONDS);
    this.dimCurrent += (this.dimTarget - this.dimCurrent) * blend;
    this.applyOpacity();

    if (!this.root.visible) {
      return;
    }

    this.root.rotation.z += deltaSeconds * BELT_ROTATION_SPEED;
  }

  setState(state: BeltState): void {
    this.baseOpacity =
      state.visibleRequested && state.openingProgress > BELT_OPENING_START
        ? smoothProgressRange(
            state.openingProgress,
            BELT_OPENING_START,
            BELT_OPENING_FULL,
          )
        : 0;
    this.dimTarget = state.focusDimmed ? FOCUS_DIM_OPACITY_SCALE : 1;
    if (this.baseOpacity <= 0) {
      this.dimCurrent = this.dimTarget;
    }
    this.applyOpacity();
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.dispose();
  }

  private applyOpacity(): void {
    const opacity = this.baseOpacity * this.dimCurrent * BELT_PEAK_OPACITY;

    this.root.visible = opacity > 0.01;
    this.material.opacity = opacity;
  }

  private populateInstances(): void {
    const matrix = new Matrix4();
    const position = new Vector3();
    const rotation = new Quaternion();
    const rotationAxis = new Vector3();
    const scale = new Vector3();

    for (let index = 0; index < BELT_ROCK_COUNT; index += 1) {
      const angle = pseudoRandom(index, 7) * Math.PI * 2;
      const radius = lerp(
        BELT_INNER_RADIUS,
        BELT_OUTER_RADIUS,
        pseudoRandom(index, 13),
      );

      position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        lerp(-BELT_Z_JITTER, BELT_Z_JITTER, pseudoRandom(index, 19)),
      );
      rotationAxis
        .set(
          pseudoRandom(index, 23) - 0.5,
          pseudoRandom(index, 29) - 0.5,
          pseudoRandom(index, 31) - 0.5,
        )
        .normalize();
      rotation.setFromAxisAngle(rotationAxis, pseudoRandom(index, 37) * Math.PI * 2);
      const rockScale = lerp(
        BELT_MIN_ROCK_SCALE,
        BELT_MAX_ROCK_SCALE,
        pseudoRandom(index, 41) ** 2,
      );
      scale.set(
        rockScale,
        rockScale * lerp(0.6, 1.3, pseudoRandom(index, 43)),
        rockScale * lerp(0.6, 1.3, pseudoRandom(index, 47)),
      );

      matrix.compose(position, rotation, scale);
      this.mesh.setMatrixAt(index, matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }
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
