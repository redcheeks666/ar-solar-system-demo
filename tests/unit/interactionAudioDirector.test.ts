import { describe, expect, it } from 'vitest';
import {
  deriveAudioActions,
  InteractionAudioDirector,
  type AudioAction,
} from '../../src/audio/interactionAudioDirector';
import type { SfxId } from '../../src/audio/sfxManifest';
import type { InteractionState } from '../../src/utils/types';

function labels(actions: readonly AudioAction[]): string[] {
  return actions.map((action) => `${action.type}:${action.id}`);
}

function sortedLabels(actions: readonly AudioAction[]): string[] {
  return labels(actions).sort();
}

function activeLoops(...ids: SfxId[]): ReadonlySet<SfxId> {
  return new Set(ids);
}

describe('deriveAudioActions reduced transition table', () => {
  const cases: Array<{
    name: string;
    prev: InteractionState;
    next: InteractionState;
    loops?: SfxId[];
    expected: string[];
  }> = [
    {
      name: 'EmptyIdle -> HandsClosed is silent',
      prev: 'EmptyIdle',
      next: 'HandsClosed',
      expected: [],
    },
    {
      name: 'HandsClosed -> PullArmed is silent',
      prev: 'HandsClosed',
      next: 'PullArmed',
      expected: [],
    },
    {
      name: 'PullArmed -> SolarOpening is silent',
      prev: 'PullArmed',
      next: 'SolarOpening',
      expected: [],
    },
    {
      name: 'SolarOpening -> SolarActive starts the selected ambience',
      prev: 'SolarOpening',
      next: 'SolarActive',
      expected: ['startLoop:ambient-solar-loop'],
    },
    {
      name: 'SolarOpening -> SolarActive does not duplicate ambience',
      prev: 'SolarOpening',
      next: 'SolarActive',
      loops: ['ambient-solar-loop'],
      expected: [],
    },
    ...(['SolarActive', 'SolarFreeHover'] as const).map((next) => ({
      name: `SolarHandleControl -> ${next} plays release`,
      prev: 'SolarHandleControl' as const,
      next,
      loops: ['ambient-solar-loop'] as SfxId[],
      expected: ['play:system-release'],
    })),
    {
      name: 'PlanetFocusControlled -> PlanetFocusFloating plays focus release',
      prev: 'PlanetFocusControlled',
      next: 'PlanetFocusFloating',
      loops: ['ambient-solar-loop'],
      expected: ['play:focus-release'],
    },
    ...(['SolarActive', 'SolarFreeHover'] as const).map((next) => ({
      name: `BodyReturning -> ${next} lands silently`,
      prev: 'BodyReturning' as const,
      next,
      loops: ['ambient-solar-loop'] as SfxId[],
      expected: [],
    })),
    {
      name: 'SolarClosing -> EmptyIdle fades ambience',
      prev: 'SolarClosing',
      next: 'EmptyIdle',
      loops: ['ambient-solar-loop'],
      expected: ['stopLoop:ambient-solar-loop'],
    },
    {
      name: 'CameraReady -> EmptyIdle stays quiet',
      prev: 'CameraReady',
      next: 'EmptyIdle',
      expected: [],
    },
  ];

  cases.forEach(({ name, prev, next, loops = [], expected }) => {
    it(name, () => {
      const actions = deriveAudioActions(prev, next, {
        activeLoops: activeLoops(...loops),
      });
      expect(sortedLabels(actions)).toEqual([...expected].sort());
    });
  });
});

describe('InteractionAudioDirector loop reconciliation', () => {
  it('clears ambience and a charging UI loop on entry to EmptyIdle', () => {
    const director = new InteractionAudioDirector();
    director.onStateChange('SolarOpening', 'SolarActive', 0);
    director.onUiHold('demo-hand-model', {
      reason: 'charging',
      triggered: false,
    });

    const actions = director.onStateChange('SolarClosing', 'EmptyIdle', 20);

    expect([...director.getActiveLoops()]).toEqual([]);
    expect(sortedLabels(actions)).toEqual([
      'stopLoop:ambient-solar-loop',
      'stopLoop:ui-hold-loop',
    ].sort());
  });

  it('clears UI hold bookkeeping when returning to EmptyIdle', () => {
    const director = new InteractionAudioDirector();
    director.onUiHold('demo-hand-model', {
      reason: 'charging',
      triggered: false,
    });
    director.onStateChange('SolarClosing', 'EmptyIdle', 10);

    expect(director.cancelUiHold('demo-hand-model')).toEqual([]);
  });
});

describe('InteractionAudioDirector UI hold edges', () => {
  it('handles UI hold start, success, interruption, and repeated charging', () => {
    const director = new InteractionAudioDirector();
    const charging = { reason: 'charging' as const, triggered: false };

    expect(labels(director.onUiHold('demo-hand-model', charging))).toEqual([
      'startLoop:ui-hold-loop',
    ]);
    expect(director.onUiHold('demo-hand-model', charging)).toEqual([]);
    expect(sortedLabels(director.onUiHold('demo-hand-model', {
      reason: 'charged',
      triggered: true,
    }))).toEqual([
      'play:ui-hold-success',
      'stopLoop:ui-hold-loop',
    ].sort());

    expect(labels(director.onUiHold('earth-moon-switch', charging))).toEqual([
      'startLoop:ui-hold-loop',
    ]);
    expect(sortedLabels(director.onUiHold('earth-moon-switch', {
      reason: 'waiting-for-index-finger',
      triggered: false,
    }))).toEqual([
      'play:ui-hold-cancel',
      'stopLoop:ui-hold-loop',
    ].sort());
    expect(director.cancelUiHold('earth-moon-switch')).toEqual([]);
  });

  it('shares one UI hold loop between all three cards', () => {
    const director = new InteractionAudioDirector();
    const charging = { reason: 'charging' as const, triggered: false };
    director.onUiHold('demo-hand-model', charging);

    expect(director.onUiHold('earth-moon-switch', charging)).toEqual([]);
    expect(director.onUiHold('planet-focus-return', charging)).toEqual([]);
    expect(labels(director.cancelUiHold('demo-hand-model'))).toEqual([
      'play:ui-hold-cancel',
    ]);
    expect(labels(director.cancelUiHold('earth-moon-switch'))).toEqual([
      'play:ui-hold-cancel',
    ]);
    expect(sortedLabels(director.cancelUiHold('planet-focus-return'))).toEqual([
      'play:ui-hold-cancel',
      'stopLoop:ui-hold-loop',
    ].sort());
  });
});
