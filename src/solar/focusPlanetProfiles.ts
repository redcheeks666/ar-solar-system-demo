import {
  NASA_EARTH_TEXTURES,
  NASA_PLANET_TEXTURES,
  NASA_RING_TEXTURES,
  SOLAR_FX_TEXTURES,
  type AvailableTextureAsset,
  type TextureAsset,
} from './solarAssetManifest';
import type { InteractiveCelestialBodyId } from './solarSystemData';

export interface FocusAtmosphereProfile {
  readonly color: string;
  readonly opacity: number;
  readonly radiusScale: number;
  readonly rimPower: number;
}

export interface FocusShadowProfile {
  readonly color: string;
  readonly opacity: number;
  readonly radiusScale: number;
}

export interface FocusLuminanceTextureOverlayProfile {
  readonly id: string;
  readonly kind: 'luminanceTexture';
  readonly texture: TextureAsset;
  readonly colorA: string;
  readonly colorB: string;
  readonly radiusScale: number;
  readonly opacity: number;
  readonly alphaLow: number;
  readonly alphaHigh: number;
  readonly speedScale: number;
}

export interface FocusNightLightsOverlayProfile {
  readonly id: string;
  readonly kind: 'nightLights';
  readonly texture: TextureAsset;
  readonly radiusScale: number;
  readonly opacity: number;
}

export interface FocusProceduralOverlayProfile {
  readonly id: string;
  readonly kind: 'haze' | 'bands' | 'dust' | 'winds';
  readonly color: string;
  readonly radiusScale: number;
  readonly opacity: number;
  readonly speedScale: number;
  readonly bandFrequency?: number;
  readonly bandStrength?: number;
  readonly noiseStrength?: number;
}

export type FocusOverlayProfile =
  | FocusLuminanceTextureOverlayProfile
  | FocusNightLightsOverlayProfile
  | FocusProceduralOverlayProfile;

export interface FocusRingProfile {
  readonly textureCandidates: readonly AvailableTextureAsset[];
  readonly opacityBoost: number;
}

export interface FocusPlanetProfile {
  readonly albedo: TextureAsset | null;
  readonly overlays: readonly FocusOverlayProfile[];
  readonly atmosphere?: FocusAtmosphereProfile;
  readonly shadow?: FocusShadowProfile;
  readonly ring?: FocusRingProfile;
}

const SATURN_RING_TEXTURE_CANDIDATES = [
  NASA_RING_TEXTURES.saturn,
  SOLAR_FX_TEXTURES.saturnRingTexture,
] as const satisfies readonly AvailableTextureAsset[];

export const FOCUS_PLANET_PROFILES: Readonly<
  Record<InteractiveCelestialBodyId, FocusPlanetProfile>
> = {
  mercury: {
    albedo: NASA_PLANET_TEXTURES.mercury,
    overlays: [],
    atmosphere: {
      color: '#e8f0ff',
      opacity: 0.12,
      radiusScale: 1.018,
      rimPower: 3.4,
    },
  },
  venus: {
    albedo: NASA_PLANET_TEXTURES.venus,
    overlays: [
      {
        id: 'haze',
        kind: 'haze',
        color: '#ffb657',
        radiusScale: 1.028,
        opacity: 0.28,
        speedScale: 0.62,
        noiseStrength: 0.28,
      },
    ],
    atmosphere: {
      color: '#ffac45',
      opacity: 0.44,
      radiusScale: 1.065,
      rimPower: 2.1,
    },
  },
  earth: {
    albedo: NASA_EARTH_TEXTURES.day,
    overlays: [
      {
        id: 'night-lights',
        kind: 'nightLights',
        texture: NASA_EARTH_TEXTURES.nightLights,
        radiusScale: 1.006,
        opacity: 0.9,
      },
      {
        id: 'cloud',
        kind: 'luminanceTexture',
        texture: NASA_EARTH_TEXTURES.clouds,
        colorA: '#c2dcff',
        colorB: '#ffffff',
        radiusScale: 1.018,
        opacity: 0.86,
        alphaLow: 0.24,
        alphaHigh: 0.62,
        speedScale: 1.08,
      },
    ],
    shadow: {
      color: '#00040f',
      opacity: 0.56,
      radiusScale: 1.004,
    },
    atmosphere: {
      color: '#56b7ff',
      opacity: 0.34,
      radiusScale: 1.04,
      rimPower: 2.6,
    },
  },
  moon: {
    albedo: NASA_PLANET_TEXTURES.moon,
    overlays: [],
    atmosphere: {
      color: '#f0f6ff',
      opacity: 0.13,
      radiusScale: 1.018,
      rimPower: 3.25,
    },
  },
  mars: {
    albedo: NASA_PLANET_TEXTURES.mars,
    overlays: [
      {
        id: 'dust',
        kind: 'dust',
        color: '#d86832',
        radiusScale: 1.018,
        opacity: 0.12,
        speedScale: 0.88,
        noiseStrength: 0.34,
      },
    ],
    atmosphere: {
      color: '#ff794c',
      opacity: 0.23,
      radiusScale: 1.036,
      rimPower: 2.7,
    },
  },
  jupiter: {
    albedo: NASA_PLANET_TEXTURES.jupiter,
    overlays: [
      {
        id: 'bands',
        kind: 'bands',
        color: '#f6d8a8',
        radiusScale: 1.012,
        opacity: 0.12,
        speedScale: 0.92,
        bandFrequency: 34,
        bandStrength: 0.45,
      },
    ],
    atmosphere: {
      color: '#ffe2b5',
      opacity: 0.2,
      radiusScale: 1.028,
      rimPower: 2.85,
    },
  },
  saturn: {
    albedo: NASA_PLANET_TEXTURES.saturn,
    overlays: [],
    atmosphere: {
      color: '#ffe0a6',
      opacity: 0.18,
      radiusScale: 1.028,
      rimPower: 2.9,
    },
    ring: {
      textureCandidates: SATURN_RING_TEXTURE_CANDIDATES,
      opacityBoost: 0.3,
    },
  },
  uranus: {
    albedo: NASA_PLANET_TEXTURES.uranus,
    overlays: [],
    atmosphere: {
      color: '#9ff6ff',
      opacity: 0.32,
      radiusScale: 1.048,
      rimPower: 2.45,
    },
  },
  neptune: {
    albedo: NASA_PLANET_TEXTURES.neptune,
    overlays: [
      {
        id: 'winds',
        kind: 'winds',
        color: '#2e80ff',
        radiusScale: 1.018,
        opacity: 0.14,
        speedScale: 1.12,
        bandFrequency: 18,
        bandStrength: 0.28,
        noiseStrength: 0.3,
      },
    ],
    atmosphere: {
      color: '#2477ff',
      opacity: 0.36,
      radiusScale: 1.05,
      rimPower: 2.35,
    },
  },
};

export function getFocusPlanetProfile(
  id: InteractiveCelestialBodyId,
): FocusPlanetProfile {
  return FOCUS_PLANET_PROFILES[id];
}
