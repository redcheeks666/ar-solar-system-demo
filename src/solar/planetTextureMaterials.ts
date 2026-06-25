import {
  NASA_EARTH_TEXTURES,
  NASA_PLANET_TEXTURES,
  NASA_RING_TEXTURES,
  SOLAR_FX_TEXTURES,
  type AvailableTextureAsset,
  type TextureAsset,
} from './solarAssetManifest';
import type { CelestialBodyId } from './solarSystemData';

const OVERVIEW_PLANET_ALBEDO_ASSETS: Partial<Record<CelestialBodyId, TextureAsset>> = {
  mercury: NASA_PLANET_TEXTURES.mercury,
  venus: NASA_PLANET_TEXTURES.venus,
  earth: NASA_EARTH_TEXTURES.day,
  moon: NASA_PLANET_TEXTURES.moon,
  mars: NASA_PLANET_TEXTURES.mars,
  jupiter: NASA_PLANET_TEXTURES.jupiter,
  saturn: NASA_PLANET_TEXTURES.saturn,
  uranus: NASA_PLANET_TEXTURES.uranus,
  neptune: NASA_PLANET_TEXTURES.neptune,
};

const SATURN_RING_TEXTURE_CANDIDATES = [
  NASA_RING_TEXTURES.saturn,
  SOLAR_FX_TEXTURES.saturnRingTexture,
] as const satisfies readonly AvailableTextureAsset[];

export function getOverviewPlanetAlbedoAsset(
  bodyId: CelestialBodyId,
): TextureAsset | null {
  return OVERVIEW_PLANET_ALBEDO_ASSETS[bodyId] ?? null;
}

export function getSaturnRingTextureCandidates(): readonly AvailableTextureAsset[] {
  return SATURN_RING_TEXTURE_CANDIDATES;
}

export function getTextureAssetPath(asset: TextureAsset | null): string | null {
  return asset?.status === 'available' ? asset.path : null;
}
