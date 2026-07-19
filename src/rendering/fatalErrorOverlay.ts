const FATAL_ERROR_OVERLAY_ID = 'fatal-error-overlay';

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

  const existingOverlay = document.getElementById(FATAL_ERROR_OVERLAY_ID);
  if (existingOverlay) {
    updateOverlayCopy(existingOverlay, content);
    return;
  }

  const overlay = document.createElement('section');
  overlay.id = FATAL_ERROR_OVERLAY_ID;
  overlay.className = 'public-fallback-overlay';
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');

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
