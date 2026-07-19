import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const APP_SOURCE = readFileSync(resolve(process.cwd(), 'src/app.ts'), 'utf8');

describe('tracking loading UI', () => {
  it('starts hidden and exposes an indeterminate progress status', () => {
    expect(INDEX_HTML).toMatch(
      /id="loading-panel"[\s\S]*?aria-busy="false"[\s\S]*?hidden/,
    );
    expect(INDEX_HTML).toContain('role="progressbar"');
    expect(INDEX_HTML).toContain('✓ 摄像头已就绪');
    expect(INDEX_HTML).toContain('手势识别模型加载中');
  });

  it('shows during initialization and clears only after tracking is ready', () => {
    expect(APP_SOURCE).toContain('showTrackingLoading();');
    expect(APP_SOURCE).toMatch(
      /await tracking\.initialize\(\);[\s\S]*?hideTrackingLoading\(\);/,
    );
    expect(APP_SOURCE).toContain('showTrackingLoadingError(message);');
  });
});
