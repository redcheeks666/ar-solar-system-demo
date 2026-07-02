import {
  AdditiveBlending,
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
import {
  getOverviewPlanetAlbedoAsset,
  getSaturnRingTextureCandidates,
  getTextureAssetPath,
} from './planetTextureMaterials';
import { createPlaceholderBodyMaterial, createSaturnRingMaterial } from './proceduralMaterials';
import {
  createSolarCoronaMaterial,
  createSolarLensFlareMaterial,
  createSolarPlasmaMaterial,
  getSolarLensFlareTextureAsset,
  setSolarVfxOpacity,
  setSolarVfxTime,
  type SolarVfxMaterialBundle,
} from './solarVfxMaterials';
import { SOLAR_FX_TEXTURES } from './solarAssetManifest';
import type { CelestialBodyDefinition } from './solarSystemData';
import { loadTexture } from './textureAssets';

const SPHERE_WIDTH_SEGMENTS = 40;
const SPHERE_HEIGHT_SEGMENTS = 24;
const ORBIT_SEGMENTS = 160;
const ORBIT_THICKNESS = 0.0028;
const LABEL_TEXTURE_WIDTH = 256;
const LABEL_TEXTURE_HEIGHT = 96;
const LABEL_BASE_WIDTH = 0.36;
const LABEL_RADIUS_SCALE = 3.55;
const LABEL_VERTICAL_GAP = 0.12;
const LABEL_RENDER_ORDER = 70;
const HOVER_RING_SEGMENTS = 80;
const HOVER_RING_THICKNESS = 0.008;
const HOVER_RING_RENDER_ORDER = 62;
const TARGET_LOCK_RENDER_ORDER = 63;
const TARGET_LOCK_RADIUS_SCALE = 4.7;
const TARGET_LOCK_RING_MIN_SIZE = 0.26;
const ORBIT_IDLE_OPACITY = 0.08;
const ORBIT_HOVER_OPACITY = 0.48;
const ORBIT_ACTIVATED_OPACITY = 0.74;
const FOCUS_BACKGROUND_BODY_OPACITY = 0.18;
const FOCUS_BACKGROUND_RING_OPACITY_SCALE = 0.32;
const FOCUS_BACKGROUND_LABEL_OPACITY = 0.28;
const DEFAULT_OVERVIEW_TEXTURE_EMISSIVE_INTENSITY = 0.2;
const SUN_CORONA_RADIUS_SCALE = 1.42;
const SUN_LENS_FLARE_WIDTH_SCALE = 6.4;
const SUN_LENS_FLARE_HEIGHT_SCALE = 0.82;
const SUN_CORONA_RENDER_ORDER = 54;
const SUN_LENS_FLARE_RENDER_ORDER = 55;

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
  private targetLockSprite: Sprite | null = null;
  private targetLockMaterial: SpriteMaterial | null = null;
  private targetLockTextureLoaded = false;
  private orbitMaterial: MeshBasicMaterial | null = null;
  private solarVfxMaterials: SolarVfxMaterialBundle | null = null;
  private solarVfxElapsedSeconds = 0;
  private hudPulseElapsedSeconds = 0;
  private interactionVisualState: CelestialBodyInteractionVisualState = 'idle';
  private focusBackgroundDimmed = false;
  private orbitAngle: number;
  private orbitPaused = false;
  private disposed = false;

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
    if (this.solarVfxMaterials) {
      this.solarVfxElapsedSeconds += deltaSeconds;
      setSolarVfxTime(this.solarVfxMaterials, this.solarVfxElapsedSeconds);
    }
    this.updateHudPulse(deltaSeconds);
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

    if (this.solarVfxMaterials) {
      setSolarVfxOpacity(
        this.solarVfxMaterials,
        dimmed ? FOCUS_BACKGROUND_BODY_OPACITY : 1,
      );
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
      this.hoverRing.visible = active && !this.targetLockTextureLoaded;
      this.hoverRing.scale.setScalar(state === 'activated' ? 1.16 : 1);
      this.hoverRingMaterial.opacity =
        (state === 'activated' ? 0.74 : 0.42) *
        (dimmed ? FOCUS_BACKGROUND_RING_OPACITY_SCALE : 1);
    }

    this.applyTargetLockVisualState();

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

  private updateHudPulse(deltaSeconds: number): void {
    if (
      this.interactionVisualState === 'idle' ||
      !this.targetLockMaterial ||
      !this.targetLockSprite
    ) {
      return;
    }

    const dimScale = this.focusBackgroundDimmed
      ? FOCUS_BACKGROUND_RING_OPACITY_SCALE
      : 1;
    const pulse =
      this.interactionVisualState === 'activated'
        ? 1
        : 0.86 + Math.sin(this.hudPulseElapsedSeconds * 3.7) * 0.08;
    this.targetLockMaterial.opacity =
      getTargetLockOpacity(this.interactionVisualState) * dimScale * pulse;
    this.hudPulseElapsedSeconds += deltaSeconds;
  }

  dispose(): void {
    this.disposed = true;
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private addBodyMesh(): void {
    if (this.definition.id === 'sun') {
      this.addSolarVfxBody();
      return;
    }

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
    this.applyOverviewPlanetTexture(materialBundle.material);
  }

  private addSolarVfxBody(): void {
    const plasmaGeometry = new SphereGeometry(
      this.definition.radius,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const plasmaMaterial = createSolarPlasmaMaterial(this.definition);
    const plasmaCore = new Mesh(plasmaGeometry, plasmaMaterial);
    plasmaCore.name = `${this.definition.id}-plasma-core`;
    this.spinGroup.add(plasmaCore);

    const coronaGeometry = new SphereGeometry(
      this.definition.radius * SUN_CORONA_RADIUS_SCALE,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const coronaMaterial = createSolarCoronaMaterial(this.definition);
    const coronaShell = new Mesh(coronaGeometry, coronaMaterial);
    coronaShell.name = `${this.definition.id}-corona-shell`;
    coronaShell.renderOrder = SUN_CORONA_RENDER_ORDER;
    this.spinGroup.add(coronaShell);

    const lensFlareMaterial = createSolarLensFlareMaterial();
    const lensFlare = new Sprite(lensFlareMaterial);
    lensFlare.name = `${this.definition.id}-lens-flare-sprite`;
    lensFlare.renderOrder = SUN_LENS_FLARE_RENDER_ORDER;
    lensFlare.visible = false;
    lensFlare.scale.set(
      this.definition.radius * SUN_LENS_FLARE_WIDTH_SCALE,
      this.definition.radius * SUN_LENS_FLARE_HEIGHT_SCALE,
      1,
    );
    this.bodyAnchor.add(lensFlare);

    this.solarVfxMaterials = {
      plasmaMaterial,
      coronaMaterial,
      lensFlareMaterial,
    };
    this.geometries.push(plasmaGeometry, coronaGeometry);
    this.materials.push(plasmaMaterial, coronaMaterial, lensFlareMaterial);
    this.applySolarLensFlareTexture(lensFlareMaterial, lensFlare);
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
    ring.rotation.x = Math.PI * 0.08;
    this.bodyAnchor.add(ring);
    this.planetRingMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
    this.applySaturnRingTexture(material);
  }

  private applyOverviewPlanetTexture(material: MeshStandardMaterial): void {
    const texturePath = getTextureAssetPath(
      getOverviewPlanetAlbedoAsset(this.definition.id),
    );

    if (!texturePath) {
      return;
    }

    this.applyLoadedTexture(texturePath, (texture) => {
      material.map = texture;
      material.emissiveMap = texture;
      material.color.set(0xffffff);
      material.emissive.set(0xffffff);
      material.emissiveIntensity = getOverviewTextureEmissiveIntensity(
        this.definition.id,
      );
      material.needsUpdate = true;
    });
  }

  private applySaturnRingTexture(material: MeshBasicMaterial): void {
    const texturePaths = getSaturnRingTextureCandidates()
      .map((asset) => getTextureAssetPath(asset))
      .filter((path): path is string => Boolean(path));

    void this.loadFirstAvailableTexture(texturePaths).then((texture) => {
      if (!texture || this.disposed) {
        return;
      }

      this.textures.push(texture);
      material.map = texture;
      material.color.set(0xffffff);
      material.transparent = true;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  }

  private applySolarLensFlareTexture(
    material: SpriteMaterial,
    sprite: Sprite,
  ): void {
    const texturePath = getTextureAssetPath(getSolarLensFlareTextureAsset());
    if (!texturePath) {
      return;
    }

    this.applyLoadedTexture(texturePath, (texture) => {
      material.map = texture;
      material.needsUpdate = true;
      sprite.visible = true;
    });
  }

  private async loadFirstAvailableTexture(
    paths: readonly string[],
  ): Promise<Texture | null> {
    for (const path of paths) {
      if (this.disposed) {
        return null;
      }

      const texture = await loadTexture(path);
      if (texture) {
        return texture;
      }
    }

    return null;
  }

  private applyLoadedTexture(
    path: string,
    apply: (texture: Texture) => void,
  ): void {
    void loadTexture(path).then((texture) => {
      if (!texture || this.disposed) {
        return;
      }

      this.textures.push(texture);
      apply(texture);
    });
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
    this.addTargetLockSprite();
  }

  private addTargetLockSprite(): void {
    const material = new SpriteMaterial({
      color: '#e6fbff',
      opacity: 0,
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new Sprite(material);
    sprite.name = `${this.definition.id}-target-lock-hud`;
    sprite.renderOrder = TARGET_LOCK_RENDER_ORDER;
    sprite.visible = false;
    sprite.scale.setScalar(getTargetLockSize(this.definition));
    this.bodyAnchor.add(sprite);

    this.targetLockSprite = sprite;
    this.targetLockMaterial = material;
    this.materials.push(material);
    this.applyTargetLockTexture(material);
  }

  private applyTargetLockTexture(material: SpriteMaterial): void {
    const texturePath = getTextureAssetPath(SOLAR_FX_TEXTURES.targetLockRing);
    if (!texturePath) {
      return;
    }

    this.applyLoadedTexture(texturePath, (texture) => {
      material.map = texture;
      material.needsUpdate = true;
      this.targetLockTextureLoaded = true;
      this.applyInteractionOpacity();
    });
  }

  private applyTargetLockVisualState(): void {
    if (!this.targetLockSprite || !this.targetLockMaterial) {
      return;
    }

    const active = this.interactionVisualState !== 'idle';
    this.targetLockSprite.visible = active && this.targetLockTextureLoaded;
    this.targetLockSprite.scale.setScalar(
      getTargetLockSize(this.definition) *
        (this.interactionVisualState === 'activated' ? 1.18 : 1),
    );
    this.targetLockMaterial.opacity =
      getTargetLockOpacity(this.interactionVisualState) *
      (this.focusBackgroundDimmed ? FOCUS_BACKGROUND_RING_OPACITY_SCALE : 1);
    this.targetLockMaterial.color.set(
      this.interactionVisualState === 'activated' ? '#ffe6a2' : '#dffaff',
    );
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

function getOverviewTextureEmissiveIntensity(
  bodyId: CelestialBodyDefinition['id'],
): number {
  switch (bodyId) {
    case 'earth':
    case 'neptune':
      return 0.52;
    case 'uranus':
      return 0.48;
    case 'mercury':
    case 'mars':
    case 'moon':
    case 'venus':
      return 0.42;
    case 'jupiter':
    case 'saturn':
      return 0.36;
    case 'sun':
      return 0;
    default:
      return DEFAULT_OVERVIEW_TEXTURE_EMISSIVE_INTENSITY;
  }
}

function getTargetLockSize(definition: CelestialBodyDefinition): number {
  return Math.max(
    TARGET_LOCK_RING_MIN_SIZE,
    definition.ring?.outerRadius
      ? definition.ring.outerRadius * 2.35
      : definition.radius * TARGET_LOCK_RADIUS_SCALE,
  );
}

function getTargetLockOpacity(
  state: CelestialBodyInteractionVisualState,
): number {
  switch (state) {
    case 'activated':
      return 0.92;
    case 'hovered':
      return 0.62;
    case 'idle':
    default:
      return 0;
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
  context.fillStyle = 'rgba(2, 9, 22, 0.72)';
  context.fillRect(16, 18, canvas.width - 32, canvas.height - 36);
  context.fillStyle = 'rgba(45, 206, 255, 0.12)';
  context.fillRect(22, 24, canvas.width - 44, canvas.height - 48);

  context.strokeStyle = 'rgba(77, 229, 255, 0.74)';
  context.lineWidth = 2;
  context.strokeRect(16, 18, canvas.width - 32, canvas.height - 36);

  context.strokeStyle = 'rgba(255, 199, 94, 0.88)';
  context.lineWidth = 3;
  drawHudCorner(context, 16, 18, 24, 1, 1);
  drawHudCorner(context, canvas.width - 16, 18, 24, -1, 1);
  drawHudCorner(context, 16, canvas.height - 18, 24, 1, -1);
  drawHudCorner(context, canvas.width - 16, canvas.height - 18, 24, -1, -1);

  context.strokeStyle = 'rgba(77, 229, 255, 0.32)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(36, canvas.height - 28);
  context.lineTo(canvas.width - 36, canvas.height - 28);
  context.stroke();

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

function drawHudCorner(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  xDirection: 1 | -1,
  yDirection: 1 | -1,
): void {
  context.beginPath();
  context.moveTo(x, y + yDirection * size);
  context.lineTo(x, y);
  context.lineTo(x + xDirection * size, y);
  context.stroke();
}
