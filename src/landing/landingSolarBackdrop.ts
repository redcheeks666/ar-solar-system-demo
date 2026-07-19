import { TransparentSceneRenderer } from '../rendering/scene';
import { getCurrentDeviceGateFacts } from '../rendering/deviceGate';
import { isWebGL2Available } from '../rendering/webglSupport';
import { CodePlaceholderSolarSystem } from '../solar/solarSystem';
import { shouldUseStaticLandingBackdrop } from './landingDeviceProfile';

const LANDING_MAX_DEVICE_PIXEL_RATIO = 1.25;
const LANDING_MAX_DELTA_SECONDS = 0.05;

export function startLandingSolarBackdrop(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
): () => void {
  const useStaticBackdrop = shouldUseStaticLandingBackdrop(
    getCurrentDeviceGateFacts(),
  );

  if (useStaticBackdrop || !isWebGL2Available()) {
    setStaticBackdrop(hero, canvas);
    return () => undefined;
  }

  try {
    const renderer = new TransparentSceneRenderer(
      canvas,
      LANDING_MAX_DEVICE_PIXEL_RATIO,
      {
        onContextLost: () => setStaticBackdrop(hero, canvas),
        onContextRestored: () => clearStaticBackdrop(hero, canvas),
        onContextRestoreFailed: () => setStaticBackdrop(hero, canvas),
      },
    );
    const solarSystem = new CodePlaceholderSolarSystem();

    solarSystem.setVisible(true);
    solarSystem.setOpeningProgress(1);
    solarSystem.setTransform({
      position: { x: 0.72, y: -0.9, z: 0 },
      scale: 0.65,
    });

    renderer.addObject3D(solarSystem.group);
    renderer.setBloomActive(true);
    renderer.setSceneContentVisible(true);
    renderer.start(({ deltaSeconds }) => {
      solarSystem.update(Math.min(deltaSeconds, LANDING_MAX_DELTA_SECONDS));
    });

    hero.dataset.backdrop = 'dynamic';

    return () => {
      renderer.removeObject3D(solarSystem.group);
      solarSystem.dispose();
      renderer.dispose();
    };
  } catch (error) {
    console.warn('[AR Solar System] 落地页动态背景已回退为静态背景。', error);
    setStaticBackdrop(hero, canvas);
    return () => undefined;
  }
}

function setStaticBackdrop(
  hero: HTMLElement,
  canvas: HTMLCanvasElement,
): void {
  hero.dataset.backdrop = 'static';
  hero.classList.add('is-static-backdrop');
  canvas.hidden = true;
}

function clearStaticBackdrop(
  hero: HTMLElement,
  canvas: HTMLCanvasElement,
): void {
  hero.dataset.backdrop = 'dynamic';
  hero.classList.remove('is-static-backdrop');
  canvas.hidden = false;
}
