import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Texture,
  Vector3,
} from 'three';
import { CAMERA_FOV, CAMERA_Z } from '../rendering/scene';
import { clamp, inverseLerp, lerp } from '../utils/math';
import {
  getFocusPlanetProfile,
  type FocusAtmosphereProfile,
  type FocusLuminanceTextureOverlayProfile,
  type FocusNightLightsOverlayProfile,
  type FocusPlanetProfile,
  type FocusProceduralOverlayProfile,
  type FocusRingProfile,
  type FocusShadowProfile,
} from './focusPlanetProfiles';
import { getTextureAssetPath } from './planetTextureMaterials';
import { createSaturnRingMaterial, createUnlitPlaceholderBodyMaterial } from './proceduralMaterials';
import type { TextureAsset } from './solarAssetManifest';
import type {
  CelestialBodyDefinition,
  InteractiveCelestialBodyId,
} from './solarSystemData';
import { loadTexture } from './textureAssets';

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
const FOCUS_LIGHT_DIRECTION = new Vector3(-0.82, 0.22, 0.35).normalize();
const FOCUS_VIEWPORT_HEIGHT =
  2 *
  (CAMERA_Z - FOCUS_BODY_WORLD_Z) *
  Math.tan((CAMERA_FOV * Math.PI) / 360);

interface FocusOverlaySpinGroup {
  readonly group: Group;
  readonly speedScale: number;
}

export class FocusedCelestialBody {
  readonly root = new Group();

  private readonly targetWorldScale: number;
  private readonly targetWorldPosition = new Vector3(0, 0, FOCUS_BODY_WORLD_Z);
  private readonly transitionSourceWorldPosition = new Vector3();
  private readonly spinGroup = new Group();
  private readonly tiltGroup = new Group();
  private readonly overlaySpinGroups: FocusOverlaySpinGroup[] = [];
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private transitionKind: 'intro' | 'return' | null = null;
  private transitionElapsedSeconds = FOCUS_INTRO_DURATION_SECONDS;
  private transitionDurationSeconds = FOCUS_INTRO_DURATION_SECONDS;
  private transitionSourceWorldScale = 1;
  private transitionTargetWorldScale: number;
  private scaleMultiplier = 1;
  private disposed = false;

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
    this.overlaySpinGroups.forEach(({ group, speedScale }) => {
      group.rotation.y +=
        this.definition.rotationSpeed *
        speedScale *
        deltaSeconds;
    });

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
    this.disposed = true;
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private addBodyMesh(): void {
    const profile = getFocusPlanetProfile(
      this.definition.id as InteractiveCelestialBodyId,
    );

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
    this.applyFocusAlbedoTexture(profile, materialBundle.material);
    this.addFocusProfileLayers(profile);
  }

  private applyFocusAlbedoTexture(
    profile: FocusPlanetProfile,
    material: MeshBasicMaterial,
  ): void {
    const texturePath = getTextureAssetPath(profile.albedo);
    if (!texturePath) {
      return;
    }

    this.applyLoadedTexture(texturePath, (texture) => {
      material.map = texture;
      material.needsUpdate = true;
    });
  }

  private addFocusProfileLayers(profile: FocusPlanetProfile): void {
    if (profile.shadow) {
      this.addFocusShadowLayer(profile.shadow);
    }

    profile.overlays.forEach((overlay) => {
      switch (overlay.kind) {
        case 'luminanceTexture':
          this.addLuminanceTextureOverlay(overlay);
          break;
        case 'nightLights':
          this.addNightLightsOverlay(overlay);
          break;
        case 'haze':
        case 'bands':
        case 'dust':
        case 'winds':
          this.addProceduralOverlay(overlay);
          break;
      }
    });

    if (profile.atmosphere) {
      this.addFocusAtmosphereLayer(profile.atmosphere);
    }
  }

  private addNightLightsOverlay(
    overlay: FocusNightLightsOverlayProfile,
  ): void {
    const geometry = new SphereGeometry(
      this.definition.radius * overlay.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      blending: AdditiveBlending,
      uniforms: {
        lightDirection: { value: FOCUS_LIGHT_DIRECTION },
        nightMap: { value: null },
        opacity: { value: overlay.opacity },
      },
      vertexShader: EARTH_LIGHTING_VERTEX_SHADER,
      fragmentShader: EARTH_NIGHT_LIGHT_FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-night-lights-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 3;
    mesh.visible = false;
    this.spinGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
    this.applyOverlayTexture(overlay.texture, (texture) => {
      material.uniforms.nightMap.value = texture;
      material.needsUpdate = true;
      mesh.visible = true;
    });
  }

  private addFocusShadowLayer(profile: FocusShadowProfile): void {
    const geometry = new SphereGeometry(
      this.definition.radius * profile.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        lightDirection: { value: FOCUS_LIGHT_DIRECTION },
        shadowColor: { value: new Color(profile.color) },
        opacity: { value: profile.opacity },
      },
      vertexShader: EARTH_LIGHTING_VERTEX_SHADER,
      fragmentShader: EARTH_SHADOW_FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name =
      this.definition.id === 'earth'
        ? 'focus-earth-terminator-shadow-shell'
        : `focus-${this.definition.id}-shadow-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 1;
    this.spinGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addLuminanceTextureOverlay(
    overlay: FocusLuminanceTextureOverlayProfile,
  ): void {
    const overlayGroup = this.addOverlaySpinGroup(overlay.id, overlay.speedScale);

    const geometry = new SphereGeometry(
      this.definition.radius * overlay.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        overlayMap: { value: null },
        lightDirection: { value: FOCUS_LIGHT_DIRECTION },
        colorA: { value: new Color(overlay.colorA) },
        colorB: { value: new Color(overlay.colorB) },
        opacity: { value: overlay.opacity },
        alphaLow: { value: overlay.alphaLow },
        alphaHigh: { value: overlay.alphaHigh },
      },
      vertexShader: EARTH_LIGHTING_VERTEX_SHADER,
      fragmentShader: EARTH_CLOUD_FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-${overlay.id}-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 2;
    mesh.visible = false;
    overlayGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
    this.applyOverlayTexture(overlay.texture, (texture) => {
      material.uniforms.overlayMap.value = texture;
      material.needsUpdate = true;
      mesh.visible = true;
    });
  }

  private addProceduralOverlay(
    overlay: FocusProceduralOverlayProfile,
  ): void {
    const overlayGroup = this.addOverlaySpinGroup(overlay.id, overlay.speedScale);
    const geometry = new SphereGeometry(
      this.definition.radius * overlay.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        overlayColor: { value: new Color(overlay.color) },
        opacity: { value: overlay.opacity },
        bandFrequency: { value: overlay.bandFrequency ?? 12 },
        bandStrength: { value: overlay.bandStrength ?? 0.18 },
        noiseStrength: { value: overlay.noiseStrength ?? 0.16 },
      },
      vertexShader: FOCUS_SHELL_VERTEX_SHADER,
      fragmentShader: FOCUS_PROCEDURAL_OVERLAY_FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-${overlay.id}-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 2;
    overlayGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addFocusAtmosphereLayer(profile: FocusAtmosphereProfile): void {
    const geometry = new SphereGeometry(
      this.definition.radius * profile.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        glowColor: { value: new Color(profile.color) },
        opacity: { value: profile.opacity },
        rimPower: { value: profile.rimPower },
      },
      vertexShader: EARTH_ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: EARTH_ATMOSPHERE_FRAGMENT_SHADER,
      blending: AdditiveBlending,
      side: BackSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-atmosphere-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 4;
    this.spinGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addOverlaySpinGroup(id: string, speedScale: number): Group {
    const group = new Group();
    group.name = `focus-${this.definition.id}-${id}-spin`;
    this.tiltGroup.add(group);
    this.overlaySpinGroups.push({ group, speedScale });

    return group;
  }

  private applyOverlayTexture(
    asset: TextureAsset,
    apply: (texture: Texture) => void,
  ): void {
    const texturePath = getTextureAssetPath(asset);
    if (!texturePath) {
      return;
    }

    this.applyLoadedTexture(texturePath, apply);
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

  private addPlanetRing(): void {
    if (!this.definition.ring) {
      return;
    }

    const profile = getFocusPlanetProfile(
      this.definition.id as InteractiveCelestialBodyId,
    );

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
    this.applyFocusRingTexture(profile.ring, material);
  }

  private applyFocusRingTexture(
    profile: FocusRingProfile | undefined,
    material: MeshBasicMaterial,
  ): void {
    if (!profile) {
      return;
    }

    const texturePaths = profile.textureCandidates
      .map((asset) => getTextureAssetPath(asset))
      .filter((path): path is string => Boolean(path));

    void this.loadFirstAvailableTexture(texturePaths).then((texture) => {
      if (!texture || this.disposed) {
        return;
      }

      this.textures.push(texture);
      material.map = texture;
      material.color.set(0xffffff);
      material.opacity = Math.min(1, material.opacity + profile.opacityBoost);
      material.transparent = true;
      material.depthWrite = false;
      material.needsUpdate = true;
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

const EARTH_LIGHTING_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vViewNormal;

  void main() {
    vUv = uv;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_SHADOW_FRAGMENT_SHADER = `
  uniform vec3 lightDirection;
  uniform vec3 shadowColor;
  uniform float opacity;
  varying vec3 vViewNormal;

  void main() {
    float lightAmount = dot(normalize(vViewNormal), normalize(lightDirection));
    float darkness = 1.0 - smoothstep(-0.18, 0.48, lightAmount);
    float alpha = darkness * opacity;
    gl_FragColor = vec4(shadowColor, alpha);
  }
`;

const EARTH_NIGHT_LIGHT_FRAGMENT_SHADER = `
  uniform sampler2D nightMap;
  uniform vec3 lightDirection;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vViewNormal;

  void main() {
    vec3 sampleColor = texture2D(nightMap, vUv).rgb;
    float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
    float lightAmount = dot(normalize(vViewNormal), normalize(lightDirection));
    float darkness = 1.0 - smoothstep(-0.2, 0.18, lightAmount);
    float cityBase = smoothstep(0.035, 0.24, luminance);
    float cityCore = smoothstep(0.18, 0.64, luminance);
    float alpha = (cityBase * 0.52 + cityCore * 0.48) * darkness * opacity;

    if (alpha < 0.01) {
      discard;
    }

    vec3 cityColor = mix(vec3(1.0, 0.48, 0.12), vec3(1.0, 0.86, 0.42), cityCore);
    cityColor *= 0.72 + cityCore * 0.88;
    gl_FragColor = vec4(cityColor, alpha);
  }
`;

const EARTH_CLOUD_FRAGMENT_SHADER = `
  uniform sampler2D overlayMap;
  uniform vec3 lightDirection;
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float opacity;
  uniform float alphaLow;
  uniform float alphaHigh;
  varying vec2 vUv;
  varying vec3 vViewNormal;

  void main() {
    vec3 sampleColor = texture2D(overlayMap, vUv).rgb;
    float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
    float lightAmount = dot(normalize(vViewNormal), normalize(lightDirection));
    float dayAmount = smoothstep(-0.14, 0.42, lightAmount);
    float alpha = smoothstep(alphaLow, alphaHigh, luminance) * mix(opacity * 0.28, opacity, dayAmount);

    if (alpha < 0.01) {
      discard;
    }

    vec3 dayCloud = mix(colorA, colorB, clamp(luminance * 1.55, 0.0, 1.0));
    vec3 nightCloud = colorA * 0.16;
    vec3 cloudColor = mix(nightCloud, dayCloud, dayAmount);
    gl_FragColor = vec4(cloudColor, alpha);
  }
`;

const FOCUS_SHELL_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const FOCUS_PROCEDURAL_OVERLAY_FRAGMENT_SHADER = `
  uniform vec3 overlayColor;
  uniform float opacity;
  uniform float bandFrequency;
  uniform float bandStrength;
  uniform float noiseStrength;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  float hash(vec2 value) {
    return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));
    float bands = 0.5 + 0.5 * sin(vUv.y * bandFrequency * 6.283185 + sin(vUv.x * 6.283185) * 0.85);
    float grain = hash(vUv * vec2(23.0, 41.0));
    float procedural = mix(1.0, bands, bandStrength);
    procedural *= 1.0 + (grain - 0.5) * noiseStrength;
    float alpha = opacity * (0.42 + rim * 0.58) * procedural;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(overlayColor, alpha);
  }
`;

const EARTH_ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const EARTH_ATMOSPHERE_FRAGMENT_SHADER = `
  uniform vec3 glowColor;
  uniform float opacity;
  uniform float rimPower;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));
    float alpha = smoothstep(0.28, 0.98, pow(rim, rimPower)) * opacity;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

const TEMP_PARENT_SCALE = new Vector3();
const TEMP_PARENT_QUATERNION = new Quaternion();
const TEMP_FOCUS_WORLD_POSITION = new Vector3();
const TEMP_FOCUS_LOCAL_POSITION = new Vector3();
const TEMP_CURRENT_WORLD_POSITION = new Vector3();
const TEMP_CURRENT_WORLD_SCALE = new Vector3();
