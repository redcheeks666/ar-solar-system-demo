export interface WebGLCanvasLike {
  getContext(contextId: 'webgl2'): unknown;
}

export type WebGLCanvasFactory = () => WebGLCanvasLike;

export function isWebGL2Available(
  createCanvas: WebGLCanvasFactory = () => document.createElement('canvas'),
): boolean {
  try {
    return Boolean(createCanvas().getContext('webgl2'));
  } catch {
    return false;
  }
}
