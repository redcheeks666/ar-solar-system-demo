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
      [
        'Perf frame',
        `${formatMs(snapshot.performance.renderDeltaMs)} / render ${formatMs(
          snapshot.performance.renderMs,
        )}`,
      ],
      [
        'Perf tracking',
        `main update ${formatMs(snapshot.performance.trackingUpdateMs)} / worker detect ${formatMs(
          snapshot.performance.detectMs,
        )}`,
      ],
      [
        'Perf hand/pose',
        `${formatMs(snapshot.performance.handDetectMs)} / ${formatMs(
          snapshot.performance.poseDetectMs,
        )}`,
      ],
      [
        'Tracking worker',
        `${snapshot.performance.handDelegate ?? 'n/a'} roundtrip=${formatMs(
          snapshot.performance.workerRoundTripMs,
        )} dropped=${snapshot.performance.droppedVideoFrameCount}`,
      ],
      [
        'Tracking Hz',
        `${formatNullable(snapshot.performance.trackingHz)} (${snapshot.performance.detectionFrameCount})`,
      ],
      [
        'Frame freshness',
        `${snapshot.performance.freshTrackingFrame ? 'fresh' : 'stale'} age=${formatMs(
          snapshot.performance.freshFrameAgeMs,
        )} fresh=${snapshot.performance.freshTrackingFrames} stale=${snapshot.performance.staleRenderFrames}`,
      ],
      [
        'Video frame',
        `dt=${formatMs(snapshot.performance.videoFrameDeltaMs)} repeated=${snapshot.performance.repeatedVideoFrameCount}`,
      ],
      [
        'Perf controllers',
        `gesture ${formatMs(snapshot.performance.controllerMs)} / recorder ${formatMs(
          snapshot.performance.recorderMs,
        )}`,
      ],
      [
        'Perf solar/VFX',
        `solar ${formatMs(snapshot.performance.solarUpdateMs)} / vfx ${formatMs(
          snapshot.performance.vfxFrameUploadMs,
        )} (${snapshot.performance.vfxFrameUploadCount})`,
      ],
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
      [
        'Active endpoint gate',
        `${snapshot.solarEndpoint.mode} score=${snapshot.solarEndpoint.score.toFixed(2)} hit=${snapshot.solarEndpoint.bothWithinRadius ? 'yes' : 'no'}`,
      ],
      [
        'Active endpoint dist',
        `${formatNullable(snapshot.solarEndpoint.leftDistanceWorld)} / ${formatNullable(snapshot.solarEndpoint.rightDistanceWorld)} (r=${formatNullable(snapshot.solarEndpoint.radiusWorld)})`,
      ],
      [
        'Active endpoint dwell',
        `${Math.round(snapshot.solarEndpoint.stableMs)} / ${Math.round(snapshot.solarEndpoint.stableRequiredMs)}ms · ${snapshot.solarEndpoint.reason}`,
      ],
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
      ['DoubleClose count', String(snapshot.planetActivation.doubleCloseCount)],
      [
        'DoubleClose valley / peak',
        `${formatNullable(snapshot.planetActivation.doubleCloseValleyRatio ?? null)} / ${formatNullable(snapshot.planetActivation.doubleClosePeakRatio ?? null)}`,
      ],
      [
        'DoubleClose prominence',
        formatNullable(snapshot.planetActivation.doubleCloseProminence ?? null),
      ],
      [
        'DoubleClose timeout',
        snapshot.planetActivation.doubleCloseTimeoutRemainingMs == null
          ? 'none'
          : `${Math.round(snapshot.planetActivation.doubleCloseTimeoutRemainingMs)}ms`,
      ],
      [
        'DoubleClose failure',
        snapshot.planetActivation.doubleCloseFailureReason ?? 'none',
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
      ['Focus control', snapshot.planetFocus.controlState],
      ['Focus mode', snapshot.planetFocus.controlMode],
      ['Focus body', snapshot.planetFocus.focusedBody ?? 'none'],
      ['Focus hands', snapshot.planetFocus.activeHandKeys.join(', ') || 'none'],
      [
        'Focus touch',
        `${snapshot.planetFocus.touchHandCount} hand(s), ${formatNullable(
          snapshot.planetFocus.touchDistancePx,
        )} / ${formatNullable(snapshot.planetFocus.touchHitRadiusPx)}px`,
      ],
      [
        'Focus dwell',
        `${Math.round(snapshot.planetFocus.dwellMs)}ms / ${Math.round(
          snapshot.planetFocus.dwellRequiredMs,
        )}ms`,
      ],
      ['Focus screen', formatPoint2(snapshot.planetFocus.screenPosition)],
      ['Focus scale', snapshot.planetFocus.scaleMultiplier.toFixed(2)],
      [
        'Focus pinch',
        `${snapshot.planetFocus.pinchState} ${formatNullable(
          snapshot.planetFocus.pinchRatio,
        )} / ${formatNullable(snapshot.planetFocus.pinchDistancePx)}px`,
      ],
      ['Focus pinch hand', snapshot.planetFocus.pinchTapHandKey ?? 'none'],
      ['Focus reason', snapshot.planetFocus.transitionReason],
      [
        'Return wave',
        `${snapshot.planetReturnWave.state} hand=${snapshot.planetReturnWave.handKey ?? 'none'} evidence=${snapshot.planetReturnWave.handReady ? 'ready' : 'collecting'} frames=${snapshot.planetReturnWave.stableFrames}`,
      ],
      [
        'Return wave motion',
        `peak=${formatNullable(snapshot.planetReturnWave.peakSpeed ?? null)} d=${formatNullable(snapshot.planetReturnWave.displacement)} elapsed=${Math.round(snapshot.planetReturnWave.elapsedMs)}ms`,
      ],
      [
        'Return wave direction',
        `${snapshot.planetReturnWave.cornerDirection ?? 'none'} x=${formatNullable(snapshot.planetReturnWave.horizontalDisplacement)} up=${formatNullable(snapshot.planetReturnWave.upwardDisplacement)}`,
      ],
      [
        'Return wave/body',
        `start=${formatNullable(snapshot.planetReturnWave.startDistanceToBody ?? null)} end=${formatNullable(snapshot.planetReturnWave.endDistanceToBody ?? null)} trend=${formatNullable(snapshot.planetReturnWave.bodyDistanceTrend ?? null)} hit=${formatNullable(snapshot.planetReturnWave.bodyHitRadius ?? null)}`,
      ],
      [
        'Return wave quality',
        `open=${formatNullable(snapshot.planetReturnWave.openHandScore)} scale=${formatNullable(snapshot.planetReturnWave.palmScaleRatio)} score=${snapshot.planetReturnWave.score.toFixed(2)} ${snapshot.planetReturnWave.reason}`,
      ],
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
        'Whole pinch ratio',
        `${formatNullable(snapshot.wholeSystem.leftPinchRatio)} / ${formatNullable(snapshot.wholeSystem.rightPinchRatio)}`,
      ],
      ['Whole pinch penalty', snapshot.wholeSystem.pinchPenalty.toFixed(2)],
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

function formatMs(value: number | null): string {
  return value === null ? 'n/a' : `${value.toFixed(1)}ms`;
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
