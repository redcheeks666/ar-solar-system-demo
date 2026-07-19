import { showFatalErrorOverlay } from './fatalErrorOverlay';

let installed = false;

export function installGlobalErrorFallback(): void {
  if (installed) {
    return;
  }

  installed = true;
  window.addEventListener('error', handleUnhandledError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

function handleUnhandledError(event: ErrorEvent): void {
  console.error(
    '[AR Solar System] 未捕获的运行错误。',
    event.error ?? event.message,
  );
  showUnexpectedFailure();
}

function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  console.error(
    '[AR Solar System] 未处理的异步错误。',
    event.reason,
  );
  showUnexpectedFailure();
}

function showUnexpectedFailure(): void {
  showFatalErrorOverlay({
    title: '体验暂时无法继续',
    message:
      '页面运行时遇到意外错误。请刷新页面重试；如果问题持续出现，请更换较新的桌面浏览器。',
  });
}
