import type { DebugSnapshot } from '../utils/types';

const UPDATE_INTERVAL_MS = 150;

export class DebugOverlay {
  private visible = false;
  private lastRenderTime = 0;
  private readonly visibilityListeners = new Set<(visible: boolean) => void>();

  constructor(
    private readonly panel: HTMLElement,
    private readonly toggleButton: HTMLButtonElement,
  ) {
    this.panel.hidden = true;
    this.toggleButton.addEventListener('click', () => {
      this.setVisible(!this.visible);
    });
  }

  update(snapshot: DebugSnapshot): void {
    if (!this.visible) {
      return;
    }

    const now = performance.now();
    if (now - this.lastRenderTime < UPDATE_INTERVAL_MS) {
      return;
    }

    this.lastRenderTime = now;
    this.panel.replaceChildren(...this.buildRows(snapshot));
  }

  get isVisible(): boolean {
    return this.visible;
  }

  onVisibilityChange(listener: (visible: boolean) => void): void {
    this.visibilityListeners.add(listener);
    listener(this.visible);
  }

  private setVisible(nextVisible: boolean): void {
    this.visible = nextVisible;
    this.panel.hidden = !nextVisible;
    this.toggleButton.setAttribute('aria-pressed', String(nextVisible));
    this.visibilityListeners.forEach((listener) => listener(nextVisible));
  }

  private buildRows(snapshot: DebugSnapshot): HTMLElement[] {
    const rows: Array<[string, string]> = [
      ['FPS', snapshot.fps.toFixed(1)],
      ['Camera', snapshot.cameraStatus],
      ['Tracking', snapshot.trackingStatus],
      ['Tracking error', snapshot.trackingError ?? 'none'],
      ['Pose', snapshot.poseDetected ? 'detected' : 'missing'],
      ['Pose landmarks', String(snapshot.poseLandmarkCount)],
      ['Left hand', snapshot.leftHandDetected ? 'detected' : 'missing'],
      ['Left center', formatPair(snapshot.leftHandCenter.x, snapshot.leftHandCenter.y)],
      ['Right hand', snapshot.rightHandDetected ? 'detected' : 'missing'],
      ['Right center', formatPair(snapshot.rightHandCenter.x, snapshot.rightHandCenter.y)],
      ['Both hands', snapshot.bothHandsVisible ? 'visible' : 'missing'],
      ['Lost-hand hold', snapshot.lostHandHoldActive ? 'active' : 'inactive'],
      ['Hand midpoint', formatPair(snapshot.handMidpoint.x, snapshot.handMidpoint.y)],
      ['Hand direction', formatPair(snapshot.handDirection.x, snapshot.handDirection.y)],
      ['State', snapshot.interactionState],
      ['Chest X/Y', formatPair(snapshot.chestAnchor.x, snapshot.chestAnchor.y)],
      ['Hand distance', formatNullable(snapshot.handDistance)],
      ['Distance velocity', formatNullable(snapshot.handDistanceVelocity)],
      ['openProgress', snapshot.openProgress.toFixed(2)],
      ['Solar scale', snapshot.solarScale.toFixed(2)],
      ['Hovered body', snapshot.hoveredBody ?? 'none'],
      ['Grabbed body', snapshot.grabbedBody ?? 'none'],
      ['Pinch', snapshot.pinchState],
      ['Throw velocity', formatNullable(snapshot.throwVelocity)],
      ['Renderer', snapshot.rendererReady ? 'ready' : 'not ready'],
      [
        'Video source',
        formatSize(snapshot.videoSourceSize.width, snapshot.videoSourceSize.height),
      ],
      [
        'Display',
        formatSize(snapshot.videoDisplaySize.width, snapshot.videoDisplaySize.height),
      ],
      ['Display ratio', formatNullable(snapshot.videoDisplayRatio)],
      ['object-fit', snapshot.videoObjectFit],
      [
        'Canvas display',
        formatSize(
          snapshot.canvasDisplaySize.width,
          snapshot.canvasDisplaySize.height,
        ),
      ],
      [
        'Canvas buffer',
        formatSize(snapshot.canvasBufferSize.width, snapshot.canvasBufferSize.height),
      ],
      [
        'Overlay',
        formatSize(
          snapshot.overlayDisplaySize.width,
          snapshot.overlayDisplaySize.height,
        ),
      ],
      [
        'Renderer size',
        `${snapshot.canvasSize.width} x ${snapshot.canvasSize.height}`,
      ],
    ];

    return rows.map(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'debug-row';

      const labelElement = document.createElement('span');
      labelElement.className = 'debug-label';
      labelElement.textContent = label;

      const valueElement = document.createElement('span');
      valueElement.className = 'debug-value';
      valueElement.textContent = value;

      row.append(labelElement, valueElement);
      return row;
    });
  }
}

function formatNullable(value: number | null): string {
  return value === null ? 'n/a' : value.toFixed(3);
}

function formatPair(x: number | null, y: number | null): string {
  if (x === null || y === null) {
    return 'n/a';
  }

  return `${x.toFixed(3)}, ${y.toFixed(3)}`;
}

function formatSize(width: number | null, height: number | null): string {
  if (width === null || height === null) {
    return 'n/a';
  }

  return `${Math.round(width)} x ${Math.round(height)}`;
}
