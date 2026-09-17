import {
  getSfxFileUrl,
  loadSfxManifest,
  type SfxId,
  type SfxManifest,
  type SfxManifestAsset,
} from './sfxManifest';

export interface OneShotOptions {
  rate?: number;
  gainMul?: number;
}

export interface LoopStartOptions {
  fadeMs?: number;
  gain?: number;
  rate?: number;
}

export interface LoopStopOptions {
  fadeMs?: number;
}

export interface LoopParams {
  /** Multiplier applied to the manifest gain. */
  gain?: number;
  rate?: number;
}

interface LoopPlayback {
  source: AudioBufferSourceNode;
  gain: GainNode;
  stopTimer: ReturnType<typeof setTimeout> | null;
}

const DEFAULT_LOOP_FADE_MS = 180;
const LOOP_PARAM_TIME_CONSTANT_SECONDS = 0.08;
const ONE_SHOT_REPEAT_GUARD_SECONDS = 0.05;
const MASTER_FADE_SECONDS = 0.05;
const AMBIENT_VISIBILITY_FADE_SECONDS = 0.3;

export class AudioEngine {
  private readonly masterGain: GainNode;
  private readonly sfxBus: GainNode;
  private readonly loopBus: GainNode;
  private readonly ambientBus: GainNode;
  private readonly buffers = new Map<SfxId, AudioBuffer>();
  private readonly activeLoops = new Map<SfxId, LoopPlayback>();
  private readonly desiredLoops = new Map<SfxId, LoopStartOptions>();
  private readonly loopParams = new Map<SfxId, LoopParams>();
  private readonly lastOneShotAt = new Map<SfxId, number>();
  private manifest: SfxManifest | null = null;
  private loadPromise: Promise<void> | null = null;
  private ambientHidden = false;
  private muted: boolean;
  private disposed = false;

  constructor(
    private readonly context: AudioContext,
    options: { muted?: boolean } = {},
  ) {
    this.muted = options.muted ?? false;
    this.masterGain = context.createGain();
    this.sfxBus = context.createGain();
    this.loopBus = context.createGain();
    this.ambientBus = context.createGain();

    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.sfxBus.gain.value = 1;
    this.loopBus.gain.value = 1;
    this.ambientBus.gain.value = 1;

    this.sfxBus.connect(this.masterGain);
    this.loopBus.connect(this.masterGain);
    this.ambientBus.connect(this.masterGain);
    this.masterGain.connect(context.destination);
  }

  get isLoaded(): boolean {
    return this.manifest !== null;
  }

  load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadAssets();
    return this.loadPromise;
  }

  resume(): void {
    if (this.context.state === 'suspended') {
      void this.context.resume().catch((error: unknown) => {
        console.warn('[Audio] AudioContext resume failed.', error);
      });
    }
  }

  playOneShot(id: SfxId, options: OneShotOptions = {}): void {
    if (this.disposed) {
      return;
    }

    const asset = this.manifest?.assetsById.get(id);
    const buffer = this.buffers.get(id);

    if (!asset || !buffer) {
      return;
    }

    const now = this.context.currentTime;
    const lastPlayedAt = this.lastOneShotAt.get(id);

    if (
      lastPlayedAt !== undefined &&
      now - lastPlayedAt < ONE_SHOT_REPEAT_GUARD_SECONDS
    ) {
      return;
    }

    this.lastOneShotAt.set(id, now);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = clampRate(options.rate ?? 1);
    gain.gain.value =
      this.getBaseGain(asset) * Math.max(0, options.gainMul ?? 1);
    source.connect(gain);
    gain.connect(this.sfxBus);
    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
    }, { once: true });
    source.start();

  }

  startLoop(id: SfxId, options: LoopStartOptions = {}): void {
    if (this.disposed) {
      return;
    }

    const normalizedOptions = {
      fadeMs: options.fadeMs ?? DEFAULT_LOOP_FADE_MS,
      gain: options.gain,
      rate: options.rate,
    };
    this.desiredLoops.set(id, normalizedOptions);

    if (options.gain !== undefined || options.rate !== undefined) {
      this.loopParams.set(id, {
        ...this.loopParams.get(id),
        gain: options.gain ?? this.loopParams.get(id)?.gain,
        rate: options.rate ?? this.loopParams.get(id)?.rate,
      });
    }

    const active = this.activeLoops.get(id);
    const asset = this.manifest?.assetsById.get(id);
    const buffer = this.buffers.get(id);

    if (active) {
      if (active.stopTimer !== null) {
        clearTimeout(active.stopTimer);
        active.stopTimer = null;
      }
      this.applyLoopParams(id, active, normalizedOptions.fadeMs);
      return;
    }

    if (!asset || !asset.loop || !buffer) {
      return;
    }

    const now = this.context.currentTime;
    const params = this.loopParams.get(id);
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = clampRate(params?.rate ?? 1);
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(id === 'ambient-solar-loop' ? this.ambientBus : this.loopBus);

    const playback: LoopPlayback = { source, gain, stopTimer: null };
    this.activeLoops.set(id, playback);
    source.addEventListener('ended', () => {
      if (this.activeLoops.get(id) === playback) {
        this.activeLoops.delete(id);
      }
      source.disconnect();
      gain.disconnect();
    }, { once: true });
    source.start();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(
      this.getLoopTargetGain(id),
      now + Math.max(0, normalizedOptions.fadeMs) / 1000,
    );
  }

  stopLoop(id: SfxId, options: LoopStopOptions = {}): void {
    this.desiredLoops.delete(id);
    const active = this.activeLoops.get(id);

    if (!active || active.stopTimer !== null) {
      return;
    }

    const fadeMs = Math.max(0, options.fadeMs ?? DEFAULT_LOOP_FADE_MS);
    const now = this.context.currentTime;
    holdAudioParam(active.gain.gain, now);
    active.gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
    active.stopTimer = setTimeout(() => {
      active.stopTimer = null;
      try {
        active.source.stop();
      } catch {
        // The source may already have ended during page teardown.
      }
    }, fadeMs + 20);
  }

  setLoopParams(id: SfxId, params: LoopParams): void {
    this.loopParams.set(id, {
      ...this.loopParams.get(id),
      ...params,
    });

    const active = this.activeLoops.get(id);
    if (active) {
      this.applyLoopParams(id, active);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    const now = this.context.currentTime;
    holdAudioParam(this.masterGain.gain, now);
    this.masterGain.gain.linearRampToValueAtTime(
      muted ? 0 : 1,
      now + MASTER_FADE_SECONDS,
    );
  }

  setAmbientHidden(hidden: boolean): void {
    if (this.ambientHidden === hidden) {
      return;
    }

    this.ambientHidden = hidden;
    const now = this.context.currentTime;
    holdAudioParam(this.ambientBus.gain, now);
    this.ambientBus.gain.linearRampToValueAtTime(
      hidden ? 0 : 1,
      now + AMBIENT_VISIBILITY_FADE_SECONDS,
    );
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.desiredLoops.clear();
    this.activeLoops.forEach((active) => {
      if (active.stopTimer !== null) {
        clearTimeout(active.stopTimer);
      }
      try {
        active.source.stop();
      } catch {
        // Already stopped.
      }
      active.source.disconnect();
      active.gain.disconnect();
    });
    this.activeLoops.clear();
    this.sfxBus.disconnect();
    this.loopBus.disconnect();
    this.ambientBus.disconnect();
    this.masterGain.disconnect();
    void this.context.close().catch(() => undefined);
  }

  private async loadAssets(): Promise<void> {
    const manifest = await loadSfxManifest();
    this.manifest = manifest;
    const decodedByFile = new Map<string, AudioBuffer>();

    await Promise.all(
      manifest.assets.map(async (asset) => {
        if (!asset.file) {
          return;
        }

        try {
          let buffer = decodedByFile.get(asset.file);
          if (!buffer) {
            const response = await fetch(getSfxFileUrl(asset.file));
            if (!response.ok) {
              throw new Error(`request failed (${response.status})`);
            }
            buffer = await this.context.decodeAudioData(await response.arrayBuffer());
            decodedByFile.set(asset.file, buffer);
          }
          this.buffers.set(asset.id, buffer);
        } catch (error) {
          console.warn(`[Audio] Skipping undecodable SFX ${asset.id}.`, error);
        }
      }),
    );

    manifest.assets.forEach((asset) => {
      if (!asset.reuseOf) {
        return;
      }
      const reusedBuffer = this.resolveReusedBuffer(asset, new Set());
      if (reusedBuffer) {
        this.buffers.set(asset.id, reusedBuffer);
      }
    });

    this.desiredLoops.forEach((options, id) => this.startLoop(id, options));
  }

  private resolveReusedBuffer(
    asset: SfxManifestAsset,
    visited: Set<SfxId>,
  ): AudioBuffer | null {
    if (this.buffers.has(asset.id)) {
      return this.buffers.get(asset.id) ?? null;
    }
    if (!asset.reuseOf || visited.has(asset.id)) {
      return null;
    }

    visited.add(asset.id);
    const source = this.manifest?.assetsById.get(asset.reuseOf);
    return source ? this.resolveReusedBuffer(source, visited) : null;
  }

  private applyLoopParams(
    id: SfxId,
    active: LoopPlayback,
    fadeMs?: number,
  ): void {
    const now = this.context.currentTime;
    const params = this.loopParams.get(id);
    const gainTimeConstant =
      fadeMs === undefined
        ? LOOP_PARAM_TIME_CONSTANT_SECONDS
        : Math.max(fadeMs / 1000 / 3, 0.01);
    holdAudioParam(active.gain.gain, now);
    holdAudioParam(active.source.playbackRate, now);
    active.gain.gain.setTargetAtTime(
      this.getLoopTargetGain(id),
      now,
      gainTimeConstant,
    );
    active.source.playbackRate.setTargetAtTime(
      clampRate(params?.rate ?? 1),
      now,
      LOOP_PARAM_TIME_CONSTANT_SECONDS,
    );
  }

  private getLoopTargetGain(id: SfxId): number {
    const asset = this.manifest?.assetsById.get(id);
    return asset
      ? this.getBaseGain(asset) * Math.max(0, this.loopParams.get(id)?.gain ?? 1)
      : 0;
  }

  private getBaseGain(asset: SfxManifestAsset): number {
    return asset.suggestedGain;
  }
}

function clampRate(rate: number): number {
  return Math.max(0.25, Math.min(4, rate));
}

function holdAudioParam(param: AudioParam, time: number): void {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(time);
    return;
  }

  const value = param.value;
  param.cancelScheduledValues(time);
  param.setValueAtTime(value, time);
}
