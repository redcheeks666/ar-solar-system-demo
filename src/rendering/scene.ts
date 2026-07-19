import {
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { Object3D } from 'three';
import type { RenderFrameSnapshot } from '../utils/types';
import { BACKGROUND_RENDER_LAYER, MAIN_RENDER_LAYER } from './renderLayers';
import { SelectiveBloomPipeline } from './selectiveBloom';
import { WebGLContextLifecycle } from './webglContextLifecycle';

const MAX_DEVICE_PIXEL_RATIO = 1.5;
const MIN_DEVICE_PIXEL_RATIO_OVERRIDE = 1;
const MAX_DEVICE_PIXEL_RATIO_OVERRIDE = 2;
export const CAMERA_FOV = 45;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
export const CAMERA_Z = 6;
/** World z of the plane where hand-driven interaction content lives (M4+). */
export const INTERACTION_PLANE_Z = 0;
const FPS_SMOOTHING = 0.12;

export interface RendererContextHandlers {
  readonly onContextLost?: () => void;
  readonly onContextRestored?: () => void;
  readonly onContextRestoreFailed?: (error: unknown) => void;
}

export class TransparentSceneRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(
    CAMERA_FOV,
    window.innerWidth / window.innerHeight,
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  private readonly renderer: WebGLRenderer;
  private bloom = new SelectiveBloomPipeline();
  private readonly maxDevicePixelRatio: number;
  private readonly contextHandlers: RendererContextHandlers;
  private readonly contextLifecycle: WebGLContextLifecycle;
  private animationFrameId: number | null = null;
  private frameCallback: ((snapshot: RenderFrameSnapshot) => void) | null = null;
  private renderLoopStarted = false;
  private contextLost = false;
  private disposed = false;
  private bloomActive = true;
  private lastFrameTime = 0;
  private lastRenderMs: number | null = null;
  private sceneContentVisible = false;
  private renderedSceneContent = false;
  private smoothedFps = 0;
  private readonly canvasSize = new Vector2();
  private readonly drawingBufferSize = new Vector2();
  private readonly resizeObserver: ResizeObserver | null = null;
  private readonly handleResize = (): void => this.resize();
  private readonly tick = (time: number): void => {
    this.animationFrameId = null;
    const onFrame = this.frameCallback;

    if (
      !this.renderLoopStarted ||
      this.contextLost ||
      this.disposed ||
      !onFrame
    ) {
      return;
    }

    const deltaMs = this.lastFrameTime > 0 ? time - this.lastFrameTime : 16.67;
    this.lastFrameTime = time;

    const instantFps = deltaMs > 0 ? 1000 / deltaMs : 0;
    this.smoothedFps =
      this.smoothedFps > 0
        ? this.smoothedFps + (instantFps - this.smoothedFps) * FPS_SMOOTHING
        : instantFps;

    onFrame({
      fps: this.smoothedFps,
      canvasSize: this.getCanvasSize(),
      deltaMs,
      deltaSeconds: deltaMs / 1000,
      renderMs: this.lastRenderMs,
      timestampMs: time,
    });
    if (this.sceneContentVisible) {
      const renderStartedAt = performance.now();
      this.renderScene();
      this.lastRenderMs = performance.now() - renderStartedAt;
      this.renderedSceneContent = true;
    } else if (this.renderedSceneContent) {
      const renderStartedAt = performance.now();
      this.renderer.clear(true, true, true);
      this.lastRenderMs = performance.now() - renderStartedAt;
      this.renderedSceneContent = false;
    } else {
      this.lastRenderMs = 0;
    }

    this.requestNextFrame();
  };
  private readonly handleContextLost = (): void => {
    if (this.contextLost || this.disposed) {
      return;
    }

    this.contextLost = true;
    this.pauseAnimationLoop();
    this.contextHandlers.onContextLost?.();
  };
  private readonly handleContextRestored = (): void => {
    if (!this.contextLost || this.disposed) {
      return;
    }

    try {
      this.bloom.dispose();
      this.bloom = new SelectiveBloomPipeline();
      this.bloom.setActive(this.bloomActive);
      this.contextLost = false;
      this.lastFrameTime = 0;
      this.resize();
      this.contextHandlers.onContextRestored?.();
      this.requestNextFrame();
    } catch (error) {
      this.contextLost = true;
      this.contextHandlers.onContextRestoreFailed?.(error);
    }
  };

  constructor(
    canvas: HTMLCanvasElement,
    maxDevicePixelRatio = MAX_DEVICE_PIXEL_RATIO,
    contextHandlers: RendererContextHandlers = {},
  ) {
    this.canvas = canvas;
    this.contextHandlers = contextHandlers;
    this.maxDevicePixelRatio = Math.min(
      MAX_DEVICE_PIXEL_RATIO_OVERRIDE,
      Math.max(MIN_DEVICE_PIXEL_RATIO_OVERRIDE, maxDevicePixelRatio),
    );
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.autoClear = false;
    this.camera.position.set(0, 0, CAMERA_Z);
    this.contextLifecycle = new WebGLContextLifecycle(canvas, {
      onLost: this.handleContextLost,
      onRestored: this.handleContextRestored,
    });

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(canvas);
    }

    window.addEventListener('resize', this.handleResize);
    this.resize();
  }

  start(onFrame: (snapshot: RenderFrameSnapshot) => void): void {
    this.frameCallback = onFrame;
    if (this.renderLoopStarted || this.disposed) {
      return;
    }

    this.renderLoopStarted = true;
    this.lastFrameTime = 0;
    this.requestNextFrame();
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.renderLoopStarted = false;
    this.frameCallback = null;
    this.pauseAnimationLoop();
    this.contextLifecycle.dispose();
    window.removeEventListener('resize', this.handleResize);
    this.resizeObserver?.disconnect();
    this.bloom.dispose();
    this.renderer.dispose();
  }

  /**
   * Skips the bloom passes entirely while no emissive content is on screen
   * (e.g. empty idle before the solar system opens).
   */
  setBloomActive(active: boolean): void {
    this.bloomActive = active;
    this.bloom.setActive(active);
  }

  /**
   * Keeps the rAF loop alive while allowing an empty transparent canvas to skip all WebGL passes.
   * The first hidden frame after visible content still clears the previous drawing once.
   */
  setSceneContentVisible(visible: boolean): void {
    this.sceneContentVisible = visible;
  }

  getCanvasSize(): { width: number; height: number } {
    const size = this.renderer.getSize(this.canvasSize);

    return {
      width: Math.round(size.x),
      height: Math.round(size.y),
    };
  }

  addObject3D(object: Object3D): void {
    this.scene.add(object);
  }

  removeObject3D(object: Object3D): void {
    this.scene.remove(object);
  }

  /**
   * The scene camera, for mapping normalized hand coordinates onto the interaction plane.
   * Pass to `mapNormalizedToWorld` (with `INTERACTION_PLANE_Z`) so 3D content (M4+) stays
   * aligned with the hands.
   */
  getCamera(): PerspectiveCamera {
    return this.camera;
  }

  private renderScene(): void {
    const originalCameraLayerMask = this.camera.layers.mask;

    this.bloom.renderGlow(this.renderer, this.scene, this.camera);
    this.renderer.clear(true, true, true);
    this.camera.layers.set(BACKGROUND_RENDER_LAYER);
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.camera.layers.set(MAIN_RENDER_LAYER);
    this.renderer.render(this.scene, this.camera);
    this.camera.layers.mask = originalCameraLayerMask;
    this.bloom.composite(this.renderer);
  }

  private requestNextFrame(): void {
    if (
      this.animationFrameId !== null ||
      !this.renderLoopStarted ||
      this.contextLost ||
      this.disposed
    ) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  private pauseAnimationLoop(): void {
    if (this.animationFrameId === null) {
      return;
    }

    window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private resize(): void {
    if (this.contextLost || this.disposed) {
      return;
    }

    const bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.maxDevicePixelRatio),
    );
    this.renderer.setSize(width, height, false);
    this.renderer.getDrawingBufferSize(this.drawingBufferSize);
    this.bloom.setSize(this.drawingBufferSize.x, this.drawingBufferSize.y);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
