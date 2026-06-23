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
      ['Hand axis angle', formatNullable(snapshot.handPrimitives.handAxisAngle)],
      [
        'Primitive confidence',
        formatNullable(snapshot.handPrimitives.trackingConfidence),
      ],
      [
        'Close / pull score',
        `${snapshot.handPrimitives.closeIntentScore.toFixed(2)} / ${snapshot.handPrimitives.pullIntentScore.toFixed(2)}`,
      ],
      ['Primitive reason', snapshot.handPrimitives.transitionReason],
      ['Startup state', snapshot.interactionState],
      ['Startup reason', snapshot.startupTransitionReason],
      ['Body ref X/Y', formatPair(snapshot.chestAnchor.x, snapshot.chestAnchor.y)],
      ['Hand distance', formatNullable(snapshot.handDistance)],
      ['Distance velocity', formatNullable(snapshot.handDistanceVelocity)],
      [
        'Calibration',
        snapshot.gestureCalibration.calibrated ? 'session-adaptive' : 'defaults',
      ],
      [
        'Palm scale',
        formatNullable(snapshot.gestureCalibration.averagePalmScale),
      ],
      [
        'Closed / open calib',
        `${formatNullable(snapshot.gestureCalibration.closedDistance)} / ${formatNullable(
          snapshot.gestureCalibration.comfortableOpenDistance,
        )}`,
      ],
      [
        'Close thresholds',
        `${snapshot.gestureCalibration.thresholds.closedDistance.toFixed(3)} / ${snapshot.gestureCalibration.thresholds.closedEvidenceDistance.toFixed(3)}`,
      ],
      [
        'Endpoint radii',
        `${snapshot.gestureCalibration.thresholds.endpointEnterRadius.toFixed(3)} / ${snapshot.gestureCalibration.thresholds.endpointExitRadius.toFixed(3)} / ${snapshot.gestureCalibration.thresholds.reGripMagnetRadius.toFixed(3)}`,
      ],
      [
        'Collapse thresholds',
        `${snapshot.gestureCalibration.thresholds.collapseCompleteDistance.toFixed(3)} / ${snapshot.gestureCalibration.thresholds.collapseStartDistance.toFixed(3)}`,
      ],
      ['Calibration reason', snapshot.gestureCalibration.reason],
      ['openProgress', snapshot.openProgress.toFixed(2)],
      [
        'Open start / target',
        `${formatNullable(snapshot.solarStartDistance)} / ${formatNullable(
          snapshot.solarTargetDistance,
        )}`,
      ],
      ['Solar scale', snapshot.solarScale.toFixed(2)],
      ['Solar reason', snapshot.solarReason],
      ['Hovered body', snapshot.hoveredBody ?? 'none'],
      ['Activated body', snapshot.activatedBody ?? 'none'],
      ['Pinch', snapshot.pinchState],
      ['Pinch ratio', formatNullable(snapshot.planetActivation.pinchRatio)],
      [
        'Pinch dist px',
        formatNullable(snapshot.planetActivation.pinchDistancePx),
      ],
      [
        'Pinch thresholds',
        `${snapshot.planetActivation.pinchStartThreshold.toFixed(2)} / ${snapshot.planetActivation.pinchEndThreshold.toFixed(2)}`,
      ],
      [
        'Hover dist/radius px',
        `${formatNullable(snapshot.planetActivation.hoverDistancePx)} / ${formatNullable(
          snapshot.planetActivation.hoverHitRadiusPx,
        )}`,
      ],
      [
        'Hover screen',
        formatPoint2(snapshot.planetActivation.hoverScreenPosition),
      ],
      ['Hover point', snapshot.planetActivation.hoverPointKind ?? 'none'],
      ['Activation hand', snapshot.planetActivation.activeHandKey ?? 'none'],
      [
        'Activation lost',
        `${Math.round(snapshot.planetActivation.trackingLossMs)}ms`,
      ],
      [
        'Activation orbit',
        formatOrbit(snapshot.planetActivation.activatedOriginalOrbit),
      ],
      ['Activation reason', snapshot.planetActivation.transitionReason],
      ['Throw velocity', formatNullable(snapshot.throwVelocity)],
      ['Whole control', snapshot.wholeSystem.controlState],
      [
        'Control confidence',
        formatNullable(snapshot.wholeSystem.controlConfidence),
      ],
      [
        'Endpoint hit',
        formatNullable(snapshot.wholeSystem.endpointHitScore),
      ],
      [
        'Whole tracking conf',
        formatNullable(snapshot.wholeSystem.trackingConfidence),
      ],
      [
        'Release confidence',
        formatNullable(snapshot.wholeSystem.releaseConfidence),
      ],
      [
        'Re-grip confidence',
        formatNullable(snapshot.wholeSystem.reGripConfidence),
      ],
      [
        'Scale intent',
        `${snapshot.wholeSystem.scaleIntent} (${snapshot.wholeSystem.scaleIntentScore.toFixed(2)})`,
      ],
      [
        'Rotation intent',
        `${snapshot.wholeSystem.rotationIntent} (${snapshot.wholeSystem.rotationIntentScore.toFixed(2)})`,
      ],
      [
        'Collapse intent',
        formatNullable(snapshot.wholeSystem.collapseIntentScore),
      ],
      [
        'Visual L palm normal',
        formatPoint3(snapshot.wholeSystem.leftPalm.normal),
      ],
      [
        'Visual R palm normal',
        formatPoint3(snapshot.wholeSystem.rightPalm.normal),
      ],
      [
        'Visual L palm facing/up',
        formatPair(
          snapshot.wholeSystem.leftPalm.facingCameraScore,
          snapshot.wholeSystem.leftPalm.upScore,
        ),
      ],
      [
        'Visual R palm facing/up',
        formatPair(
          snapshot.wholeSystem.rightPalm.facingCameraScore,
          snapshot.wholeSystem.rightPalm.upScore,
        ),
      ],
      [
        'Visual L open/grip',
        formatPosePair(snapshot.wholeSystem.leftHandPose),
      ],
      [
        'Visual R open/grip',
        formatPosePair(snapshot.wholeSystem.rightHandPose),
      ],
      [
        'Release gesture',
        `${
          snapshot.wholeSystem.releaseGestureActive ||
          snapshot.wholeSystem.releaseGestureLatched
            ? 'yes'
            : 'no'
        } / lock ${
          snapshot.wholeSystem.releaseGestureLatched ? 'on' : 'off'
        } (${snapshot.wholeSystem.releaseGestureScore.toFixed(2)})`,
      ],
      [
        'Release stable',
        `${Math.round(snapshot.wholeSystem.releaseStableMs)}ms`,
      ],
      ['Release blocked', snapshot.wholeSystem.releaseBlockReason],
      ['Grip hold', snapshot.wholeSystem.gripHoldActive ? 'yes' : 'no'],
      ['Re-grip reason', snapshot.wholeSystem.reGripReason],
      ['Whole reason', snapshot.wholeSystem.transitionReason],
      [
        'Recorder',
        `${snapshot.gestureRecording.recording ? 'recording' : 'idle'} ${snapshot.gestureRecording.frameCount}/${snapshot.gestureRecording.maxFrames}`,
      ],
      ['Recorder event', snapshot.gestureRecording.lastEvent ?? 'none'],
      [
        'Visual L endpoint',
        formatPoint2(snapshot.wholeSystem.virtualLeftEndpoint),
      ],
      [
        'Visual R endpoint',
        formatPoint2(snapshot.wholeSystem.virtualRightEndpoint),
      ],
      [
        'Visual endpoint matched',
        `${snapshot.wholeSystem.leftEndpointMatched ? 'Visual L yes' : 'Visual L no'} / ${
          snapshot.wholeSystem.rightEndpointMatched ? 'Visual R yes' : 'Visual R no'
        }`,
      ],
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

function formatPoint2(point: { x: number; y: number } | null): string {
  if (!point) {
    return 'n/a';
  }

  return `${point.x.toFixed(3)}, ${point.y.toFixed(3)}`;
}

function formatPoint3(point: { x: number; y: number; z: number } | null): string {
  if (!point) {
    return 'n/a';
  }

  return `${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}`;
}

function formatPosePair(pose: {
  openHandScore: number | null;
  gripPoseScore: number | null;
  openFingerCount: number;
}): string {
  return `${formatNullable(pose.openHandScore)} / ${formatNullable(
    pose.gripPoseScore,
  )} (${pose.openFingerCount})`;
}

function formatSize(width: number | null, height: number | null): string {
  if (width === null || height === null) {
    return 'n/a';
  }

  return `${Math.round(width)} x ${Math.round(height)}`;
}

function formatOrbit(
  orbit: DebugSnapshot['planetActivation']['activatedOriginalOrbit'],
): string {
  if (!orbit) {
    return 'n/a';
  }

  return `${orbit.parentId ?? 'sun'} r=${orbit.orbitRadius.toFixed(2)} p=${orbit.orbitPhase.toFixed(2)}`;
}
