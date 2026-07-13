import {
  CustomBlending,
  LinearFilter,
  Mesh,
  OneFactor,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  ZeroFactor,
  type Camera,
  type WebGLRenderer,
} from 'three';
import { BLOOM_RENDER_LAYER } from './renderLayers';

// Quarter-resolution targets keep the whole pipeline cheap enough for
// integrated GPUs (three small fullscreen passes + one composite).
const BLOOM_RESOLUTION_DIVISOR = 4;
// The scene's glows are already hand-tuned additive layers, so bloom only
// kisses the genuinely hot cores instead of re-glowing everything.
const BLOOM_THRESHOLD = 0.62;
const BLOOM_SOFT_KNEE = 0.28;
const BLOOM_STRENGTH = 0.5;
const BLUR_ITERATIONS = 2;

/**
 * Selective bloom for a transparent-canvas scene: objects that enable
 * BLOOM_RENDER_LAYER are re-rendered into a small offscreen target, bright
 * parts are blurred, and the result is composited additively WITHOUT touching
 * destination alpha — so the glow also spills over the DOM camera video
 * underneath the canvas, reading as virtual light hitting the real room.
 */
export class SelectiveBloomPipeline {
  private readonly sourceTarget: WebGLRenderTarget;
  private readonly pingTarget: WebGLRenderTarget;
  private readonly pongTarget: WebGLRenderTarget;
  private readonly quadScene = new Scene();
  private readonly quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: Mesh;
  private readonly quadGeometry = new PlaneGeometry(2, 2);
  private readonly prefilterMaterial: ShaderMaterial;
  private readonly blurMaterial: ShaderMaterial;
  private readonly compositeMaterial: ShaderMaterial;
  private readonly texelSize = new Vector2();
  private active = true;
  private hadSourceContent = false;

  constructor() {
    const targetOptions = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    } as const;
    this.sourceTarget = new WebGLRenderTarget(2, 2, {
      ...targetOptions,
      depthBuffer: true,
    });
    this.pingTarget = new WebGLRenderTarget(2, 2, targetOptions);
    this.pongTarget = new WebGLRenderTarget(2, 2, targetOptions);

    this.prefilterMaterial = createPrefilterMaterial();
    this.blurMaterial = createBlurMaterial();
    this.compositeMaterial = createCompositeMaterial();
    this.quad = new Mesh(this.quadGeometry, this.prefilterMaterial);
    this.quad.frustumCulled = false;
    this.quadScene.add(this.quad);
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  setSize(drawingBufferWidth: number, drawingBufferHeight: number): void {
    const width = Math.max(1, Math.floor(drawingBufferWidth / BLOOM_RESOLUTION_DIVISOR));
    const height = Math.max(1, Math.floor(drawingBufferHeight / BLOOM_RESOLUTION_DIVISOR));

    this.sourceTarget.setSize(width, height);
    this.pingTarget.setSize(width, height);
    this.pongTarget.setSize(width, height);
    this.texelSize.set(1 / width, 1 / height);
  }

  /**
   * Renders the bloom-layer objects and produces the blurred glow texture.
   * Call before the main passes; the camera layer mask is left modified and
   * must be restored by the caller (the caller already saves/restores it).
   */
  renderGlow(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
    this.hadSourceContent = false;

    if (!this.active) {
      return;
    }

    camera.layers.set(BLOOM_RENDER_LAYER);
    renderer.setRenderTarget(this.sourceTarget);
    renderer.clear(true, true, false);
    renderer.render(scene, camera);
    this.hadSourceContent = true;

    this.prefilterMaterial.uniforms.map.value = this.sourceTarget.texture;
    this.runQuadPass(renderer, this.prefilterMaterial, this.pingTarget);

    let readTarget = this.pingTarget;
    let writeTarget = this.pongTarget;
    for (let iteration = 0; iteration < BLUR_ITERATIONS; iteration += 1) {
      const spread = iteration + 1;

      this.blurMaterial.uniforms.map.value = readTarget.texture;
      this.blurMaterial.uniforms.direction.value.set(
        this.texelSize.x * spread,
        0,
      );
      this.runQuadPass(renderer, this.blurMaterial, writeTarget);
      [readTarget, writeTarget] = [writeTarget, readTarget];

      this.blurMaterial.uniforms.map.value = readTarget.texture;
      this.blurMaterial.uniforms.direction.value.set(
        0,
        this.texelSize.y * spread,
      );
      this.runQuadPass(renderer, this.blurMaterial, writeTarget);
      [readTarget, writeTarget] = [writeTarget, readTarget];
    }

    this.compositeMaterial.uniforms.map.value = readTarget.texture;
    renderer.setRenderTarget(null);
  }

  /** Additively draws the glow texture over the framebuffer (canvas). */
  composite(renderer: WebGLRenderer): void {
    if (!this.active || !this.hadSourceContent) {
      return;
    }

    this.quad.material = this.compositeMaterial;
    renderer.render(this.quadScene, this.quadCamera);
  }

  dispose(): void {
    this.sourceTarget.dispose();
    this.pingTarget.dispose();
    this.pongTarget.dispose();
    this.quadGeometry.dispose();
    this.prefilterMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
  }

  private runQuadPass(
    renderer: WebGLRenderer,
    material: ShaderMaterial,
    target: WebGLRenderTarget,
  ): void {
    this.quad.material = material;
    renderer.setRenderTarget(target);
    renderer.clear(true, false, false);
    renderer.render(this.quadScene, this.quadCamera);
  }
}

const FULLSCREEN_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function createPrefilterMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: null },
      threshold: { value: BLOOM_THRESHOLD },
      knee: { value: BLOOM_SOFT_KNEE },
    },
    vertexShader: FULLSCREEN_VERTEX_SHADER,
    fragmentShader: `
      uniform sampler2D map;
      uniform float threshold;
      uniform float knee;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(map, vUv);
        float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        float contribution = smoothstep(threshold, threshold + knee, luminance);

        gl_FragColor = vec4(color.rgb * contribution, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
}

function createBlurMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: null },
      direction: { value: new Vector2() },
    },
    vertexShader: FULLSCREEN_VERTEX_SHADER,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec2 direction;
      varying vec2 vUv;

      void main() {
        vec3 sum = texture2D(map, vUv).rgb * 0.227027;
        sum += texture2D(map, vUv + direction * 1.3846).rgb * 0.316216;
        sum += texture2D(map, vUv - direction * 1.3846).rgb * 0.316216;
        sum += texture2D(map, vUv + direction * 3.2308).rgb * 0.070270;
        sum += texture2D(map, vUv - direction * 3.2308).rgb * 0.070270;

        gl_FragColor = vec4(sum, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
}

function createCompositeMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      map: { value: null },
      strength: { value: BLOOM_STRENGTH },
    },
    vertexShader: FULLSCREEN_VERTEX_SHADER,
    fragmentShader: `
      uniform sampler2D map;
      uniform float strength;
      varying vec2 vUv;

      void main() {
        vec3 glow = texture2D(map, vUv).rgb * strength;

        gl_FragColor = vec4(glow, 0.0);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    // Pure additive on color, destination alpha untouched: glow brightens the
    // scene AND bleeds onto the camera video below the transparent canvas.
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
    depthTest: false,
    depthWrite: false,
  });
}
