import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const APP_SOURCE = readFileSync(resolve(process.cwd(), 'src/app.ts'), 'utf8');
const STYLES = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

describe('single-body focus UI', () => {
  it('uses the shared 0.5s index-finger hold for the right-side return card', () => {
    expect(INDEX_HTML).toContain('id="planet-focus-return-button"');
    expect(INDEX_HTML).toContain('SOLAR SYSTEM · RETURN');
    expect(INDEX_HTML).toContain('aria-label="长按返回太阳系"');
    expect(INDEX_HTML).toContain('class="planet-focus-action-card-fill"');
    expect(INDEX_HTML).toContain('class="planet-focus-action-card-scan"');
    expect(INDEX_HTML).toContain(
      'class="planet-focus-action-card-ring-progress"',
    );
    expect(APP_SOURCE).toContain(
      'const PLANET_FOCUS_RETURN_HOLD_MS = 500',
    );
    expect(APP_SOURCE).toContain(
      'function updatePlanetFocusReturnButtonHandHold(',
    );
    expect(APP_SOURCE).toContain(
      "audioLayer.onUiHold('planet-focus-return', holdUpdate)",
    );
    expect(APP_SOURCE).toContain('planetFocusReturnNeedsClear = true');
    expect(APP_SOURCE).toContain("'focus-return-ui-hold'");
    expect(APP_SOURCE).not.toContain(
      "planetFocusReturnButton.addEventListener('click'",
    );
    expect(APP_SOURCE).toContain(
      'solarPreviewEnabled || isFocusVisualState(interaction.state)',
    );
    expect(STYLES).toMatch(
      /\.planet-focus-return-button\s*\{[\s\S]*?right: var\(--demo-hud-inline-inset\);[\s\S]*?width: var\(--demo-hud-card-width\)/,
    );
  });

  it('keeps the Earth-Moon switch card and its compact two-column layout', () => {
    expect(INDEX_HTML).toContain('id="planet-focus-switch-button"');
    expect(INDEX_HTML).toContain('id="planet-focus-switch-label"');
    expect(INDEX_HTML).toContain('id="planet-focus-switch-context"');
    expect(STYLES).toMatch(
      /\.planet-focus-switch-button,\s*\.demo-hand-model-button,\s*\.planet-focus-return-button\s*\{[\s\S]*?grid-template-areas:[\s\S]*?"reactor copy"[\s\S]*?"reactor readout"[\s\S]*?width: min\(344px, 100%\)/,
    );
    expect(STYLES).toMatch(
      /\.planet-focus-switch-button,\s*\.demo-hand-model-button,\s*\.planet-focus-return-button\s*\{[\s\S]*?--hud-accent: 127, 216, 255/,
    );
  });
});
