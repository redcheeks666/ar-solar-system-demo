import { withPublicBasePath } from '../utils/publicAssetPath';

export const SFX_IDS = [
  'system-release',
  'focus-release',
  'ui-hold-loop',
  'ui-hold-success',
  'ui-hold-cancel',
  'ambient-solar-loop',
] as const;

export type SfxId = (typeof SFX_IDS)[number];

export interface SfxManifestAsset {
  id: SfxId;
  file?: string;
  reuseOf?: SfxId;
  loop: boolean;
  suggestedGain: number;
}

export interface SfxManifest {
  assets: readonly SfxManifestAsset[];
  assetsById: ReadonlyMap<SfxId, SfxManifestAsset>;
}

const SFX_ID_SET = new Set<string>(SFX_IDS);
const MANIFEST_PATH = '/assets/solar/manifests/sfx-assets.json' as const;

export async function loadSfxManifest(): Promise<SfxManifest> {
  const response = await fetch(withPublicBasePath(MANIFEST_PATH));

  if (!response.ok) {
    throw new Error(`SFX manifest request failed (${response.status}).`);
  }

  return parseSfxManifest(await response.json());
}

export function parseSfxManifest(input: unknown): SfxManifest {
  if (!isRecord(input) || !Array.isArray(input.assets)) {
    throw new Error('SFX manifest is missing its assets array.');
  }

  const assets: SfxManifestAsset[] = [];
  const assetsById = new Map<SfxId, SfxManifestAsset>();

  input.assets.forEach((rawAsset, index) => {
    if (!isRecord(rawAsset) || !isSfxId(rawAsset.id)) {
      console.warn(`[Audio] Skipping unknown SFX manifest entry at index ${index}.`);
      return;
    }

    if (assetsById.has(rawAsset.id)) {
      console.warn(`[Audio] Skipping duplicate SFX id: ${rawAsset.id}.`);
      return;
    }

    const suggestedGain = rawAsset.suggested_gain;
    const file = typeof rawAsset.file === 'string' ? rawAsset.file : undefined;
    const reuseOf = isSfxId(rawAsset.reuse_of) ? rawAsset.reuse_of : undefined;

    if (
      typeof rawAsset.loop !== 'boolean' ||
      typeof suggestedGain !== 'number' ||
      !Number.isFinite(suggestedGain) ||
      suggestedGain < 0 ||
      (!file && !reuseOf)
    ) {
      console.warn(`[Audio] Skipping malformed SFX manifest entry: ${rawAsset.id}.`);
      return;
    }

    const asset: SfxManifestAsset = {
      id: rawAsset.id,
      file,
      reuseOf,
      loop: rawAsset.loop,
      suggestedGain,
    };
    assets.push(asset);
    assetsById.set(asset.id, asset);
  });

  SFX_IDS.forEach((id) => {
    if (!assetsById.has(id)) {
      console.warn(`[Audio] SFX manifest is missing required id: ${id}.`);
    }
  });

  assets.forEach((asset) => {
    if (asset.reuseOf && !assetsById.has(asset.reuseOf)) {
      console.warn(
        `[Audio] SFX ${asset.id} reuses missing manifest id ${asset.reuseOf}.`,
      );
    }
  });

  return { assets, assetsById };
}

export function getSfxFileUrl(file: string): string {
  return withPublicBasePath(`/assets/solar/sfx/${file}`);
}

function isSfxId(value: unknown): value is SfxId {
  return typeof value === 'string' && SFX_ID_SET.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
