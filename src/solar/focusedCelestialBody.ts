import {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Texture,
  Vector3,
} from 'three';
import { CAMERA_FOV, CAMERA_Z } from '../rendering/scene';
import { clamp, inverseLerp, lerp } from '../utils/math';
import { createSaturnRingMaterial, createUnlitPlaceholderBodyMaterial } from './proceduralMaterials';
import type { CelestialBodyDefinition } from './solarSystemData';

export const FOCUS_BODY_WORLD_Z = 0.62;
export const FOCUS_BODY_MIN_SCREEN_HEIGHT_FRACTION = 0.5;
export const FOCUS_BODY_MAX_SCREEN_HEIGHT_FRACTION = 2 / 3;
export const FOCUS_INTRO_DURATION_SECONDS = 0.3;
export const FOCUS_RETURN_DURATION_SECONDS = 0.5;

const FOCUS_RENDER_ORDER = 96;
const SPHERE_WIDTH_SEGMENTS = 56;
const SPHERE_HEIGHT_SEGMENTS = 32;
const RING_SEGMENTS = 180;
const FOCUS_MIN_REFERENCE_RADIUS = 0.026;
const FOCUS_MAX_REFERENCE_RADIUS = 0.18;
const FOCUS_VIEWPORT_HEIGHT =
  2 *
  (CAMERA_Z - FOCUS_BODY_WORLD_Z) *
  Math.tan((CAMERA_FOV * Math.PI) / 360);

export class FocusedCelestialBody {
  readonly root = new Group();

  private readonly targetWorldScale: number;
  private readonly targetWorldPosition = new Vector3(0, 0, FOCUS_BODY_WORLD_Z);
  private readonly transitionSourceWorldPosition = new Vector3();
  private readonly spinGroup = new Group();
  private readonly tiltGroup = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private transitionKind: 'intro' | 'return' | null = null;
  private transitionElapsedSeconds = FOCUS_INTRO_DURATION_SECONDS;
  private transitionDurationSeconds = FOCUS_INTRO_DURATION_SECONDS;
  private transitionSourceWorldScale = 1;
  private transitionTargetWorldScale: number;
  private scaleMultiplier = 1;

  constructor(readonly definition: CelestialBodyDefinition) {
    this.targetWorldScale = getFocusedBodyWorldScale(definition);
    this.transitionTargetWorldScale = this.targetWorldScale;
    this.root.name = `focus-${definition.id}-root`;
    this.root.visible = false;

    this.tiltGroup.name = `focus-${definition.id}-tilt`;
    this.spinGroup.name = `focus-${definition.id}-spin`;
    this.tiltGroup.rotation.z = definition.axialTilt;
    this.root.add(this.tiltGroup);
    this.tiltGroup.add(this.spinGroup);

    this.addBodyMesh();
    this.addPlanetRing();
  }

  update(deltaSeconds: number, parent: Group): void {
    this.spinGroup.rotation.y += this.definition.rotationSpeed * deltaSeconds;

    if (!this.root.visible) {
      return;
    }

    if (this.transitionElapsedSeconds < this.transitionDurationSeconds) {
      this.transitionElapsedSeconds = Math.min(
        this.transitionDurationSeconds,
        this.transitionElapsedSeconds + deltaSeconds,
      );
    }

    this.applyScreenCenteredLayout(parent);
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
  }

  startIntroTransition(
    parent: Group,
    sourceWorldPosition: Vector3,
    sourceWorldScale: number,
  ): void {
    this.transitionKind = 'intro';
    this.transitionDurationSeconds = FOCUS_INTRO_DURATION_SECONDS;
    this.targetWorldPosition.set(0, 0, FOCUS_BODY_WORLD_Z);
    this.transitionTargetWorldScale = this.targetWorldScale;
    this.scaleMultiplier = 1;
    this.transitionSourceWorldPosition.copy(sourceWorldPosition);
    this.transitionSourceWorldScale = Math.max(sourceWorldScale, 0.0001);
    this.transitionElapsedSeconds = 0;
    this.root.visible = true;
    this.applyScreenCenteredLayout(parent);
  }

  startReturnTransition(
    parent: Group,
    targetWorldPosition: Vector3,
    targetWorldScale: number,
  ): void {
    this.transitionKind = 'return';
    this.transitionDurationSeconds = FOCUS_RETURN_DURATION_SECONDS;
    this.transitionSourceWorldPosition.copy(this.getWorldPosition(TEMP_CURRENT_WORLD_POSITION));
    this.transitionSourceWorldScale = Math.max(
      this.getMaxWorldScale(TEMP_CURRENT_WORLD_SCALE),
      0.0001,
    );
    this.targetWorldPosition.copy(targetWorldPosition);
    this.transitionTargetWorldScale = Math.max(targetWorldScale, 0.0001);
    this.transitionElapsedSeconds = 0;
    this.root.visible = true;
    this.applyScreenCenteredLayout(parent);
  }

  setWorldPlacement(
    parent: Group,
    worldPosition: Vector3,
    scaleMultiplier: number,
  ): void {
    this.transitionKind = null;
    this.transitionDurationSeconds = FOCUS_INTRO_DURATION_SECONDS;
    this.targetWorldPosition.copy(worldPosition);
    this.scaleMultiplier = clamp(scaleMultiplier, 0.3, 1.8);
    this.transitionTargetWorldScale = this.targetWorldScale * this.scaleMultiplier;
    this.transitionElapsedSeconds = this.transitionDurationSeconds;
    this.applyScreenCenteredLayout(parent);
  }

  isReturnTransitionComplete(): boolean {
    return (
      this.transitionKind === 'return' &&
      this.transitionElapsedSeconds >= this.transitionDurationSeconds
    );
  }

  isReturnTransitionActive(): boolean {
    return (
      this.transitionKind === 'return' &&
      this.transitionElapsedSeconds < this.transitionDurationSeconds
    );
  }

  applyScreenCenteredLayout(parent: Group): void {
    parent.updateMatrixWorld(true);
    parent.getWorldScale(TEMP_PARENT_SCALE);
    const parentScale = Math.max(
      Math.abs(TEMP_PARENT_SCALE.x),
      Math.abs(TEMP_PARENT_SCALE.y),
      Math.abs(TEMP_PARENT_SCALE.z),
      0.0001,
    );

    const introProgress =
      this.transitionElapsedSeconds >= this.transitionDurationSeconds
        ? 1
        : smoothstep(
            this.transitionElapsedSeconds / this.transitionDurationSeconds,
          );
    const targetWorldScale = lerp(
      this.transitionSourceWorldScale,
      this.transitionTargetWorldScale,
      introProgress,
    );

    TEMP_FOCUS_WORLD_POSITION
      .copy(this.transitionSourceWorldPosition)
      .lerp(this.targetWorldPosition, introProgress);
    parent.worldToLocal(TEMP_FOCUS_LOCAL_POSITION.copy(TEMP_FOCUS_WORLD_POSITION));
    parent.getWorldQuaternion(TEMP_PARENT_QUATERNION);

    this.root.position.copy(TEMP_FOCUS_LOCAL_POSITION);
    this.root.quaternion.copy(TEMP_PARENT_QUATERNION).invert();
    this.root.scale.setScalar(targetWorldScale / parentScale);
  }

  getWorldPosition(target: Vector3): Vector3 {
    return this.root.getWorldPosition(target);
  }

  getMaxWorldScale(target: Vector3): number {
    this.root.getWorldScale(target);

    return Math.max(Math.abs(target.x), Math.abs(target.y), Math.abs(target.z));
  }

  dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private addBodyMesh(): void {
    const geometry = new SphereGeometry(
      this.definition.radius,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const materialBundle = createUnlitPlaceholderBodyMaterial(this.definition, {
      includeRotationMarker: false,
    });
    materialBundle.material.transparent = true;
    materialBundle.material.opacity = 1;
    materialBundle.material.depthTest = false;
    materialBundle.material.depthWrite = false;

    const mesh = new Mesh(geometry, materialBundle.material);
    mesh.name = `focus-${this.definition.id}-placeholder-sphere`;
    mesh.renderOrder = FOCUS_RENDER_ORDER;
    this.spinGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(materialBundle.material);
    this.textures.push(...materialBundle.textures);
  }

  private addPlanetRing(): void {
    if (!this.definition.ring) {
      return;
    }

    const geometry = new RingGeometry(
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
      RING_SEGMENTS,
    );
    const material = createSaturnRingMaterial(
      this.definition.ring.color,
      Math.min(0.88, this.definition.ring.opacity + 0.18),
    );
    material.depthTest = false;
    material.depthWrite = false;

    const ring = new Mesh(geometry, material);
    ring.name = `focus-${this.definition.id}-saturn-ring`;
    ring.rotation.x = Math.PI * 0.38;
    ring.renderOrder = FOCUS_RENDER_ORDER + 1;
    this.root.add(ring);
    this.geometries.push(geometry);
    this.materials.push(material);
  }
}

export function getFocusedBodyScreenHeightFraction(
  definition: CelestialBodyDefinition,
): number {
  return lerp(
    FOCUS_BODY_MIN_SCREEN_HEIGHT_FRACTION,
    FOCUS_BODY_MAX_SCREEN_HEIGHT_FRACTION,
    inverseLerp(
      FOCUS_MIN_REFERENCE_RADIUS,
      FOCUS_MAX_REFERENCE_RADIUS,
      definition.radius,
    ),
  );
}

export function getFocusedBodyWorldScale(
  definition: CelestialBodyDefinition,
): number {
  const targetDiameter =
    FOCUS_VIEWPORT_HEIGHT * getFocusedBodyScreenHeightFraction(definition);

  return targetDiameter / Math.max(definition.radius * 2, 0.0001);
}

function smoothstep(value: number): number {
  const clamped = Math.min(Math.max(value, 0), 1);

  return clamped * clamped * (3 - 2 * clamped);
}

const TEMP_PARENT_SCALE = new Vector3();
const TEMP_PARENT_QUATERNION = new Quaternion();
const TEMP_FOCUS_WORLD_POSITION = new Vector3();
const TEMP_FOCUS_LOCAL_POSITION = new Vector3();
const TEMP_CURRENT_WORLD_POSITION = new Vector3();
const TEMP_CURRENT_WORLD_SCALE = new Vector3();
