import {
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  RingGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
  type Camera,
} from 'three';
import { clamp01, lerp } from '../utils/math';
import {
  CelestialBody,
  type CelestialBodyRenderState,
  type CelestialBodyInteractionVisualState,
} from './celestialBody';
import {
  type PreviewLayout,
  estimateWorldRadiusInStagePixels,
  mapWorldToStagePixel,
} from '../interaction/coordinateMapping';
import {
  CELESTIAL_BODY_DEFINITIONS,
  INTERACTIVE_CELESTIAL_BODY_DEFINITIONS,
  SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
  SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN,
  getCelestialBodyDefinition,
  getOriginalOrbitTransform,
  type CelestialBodyDefinition,
  type CelestialBodyId,
  type CelestialOriginalOrbitTransform,
  type InteractiveCelestialBodyId,
} from './solarSystemData';
import { FocusedCelestialBody } from './focusedCelestialBody';
import { getTextureAssetPath } from './planetTextureMaterials';
import { SOLAR_FX_TEXTURES, type TextureAsset } from './solarAssetManifest';
import { SolarParticleField } from './solarParticles';
import {
  SOLAR_SYSTEM_PREVIEW_TILT_X,
  SOLAR_SYSTEM_PREVIEW_TILT_Y,
} from './solarVisualConfig';
import { loadTexture } from './textureAssets';
import { UniverseRiftBackdrop } from './universeRiftBackdrop';

export interface CelestialBodyScreenTarget {
  id: InteractiveCelestialBodyId;
  label: string;
  screenPosition: {
    x: number;
    y: number;
  };
  visible: boolean;
  hitRadiusPx: number;
  originalOrbit: CelestialOriginalOrbitTransform;
}

export interface FocusedCelestialBodyScreenTarget {
  id: InteractiveCelestialBodyId;
  screenPosition: {
    x: number;
    y: number;
  };
  visible: boolean;
  bodyRadiusPx: number;
  hitRadiusPx: number;
  layout: PreviewLayout;
}

export interface SolarSystemTransform {
  position?: {
    x: number;
    y: number;
    z: number;
  };
  scale?: number;
}

const DEFAULT_SCALE = 1;
const MIN_OPEN_SCALE = 0.08;
const CONTROL_ENDPOINT_RING_INNER_RADIUS = 0.075;
const CONTROL_ENDPOINT_RING_OUTER_RADIUS = 0.11;
const CONTROL_ENDPOINT_DOT_RADIUS = 0.025;
const CONTROL_ENDPOINT_SEGMENTS = 40;
const CONTROL_ENDPOINT_Z_OFFSET = 0.035;
const CONTROL_ENDPOINT_RENDER_ORDER = 40;
const LEFT_ENDPOINT_COLOR = 0x7dd3fc;
const RIGHT_ENDPOINT_COLOR = 0xf6c177;
const MIN_BODY_HIT_RADIUS_PX = 44;
const SMALL_BODY_EXTRA_HIT_RADIUS_PX = 22;
const OPENING_VFX_RENDER_ORDER = 24;
const OPENING_VFX_RIFT_Z = 0.08;
const OPENING_ANCHOR_Z = CONTROL_ENDPOINT_Z_OFFSET + 0.012;
const OPENING_ANCHOR_GLOW_SIZE = 0.54;

type OpeningVfxSpriteName =
  | 'burstRift'
  | 'cyanShockwave'
  | 'blueGoldShockwave'
  | 'leftAnchorGlow'
  | 'rightAnchorGlow';

type ShockwaveSpriteName = Extract<
  OpeningVfxSpriteName,
  'burstRift' | 'cyanShockwave' | 'blueGoldShockwave'
>;

const SHOCKWAVE_SPRITE_NAMES: readonly ShockwaveSpriteName[] = [
  'burstRift',
  'cyanShockwave',
  'blueGoldShockwave',
];

interface ShockwaveBeat {
  readonly fadeIn: readonly [number, number];
  readonly fadeOut: readonly [number, number];
  readonly peakOpacity: number;
  readonly scaleX: readonly [number, number];
  readonly scaleY: readonly [number, number];
  readonly scaleRange: readonly [number, number];
  readonly zOffset: number;
  /** Closing beats counter the shrinking group scale so rings keep hand-span size. */
  readonly compensateScale: boolean;
}

const OPENING_SHOCKWAVE_BEATS: Readonly<
  Record<ShockwaveSpriteName, ShockwaveBeat>
> = {
  burstRift: {
    fadeIn: [0.62, 0.76],
    fadeOut: [0.84, 1],
    peakOpacity: 0.42,
    scaleX: [0.28, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.46],
    scaleY: [0.16, 0.54],
    scaleRange: [0.62, 1],
    zOffset: 0.014,
    compensateScale: false,
  },
  cyanShockwave: {
    fadeIn: [0.68, 0.8],
    fadeOut: [0.86, 1],
    peakOpacity: 0.34,
    scaleX: [0.24, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.38],
    scaleY: [0.24, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.38],
    scaleRange: [0.68, 1],
    zOffset: 0.018,
    compensateScale: false,
  },
  blueGoldShockwave: {
    fadeIn: [0.74, 0.86],
    fadeOut: [0.92, 1],
    peakOpacity: 0.3,
    scaleX: [0.22, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.44],
    scaleY: [0.22, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.44],
    scaleRange: [0.74, 1],
    zOffset: 0.02,
    compensateScale: false,
  },
};

// Closing gets its own implosion beats instead of replaying the opening
// shockwaves in reverse: a shrinking flash plus one inward ring.
const CLOSING_SHOCKWAVE_BEATS: Readonly<
  Record<ShockwaveSpriteName, ShockwaveBeat>
> = {
  burstRift: {
    fadeIn: [0.08, 0.18],
    fadeOut: [0.28, 0.42],
    peakOpacity: 0.5,
    scaleX: [0.22, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.5],
    scaleY: [0.14, 0.5],
    scaleRange: [0.05, 0.42],
    zOffset: 0.014,
    compensateScale: true,
  },
  cyanShockwave: {
    fadeIn: [0.12, 0.24],
    fadeOut: [0.4, 0.55],
    peakOpacity: 0.3,
    scaleX: [0.2, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.42],
    scaleY: [0.2, SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN * 0.42],
    scaleRange: [0.1, 0.55],
    zOffset: 0.018,
    compensateScale: true,
  },
  blueGoldShockwave: {
    fadeIn: [0, 0.5],
    fadeOut: [0.5, 1],
    peakOpacity: 0,
    scaleX: [1, 1],
    scaleY: [1, 1],
    scaleRange: [0, 1],
    zOffset: 0.02,
    compensateScale: false,
  },
};

interface OpeningVfxSprite {
  readonly sprite: Sprite;
  readonly material: SpriteMaterial;
}

export class CodePlaceholderSolarSystem {
  readonly group = new Group();

  private readonly bodies = new Map<CelestialBodyId, CelestialBody>();
  private readonly focusedBodies = new Map<InteractiveCelestialBodyId, FocusedCelestialBody>();
  private readonly controlEndpoints: Group[] = [];
  private readonly openingVfxGroup = new Group();
  private readonly openingVfxSprites = new Map<OpeningVfxSpriteName, OpeningVfxSprite>();
  private readonly openingVfxMaterials: Material[] = [];
  private readonly openingVfxTextures: Texture[] = [];
  private readonly riftBackdrop = new UniverseRiftBackdrop();
  private readonly particleField = new SolarParticleField(CELESTIAL_BODY_DEFINITIONS);
  private readonly endpointGeometries: BufferGeometry[] = [];
  private readonly endpointMaterials: Material[] = [];
  private readonly baseScale = new Vector3(DEFAULT_SCALE, DEFAULT_SCALE, DEFAULT_SCALE);
  private visibleRequested = false;
  private openingProgress = 0;
  private closingActive = false;
  private focusedBody: InteractiveCelestialBodyId | null = null;

  constructor() {
    this.group.name = 'code-placeholder-solar-system';
    this.group.visible = false;
    this.group.rotation.set(
      SOLAR_SYSTEM_PREVIEW_TILT_X,
      SOLAR_SYSTEM_PREVIEW_TILT_Y,
      0,
    );
    this.addLights();
    this.group.add(this.riftBackdrop.root);
    this.createBodies();
    this.addControlEndpoints();
    this.addOpeningVfx();
    this.group.add(this.particleField.root);
    this.addFocusViewBodies();
    this.applyVisibility();
  }

  update(deltaSeconds: number): void {
    if (!this.group.visible) {
      return;
    }

    this.bodies.forEach((body) => body.update(deltaSeconds));
    this.riftBackdrop.update(deltaSeconds);
    this.particleField.update(deltaSeconds);
    if (this.focusedBody) {
      this.focusedBodies.get(this.focusedBody)?.update(deltaSeconds, this.group);
    }
  }

  getPerformanceSnapshot(): {
    vfxFrameUploadMs: number | null;
    vfxFrameUploadCount: number;
  } {
    return this.riftBackdrop.getPerformanceSnapshot();
  }

  setVisible(visible: boolean): void {
    this.visibleRequested = visible;
    this.applyVisibility();
  }

  setOpeningProgress(progress: number): void {
    this.openingProgress = clamp01(progress);
    this.applyVisibility();
  }

  setClosingActive(active: boolean): void {
    if (this.closingActive === active) {
      return;
    }

    this.closingActive = active;
    this.applyVisibility();
  }

  setTransform(transform: SolarSystemTransform): void {
    if (transform.position) {
      this.group.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z,
      );
    }

    if (transform.scale !== undefined) {
      this.baseScale.setScalar(transform.scale);
      this.applyVisibility();
    }

    this.updateFocusedBodyLayout();
  }

  getInteractiveBodyDefinitions(): readonly CelestialBodyDefinition[] {
    return INTERACTIVE_CELESTIAL_BODY_DEFINITIONS;
  }

  getBodyDefinition(id: CelestialBodyId): CelestialBodyDefinition {
    return getCelestialBodyDefinition(id);
  }

  getBodyOriginalOrbitTransform(
    id: InteractiveCelestialBodyId,
  ): CelestialOriginalOrbitTransform {
    return getOriginalOrbitTransform(id);
  }

  setBodyLabelVisible(id: InteractiveCelestialBodyId, visible: boolean): void {
    this.getBodyById(id).setLabelVisible(visible);
  }

  getBodyWorldPosition(
    id: InteractiveCelestialBodyId,
    target: Vector3,
  ): Vector3 {
    return this.getBodyById(id).getWorldPosition(target);
  }

  getBodyRenderOpacity(id: CelestialBodyId): number | null {
    return this.getBodyById(id).getBodyOpacity();
  }

  getBodyRenderState(id: CelestialBodyId): CelestialBodyRenderState | null {
    return this.getBodyById(id).getBodyRenderState();
  }

  getInteractiveBodyScreenTargets(
    camera: Camera,
    layout: PreviewLayout,
  ): CelestialBodyScreenTarget[] {
    return INTERACTIVE_CELESTIAL_BODY_DEFINITIONS.flatMap((definition) => {
      const body = this.getBodyById(definition.id as InteractiveCelestialBodyId);
      const targetId = getOverviewActivationTargetId(
        definition.id as InteractiveCelestialBodyId,
      );
      const worldPosition = body.getWorldPosition(TEMP_WORLD_POSITION);
      const projected = mapWorldToStagePixel(worldPosition, layout, camera);

      if (!projected) {
        return [];
      }

      const worldScale = body.getMaxWorldScale(TEMP_WORLD_SCALE);
      const projectedRadius =
        estimateWorldRadiusInStagePixels(
          worldPosition,
          definition.activationHitRadius * worldScale,
          layout,
          camera,
        ) ?? 0;
      const smallBodyPadding =
        definition.id === 'mercury' || definition.id === 'moon'
          ? SMALL_BODY_EXTRA_HIT_RADIUS_PX
          : 0;

      return [
        {
          id: targetId,
          label: definition.id === 'moon' ? 'Earth-Moon' : definition.label,
          screenPosition: {
            x: projected.x,
            y: projected.y,
          },
          visible: projected.visible,
          hitRadiusPx:
            Math.max(MIN_BODY_HIT_RADIUS_PX, projectedRadius) +
            smallBodyPadding,
          originalOrbit: getOriginalOrbitTransform(
            targetId,
          ),
        },
      ];
    });
  }

  getFocusedBodyScreenTarget(
    id: InteractiveCelestialBodyId,
    camera: Camera,
    layout: PreviewLayout,
  ): FocusedCelestialBodyScreenTarget | null {
    const focusedBody = this.focusedBodies.get(id);

    if (!focusedBody || !focusedBody.root.visible) {
      return null;
    }

    const definition = getCelestialBodyDefinition(id);
    const worldPosition = focusedBody.getWorldPosition(TEMP_FOCUS_WORLD_POSITION);
    const projected = mapWorldToStagePixel(worldPosition, layout, camera);

    if (!projected) {
      return null;
    }

    const worldScale = focusedBody.getMaxWorldScale(TEMP_FOCUS_WORLD_SCALE);
    const bodyRadiusPx =
      estimateWorldRadiusInStagePixels(
        worldPosition,
        definition.radius * worldScale,
        layout,
        camera,
      ) ?? MIN_BODY_HIT_RADIUS_PX;

    return {
      id,
      screenPosition: {
        x: projected.x,
        y: projected.y,
      },
      visible: projected.visible,
      bodyRadiusPx,
      hitRadiusPx: Math.max(bodyRadiusPx + 36, MIN_BODY_HIT_RADIUS_PX * 1.4),
      layout,
    };
  }

  setFocusedBodyPlacement(input: {
    focusedBody: InteractiveCelestialBodyId;
    worldPosition: {
      x: number;
      y: number;
      z: number;
    };
    scaleMultiplier: number;
  }): void {
    const focusedBody = this.focusedBodies.get(input.focusedBody);

    if (!focusedBody || focusedBody.isReturnTransitionActive()) {
      return;
    }

    focusedBody.setWorldPlacement(
      this.group,
      TEMP_FOCUS_CONTROL_POSITION.set(
        input.worldPosition.x,
        input.worldPosition.y,
        input.worldPosition.z,
      ),
      input.scaleMultiplier,
    );
  }

  startFocusedBodyReturn(input: {
    focusedBody: InteractiveCelestialBodyId;
  }): boolean {
    const focusedBody = this.focusedBodies.get(input.focusedBody);

    if (!focusedBody?.root.visible) {
      return false;
    }

    const sourceBody = this.getBodyById(input.focusedBody);
    const sourceWorldPosition = sourceBody.getWorldPosition(
      TEMP_FOCUS_RETURN_POSITION,
    );
    const sourceWorldScale = sourceBody.getMaxWorldScale(TEMP_FOCUS_RETURN_SCALE);
    focusedBody.startReturnTransition(
      this.group,
      sourceWorldPosition,
      sourceWorldScale,
    );

    return true;
  }

  isFocusedBodyReturnComplete(
    focusedBody: InteractiveCelestialBodyId | null,
  ): boolean {
    if (!focusedBody) {
      return false;
    }

    return (
      this.focusedBodies.get(focusedBody)?.isReturnTransitionComplete() ?? false
    );
  }

  applyBodyInteractionState(input: {
    hoveredBody: InteractiveCelestialBodyId | null;
    activatedBody: InteractiveCelestialBodyId | null;
    focusedBody?: InteractiveCelestialBodyId | null;
  }): void {
    let nextFocusedBody = input.focusedBody ?? null;
    if (
      !nextFocusedBody &&
      this.focusedBody &&
      this.focusedBodies.get(this.focusedBody)?.isReturnTransitionActive()
    ) {
      nextFocusedBody = this.focusedBody;
    }
    const focusEntered =
      nextFocusedBody !== null && nextFocusedBody !== this.focusedBody;
    this.focusedBody = nextFocusedBody;
    const focusActive = Boolean(this.focusedBody);
    this.controlEndpoints.forEach((endpoint) => {
      endpoint.visible = !focusActive;
    });
    this.focusedBodies.forEach((body, id) => {
      body.setVisible(this.focusedBody === id);
    });
    if (focusEntered && this.focusedBody) {
      this.startFocusedBodyIntro(this.focusedBody);
    } else {
      this.updateFocusedBodyLayout();
    }
    this.bodies.forEach((body) => body.setFocusBackgroundDimmed(focusActive));
    this.applyRiftBackdropState();
    this.applyParticleState();

    INTERACTIVE_CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = this.getBodyById(definition.id as InteractiveCelestialBodyId);
      const state = getBodyVisualState(definition.id as InteractiveCelestialBodyId, input);
      body.setInteractionVisualState(state);
      body.setOrbitPaused(
        shouldPauseBodyOrbit(
          definition.id as InteractiveCelestialBodyId,
          input.activatedBody,
        ),
      );
    });
  }

  dispose(): void {
    this.bodies.forEach((body) => body.dispose());
    this.bodies.clear();
    this.focusedBodies.forEach((body) => body.dispose());
    this.focusedBodies.clear();
    this.endpointGeometries.forEach((geometry) => geometry.dispose());
    this.endpointMaterials.forEach((material) => material.dispose());
    this.openingVfxMaterials.forEach((material) => material.dispose());
    this.openingVfxTextures.forEach((texture) => texture.dispose());
    this.riftBackdrop.dispose();
    this.particleField.dispose();
    this.endpointGeometries.length = 0;
    this.endpointMaterials.length = 0;
    this.openingVfxMaterials.length = 0;
    this.openingVfxTextures.length = 0;
  }

  private addLights(): void {
    const ambient = new AmbientLight(0xcad7ff, 0.92);
    const sunLight = new PointLight(0xffd48a, 7.2, 12, 1.4);
    ambient.name = 'placeholder-solar-ambient-light';
    sunLight.name = 'placeholder-solar-sun-light';
    sunLight.position.set(0, 0, 1.2);
    this.group.add(ambient, sunLight);
  }

  private createBodies(): void {
    CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = new CelestialBody(definition);
      this.bodies.set(definition.id, body);
    });

    CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = this.getBodyById(definition.id);

      if (definition.parentId) {
        const parent = this.bodies.get(definition.parentId);
        parent?.satelliteRoot.add(body.orbitPivot);
        return;
      }

      this.group.add(body.orbitPivot);
    });
  }

  private addControlEndpoints(): void {
    this.group.add(
      this.createControlEndpoint(
        'visual-left-control-endpoint',
        -SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
        LEFT_ENDPOINT_COLOR,
      ),
      this.createControlEndpoint(
        'visual-right-control-endpoint',
        SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
        RIGHT_ENDPOINT_COLOR,
      ),
    );
  }

  private addOpeningVfx(): void {
    this.openingVfxGroup.name = 'solar-opening-vfx';
    this.openingVfxGroup.visible = false;
    this.group.add(this.openingVfxGroup);

    // The tearing crack itself now lives in the rift backdrop shader (aperture
    // animation); sprites only cover punctual radial bursts and hand anchors.
    this.addOpeningVfxSprite(
      'burstRift',
      'solar-opening-burst-rift',
      SOLAR_FX_TEXTURES.burstRift,
      '#ffe4a0',
    );
    this.addOpeningVfxSprite(
      'cyanShockwave',
      'solar-opening-cyan-shockwave-ring',
      SOLAR_FX_TEXTURES.cyanShockwaveRing,
      '#c8fbff',
    );
    this.addOpeningVfxSprite(
      'blueGoldShockwave',
      'solar-opening-blue-gold-shockwave-ring',
      SOLAR_FX_TEXTURES.blueGoldShockwaveRing,
      '#fff7d6',
    );
    this.addOpeningVfxSprite(
      'leftAnchorGlow',
      'solar-opening-left-hand-blue-anchor-glow',
      SOLAR_FX_TEXTURES.leftHandBlueAnchorGlow,
      '#a8ecff',
    );
    this.addOpeningVfxSprite(
      'rightAnchorGlow',
      'solar-opening-right-hand-gold-anchor-glow',
      SOLAR_FX_TEXTURES.rightHandGoldAnchorGlow,
      '#ffe2a8',
    );
  }

  private addOpeningVfxSprite(
    key: OpeningVfxSpriteName,
    name: string,
    textureAsset: TextureAsset,
    color: string,
  ): void {
    const material = new SpriteMaterial({
      color,
      opacity: 0,
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new Sprite(material);
    sprite.name = name;
    sprite.renderOrder = OPENING_VFX_RENDER_ORDER;
    sprite.visible = false;
    this.openingVfxGroup.add(sprite);
    this.openingVfxSprites.set(key, { sprite, material });
    this.openingVfxMaterials.push(material);
    this.loadOpeningVfxTexture(textureAsset, material);
  }

  private loadOpeningVfxTexture(
    textureAsset: TextureAsset,
    material: SpriteMaterial,
  ): void {
    const texturePath = getTextureAssetPath(textureAsset);
    if (!texturePath) {
      return;
    }

    void loadTexture(texturePath).then((texture) => {
      if (!texture) {
        return;
      }

      this.openingVfxTextures.push(texture);
      material.map = texture;
      material.needsUpdate = true;
    });
  }

  private createControlEndpoint(
    name: string,
    x: number,
    color: number,
  ): Group {
    const endpoint = new Group();
    endpoint.name = name;
    endpoint.position.set(x, 0, CONTROL_ENDPOINT_Z_OFFSET);

    const ringGeometry = new RingGeometry(
      CONTROL_ENDPOINT_RING_INNER_RADIUS,
      CONTROL_ENDPOINT_RING_OUTER_RADIUS,
      CONTROL_ENDPOINT_SEGMENTS,
    );
    const ringMaterial = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    ring.name = `${name}-ring`;
    ring.renderOrder = CONTROL_ENDPOINT_RENDER_ORDER;

    const dotGeometry = new SphereGeometry(
      CONTROL_ENDPOINT_DOT_RADIUS,
      18,
      12,
    );
    const dotMaterial = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    });
    const dot = new Mesh(dotGeometry, dotMaterial);
    dot.name = `${name}-dot`;
    dot.renderOrder = CONTROL_ENDPOINT_RENDER_ORDER + 1;

    endpoint.add(ring, dot);
    this.controlEndpoints.push(endpoint);
    this.endpointGeometries.push(ringGeometry, dotGeometry);
    this.endpointMaterials.push(ringMaterial, dotMaterial);

    return endpoint;
  }

  private addFocusViewBodies(): void {
    INTERACTIVE_CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = new FocusedCelestialBody(definition);
      this.focusedBodies.set(definition.id as InteractiveCelestialBodyId, body);
      this.group.add(body.root);
    });
  }

  private getBodyById(id: CelestialBodyId): CelestialBody {
    const body = this.bodies.get(id);

    if (!body) {
      throw new Error(`Missing placeholder body for ${id}.`);
    }

    return body;
  }

  private applyVisibility(): void {
    const easedProgress = this.openingProgress * this.openingProgress;
    const openScale = MIN_OPEN_SCALE + (1 - MIN_OPEN_SCALE) * easedProgress;
    this.group.scale.copy(this.baseScale).multiplyScalar(openScale);
    this.group.visible = this.visibleRequested && this.openingProgress > 0.001;
    this.applyOpeningVfx();
    this.applyRiftBackdropState();
    this.applyParticleState();
    this.updateFocusedBodyLayout();
  }

  private applyRiftBackdropState(): void {
    this.riftBackdrop.setState({
      visibleRequested: this.visibleRequested,
      openingProgress: this.openingProgress,
      focusDimmed: Boolean(this.focusedBody),
      closingActive: this.closingActive,
      scaleCompensation: getOpeningVfxScaleCompensation(
        this.openingProgress,
        0.28,
      ),
    });
  }

  private applyParticleState(): void {
    this.particleField.setState({
      visibleRequested: this.visibleRequested,
      openingProgress: this.openingProgress,
      focusDimmed: Boolean(this.focusedBody),
    });
  }

  private applyOpeningVfx(): void {
    const progress = this.openingProgress;
    const visible = this.visibleRequested && progress > 0;
    this.openingVfxGroup.visible = visible;

    if (!visible) {
      this.openingVfxSprites.forEach(({ sprite, material }) => {
        sprite.visible = false;
        material.opacity = 0;
      });
      return;
    }

    const riftScaleCompensation = getOpeningVfxScaleCompensation(progress, 0.28);
    const anchorScaleCompensation = getOpeningVfxScaleCompensation(progress, 0.32);
    const beats = this.closingActive
      ? CLOSING_SHOCKWAVE_BEATS
      : OPENING_SHOCKWAVE_BEATS;

    SHOCKWAVE_SPRITE_NAMES.forEach((key) => {
      const beat = beats[key];
      const compensation = beat.compensateScale ? riftScaleCompensation : 1;
      const scaleProgress = smoothProgressRange(
        progress,
        beat.scaleRange[0],
        beat.scaleRange[1],
      );

      this.applyOpeningVfxSprite(key, {
        opacity:
          smoothProgressRange(progress, beat.fadeIn[0], beat.fadeIn[1]) *
          (1 - smoothProgressRange(progress, beat.fadeOut[0], beat.fadeOut[1])) *
          beat.peakOpacity,
        scaleX: lerp(beat.scaleX[0], beat.scaleX[1], scaleProgress) * compensation,
        scaleY: lerp(beat.scaleY[0], beat.scaleY[1], scaleProgress) * compensation,
        z: OPENING_VFX_RIFT_Z + beat.zOffset,
      });
    });
    this.applyOpeningAnchorVfx(
      'leftAnchorGlow',
      -SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
      anchorScaleCompensation,
    );
    this.applyOpeningAnchorVfx(
      'rightAnchorGlow',
      SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
      anchorScaleCompensation,
    );
  }

  private applyOpeningVfxSprite(
    key: OpeningVfxSpriteName,
    state: {
      opacity: number;
      scaleX: number;
      scaleY: number;
      z: number;
    },
  ): void {
    const entry = this.openingVfxSprites.get(key);
    if (!entry) {
      return;
    }

    const opacity = clamp01(state.opacity);
    entry.sprite.visible = opacity > 0.01;
    entry.sprite.position.set(0, 0, state.z);
    entry.sprite.scale.set(state.scaleX, state.scaleY, 1);
    entry.material.opacity = opacity;
  }

  private applyOpeningAnchorVfx(
    key: OpeningVfxSpriteName,
    localX: number,
    scaleCompensation: number,
  ): void {
    const progress = this.openingProgress;
    const opacity =
      smoothProgressRange(progress, 0.01, 0.12) *
      (1 - smoothProgressRange(progress, 0.94, 1));
    const size =
      OPENING_ANCHOR_GLOW_SIZE *
      lerp(0.84, 1.24, smoothProgressRange(progress, 0.01, 0.72)) *
      scaleCompensation;
    const entry = this.openingVfxSprites.get(key);
    if (!entry) {
      return;
    }

    entry.sprite.visible = opacity > 0.01;
    entry.sprite.position.set(localX, 0, OPENING_ANCHOR_Z);
    entry.sprite.scale.set(size, size, 1);
    entry.material.opacity = clamp01(opacity);
  }

  private updateFocusedBodyLayout(): void {
    if (!this.focusedBody) {
      return;
    }

    this.focusedBodies.get(this.focusedBody)?.applyScreenCenteredLayout(this.group);
  }

  private startFocusedBodyIntro(id: InteractiveCelestialBodyId): void {
    const sourceBody = this.getBodyById(id);
    const sourceWorldPosition = sourceBody.getWorldPosition(TEMP_FOCUS_SOURCE_POSITION);
    const sourceWorldScale = sourceBody.getMaxWorldScale(TEMP_FOCUS_SOURCE_SCALE);

    this.focusedBodies
      .get(id)
      ?.startIntroTransition(this.group, sourceWorldPosition, sourceWorldScale);
  }
}

const TEMP_WORLD_POSITION = new Vector3();
const TEMP_WORLD_SCALE = new Vector3();
const TEMP_FOCUS_SOURCE_POSITION = new Vector3();
const TEMP_FOCUS_SOURCE_SCALE = new Vector3();
const TEMP_FOCUS_WORLD_POSITION = new Vector3();
const TEMP_FOCUS_WORLD_SCALE = new Vector3();
const TEMP_FOCUS_CONTROL_POSITION = new Vector3();
const TEMP_FOCUS_RETURN_POSITION = new Vector3();
const TEMP_FOCUS_RETURN_SCALE = new Vector3();

function getBodyVisualState(
  id: InteractiveCelestialBodyId,
  input: {
    hoveredBody: InteractiveCelestialBodyId | null;
    activatedBody: InteractiveCelestialBodyId | null;
  },
): CelestialBodyInteractionVisualState {
  if (input.activatedBody === id || isEarthMoonPeer(id, input.activatedBody)) {
    return 'activated';
  }

  if (input.hoveredBody === id || isEarthMoonPeer(id, input.hoveredBody)) {
    return 'hovered';
  }

  return 'idle';
}

function getOverviewActivationTargetId(
  id: InteractiveCelestialBodyId,
): InteractiveCelestialBodyId {
  return id === 'moon' ? 'earth' : id;
}

function isEarthMoonPeer(
  id: InteractiveCelestialBodyId,
  target: InteractiveCelestialBodyId | null,
): boolean {
  return (
    (id === 'moon' && target === 'earth') ||
    (id === 'earth' && target === 'moon')
  );
}

function shouldPauseBodyOrbit(
  id: InteractiveCelestialBodyId,
  activatedBody: InteractiveCelestialBodyId | null,
): boolean {
  if (!activatedBody) {
    return false;
  }

  if (activatedBody === id) {
    return true;
  }

  return activatedBody === 'moon' && id === 'earth';
}

function smoothProgressRange(
  progress: number,
  start: number,
  end: number,
): number {
  const normalized = clamp01((progress - start) / Math.max(end - start, 0.0001));

  return normalized * normalized * (3 - 2 * normalized);
}

function getOpeningVfxScaleCompensation(
  progress: number,
  minimumScale: number,
): number {
  const easedProgress = progress * progress;
  const openingScale = MIN_OPEN_SCALE + (1 - MIN_OPEN_SCALE) * easedProgress;

  return 1 / Math.max(openingScale, minimumScale);
}
