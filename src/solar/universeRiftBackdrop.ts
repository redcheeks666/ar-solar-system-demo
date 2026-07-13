import {
  CanvasTexture,
  Color,
  DoubleSide,
  Euler,
  Group,
  Mesh,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
} from 'three';
import { BACKGROUND_RENDER_LAYER } from '../rendering/renderLayers';
import { clamp01, lerp } from '../utils/math';
import { RiftEdgeSparks } from './riftEdgeSparks';
import {
  FOCUS_DIM_EASE_SECONDS,
  RIFT_APERTURE_HORIZONTAL_PROGRESS_END,
  RIFT_APERTURE_HORIZONTAL_PROGRESS_START,
  RIFT_APERTURE_HORIZONTAL_START,
  RIFT_APERTURE_VERTICAL_PROGRESS_END,
  RIFT_APERTURE_VERTICAL_PROGRESS_START,
  RIFT_APERTURE_VERTICAL_START,
  RIFT_EDGE_BREATHE_SPEED,
  RIFT_EDGE_FEATHER,
  RIFT_EDGE_GLOW_CYAN,
  RIFT_EDGE_GLOW_GOLD,
  RIFT_EDGE_GLOW_INTENSITY,
  RIFT_EDGE_GLOW_WIDTH,
  RIFT_EDGE_NOISE_AMPLITUDE,
  RIFT_EDGE_NOISE_SCALE,
  RIFT_EDGE_NOISE_SPEED,
  RIFT_EDGE_OPENING_GLOW_BOOST,
  RIFT_EDGE_OPENING_WOBBLE_BOOST,
  RIFT_REVEAL_PROGRESS_END,
  RIFT_REVEAL_PROGRESS_START,
  SOLAR_SYSTEM_PREVIEW_TILT_X,
  SOLAR_SYSTEM_PREVIEW_TILT_Y,
  UNIVERSE_RIFT_BACKGROUND_OPACITY,
  UNIVERSE_RIFT_WIDTH,
} from './solarVisualConfig';

const TEXTURE_WIDTH = 1920;
const TEXTURE_HEIGHT = 1080;
const RIFT_VISIBLE_BOUNDS_WIDTH = 1687;
const RIFT_VISIBLE_BOUNDS_HEIGHT = 322;
const BACKDROP_RENDER_ORDER = -20;
const FOCUS_DIM_OPACITY_SCALE = 0.22;
const BACKDROP_LOCAL_Z = -0.16;
const RIFT_CANVAS_ASPECT_RATIO = TEXTURE_HEIGHT / TEXTURE_WIDTH;
const RIFT_PLANE_WIDTH =
  UNIVERSE_RIFT_WIDTH * (TEXTURE_WIDTH / RIFT_VISIBLE_BOUNDS_WIDTH);
const RIFT_PLANE_HEIGHT = RIFT_PLANE_WIDTH * RIFT_CANVAS_ASPECT_RATIO;
const BACKDROP_ELLIPSE_RADIUS_X =
  RIFT_VISIBLE_BOUNDS_WIDTH * 0.43;
const BACKDROP_ELLIPSE_RADIUS_Y =
  RIFT_VISIBLE_BOUNDS_HEIGHT * 0.36;
// Both radii expressed as fractions of the plane width so shader distances
// stay isotropic in world units around the whole rim.
const ELLIPSE_RADIUS_U = BACKDROP_ELLIPSE_RADIUS_X / TEXTURE_WIDTH;
const ELLIPSE_RADIUS_V = BACKDROP_ELLIPSE_RADIUS_Y / TEXTURE_WIDTH;
const DEFAULT_SOLAR_TILT_INVERSE = new Quaternion()
  .setFromEuler(
    new Euler(
      SOLAR_SYSTEM_PREVIEW_TILT_X,
      SOLAR_SYSTEM_PREVIEW_TILT_Y,
      0,
    ),
  )
  .invert();

interface RiftState {
  readonly visibleRequested: boolean;
  readonly openingProgress: number;
  readonly focusDimmed: boolean;
  readonly closingActive: boolean;
  readonly scaleCompensation: number;
}

interface RiftPerformanceSnapshot {
  readonly vfxFrameUploadMs: number | null;
  readonly vfxFrameUploadCount: number;
}

export class UniverseRiftBackdrop {
  readonly root = new Group();

  private readonly backgroundTexture: CanvasTexture;
  private readonly backgroundGeometry = new PlaneGeometry(
    RIFT_PLANE_WIDTH,
    RIFT_PLANE_HEIGHT,
  );
  private readonly backgroundMaterial: ShaderMaterial;
  private readonly edgeSparks = new RiftEdgeSparks(
    ELLIPSE_RADIUS_U * RIFT_PLANE_WIDTH,
    ELLIPSE_RADIUS_V * RIFT_PLANE_WIDTH,
  );
  private readonly geometries: PlaneGeometry[] = [];
  private readonly materials: ShaderMaterial[] = [];
  private elapsedSeconds = 0;
  private reveal = 0;
  private dimTarget = 1;
  private dimCurrent = 1;

  constructor() {
    this.root.name = 'universe-rift-backdrop';
    this.root.visible = false;

    this.backgroundTexture = createRiftBackgroundTexture();
    this.backgroundMaterial = createRiftEdgeMaterial(this.backgroundTexture);
    const backdrop = new Mesh(this.backgroundGeometry, this.backgroundMaterial);
    backdrop.name = 'universe-rift-elliptical-starfield';
    backdrop.position.z = BACKDROP_LOCAL_Z;
    // Keep the generated sky glued to the AE frame rather than the old 3D disk pitch.
    backdrop.quaternion.copy(DEFAULT_SOLAR_TILT_INVERSE);
    backdrop.layers.set(BACKGROUND_RENDER_LAYER);
    backdrop.renderOrder = BACKDROP_RENDER_ORDER;
    this.root.add(backdrop);
    // Sparks live on the same tilted plane as the rim they spawn from.
    this.edgeSparks.root.quaternion.copy(DEFAULT_SOLAR_TILT_INVERSE);
    this.edgeSparks.root.position.z = BACKDROP_LOCAL_Z + 0.012;
    this.root.add(this.edgeSparks.root);
    this.geometries.push(this.backgroundGeometry);
    this.materials.push(this.backgroundMaterial);
  }

  update(deltaSeconds = 0): void {
    this.elapsedSeconds += deltaSeconds;
    this.backgroundMaterial.uniforms.time.value = this.elapsedSeconds;

    const blend = 1 - Math.exp(-deltaSeconds / FOCUS_DIM_EASE_SECONDS);
    this.dimCurrent += (this.dimTarget - this.dimCurrent) * blend;
    this.applyOpacity();

    this.edgeSparks.update(
      deltaSeconds,
      this.backgroundMaterial.uniforms.aperture.value as Vector2,
      this.backgroundMaterial.uniforms.openingEnergy.value as number,
      this.reveal * this.dimCurrent,
    );
  }

  setState(state: RiftState): void {
    this.reveal =
      state.visibleRequested && state.openingProgress > 0.01
        ? smoothProgressRange(
            state.openingProgress,
            RIFT_REVEAL_PROGRESS_START,
            RIFT_REVEAL_PROGRESS_END,
          )
        : 0;
    this.dimTarget = state.focusDimmed ? FOCUS_DIM_OPACITY_SCALE : 1;
    if (this.reveal <= 0) {
      // Fresh open must not inherit a half-eased dim from the previous session.
      this.dimCurrent = this.dimTarget;
    }
    this.applyOpacity();

    // The shader ellipse is the crack itself: it tears open from a thin seam
    // into the full ellipse as the hands pull, and collapses back on closing.
    const aperture = this.backgroundMaterial.uniforms.aperture.value as Vector2;
    aperture.set(
      lerp(
        RIFT_APERTURE_HORIZONTAL_START,
        1,
        smoothProgressRange(
          state.openingProgress,
          RIFT_APERTURE_HORIZONTAL_PROGRESS_START,
          RIFT_APERTURE_HORIZONTAL_PROGRESS_END,
        ),
      ),
      lerp(
        RIFT_APERTURE_VERTICAL_START,
        1,
        smoothProgressRange(
          state.openingProgress,
          RIFT_APERTURE_VERTICAL_PROGRESS_START,
          RIFT_APERTURE_VERTICAL_PROGRESS_END,
        ),
      ),
    );

    // Counter the group's opening scale the same way the opening sprites do, so
    // the seam reads at hand-span size early on. The factor is exactly 1 once
    // fully open, keeping the rim aligned with the control endpoints.
    this.root.scale.setScalar(state.scaleCompensation);

    // Edge stays hot and turbulent while the hands are still tearing it open or
    // collapsing it shut, and settles into a calm breathing rim once revealed.
    const openingEnergy =
      1 - smoothProgressRange(state.openingProgress, 0.72, 0.98);
    this.backgroundMaterial.uniforms.openingEnergy.value = state.closingActive
      ? 1
      : openingEnergy;
  }

  private applyOpacity(): void {
    const opacityScale = this.reveal * this.dimCurrent;
    this.root.visible = opacityScale > 0.005;
    this.backgroundMaterial.uniforms.opacity.value = opacityScale;
  }

  dispose(): void {
    this.backgroundTexture.dispose();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.edgeSparks.dispose();
  }

  getPerformanceSnapshot(): RiftPerformanceSnapshot {
    return {
      vfxFrameUploadMs: null,
      vfxFrameUploadCount: 0,
    };
  }
}

function createRiftEdgeMaterial(texture: CanvasTexture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: texture },
      time: { value: 0 },
      opacity: { value: 0 },
      openingEnergy: { value: 1 },
      aperture: { value: new Vector2(1, 1) },
      ellipseRadii: { value: new Vector2(ELLIPSE_RADIUS_U, ELLIPSE_RADIUS_V) },
      planeAspect: { value: RIFT_CANVAS_ASPECT_RATIO },
      edgeFeather: { value: RIFT_EDGE_FEATHER },
      noiseAmplitude: { value: RIFT_EDGE_NOISE_AMPLITUDE },
      noiseScale: { value: RIFT_EDGE_NOISE_SCALE },
      noiseSpeed: { value: RIFT_EDGE_NOISE_SPEED },
      glowWidth: { value: RIFT_EDGE_GLOW_WIDTH },
      glowIntensity: { value: RIFT_EDGE_GLOW_INTENSITY },
      glowCyan: { value: new Color(RIFT_EDGE_GLOW_CYAN) },
      glowGold: { value: new Color(RIFT_EDGE_GLOW_GOLD) },
      breatheSpeed: { value: RIFT_EDGE_BREATHE_SPEED },
      openingGlowBoost: { value: RIFT_EDGE_OPENING_GLOW_BOOST },
      openingWobbleBoost: { value: RIFT_EDGE_OPENING_WOBBLE_BOOST },
    },
    vertexShader: RIFT_EDGE_VERTEX_SHADER,
    fragmentShader: RIFT_EDGE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: DoubleSide,
  });
}

const RIFT_EDGE_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIFT_EDGE_FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform float time;
  uniform float opacity;
  uniform float openingEnergy;
  uniform vec2 aperture;
  uniform vec2 ellipseRadii;
  uniform float planeAspect;
  uniform float edgeFeather;
  uniform float noiseAmplitude;
  uniform float noiseScale;
  uniform float noiseSpeed;
  uniform float glowWidth;
  uniform float glowIntensity;
  uniform vec3 glowCyan;
  uniform vec3 glowGold;
  uniform float breatheSpeed;
  uniform float openingGlowBoost;
  uniform float openingWobbleBoost;
  varying vec2 vUv;

  float hash(vec2 value) {
    return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 value) {
    vec2 integerPart = floor(value);
    vec2 fractionPart = fract(value);
    vec2 curve = fractionPart * fractionPart * (3.0 - 2.0 * fractionPart);

    float a = hash(integerPart);
    float b = hash(integerPart + vec2(1.0, 0.0));
    float c = hash(integerPart + vec2(0.0, 1.0));
    float d = hash(integerPart + vec2(1.0, 1.0));

    return mix(mix(a, b, curve.x), mix(c, d, curve.x), curve.y);
  }

  float fbm(vec2 value) {
    float total = 0.0;
    float amplitude = 0.5;
    mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);

    for (int i = 0; i < 5; i++) {
      total += noise(value) * amplitude;
      value = rotate * value * 2.03 + 7.13;
      amplitude *= 0.5;
    }

    return total;
  }

  void main() {
    // Work in plane-width units so band thickness is uniform around the rim.
    vec2 centered = vec2(vUv.x - 0.5, (vUv.y - 0.5) * planeAspect);
    vec2 radii = ellipseRadii * aperture;
    vec2 normalized = centered / radii;
    float radial = length(normalized);
    vec2 rimDirection = radial > 0.0001 ? normalized / radial : vec2(1.0, 0.0);
    float gradientLength = length(rimDirection / radii);
    float signedDistance = (radial - 1.0) / max(gradientLength, 0.0001);

    // Damp the wobble while the aperture is still a thin seam so the crack
    // stays a coherent line instead of noise soup.
    float seamDamp = mix(0.3, 1.0, aperture.y);
    float wobbleAmp = noiseAmplitude * seamDamp
      * (1.0 + openingWobbleBoost * openingEnergy);
    vec2 flow = rimDirection * noiseScale
      + vec2(time * noiseSpeed, -time * noiseSpeed * 0.6);
    float ripple = (fbm(flow) - 0.48) * 2.0;
    float d = signedDistance - ripple * wobbleAmp;

    float interior = 1.0 - smoothstep(-edgeFeather, 0.0, d);
    vec4 starfield = texture2D(map, vUv);

    float band = exp(-abs(d) / glowWidth);
    float shimmer = fbm(rimDirection * noiseScale * 2.6
      + vec2(-time * noiseSpeed * 2.2, time * noiseSpeed * 1.5));
    float pulse = 0.78 + 0.22 * sin(time * breatheSpeed + shimmer * 6.28318);
    float rim = band * glowIntensity * pulse * (0.55 + 0.75 * shimmer)
      * (1.0 + openingGlowBoost * openingEnergy);

    float colorDrift = fbm(rimDirection * 1.9 + vec2(time * 0.05, -time * 0.04));
    vec3 rimColor = mix(glowCyan, glowGold, smoothstep(0.25, 0.75, colorDrift));
    rimColor += vec3(1.0) * pow(band, 3.0) * 0.55;

    vec3 color = starfield.rgb * interior + rimColor * rim;
    float alpha = clamp(starfield.a * interior + rim * 0.85, 0.0, 1.0) * opacity;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

function createRiftBackgroundTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to create universe rift texture context.');
  }

  // No hard elliptical clip here anymore: the shader owns the boundary with a
  // feathered, noise-perturbed edge, so the texture paints the full frame and
  // keeps valid content slightly beyond the nominal ellipse for the wobble.
  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  context.fillStyle = `rgba(2, 4, 12, ${UNIVERSE_RIFT_BACKGROUND_OPACITY})`;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  drawNebulaGlow(context);
  drawStarField(context, 1200);
  drawMilkyDust(context);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function drawNebulaGlow(context: CanvasRenderingContext2D): void {
  const blueGlow = context.createRadialGradient(
    TEXTURE_WIDTH * 0.42,
    TEXTURE_HEIGHT * 0.47,
    10,
    TEXTURE_WIDTH * 0.44,
    TEXTURE_HEIGHT * 0.47,
    TEXTURE_WIDTH * 0.42,
  );
  blueGlow.addColorStop(0, 'rgba(76, 128, 190, 0.3)');
  blueGlow.addColorStop(0.42, 'rgba(31, 70, 122, 0.16)');
  blueGlow.addColorStop(1, 'rgba(3, 5, 15, 0)');
  context.fillStyle = blueGlow;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  const warmGlow = context.createRadialGradient(
    TEXTURE_WIDTH * 0.54,
    TEXTURE_HEIGHT * 0.51,
    4,
    TEXTURE_WIDTH * 0.54,
    TEXTURE_HEIGHT * 0.51,
    TEXTURE_WIDTH * 0.28,
  );
  warmGlow.addColorStop(0, 'rgba(227, 112, 45, 0.22)');
  warmGlow.addColorStop(0.48, 'rgba(95, 37, 28, 0.1)');
  warmGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = warmGlow;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
}

function drawStarField(
  context: CanvasRenderingContext2D,
  count: number,
): void {
  for (let index = 0; index < count; index += 1) {
    const x = pseudoRandom(index, 3) * TEXTURE_WIDTH;
    const y = pseudoRandom(index, 7) * TEXTURE_HEIGHT;
    const dx = (x - TEXTURE_WIDTH / 2) / (TEXTURE_WIDTH * 0.47);
    const dy = (y - TEXTURE_HEIGHT / 2) / (TEXTURE_HEIGHT * 0.46);

    if (dx * dx + dy * dy > 1) {
      continue;
    }

    const brightness = pseudoRandom(index, 13);
    const radius = lerp(0.45, 1.7, brightness * brightness);
    const alpha = lerp(0.12, 0.74, brightness);
    context.fillStyle =
      brightness > 0.84
        ? `rgba(190, 230, 255, ${alpha})`
        : `rgba(238, 244, 255, ${alpha * 0.72})`;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawMilkyDust(context: CanvasRenderingContext2D): void {
  context.save();
  context.globalCompositeOperation = 'lighter';
  for (let index = 0; index < 44; index += 1) {
    const t = index / 43;
    const x = lerp(TEXTURE_WIDTH * 0.14, TEXTURE_WIDTH * 0.88, t);
    const y =
      TEXTURE_HEIGHT * 0.49 +
      Math.sin(t * Math.PI * 2.15 + 0.8) * TEXTURE_HEIGHT * 0.045 +
      lerp(-18, 18, pseudoRandom(index, 31));
    const width = lerp(14, 48, pseudoRandom(index, 47));
    const height = lerp(5, 20, pseudoRandom(index, 61));

    context.fillStyle = `rgba(85, 134, 190, ${lerp(0.035, 0.11, pseudoRandom(index, 73))})`;
    context.beginPath();
    context.ellipse(
      x,
      y,
      width,
      height,
      lerp(-0.22, 0.16, pseudoRandom(index, 83)),
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
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
