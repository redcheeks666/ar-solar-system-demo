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

const MAX_DEVICE_PIXEL_RATIO = 2;
export const CAMERA_FOV = 45;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;
export const CAMERA_Z = 6;
/** World z of the plane where hand-driven interaction content lives (M4+). */
export const INTERACTION_PLANE_Z = 0;
const FPS_SMOOTHING = 0.12;

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
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private lastRenderMs: number | null = null;
  private smoothedFps = 0;
  private readonly canvasSize = new Vector2();
  private readonly resizeObserver: ResizeObserver | null = null;
  private readonly handleResize = (): void => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
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

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(canvas);
    }

    window.addEventListener('resize', this.handleResize);
    this.resize();
  }

  start(onFrame: (snapshot: RenderFrameSnapshot) => void): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const tick = (time: number): void => {
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
      const renderStartedAt = performance.now();
      this.renderScene();
      this.lastRenderMs = performance.now() - renderStartedAt;

      this.animationFrameId = window.requestAnimationFrame(tick);
    };

    this.animationFrameId = window.requestAnimationFrame(tick);
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.handleResize);
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
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

    this.renderer.clear(true, true, true);
    this.camera.layers.set(BACKGROUND_RENDER_LAYER);
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.camera.layers.set(MAIN_RENDER_LAYER);
    this.renderer.render(this.scene, this.camera);
    this.camera.layers.mask = originalCameraLayerMask;
  }

  private resize(): void {
    const bounds = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, MAX_DEVICE_PIXEL_RATIO),
    );
    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
