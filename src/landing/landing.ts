import { getCurrentDeviceGateFacts } from '../rendering/deviceGate';
import { isWebGL2Available } from '../rendering/webglSupport';
import { getExperiencePath } from './appRoute';
import { getLandingExperienceBlockReason } from './landingDeviceProfile';
import { startLandingSolarBackdrop } from './landingSolarBackdrop';

export function initLandingPage(baseUrl: string): void {
  const landingRoot = getElement<HTMLElement>('landing-root');
  const hero = getElement<HTMLElement>('landing-hero');
  const canvas = getElement<HTMLCanvasElement>('landing-solar-canvas');
  const experienceButton = getElement<HTMLButtonElement>(
    'landing-experience-button',
  );
  const gateMessage = getElement<HTMLElement>('landing-gate-message');

  document.body.classList.add('landing-route');
  const disposeBackdrop = startLandingSolarBackdrop(canvas, hero);
  const disposeReveal = installSectionReveal(landingRoot);
  const dispose = (): void => {
    disposeReveal();
    disposeBackdrop();
  };

  window.addEventListener('pagehide', dispose, { once: true });
  experienceButton.addEventListener('click', () => {
    const blockReason = getLandingExperienceBlockReason({
      deviceFacts: getCurrentDeviceGateFacts(),
      webgl2Available: isWebGL2Available(),
    });

    if (blockReason) {
      gateMessage.hidden = false;
      gateMessage.textContent =
        blockReason === 'webgl2-unavailable'
          ? '当前浏览器不支持 WebGL2，请更换较新的桌面浏览器后体验。'
          : '请用带摄像头的桌面浏览器体验；手机或平板仍可继续浏览手势玩法。';
      gateMessage.focus({ preventScroll: true });
      return;
    }

    window.location.assign(getExperiencePath(baseUrl));
  });
}

function installSectionReveal(root: HTMLElement): () => void {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  const reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return () => undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        (entry.target as HTMLElement).classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  targets.forEach((target) => observer.observe(target));
  return () => observer.disconnect();
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing landing page element: #${id}`);
  }
  return element as T;
}
