import {
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type WebGLRenderer,
} from 'three';

export type TextureColorMode = 'color' | 'data';

export interface LoadTextureOptions {
  readonly colorMode?: TextureColorMode;
  readonly anisotropy?: number;
  readonly renderer?: WebGLRenderer;
}

const DEFAULT_TEXTURE_ANISOTROPY = 4;

const textureLoader = new TextureLoader();
const textureCache = new Map<string, Promise<Texture | null>>();

export function loadTexture(
  path: string | null | undefined,
  options: LoadTextureOptions = {},
): Promise<Texture | null> {
  if (!path) {
    console.warn('[solar texture] Missing texture path; using fallback material.');
    return Promise.resolve(null);
  }

  const cached = textureCache.get(path);
  if (cached) {
    return cached;
  }

  let texturePromise: Promise<Texture | null>;

  try {
    texturePromise = textureLoader
      .loadAsync(path)
      .then((texture) => configureTexture(texture, options))
      .catch((error: unknown) => {
        console.warn(
          `[solar texture] Failed to load "${path}"; using fallback material.`,
          error,
        );
        return null;
      });
  } catch (error) {
    console.warn(
      `[solar texture] Failed to start loading "${path}"; using fallback material.`,
      error,
    );
    texturePromise = Promise.resolve(null);
  }

  textureCache.set(path, texturePromise);

  return texturePromise;
}

export function clearTextureAssetCache(): void {
  textureCache.clear();
}

export function disposeTextureAssetCache(): void {
  textureCache.forEach((texturePromise) => {
    void texturePromise.then((texture) => texture?.dispose());
  });
  textureCache.clear();
}

function configureTexture(
  texture: Texture,
  options: LoadTextureOptions,
): Texture {
  if ((options.colorMode ?? 'color') === 'color') {
    texture.colorSpace = SRGBColorSpace;
  }

  texture.anisotropy = getTextureAnisotropy(options);
  texture.needsUpdate = true;

  return texture;
}

function getTextureAnisotropy(options: LoadTextureOptions): number {
  if (options.anisotropy !== undefined) {
    return Math.max(1, Math.floor(options.anisotropy));
  }

  try {
    const rendererMax = options.renderer?.capabilities.getMaxAnisotropy();
    if (rendererMax && Number.isFinite(rendererMax)) {
      return Math.max(1, Math.min(DEFAULT_TEXTURE_ANISOTROPY, rendererMax));
    }
  } catch (error) {
    console.warn('[solar texture] Unable to read renderer anisotropy.', error);
  }

  return DEFAULT_TEXTURE_ANISOTROPY;
}
