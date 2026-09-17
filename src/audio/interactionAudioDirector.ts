import type { InteractionState } from '../utils/types';
import { AudioEngine } from './audioEngine';
import type { SfxId } from './sfxManifest';

export type AudioAction =
  | {
      type: 'play';
      id: SfxId;
      rate?: number;
      gainMul?: number;
    }
  | {
      type: 'startLoop';
      id: SfxId;
      fadeMs: number;
      gain?: number;
      rate?: number;
    }
  | {
      type: 'stopLoop';
      id: SfxId;
      fadeMs: number;
    };

export interface StateChangeAudioContext {
  activeLoops?: ReadonlySet<SfxId>;
}

export type UiHoldAudioSource =
  | 'demo-hand-model'
  | 'earth-moon-switch'
  | 'planet-focus-return';

export interface UiHoldAudioUpdate {
  reason: 'inactive' | 'invalid-rect' | 'waiting-for-index-finger' | 'charging' | 'charged';
  triggered: boolean;
}

/**
 * Pure state-transition table. Active loops are supplied by the caller so the function can
 * reconcile starts/stops without hidden Web Audio or clock state.
 */
export function deriveAudioActions(
  prevState: InteractionState,
  nextState: InteractionState,
  frameContext: StateChangeAudioContext = {},
): AudioAction[] {
  if (prevState === nextState) {
    return [];
  }

  const actions: AudioAction[] = [];
  const activeLoops = new Set(frameContext.activeLoops ?? []);
  const play = (id: SfxId): void => {
    actions.push({ type: 'play', id });
  };
  const startLoop = (
    id: SfxId,
    fadeMs: number,
    params: { gain?: number; rate?: number } = {},
  ): void => {
    if (activeLoops.has(id)) {
      return;
    }
    activeLoops.add(id);
    actions.push({ type: 'startLoop', id, fadeMs, ...params });
  };
  const stopLoop = (id: SfxId, fadeMs: number): void => {
    if (!activeLoops.has(id)) {
      return;
    }
    activeLoops.delete(id);
    actions.push({ type: 'stopLoop', id, fadeMs });
  };

  if (prevState === 'SolarOpening' && nextState === 'SolarActive') {
    startLoop('ambient-solar-loop', 1500);
  }

  if (
    prevState === 'SolarHandleControl' &&
    (nextState === 'SolarActive' || nextState === 'SolarFreeHover')
  ) {
    play('system-release');
  }

  if (
    prevState === 'PlanetFocusControlled' &&
    nextState === 'PlanetFocusFloating'
  ) {
    play('focus-release');
  }

  if (nextState === 'EmptyIdle') {
    [...activeLoops].forEach((id) => {
      stopLoop(id, id === 'ambient-solar-loop' ? 800 : 150);
    });
  }

  return actions;
}

export class InteractionAudioDirector {
  private readonly activeLoops = new Set<SfxId>();
  private readonly uiHoldReasons = new Map<UiHoldAudioSource, UiHoldAudioUpdate['reason']>();
  private readonly chargingUiSources = new Set<UiHoldAudioSource>();

  onStateChange(
    prevState: InteractionState,
    nextState: InteractionState,
    _timestamp: number,
  ): AudioAction[] {
    const actions = deriveAudioActions(prevState, nextState, {
      activeLoops: this.activeLoops,
    });
    this.applyLoopActions(actions);

    if (nextState === 'EmptyIdle') {
      this.chargingUiSources.clear();
      this.uiHoldReasons.clear();
    }

    return actions;
  }

  onUiHold(
    source: UiHoldAudioSource,
    update: UiHoldAudioUpdate,
  ): AudioAction[] {
    const actions: AudioAction[] = [];
    const previousReason = this.uiHoldReasons.get(source) ?? 'inactive';

    if (update.reason === 'charging' && previousReason !== 'charging') {
      const hadChargingSource = this.chargingUiSources.size > 0;
      this.chargingUiSources.add(source);
      if (!hadChargingSource && !this.activeLoops.has('ui-hold-loop')) {
        actions.push({
          type: 'startLoop',
          id: 'ui-hold-loop',
          fadeMs: 100,
        });
      }
    }

    if (update.triggered && previousReason === 'charging') {
      actions.push({ type: 'play', id: 'ui-hold-success' });
      this.chargingUiSources.delete(source);
      this.stopSharedUiLoopIfUnused(actions);
    } else if (previousReason === 'charging' && update.reason !== 'charging') {
      actions.push({ type: 'play', id: 'ui-hold-cancel' });
      this.chargingUiSources.delete(source);
      this.stopSharedUiLoopIfUnused(actions);
    }

    this.uiHoldReasons.set(source, update.reason);
    this.applyLoopActions(actions);
    return actions;
  }

  cancelUiHold(source: UiHoldAudioSource): AudioAction[] {
    return this.onUiHold(source, { reason: 'inactive', triggered: false });
  }

  getActiveLoops(): ReadonlySet<SfxId> {
    return new Set(this.activeLoops);
  }

  private stopSharedUiLoopIfUnused(actions: AudioAction[]): void {
    if (
      this.chargingUiSources.size === 0 &&
      this.activeLoops.has('ui-hold-loop')
    ) {
      actions.push({ type: 'stopLoop', id: 'ui-hold-loop', fadeMs: 150 });
    }
  }

  private applyLoopActions(actions: readonly AudioAction[]): void {
    actions.forEach((action) => {
      if (action.type === 'startLoop') {
        this.activeLoops.add(action.id);
      } else if (action.type === 'stopLoop') {
        this.activeLoops.delete(action.id);
      }
    });
  }
}

export class InteractionAudioLayer {
  private readonly director: InteractionAudioDirector;
  private engine: AudioEngine | null = null;
  private loadPromise: Promise<void> | null = null;
  private muted: boolean;

  constructor(options: { muted?: boolean } = {}) {
    this.muted = options.muted ?? false;
    this.director = new InteractionAudioDirector();
  }

  initializeFromUserGesture(): Promise<void> {
    if (this.engine) {
      this.engine.resume();
      return this.loadPromise ?? Promise.resolve();
    }

    try {
      this.engine = new AudioEngine(new AudioContext(), { muted: this.muted });
      this.engine.resume();
      this.loadPromise = this.engine
        .load()
        .then(() => {
          this.director.getActiveLoops().forEach((id) => {
            this.engine?.startLoop(id);
          });
        })
        .catch((error: unknown) => {
          console.warn('[Audio] SFX layer failed to initialize; continuing silently.', error);
        });
      return this.loadPromise;
    } catch (error) {
      console.warn('[Audio] Web Audio is unavailable; continuing silently.', error);
      return Promise.resolve();
    }
  }

  onStateChange(
    prevState: InteractionState,
    nextState: InteractionState,
    timestamp: number,
  ): void {
    this.execute(this.director.onStateChange(prevState, nextState, timestamp));
  }

  onUiHold(source: UiHoldAudioSource, update: UiHoldAudioUpdate): void {
    this.execute(this.director.onUiHold(source, update));
  }

  cancelUiHold(source: UiHoldAudioSource): void {
    this.execute(this.director.cancelUiHold(source));
  }

  toggleMuted(): boolean {
    this.muted = !this.muted;
    this.engine?.setMuted(this.muted);
    return this.muted;
  }

  setPageHidden(hidden: boolean): void {
    this.engine?.setAmbientHidden(hidden);
  }

  dispose(): void {
    this.engine?.dispose();
    this.engine = null;
  }

  private execute(actions: readonly AudioAction[]): void {
    const engine = this.engine;
    if (!engine) {
      return;
    }

    actions.forEach((action) => {
      switch (action.type) {
        case 'play':
          engine.playOneShot(action.id, {
            rate: action.rate,
            gainMul: action.gainMul,
          });
          break;
        case 'startLoop':
          engine.startLoop(action.id, {
            fadeMs: action.fadeMs,
            gain: action.gain,
            rate: action.rate,
          });
          break;
        case 'stopLoop':
          engine.stopLoop(action.id, { fadeMs: action.fadeMs });
          break;
      }
    });
  }
}
