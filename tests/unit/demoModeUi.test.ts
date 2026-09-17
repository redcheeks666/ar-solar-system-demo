import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const APP_SOURCE = readFileSync(resolve(process.cwd(), 'src/app.ts'), 'utf8');
const SUMMARY_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/rendering/interactionStatusSummary.ts'),
  'utf8',
);
const CELESTIAL_BODY_SOURCE = readFileSync(
  resolve(process.cwd(), 'src/solar/celestialBody.ts'),
  'utf8',
);
const STYLES = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

describe('demo-mode operation HUD', () => {
  it('uses the title-only summary mode without hiding the summary container', () => {
    expect(APP_SOURCE).toContain("demoModeEnabled ? 'operation-only' : 'full'");
    expect(APP_SOURCE).not.toContain('interactionSummary.hidden = true');

    const compactBranch = SUMMARY_SOURCE.slice(
      SUMMARY_SOURCE.indexOf("if (this.mode === 'operation-only')"),
      SUMMARY_SOURCE.indexOf("const title = document.createElement('p')"),
    );

    expect(compactBranch).toContain(
      'operation.textContent = summary.operationTitle ?? summary.title',
    );
    expect(compactBranch).toContain(
      'this.container.replaceChildren(corners, edge, label, operation)',
    );
    expect(compactBranch).not.toContain('summary.state');
    expect(compactBranch).not.toContain('summary.reason');
    expect(compactBranch).not.toContain('summary.params');
    expect(SUMMARY_SOURCE).toContain(
      'operationTitle: focusedBodyOperationTitle(snapshot)',
    );
    expect(SUMMARY_SOURCE).toContain(
      'title: `${statusBodyNameZh(snapshot)}已激活`',
    );
    expect(SUMMARY_SOURCE).toContain(
      'title: `正在控制${statusBodyNameZh(snapshot)}`',
    );
    expect(SUMMARY_SOURCE).toContain("title: '星球已放下'");
    expect(SUMMARY_SOURCE).toContain(
      'operationTitle: `${statusBodyNameZh(snapshot)}悬浮中`',
    );
    expect(SUMMARY_SOURCE).toContain("    : '天体';");
  });

  it('renders overview body labels from Chinese names with CJK fallbacks', () => {
    expect(CELESTIAL_BODY_SOURCE).toContain(
      'createLabelTexture(this.definition.nameZh)',
    );
    expect(CELESTIAL_BODY_SOURCE).toContain('"PingFang SC"');
    expect(CELESTIAL_BODY_SOURCE).toContain('"Microsoft YaHei"');
    expect(CELESTIAL_BODY_SOURCE).toContain('"Noto Sans CJK SC"');
  });

  it('keeps the compact operation card in the approved cyan HUD family', () => {
    expect(STYLES).toMatch(
      /\.interaction-summary\.demo-operation-hud\s*\{[\s\S]*?--hud-accent: 127, 216, 255/,
    );
    expect(STYLES).toContain('.demo-operation-title');
    expect(STYLES).toContain('.demo-operation-label');
    expect(STYLES).toMatch(
      /\.planet-focus-action-card\s*\{[\s\S]*?0 0 38px rgba\(var\(--hud-accent\), 0\.3\)[\s\S]*?filter: drop-shadow/,
    );
    expect(STYLES).toMatch(
      /\.planet-focus-action-card::before,[\s\S]*?filter: drop-shadow\(0 0 7px rgba\(var\(--hud-accent\), 0\.95\)\)/,
    );
    expect(STYLES).toMatch(
      /\.planet-focus-action-card\.is-charging\s*\{[\s\S]*?animation: planet-hud-glow-pulse/,
    );
    expect(STYLES).toMatch(
      /\.demo-operation-title\s*\{[\s\S]*?text-shadow:/,
    );
  });

  it('anchors the operation and hand-model cards to the same preview overlay', () => {
    const overlayStart = INDEX_HTML.indexOf('id="preview-overlay"');
    const overlayEnd = INDEX_HTML.indexOf('id="debug-toggle"', overlayStart);
    const overlayMarkup = INDEX_HTML.slice(overlayStart, overlayEnd);

    expect(overlayMarkup).toContain('id="interaction-summary"');
    expect(overlayMarkup).toContain('id="demo-hand-model-button"');
    expect(STYLES).toMatch(
      /\.preview-overlay\s*\{[\s\S]*?--demo-hud-inline-inset: 32px;[\s\S]*?--demo-hud-card-width: min\(344px,/,
    );
    expect(STYLES).toMatch(
      /\.interaction-summary\.demo-operation-hud\s*\{[\s\S]*?right: var\(--demo-hud-inline-inset\);[\s\S]*?width: var\(--demo-hud-card-width\)/,
    );
    expect(STYLES).toMatch(
      /\.demo-hand-model-button\s*\{[\s\S]*?right: var\(--demo-hud-inline-inset\);[\s\S]*?width: var\(--demo-hud-card-width\)/,
    );
    expect(STYLES).toMatch(
      /\.planet-focus-return-button\s*\{[\s\S]*?right: var\(--demo-hud-inline-inset\);[\s\S]*?width: var\(--demo-hud-card-width\)/,
    );
  });
});

describe('demo-mode hand skeleton toggle', () => {
  it('renders a demo-only 0.5s hold card that starts switched off', () => {
    expect(INDEX_HTML).toContain('id="demo-hand-model-button"');
    expect(INDEX_HTML).toContain('aria-pressed="false"');
    expect(INDEX_HTML).toContain('id="demo-hand-model-label"');
    expect(INDEX_HTML).toContain('HAND SKELETON · OFF');
    expect(INDEX_HTML).toContain('T-0.5s');
    expect(STYLES).toContain('.demo-hand-model-button');
  });

  it('uses the shared stable index-finger hold and clear-before-retoggle gate', () => {
    expect(APP_SOURCE).toContain('const DEMO_HAND_MODEL_HOLD_MS = 500');
    expect(APP_SOURCE).toContain('let demoHandSkeletonVisible = false');
    expect(APP_SOURCE).toContain('updateIndexFingerUiHold({');
    expect(APP_SOURCE).toContain('demoHandModelNeedsClear = true');
    expect(APP_SOURCE).toContain(
      'debugOverlay.isVisible || (demoModeEnabled && demoHandSkeletonVisible)',
    );
  });
});
