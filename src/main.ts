import './styles.css';
import { showFatalErrorOverlay } from './rendering/fatalErrorOverlay';
import { installGlobalErrorFallback } from './rendering/globalErrorFallback';
import { isWebGL2Available } from './rendering/webglSupport';

function bootstrap(): void {
  installGlobalErrorFallback();

  if (!isWebGL2Available()) {
    showFatalErrorOverlay({
      title: '当前设备无法运行此体验',
      message:
        '当前浏览器或设备不支持 WebGL2，无法运行该体验。请更换较新的桌面浏览器（Chrome / Edge / Safari）后重试。',
    });
    return;
  }

  void import('./app');
}

bootstrap();
