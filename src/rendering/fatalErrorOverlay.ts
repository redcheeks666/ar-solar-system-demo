const FATAL_ERROR_OVERLAY_ID = 'fatal-error-overlay';
const RENDER_INTERRUPTION_OVERLAY_ID = 'render-interruption-overlay';

export interface FatalErrorOverlayContent {
  readonly title: string;
  readonly message: string;
}

export function showFatalErrorOverlay(
  content: FatalErrorOverlayContent,
): void {
  const startButton = document.getElementById('start-camera');
  if (startButton instanceof HTMLButtonElement) {
    startButton.disabled = true;
    startButton.hidden = true;
  }

  showOverlay(FATAL_ERROR_OVERLAY_ID, content, 'assertive');
}

export function showRenderingInterruptionOverlay(): void {
  showOverlay(
    RENDER_INTERRUPTION_OVERLAY_ID,
    {
      title: '渲染暂时中断',
      message: '正在尝试恢复画面，请稍候。',
    },
    'polite',
  );
}

export function hideRenderingInterruptionOverlay(): void {
  document.getElementById(RENDER_INTERRUPTION_OVERLAY_ID)?.remove();
}

function showOverlay(
  id: string,
  content: FatalErrorOverlayContent,
  liveMode: 'assertive' | 'polite',
): void {
  const existingOverlay = document.getElementById(id);
  if (existingOverlay) {
    updateOverlayCopy(existingOverlay, content);
    return;
  }

  const overlay = document.createElement('section');
  overlay.id = id;
  overlay.className = 'public-fallback-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', liveMode);

  const panel = document.createElement('div');
  panel.className = 'intro-panel public-fallback-panel';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'AR Solar System';

  const title = document.createElement('h1');
  title.dataset.fallbackTitle = '';

  const message = document.createElement('p');
  message.className = 'status-text public-fallback-message';
  message.dataset.fallbackMessage = '';

  panel.append(eyebrow, title, message);
  overlay.append(panel);
  document.body.append(overlay);
  updateOverlayCopy(overlay, content);
}

function updateOverlayCopy(
  overlay: HTMLElement,
  content: FatalErrorOverlayContent,
): void {
  const title = overlay.querySelector<HTMLElement>('[data-fallback-title]');
  const message = overlay.querySelector<HTMLElement>('[data-fallback-message]');

  if (title) {
    title.textContent = content.title;
  }
  if (message) {
    message.textContent = content.message;
  }
}
