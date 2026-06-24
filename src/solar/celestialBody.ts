import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three';
import { createPlaceholderBodyMaterial, createSaturnRingMaterial } from './proceduralMaterials';
import type { CelestialBodyDefinition } from './solarSystemData';

const SPHERE_WIDTH_SEGMENTS = 40;
const SPHERE_HEIGHT_SEGMENTS = 24;
const ORBIT_SEGMENTS = 160;
const ORBIT_THICKNESS = 0.004;
const LABEL_TEXTURE_WIDTH = 256;
const LABEL_TEXTURE_HEIGHT = 96;
const LABEL_BASE_WIDTH = 0.36;
const LABEL_RADIUS_SCALE = 3.2;
const LABEL_VERTICAL_GAP = 0.11;
const LABEL_RENDER_ORDER = 70;
const HOVER_RING_SEGMENTS = 80;
const HOVER_RING_THICKNESS = 0.012;
const HOVER_RING_RENDER_ORDER = 62;
const ORBIT_IDLE_OPACITY = 0.18;
const ORBIT_HOVER_OPACITY = 0.36;
const ORBIT_ACTIVATED_OPACITY = 0.56;
const FOCUS_BACKGROUND_BODY_OPACITY = 0.18;
const FOCUS_BACKGROUND_RING_OPACITY_SCALE = 0.32;
const FOCUS_BACKGROUND_LABEL_OPACITY = 0.28;

export interface CelestialBodyRenderState {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

export type CelestialBodyInteractionVisualState =
  | 'idle'
  | 'hovered'
  | 'activated';

export class CelestialBody {
  readonly orbitPivot = new Group();
  readonly bodyAnchor = new Group();
  readonly satelliteRoot = new Group();

  private readonly spinGroup = new Group();
  private readonly tiltGroup = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private labelSprite: Sprite | null = null;
  private labelMaterial: SpriteMaterial | null = null;
  private bodyMaterial: MeshStandardMaterial | null = null;
  private planetRingMaterial: MeshBasicMaterial | null = null;
  private hoverRing: Mesh | null = null;
  private hoverRingMaterial: MeshBasicMaterial | null = null;
  private orbitMaterial: MeshBasicMaterial | null = null;
  private interactionVisualState: CelestialBodyInteractionVisualState = 'idle';
  private focusBackgroundDimmed = false;
  private orbitAngle: number;
  private orbitPaused = false;

  constructor(readonly definition: CelestialBodyDefinition) {
    this.orbitAngle = definition.orbitPhase;
    this.orbitPivot.name = `${definition.id}-orbit-pivot`;
    this.bodyAnchor.name = `${definition.id}-anchor`;
    this.tiltGroup.name = `${definition.id}-tilt`;
    this.spinGroup.name = `${definition.id}-spin`;
    this.satelliteRoot.name = `${definition.id}-satellites`;

    this.bodyAnchor.position.x = definition.orbitRadius;
    this.orbitPivot.rotation.z = this.orbitAngle;
    this.tiltGroup.rotation.z = definition.axialTilt;

    this.orbitPivot.add(this.bodyAnchor);
    this.bodyAnchor.add(this.tiltGroup);
    this.tiltGroup.add(this.spinGroup);
    this.bodyAnchor.add(this.satelliteRoot);
    this.addOrbitRing();
    this.addBodyMesh();
    this.addPlanetRing();
    this.addHoverRing();
    this.addLabel();
  }

  update(deltaSeconds: number): void {
    if (!this.orbitPaused) {
      this.orbitAngle += this.definition.orbitSpeed * deltaSeconds;
      this.orbitPivot.rotation.z = this.orbitAngle;
    }

    this.spinGroup.rotation.y += this.definition.rotationSpeed * deltaSeconds;
  }

  setOrbitPaused(paused: boolean): void {
    this.orbitPaused = paused;
  }

  setLabelVisible(visible: boolean): void {
    if (this.labelSprite) {
      this.labelSprite.visible = visible;
    }
  }

  getWorldPosition(target: Vector3): Vector3 {
    return this.bodyAnchor.getWorldPosition(target);
  }

  getMaxWorldScale(target: Vector3): number {
    this.bodyAnchor.getWorldScale(target);

    return Math.max(Math.abs(target.x), Math.abs(target.y), Math.abs(target.z));
  }

  setInteractionVisualState(
    state: CelestialBodyInteractionVisualState,
  ): void {
    this.interactionVisualState = state;
    const active = state !== 'idle';
    this.setLabelVisible(active);

    this.applyInteractionOpacity();
  }

  setFocusBackgroundDimmed(dimmed: boolean): void {
    this.focusBackgroundDimmed = dimmed;
    this.applyInteractionOpacity();
  }

  getBodyOpacity(): number | null {
    return this.bodyMaterial?.opacity ?? null;
  }

  getBodyRenderState(): CelestialBodyRenderState | null {
    if (!this.bodyMaterial) {
      return null;
    }

    return {
      opacity: this.bodyMaterial.opacity,
      transparent: this.bodyMaterial.transparent,
      depthWrite: this.bodyMaterial.depthWrite,
    };
  }

  private applyInteractionOpacity(): void {
    const state = this.interactionVisualState;
    const dimmed = this.focusBackgroundDimmed;

    if (this.bodyMaterial) {
      applyBodyMaterialTransparency(this.bodyMaterial, dimmed);
    }

    if (this.planetRingMaterial) {
      this.planetRingMaterial.opacity = dimmed
        ? this.definition.ring?.opacity ?? 0
        : this.definition.ring?.opacity ?? this.planetRingMaterial.opacity;
      if (dimmed) {
        this.planetRingMaterial.opacity *= FOCUS_BACKGROUND_RING_OPACITY_SCALE;
      }
    }

    if (this.hoverRing && this.hoverRingMaterial) {
      const active = state !== 'idle';
      this.hoverRing.visible = active;
      this.hoverRing.scale.setScalar(state === 'activated' ? 1.16 : 1);
      this.hoverRingMaterial.opacity =
        (state === 'activated' ? 0.82 : 0.52) *
        (dimmed ? FOCUS_BACKGROUND_RING_OPACITY_SCALE : 1);
    }

    if (this.orbitMaterial) {
      const baseOpacity =
        state === 'activated'
          ? ORBIT_ACTIVATED_OPACITY
          : state === 'hovered'
            ? ORBIT_HOVER_OPACITY
            : ORBIT_IDLE_OPACITY;
      this.orbitMaterial.opacity =
        baseOpacity * (dimmed ? FOCUS_BACKGROUND_RING_OPACITY_SCALE : 1);
    }

    if (this.labelMaterial) {
      this.labelMaterial.opacity = dimmed ? FOCUS_BACKGROUND_LABEL_OPACITY : 1;
    }
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
    const materialBundle = createPlaceholderBodyMaterial(this.definition);
    const mesh = new Mesh(geometry, materialBundle.material);
    mesh.name = `${this.definition.id}-placeholder-sphere`;
    this.spinGroup.add(mesh);
    this.bodyMaterial = materialBundle.material;
    this.geometries.push(geometry);
    this.materials.push(materialBundle.material);
    this.textures.push(...materialBundle.textures);
  }

  private addOrbitRing(): void {
    if (this.definition.orbitRadius <= 0) {
      return;
    }

    const geometry = new RingGeometry(
      Math.max(0.001, this.definition.orbitRadius - ORBIT_THICKNESS),
      this.definition.orbitRadius + ORBIT_THICKNESS,
      ORBIT_SEGMENTS,
    );
    const material = createSaturnRingMaterial('#9fb3c9', ORBIT_IDLE_OPACITY);
    material.side = DoubleSide;
    const ring = new Mesh(geometry, material);
    ring.name = `${this.definition.id}-orbit-ring`;
    ring.renderOrder = -1;
    this.orbitPivot.add(ring);
    this.orbitMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addPlanetRing(): void {
    if (!this.definition.ring) {
      return;
    }

    const geometry = new RingGeometry(
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
      ORBIT_SEGMENTS,
    );
    const material = createSaturnRingMaterial(
      this.definition.ring.color,
      this.definition.ring.opacity,
    );
    const ring = new Mesh(geometry, material);
    ring.name = `${this.definition.id}-saturn-ring`;
    ring.rotation.x = Math.PI * 0.38;
    this.bodyAnchor.add(ring);
    this.planetRingMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addHoverRing(): void {
    if (this.definition.id === 'sun') {
      return;
    }

    const outerRadius = Math.max(
      this.definition.radius * 1.88,
      this.definition.ring?.outerRadius
        ? this.definition.ring.outerRadius * 1.08
        : 0,
    );
    const geometry = new RingGeometry(
      Math.max(0.001, outerRadius - HOVER_RING_THICKNESS),
      outerRadius + HOVER_RING_THICKNESS,
      HOVER_RING_SEGMENTS,
    );
    const material = new MeshBasicMaterial({
      color: this.definition.markerColor,
      transparent: true,
      opacity: 0.52,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const ring = new Mesh(geometry, material);
    ring.name = `${this.definition.id}-hover-ring`;
    ring.renderOrder = HOVER_RING_RENDER_ORDER;
    ring.visible = false;
    this.bodyAnchor.add(ring);
    this.hoverRing = ring;
    this.hoverRingMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addLabel(): void {
    if (this.definition.id === 'sun') {
      return;
    }

    const texture = createLabelTexture(this.definition.label);
    const material = new SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const label = new Sprite(material);
    const labelWidth = Math.max(
      LABEL_BASE_WIDTH,
      this.definition.radius * LABEL_RADIUS_SCALE,
    );

    label.name = `${this.definition.id}-label`;
    label.position.set(
      0,
      this.definition.radius + LABEL_VERTICAL_GAP,
      0,
    );
    label.scale.set(
      labelWidth,
      labelWidth * (LABEL_TEXTURE_HEIGHT / LABEL_TEXTURE_WIDTH),
      1,
    );
    label.renderOrder = LABEL_RENDER_ORDER;
    label.visible = false;

    this.bodyAnchor.add(label);
    this.labelSprite = label;
    this.labelMaterial = material;
    this.materials.push(material);
    this.textures.push(texture);
  }
}

function applyBodyMaterialTransparency(
  material: MeshStandardMaterial,
  dimmed: boolean,
): void {
  const transparent = dimmed;
  const depthWrite = !dimmed;
  const opacity = dimmed ? FOCUS_BACKGROUND_BODY_OPACITY : 1;
  const renderModeChanged =
    material.transparent !== transparent || material.depthWrite !== depthWrite;

  material.transparent = transparent;
  material.depthWrite = depthWrite;
  material.opacity = opacity;

  if (renderModeChanged) {
    material.needsUpdate = true;
  }
}

function createLabelTexture(label: string): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_TEXTURE_WIDTH;
  canvas.height = LABEL_TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to create celestial label texture context.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(3, 9, 23, 0.68)';
  context.fillRect(14, 18, canvas.width - 28, canvas.height - 36);
  context.strokeStyle = 'rgba(255, 255, 255, 0.42)';
  context.lineWidth = 2;
  context.strokeRect(14, 18, canvas.width - 28, canvas.height - 36);
  context.fillStyle = '#ffffff';
  context.font =
    '600 34px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, canvas.height / 2 + 1);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}
