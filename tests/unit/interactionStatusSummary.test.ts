import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PLANET_ACTIVATION_SNAPSHOT } from '../../src/interaction/planetActivationController';
import { EMPTY_PLANET_FOCUS_SNAPSHOT } from '../../src/interaction/planetFocusController';
import { EMPTY_PLANET_RETURN_WAVE_SNAPSHOT } from '../../src/interaction/planetReturnWave';
import { InteractionStatusSummary } from '../../src/rendering/interactionStatusSummary';
import type { InteractiveCelestialBodyId } from '../../src/solar/solarSystemData';
import type { DebugSnapshot, InteractionState } from '../../src/utils/types';

interface ElementStub {
  className: string;
  textContent: string;
  setAttribute: ReturnType<typeof vi.fn>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('interaction status summary body names', () => {
  it.each([
    ['PlanetActivated', '木星已激活'],
    ['PlanetFocusControlled', '正在控制木星'],
    ['PlanetFocusFloating', '木星悬浮中'],
  ] as const)('shows the Chinese body name in %s', (state, expected) => {
    expect(renderOperationTitle(state, 'jupiter', null)).toBe(expected);
  });

  it('prefers the currently focused Moon over the activated Earth group', () => {
    expect(
      renderOperationTitle('PlanetFocusControlled', 'earth', 'moon'),
    ).toBe('正在控制月球');
    expect(
      renderOperationTitle('PlanetFocusFloating', 'earth', 'moon'),
    ).toBe('月球悬浮中');
  });

  it.each([
    ['PlanetActivated', '天体已激活'],
    ['PlanetFocusControlled', '正在控制天体'],
    ['PlanetFocusFloating', '天体悬浮中'],
  ] as const)('uses the neutral Chinese fallback in %s', (state, expected) => {
    expect(renderOperationTitle(state, null, null)).toBe(expected);
  });
});

function renderOperationTitle(
  interactionState: InteractionState,
  activatedBody: InteractiveCelestialBodyId | null,
  focusedBody: InteractiveCelestialBodyId | null,
): string {
  const renderedChildren: ElementStub[] = [];
  const container = {
    hidden: false,
    replaceChildren: (...children: ElementStub[]) => {
      renderedChildren.splice(0, renderedChildren.length, ...children);
    },
  } as unknown as HTMLElement;

  vi.stubGlobal('document', {
    createElement: () => ({
      className: '',
      textContent: '',
      setAttribute: vi.fn(),
    }),
  });
  vi.spyOn(performance, 'now').mockReturnValue(1_000);

  const summary = new InteractionStatusSummary(container, 'operation-only');
  summary.update({
    cameraStatus: 'granted',
    trackingStatus: 'ready',
    interactionState,
    activatedBody,
    pinchState: 'open',
    planetActivation: {
      ...EMPTY_PLANET_ACTIVATION_SNAPSHOT,
      activatedBody,
    },
    planetFocus: {
      ...EMPTY_PLANET_FOCUS_SNAPSHOT,
      focusedBody,
    },
    planetReturnWave: EMPTY_PLANET_RETURN_WAVE_SNAPSHOT,
  } as DebugSnapshot);

  return renderedChildren.at(-1)?.textContent ?? '';
}
