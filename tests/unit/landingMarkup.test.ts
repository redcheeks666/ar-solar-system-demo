import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const MAIN_SOURCE = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');
const BACKDROP_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/landing/landingSolarBackdrop.ts'),
  'utf8',
);

describe('public landing page shell', () => {
  it('renders the three scrollable sections as static HTML', () => {
    expect(INDEX_HTML).toContain('id="landing-hero"');
    expect(INDEX_HTML).toContain('id="gestures"');
    expect(INDEX_HTML).toContain('id="follow"');
    expect(INDEX_HTML).toContain('抬起双手，');
    expect(INDEX_HTML).toContain('手势玩法');
    expect(INDEX_HTML).toContain('开源项目');
  });

  it('contains all ten gesture cards and their three tiers', () => {
    expect(INDEX_HTML.match(/class="gesture-number"/g)).toHaveLength(10);
    expect(INDEX_HTML).toContain('核心 · 主线闭环');
    expect(INDEX_HTML).toContain('进阶 · 展开后操作');
    expect(INDEX_HTML).toContain('辅助 · 特殊与演示');
    expect(INDEX_HTML).toContain('召唤太阳系');
    expect(INDEX_HTML).toContain('显示手部骨架');
  });

  it('links the open-source repository instead of personal social accounts', () => {
    expect(INDEX_HTML).toContain('https://github.com/redcheeks666/ar-solar-system-demo');
    expect(INDEX_HTML).not.toContain('douyin-qr.png');
    expect(INDEX_HTML).not.toContain('抖音号');
  });

  it('keeps the app shell separate and provides a return control', () => {
    expect(INDEX_HTML).toMatch(/id="app" class="app-shell" hidden/);
    expect(INDEX_HTML).toContain('id="experience-return"');
    expect(MAIN_SOURCE).toContain("route === 'landing'");
    expect(MAIN_SOURCE).toContain("route === 'solar-preview'");
  });
});

describe('landing backdrop guard timing', () => {
  it('loads the landing implementation only after the global fallback installs', () => {
    expect(MAIN_SOURCE.indexOf('installGlobalErrorFallback();')).toBeLessThan(
      MAIN_SOURCE.indexOf("import('./landing/landing')"),
    );
  });

  it('reuses the existing renderer and solar system with a static fallback', () => {
    expect(BACKDROP_SOURCE).toContain('TransparentSceneRenderer');
    expect(BACKDROP_SOURCE).toContain('CodePlaceholderSolarSystem');
    expect(BACKDROP_SOURCE).toContain('shouldUseStaticLandingBackdrop');
    expect(BACKDROP_SOURCE).toContain('setOpeningProgress(1)');
    expect(BACKDROP_SOURCE).toContain('setStaticBackdrop(hero, canvas)');
  });
});
