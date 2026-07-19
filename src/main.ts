import './styles.css';
import './landing/landing.css';
import {
  getCurrentDeviceGateFacts,
  shouldShowDeviceGate,
  showDeviceGate,
} from './rendering/deviceGate';
import { showFatalErrorOverlay } from './rendering/fatalErrorOverlay';
import { installGlobalErrorFallback } from './rendering/globalErrorFallback';
import { isWebGL2Available } from './rendering/webglSupport';
import {
  getBaseRootPath,
  resolveAppRoute,
  type AppRoute,
} from './landing/appRoute';

function bootstrap(): void {
  installGlobalErrorFallback();
  const baseUrl = import.meta.env.BASE_URL;
  const route = resolveAppRoute(window.location, baseUrl);

  if (route === 'landing') {
    showLanding(baseUrl);
    return;
  }

  showAppShell(route, baseUrl);

  if (!isWebGL2Available()) {
    showFatalErrorOverlay({
      title: '当前设备无法运行此体验',
      message:
        '当前浏览器或设备不支持 WebGL2，无法运行该体验。请更换较新的桌面浏览器（Chrome / Edge / Safari）后重试。',
    });
    return;
  }

  if (shouldShowDeviceGate(getCurrentDeviceGateFacts())) {
    showDeviceGate(startExperience);
    return;
  }

  startExperience();
}

function startExperience(): void {
  void import('./app');
}

function showLanding(baseUrl: string): void {
  getElement('app').hidden = true;
  getElement('landing-root').hidden = false;
  void import('./landing/landing').then(({ initLandingPage }) => {
    initLandingPage(baseUrl);
  });
}

function showAppShell(route: AppRoute, baseUrl: string): void {
  getElement('landing-root').hidden = true;
  getElement('app').hidden = false;
  const returnControl = getElement<HTMLAnchorElement>('experience-return');
  returnControl.href = getBaseRootPath(baseUrl);
  returnControl.hidden = route === 'solar-preview';
}

function getElement<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing bootstrap element: #${id}`);
  }
  return element as T;
}

bootstrap();
