import { withPublicBasePath } from '../utils/publicAssetPath';

export type TextureAssetPath = string;

export interface AvailableTextureAsset {
  readonly status: 'available';
  readonly path: TextureAssetPath;
}

export interface MissingTextureAsset {
  readonly status: 'missing';
  readonly path: null;
  readonly reason: string;
}

export type TextureAsset = AvailableTextureAsset | MissingTextureAsset;

const NASA_RUNTIME_QUALITY = 'medium';
const NASA_RUNTIME_BASE = withPublicBasePath(
  `/assets/solar/nasa/runtime/${NASA_RUNTIME_QUALITY}`,
);
const FX_BASE = withPublicBasePath('/assets/solar/fx');

function texture(path: TextureAssetPath): AvailableTextureAsset {
  return {
    status: 'available',
    path,
  };
}

export const NASA_RUNTIME_TEXTURE_QUALITY = NASA_RUNTIME_QUALITY;

export const NASA_EARTH_TEXTURES = {
  day: texture(`${NASA_RUNTIME_BASE}/earth/earth_day_2k.jpg`),
  clouds: texture(`${NASA_RUNTIME_BASE}/earth/earth_clouds_2k.jpg`),
  nightLights: texture(
    `${NASA_RUNTIME_BASE}/earth/earth_night_lights_2k.jpg`,
  ),
} as const;

export const NASA_PLANET_TEXTURES = {
  mercury: texture(`${NASA_RUNTIME_BASE}/planets/mercury_albedo_2k.jpg`),
  venus: texture(`${NASA_RUNTIME_BASE}/planets/venus_albedo_2k.jpg`),
  moon: texture(`${NASA_RUNTIME_BASE}/planets/moon_albedo_2k.jpg`),
  mars: texture(`${NASA_RUNTIME_BASE}/planets/mars_albedo_2k.jpg`),
  jupiter: texture(`${NASA_RUNTIME_BASE}/planets/jupiter_albedo_2k.jpg`),
  saturn: texture(`${NASA_RUNTIME_BASE}/planets/saturn_albedo_2k.jpg`),
  uranus: texture(`${NASA_RUNTIME_BASE}/planets/uranus_albedo_2k.jpg`),
  neptune: texture(`${NASA_RUNTIME_BASE}/planets/neptune_albedo_2k.jpg`),
} as const;

export const NASA_RING_TEXTURES = {
  saturn: texture(`${NASA_RUNTIME_BASE}/rings/saturn_ring_2k.png`),
} as const;

export const SOLAR_FX_TEXTURES = {
  blueGoldShockwaveRing: texture(`${FX_BASE}/blue-gold-shockwave-ring.png`),
  burstRift: texture(`${FX_BASE}/burst-rift.png`),
  cyanParticle: texture(`${FX_BASE}/cyan-particle.png`),
  cyanShockwaveRing: texture(`${FX_BASE}/cyan-shockwave-ring.png`),
  goldHorizontalLensFlare: texture(`${FX_BASE}/gold-horizontal-lens-flare.png`),
  goldParticle: texture(`${FX_BASE}/gold-particle.png`),
  leftHandBlueAnchorGlow: texture(`${FX_BASE}/left-hand-blue-anchor-glow.png`),
  microFlare: texture(`${FX_BASE}/micro-flare.png`),
  rightHandGoldAnchorGlow: texture(`${FX_BASE}/right-hand-gold-anchor-glow.png`),
  stardustParticles: texture(`${FX_BASE}/stardust-particles.png`),
  targetLockRing: texture(`${FX_BASE}/target-lock-ring.png`),
  whiteParticle: texture(`${FX_BASE}/white-particle.png`),
} as const;
