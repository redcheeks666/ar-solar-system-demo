import {
  AdditiveBlending,
  BackSide,
  Color,
  ShaderMaterial,
  SpriteMaterial,
} from 'three';
import { SOLAR_FX_TEXTURES, type TextureAsset } from './solarAssetManifest';
import type { CelestialBodyDefinition } from './solarSystemData';

export interface SolarVfxMaterialBundle {
  readonly plasmaMaterial: ShaderMaterial;
  readonly coronaMaterial: ShaderMaterial;
  readonly lensFlareMaterial: SpriteMaterial;
}

export function createSolarPlasmaMaterial(
  definition: CelestialBodyDefinition,
): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      opacity: { value: 1 },
      baseColor: { value: new Color(definition.baseColor) },
      hotColor: { value: new Color(definition.accentColor) },
      flareColor: { value: new Color(definition.markerColor) },
    },
    vertexShader: SOLAR_PLASMA_VERTEX_SHADER,
    fragmentShader: SOLAR_PLASMA_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
  });
}

export function createSolarCoronaMaterial(
  definition: CelestialBodyDefinition,
): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      opacity: { value: 0.64 },
      glowColor: { value: new Color(definition.markerColor) },
      hotColor: { value: new Color(definition.accentColor) },
    },
    vertexShader: SOLAR_CORONA_VERTEX_SHADER,
    fragmentShader: SOLAR_CORONA_FRAGMENT_SHADER,
    blending: AdditiveBlending,
    side: BackSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}

export function createSolarLensFlareMaterial(): SpriteMaterial {
  return new SpriteMaterial({
    color: '#ffd47c',
    opacity: 0.78,
    blending: AdditiveBlending,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}

export function getSolarLensFlareTextureAsset(): TextureAsset {
  return SOLAR_FX_TEXTURES.goldHorizontalLensFlare;
}

export function setSolarVfxTime(
  bundle: SolarVfxMaterialBundle,
  timeSeconds: number,
): void {
  bundle.plasmaMaterial.uniforms.time.value = timeSeconds;
  bundle.coronaMaterial.uniforms.time.value = timeSeconds;
}

export function setSolarVfxOpacity(
  bundle: SolarVfxMaterialBundle,
  opacity: number,
): void {
  bundle.plasmaMaterial.uniforms.opacity.value = opacity;
  bundle.coronaMaterial.uniforms.opacity.value = opacity * 0.64;
  bundle.lensFlareMaterial.opacity = opacity * 0.78;
}

const SOLAR_PLASMA_VERTEX_SHADER = `
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

const SOLAR_PLASMA_FRAGMENT_SHADER = `
  uniform float time;
  uniform float opacity;
  uniform vec3 baseColor;
  uniform vec3 hotColor;
  uniform vec3 flareColor;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

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
    vec2 flowA = vUv * vec2(5.0, 3.2) + vec2(time * 0.055, -time * 0.035);
    vec2 flowB = vUv * vec2(11.0, 6.0) + vec2(-time * 0.12, time * 0.08);
    float largeCells = fbm(flowA);
    float fineCells = fbm(flowB);
    float plasma = smoothstep(0.18, 0.95, largeCells * 0.72 + fineCells * 0.42);
    float filaments = pow(abs(sin((vUv.x + largeCells * 0.28 + time * 0.04) * 32.0)), 9.0);
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));

    vec3 color = mix(baseColor * 0.92, hotColor, plasma);
    color += flareColor * filaments * 0.48;
    color += flareColor * pow(rim, 1.8) * 0.55;
    color += hotColor * pow(plasma, 3.0) * 0.35;

    gl_FragColor = vec4(color, opacity);
  }
`;

const SOLAR_CORONA_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const SOLAR_CORONA_FRAGMENT_SHADER = `
  uniform float time;
  uniform float opacity;
  uniform vec3 glowColor;
  uniform vec3 hotColor;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));
    float pulse = 0.82 + 0.18 * sin(time * 1.7 + rim * 9.0);
    float alpha = smoothstep(0.14, 0.96, pow(rim, 1.45)) * opacity * pulse;
    vec3 color = mix(hotColor, glowColor, smoothstep(0.0, 1.0, rim));

    gl_FragColor = vec4(color, alpha);
  }
`;
