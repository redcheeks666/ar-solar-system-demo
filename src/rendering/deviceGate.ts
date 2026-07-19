const DEVICE_GATE_ID = 'device-gate';
const NARROW_VIEWPORT_MAX_PX = 720;
const TOUCH_VIEWPORT_MAX_PX = 1366;

export interface DeviceGateFacts {
  readonly coarsePointer: boolean;
  readonly maxTouchPoints: number;
  readonly viewportWidth: number;
}

export function shouldShowDeviceGate(facts: DeviceGateFacts): boolean {
  const narrowViewport = facts.viewportWidth <= NARROW_VIEWPORT_MAX_PX;
  const touchSizedViewport =
    facts.maxTouchPoints > 0 &&
    facts.viewportWidth <= TOUCH_VIEWPORT_MAX_PX;

  return facts.coarsePointer || narrowViewport || touchSizedViewport;
}

export function getCurrentDeviceGateFacts(): DeviceGateFacts {
  return {
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    viewportWidth: window.innerWidth,
  };
}

export function showDeviceGate(onContinue: () => void): void {
  if (document.getElementById(DEVICE_GATE_ID)) {
    return;
  }

  const overlay = document.createElement('section');
  overlay.id = DEVICE_GATE_ID;
  overlay.className = 'public-fallback-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'device-gate-title');

  const panel = document.createElement('div');
  panel.className = 'intro-panel public-fallback-panel';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = '设备提示';

  const title = document.createElement('h1');
  title.id = 'device-gate-title';
  title.textContent = '建议使用桌面设备';

  const message = document.createElement('p');
  message.className = 'status-text';
  message.textContent =
    '本体验需要在带摄像头的桌面浏览器中双手操作，手机 / 平板暂不适配。';

  const continueButton = document.createElement('button');
  continueButton.className = 'primary-action';
  continueButton.type = 'button';
  continueButton.textContent = '仍要继续';
  continueButton.addEventListener(
    'click',
    () => {
      overlay.remove();
      onContinue();
    },
    { once: true },
  );

  panel.append(eyebrow, title, message, continueButton);
  overlay.append(panel);
  document.body.append(overlay);
  continueButton.focus();
}
