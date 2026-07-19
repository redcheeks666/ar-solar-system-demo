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
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  TorusGeometry,
  Vector3,
} from 'three';
import { BLOOM_RENDER_LAYER } from '../rendering/renderLayers';
import { getFocusPlanetProfile } from './focusPlanetProfiles';
import {
  getOverviewPlanetAlbedoAsset,
  getSaturnRingTextureCandidates,
  getTextureAssetPath,
} from './planetTextureMaterials';
import { createPlaceholderBodyMaterial, createSaturnRingMaterial } from './proceduralMaterials';
import { applyRadialRingTextureUvs } from './ringTextureMapping';
import {
  createAtmosphereRimMaterial,
  createOrbitTrailMaterial,
  createSolarCoronaMaterial,
  createSolarLensFlareMaterial,
  createSolarPlasmaMaterial,
  getSolarLensFlareTextureAsset,
  setSolarVfxFlareBoost,
  setSolarVfxOpacity,
  setSolarVfxTime,
  type SolarVfxMaterialBundle,
} from './solarVfxMaterials';
import { SOLAR_FX_TEXTURES } from './solarAssetManifest';
import {
  isInteractiveCelestialBodyId,
  type CelestialBodyDefinition,
} from './solarSystemData';
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
const ATMOSPHERE_RIM_RADIUS_SCALE = 1.055;
const ATMOSPHERE_RIM_RENDER_ORDER = 4;
const PROMINENCE_COLOR = '#ff9a4d';
const PROMINENCE_PEAK_OPACITY = 0.58;
const SOLAR_FLARE_RISE_SECONDS = 0.22;
const SOLAR_FLARE_DECAY_SECONDS = 1.35;
const SOLAR_FLARE_MIN_GAP_SECONDS = 9;
const SOLAR_FLARE_MAX_GAP_SECONDS = 20;
const SOLAR_FLARE_FIRST_DELAY_SECONDS = 6;
const RETURN_CAPTURE_FLARE_SECONDS = 0.5;
const ORBIT_CAPTURE_PULSE_SECONDS = 0.62;
const ORBIT_CAPTURE_PULSE_INTENSITY = 4.6;
const MIN_ORBIT_VELOCITY_SQUARED = 0.000001;

interface SolarProminenceConfig {
  readonly longitude: number;
  readonly planeTilt: number;
  readonly arcRadius: number;
  readonly tubeRadius: number;
  readonly arcSpan: number;
  readonly periodSeconds: number;
  readonly phaseOffset: number;
}

// Plasma loops rising from the sun's limb; staggered slow lifecycles so at
// most one or two are prominent at a time.
const SOLAR_PROMINENCE_CONFIGS: readonly SolarProminenceConfig[] = [
  {
    longitude: 0.6,
    planeTilt: 0.42,
    arcRadius: 0.21,
    tubeRadius: 0.016,
    arcSpan: 2.5,
    periodSeconds: 9.5,
    phaseOffset: 0,
  },
  {
    longitude: 2.7,
    planeTilt: -0.3,
    arcRadius: 0.16,
    tubeRadius: 0.013,
    arcSpan: 2.2,
    periodSeconds: 12.5,
    phaseOffset: 0.42,
  },
  {
    longitude: 4.6,
    planeTilt: 0.14,
    arcRadius: 0.26,
    tubeRadius: 0.014,
    arcSpan: 2.7,
    periodSeconds: 15,
    phaseOffset: 0.74,
  },
];

interface SolarProminence {
  readonly mesh: Mesh;
  readonly material: MeshBasicMaterial;
  readonly config: SolarProminenceConfig;
}

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
  private orbitMaterial: ShaderMaterial | null = null;
  private orbitRing: Mesh | null = null;
  private atmosphereRimMaterial: ShaderMaterial | null = null;
  private solarVfxMaterials: SolarVfxMaterialBundle | null = null;
  private lensFlareSprite: Sprite | null = null;
  private lensFlareBaseWidth = 0;
  private readonly prominences: SolarProminence[] = [];
  private flareLevel = 0;
  private flareElapsedSeconds = -1;
  private flareCooldownSeconds = SOLAR_FLARE_FIRST_DELAY_SECONDS;
  private returnCaptureFlareElapsedSeconds = -1;
  private orbitCapturePulseElapsedSeconds = -1;
  private solarVfxElapsedSeconds = 0;
  private hudPulseElapsedSeconds = 0;
  private interactionVisualState: CelestialBodyInteractionVisualState = 'idle';
  private focusBackgroundDimmed = false;
  private orbitAngle: number;
  private orbitPaused = false;
  private readonly previousWorldPosition = new Vector3();
  private readonly currentWorldPosition = new Vector3();
  private readonly orbitVelocity = new Vector3();
  private hasPreviousWorldPosition = false;
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
      this.updateSolarActivity(deltaSeconds);
    }
    this.captureOrbitVelocity(deltaSeconds);
    this.updateOrbitCapturePulse(deltaSeconds);
    this.updateHudPulse(deltaSeconds);
  }

  /** Flare pulse level (0 calm → 1 peak); non-sun bodies always report 0. */
  getFlareLevel(): number {
    return this.flareLevel;
  }

  private updateSolarActivity(deltaSeconds: number): void {
    const dimScale = this.focusBackgroundDimmed ? FOCUS_BACKGROUND_BODY_OPACITY : 1;

    this.prominences.forEach(({ mesh, material, config }) => {
      const cycle =
        (this.solarVfxElapsedSeconds / config.periodSeconds + config.phaseOffset) % 1;
      // Active for the first 55% of each cycle, dormant for the rest.
      const envelope =
        cycle < 0.55 ? Math.sin((cycle / 0.55) * Math.PI) : 0;

      material.opacity = envelope * PROMINENCE_PEAK_OPACITY * dimScale;
      mesh.visible = material.opacity > 0.01;
      mesh.scale.setScalar(0.55 + 0.45 * envelope);
    });

    if (this.flareElapsedSeconds < 0) {
      this.flareCooldownSeconds -= deltaSeconds;
      if (this.flareCooldownSeconds <= 0) {
        this.flareElapsedSeconds = 0;
      }
    } else {
      this.flareElapsedSeconds += deltaSeconds;
      const elapsed = this.flareElapsedSeconds;

      if (elapsed >= SOLAR_FLARE_RISE_SECONDS + SOLAR_FLARE_DECAY_SECONDS) {
        this.flareElapsedSeconds = -1;
        this.flareCooldownSeconds =
          SOLAR_FLARE_MIN_GAP_SECONDS +
          Math.random() *
            (SOLAR_FLARE_MAX_GAP_SECONDS - SOLAR_FLARE_MIN_GAP_SECONDS);
      }
    }

    const elapsed = this.flareElapsedSeconds;
    const rawLevel =
      elapsed < 0
        ? 0
        : elapsed < SOLAR_FLARE_RISE_SECONDS
          ? elapsed / SOLAR_FLARE_RISE_SECONDS
          : Math.max(
              0,
              1 - (elapsed - SOLAR_FLARE_RISE_SECONDS) / SOLAR_FLARE_DECAY_SECONDS,
            );
    let returnCaptureLevel = 0;
    if (this.returnCaptureFlareElapsedSeconds >= 0) {
      this.returnCaptureFlareElapsedSeconds += deltaSeconds;
      const captureProgress = Math.min(
        this.returnCaptureFlareElapsedSeconds / RETURN_CAPTURE_FLARE_SECONDS,
        1,
      );
      returnCaptureLevel = (1 - captureProgress) ** 2;
      if (captureProgress >= 1) {
        this.returnCaptureFlareElapsedSeconds = -1;
      }
    }

    this.flareLevel = Math.max(rawLevel * dimScale, returnCaptureLevel);

    if (this.solarVfxMaterials) {
      setSolarVfxFlareBoost(this.solarVfxMaterials, this.flareLevel);
    }

    if (this.lensFlareSprite) {
      this.lensFlareSprite.scale.x =
        this.lensFlareBaseWidth * (1 + 0.32 * this.flareLevel);
    }
  }

  setOrbitPaused(paused: boolean): void {
    this.orbitPaused = paused;
  }

  getOrbitVelocity(target: Vector3): Vector3 {
    return target.copy(this.orbitVelocity);
  }

  triggerOrbitCapturePulse(): void {
    if (this.orbitMaterial) {
      this.orbitCapturePulseElapsedSeconds = 0;
      this.orbitMaterial.uniforms.intensity.value = ORBIT_CAPTURE_PULSE_INTENSITY;
      this.orbitRing?.layers.enable(BLOOM_RENDER_LAYER);
    }
  }

  triggerReturnCaptureFlare(): void {
    if (this.solarVfxMaterials) {
      this.returnCaptureFlareElapsedSeconds = 0;
      this.flareLevel = Math.max(this.flareLevel, 1);
      setSolarVfxFlareBoost(this.solarVfxMaterials, this.flareLevel);
    }
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
      this.orbitMaterial.uniforms.opacity.value =
        baseOpacity * (dimmed ? FOCUS_BACKGROUND_RING_OPACITY_SCALE : 1);
    }

    if (this.atmosphereRimMaterial) {
      this.atmosphereRimMaterial.uniforms.opacity.value = dimmed
        ? FOCUS_BACKGROUND_BODY_OPACITY
        : 1;
    }

    if (this.labelMaterial) {
      this.labelMaterial.opacity = dimmed ? FOCUS_BACKGROUND_LABEL_OPACITY : 1;
    }
  }

  private captureOrbitVelocity(deltaSeconds: number): void {
    this.getWorldPosition(this.currentWorldPosition);

    if (this.hasPreviousWorldPosition && deltaSeconds > 0.000001) {
      TEMP_ORBIT_VELOCITY
        .copy(this.currentWorldPosition)
        .sub(this.previousWorldPosition)
        .divideScalar(deltaSeconds);
      if (TEMP_ORBIT_VELOCITY.lengthSq() > MIN_ORBIT_VELOCITY_SQUARED) {
        this.orbitVelocity.copy(TEMP_ORBIT_VELOCITY);
      }
    }

    this.previousWorldPosition.copy(this.currentWorldPosition);
    this.hasPreviousWorldPosition = true;
  }

  private updateOrbitCapturePulse(deltaSeconds: number): void {
    if (!this.orbitMaterial || this.orbitCapturePulseElapsedSeconds < 0) {
      return;
    }

    this.orbitCapturePulseElapsedSeconds += deltaSeconds;
    const progress = Math.min(
      this.orbitCapturePulseElapsedSeconds / ORBIT_CAPTURE_PULSE_SECONDS,
      1,
    );
    this.orbitMaterial.uniforms.intensity.value =
      1 + (ORBIT_CAPTURE_PULSE_INTENSITY - 1) * (1 - progress) ** 2;

    if (progress >= 1) {
      this.orbitCapturePulseElapsedSeconds = -1;
      this.orbitMaterial.uniforms.intensity.value = 1;
      this.orbitRing?.layers.disable(BLOOM_RENDER_LAYER);
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
    this.addAtmosphereRim();
  }

  private addAtmosphereRim(): void {
    if (!isInteractiveCelestialBodyId(this.definition.id)) {
      return;
    }

    const atmosphere = getFocusPlanetProfile(this.definition.id).atmosphere;

    if (!atmosphere) {
      return;
    }

    const geometry = new SphereGeometry(
      this.definition.radius * ATMOSPHERE_RIM_RADIUS_SCALE,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    // Focus-profile atmosphere colors/curves are re-used at overview scale
    // with a stronger intensity so the small spheres still get a visible rim.
    const material = createAtmosphereRimMaterial(
      atmosphere.color,
      Math.max(atmosphere.rimPower, 2.4),
      Math.min(atmosphere.opacity * 1.4, 0.6),
    );
    const shell = new Mesh(geometry, material);
    shell.name = `${this.definition.id}-atmosphere-rim`;
    shell.renderOrder = ATMOSPHERE_RIM_RENDER_ORDER;
    this.bodyAnchor.add(shell);
    this.atmosphereRimMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
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
    plasmaCore.layers.enable(BLOOM_RENDER_LAYER);
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
    coronaShell.layers.enable(BLOOM_RENDER_LAYER);
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
    this.lensFlareSprite = lensFlare;
    this.lensFlareBaseWidth = this.definition.radius * SUN_LENS_FLARE_WIDTH_SCALE;

    this.solarVfxMaterials = {
      plasmaMaterial,
      coronaMaterial,
      lensFlareMaterial,
    };
    this.geometries.push(plasmaGeometry, coronaGeometry);
    this.materials.push(plasmaMaterial, coronaMaterial, lensFlareMaterial);
    this.applySolarLensFlareTexture(lensFlareMaterial, lensFlare);
    this.addSolarProminences();
  }

  private addSolarProminences(): void {
    SOLAR_PROMINENCE_CONFIGS.forEach((config, index) => {
      const geometry = new TorusGeometry(
        config.arcRadius,
        config.tubeRadius,
        8,
        26,
        config.arcSpan,
      );
      const material = new MeshBasicMaterial({
        color: PROMINENCE_COLOR,
        blending: AdditiveBlending,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const arc = new Mesh(geometry, material);
      arc.name = `${this.definition.id}-prominence-${index}`;
      arc.layers.enable(BLOOM_RENDER_LAYER);
      // Center the arc span on the outward (+x) direction so the loop bulges
      // away from the limb instead of hiding inside the sphere.
      arc.rotation.z = -config.arcSpan / 2;
      arc.position.x = this.definition.radius * 0.94;
      arc.visible = false;

      const pivot = new Group();
      pivot.name = `${this.definition.id}-prominence-pivot-${index}`;
      pivot.rotation.z = config.longitude;
      pivot.rotation.x = config.planeTilt;
      pivot.add(arc);
      // Parented to the spin group so loops ride the rotating surface.
      this.spinGroup.add(pivot);

      this.prominences.push({ mesh: arc, material, config });
      this.geometries.push(geometry);
      this.materials.push(material);
    });
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
    const material = createOrbitTrailMaterial('#9fb3c9', this.definition.markerColor);
    material.uniforms.opacity.value = ORBIT_IDLE_OPACITY;
    const ring = new Mesh(geometry, material);
    ring.name = `${this.definition.id}-orbit-ring`;
    ring.renderOrder = -1;
    this.orbitPivot.add(ring);
    this.orbitMaterial = material;
    this.orbitRing = ring;
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
    applyRadialRingTextureUvs(
      geometry,
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
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

    const texture = createLabelTexture(this.definition.nameZh);
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
    '600 34px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
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

const TEMP_ORBIT_VELOCITY = new Vector3();
