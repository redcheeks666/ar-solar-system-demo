import {
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { PerspectiveViewport } from '../interaction/coordinateMapping';
import type { RenderFrameSnapshot } from '../utils/types';

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

      this.renderer.render(this.scene, this.camera);
      onFrame({
        fps: this.smoothedFps,
        canvasSize: this.getCanvasSize(),
      });

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

  /**
   * Camera parameters for mapping normalized hand coordinates onto the interaction plane.
   * Pair with `mapNormalizedToWorld` so 3D content (M4+) stays aligned with the hands.
   */
  getInteractionViewport(): PerspectiveViewport {
    return {
      fovDegrees: CAMERA_FOV,
      cameraZ: CAMERA_Z,
      planeZ: INTERACTION_PLANE_Z,
    };
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
