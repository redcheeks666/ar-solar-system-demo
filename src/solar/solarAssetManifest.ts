export type TextureAssetPath = `/${string}`;

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
const NASA_RUNTIME_BASE =
  `/assets/solar/nasa/runtime/${NASA_RUNTIME_QUALITY}` as const;
const FX_BASE = '/assets/solar/fx' as const;

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

export const NASA_STARFIELD_TEXTURES = {
  deepStarMap: texture(
    `${NASA_RUNTIME_BASE}/starfield/starfield_deep_star_map_4k.jpg`,
  ),
} as const;

export const SOLAR_FX_TEXTURES = {
  blueGoldEnergyRift: texture(`${FX_BASE}/blue-gold-energy-rift.png`),
  blueGoldShockwaveRing: texture(`${FX_BASE}/blue-gold-shockwave-ring.png`),
  blueHorizontalLensFlare: texture(`${FX_BASE}/blue-horizontal-lens-flare.png`),
  burstRift: texture(`${FX_BASE}/burst-rift.png`),
  contactSheet: texture(`${FX_BASE}/contact-sheet.png`),
  cyanParticle: texture(`${FX_BASE}/cyan-particle.png`),
  cyanShockwaveRing: texture(`${FX_BASE}/cyan-shockwave-ring.png`),
  deepSpaceNebulaLayer: texture(`${FX_BASE}/deep-space-nebula-layer.png`),
  goldHorizontalLensFlare: texture(`${FX_BASE}/gold-horizontal-lens-flare.png`),
  goldParticle: texture(`${FX_BASE}/gold-particle.png`),
  leftHandBlueAnchorGlow: texture(`${FX_BASE}/left-hand-blue-anchor-glow.png`),
  microFlare: texture(`${FX_BASE}/micro-flare.png`),
  planetLabelHudFrame: texture(`${FX_BASE}/planet-label-hud-frame.png`),
  returnButtonHudFrame: texture(`${FX_BASE}/return-button-hud-frame.png`),
  rightHandGoldAnchorGlow: texture(`${FX_BASE}/right-hand-gold-anchor-glow.png`),
  saturnRingTexture: texture(`${FX_BASE}/saturn-ring-texture.png`),
  stardustParticles: texture(`${FX_BASE}/stardust-particles.png`),
  targetLockRing: texture(`${FX_BASE}/target-lock-ring.png`),
  thinSpaceCrack: texture(`${FX_BASE}/thin-space-crack.png`),
  transparentNebulaMist: texture(`${FX_BASE}/transparent-nebula-mist.png`),
  whiteParticle: texture(`${FX_BASE}/white-particle.png`),
} as const;

export const SOLAR_ASSET_MANIFEST = {
  nasa: {
    runtimeQuality: NASA_RUNTIME_TEXTURE_QUALITY,
    earth: NASA_EARTH_TEXTURES,
    planets: NASA_PLANET_TEXTURES,
    rings: NASA_RING_TEXTURES,
    starfield: NASA_STARFIELD_TEXTURES,
  },
  fx: SOLAR_FX_TEXTURES,
} as const;
