import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const APP_SOURCE = readFileSync(resolve(process.cwd(), 'src/app.ts'), 'utf8');
const STYLES = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

describe('single-body focus UI', () => {
  it('does not render a return button or hidden return hit target', () => {
    expect(INDEX_HTML).not.toContain('id="planet-return-button"');
    expect(INDEX_HTML).not.toContain('长按返回太阳系');
    expect(APP_SOURCE).not.toContain('index-finger-return-button-hold');
    expect(APP_SOURCE).not.toContain('planetReturnButton');
  });

  it('keeps the Earth-Moon switch card and its compact two-column layout', () => {
    expect(INDEX_HTML).toContain('id="planet-focus-switch-button"');
    expect(INDEX_HTML).toContain('id="planet-focus-switch-label"');
    expect(INDEX_HTML).toContain('id="planet-focus-switch-context"');
    expect(STYLES).toMatch(
      /\.planet-focus-switch-button,\s*\.demo-hand-model-button\s*\{[\s\S]*?grid-template-areas:[\s\S]*?"reactor copy"[\s\S]*?"reactor readout"[\s\S]*?width: min\(344px, 100%\)/,
    );
    expect(STYLES).toMatch(
      /\.planet-focus-switch-button,\s*\.demo-hand-model-button\s*\{[\s\S]*?--hud-accent: 127, 216, 255/,
    );
  });
});
