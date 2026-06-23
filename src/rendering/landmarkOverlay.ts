import { HandLandmarker } from '@mediapipe/tasks-vision';
import {
  mapNormalizedToStagePixel,
  type PreviewLayout,
} from '../interaction/coordinateMapping';
import type {
  InteractionState,
  NormalizedPoint,
  TrackedHand,
  TrackingSnapshot,
  WholeSystemIntentSnapshot,
} from '../utils/types';

/**
 * Canonical 21-point hand skeleton edges, sourced from MediaPipe instead of a hand-copied table.
 * The drawing itself stays custom (see `drawHand`) because it must route through
 * `mapNormalizedToStagePixel` for mirror + `object-fit: contain` alignment, which the library's
 * `DrawingUtils` does not support.
 */
const HAND_CONNECTIONS = HandLandmarker.HAND_CONNECTIONS;

const LEFT_COLOR = '#7dd3fc';
const RIGHT_COLOR = '#f6c177';
const POSE_COLOR = '#a9f3df';
const ENDPOINT_COLOR = '#d9f99d';
const DRAW_POSE_SHOULDER_DEBUG = false;

export class LandmarkOverlay {
  private readonly context: CanvasRenderingContext2D;
  private visible = false;
  private layout: PreviewLayout = {
    stageWidth: 0,
    stageHeight: 0,
    sourceWidth: 0,
    sourceHeight: 0,
    mirrored: true,
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly video: HTMLVideoElement,
  ) {
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('2D landmark overlay context is unavailable.');
    }

    this.context = context;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.canvas.hidden = !visible;

    if (!visible) {
      this.clear();
    }
  }

  draw(
    snapshot: TrackingSnapshot,
    wholeSystem?: WholeSystemIntentSnapshot,
    interactionState?: InteractionState,
  ): void {
    if (!this.visible) {
      return;
    }

    const bounds = this.canvas.getBoundingClientRect();
    this.resizeToDisplay(bounds);
    this.layout = {
      stageWidth: bounds.width,
      stageHeight: bounds.height,
      sourceWidth: this.video.videoWidth,
      sourceHeight: this.video.videoHeight,
      mirrored: true,
    };
    this.clear();

    if (snapshot.status !== 'ready') {
      return;
    }

    if (DRAW_POSE_SHOULDER_DEBUG) {
      this.drawPose(snapshot.pose.landmarks);
    }
    snapshot.hands.hands.forEach((hand) => this.drawHand(hand));

    if (wholeSystem && shouldDrawLegacyVirtualEndpoints(interactionState)) {
      this.drawVirtualEndpoints(wholeSystem);
    }
  }

  clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private resizeToDisplay(bounds: DOMRect): void {
    const width = Math.max(1, Math.round(bounds.width * window.devicePixelRatio));
    const height = Math.max(1, Math.round(bounds.height * window.devicePixelRatio));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  private drawPose(landmarks: readonly NormalizedPoint[]): void {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    if (!leftShoulder || !rightShoulder) {
      return;
    }

    this.drawLine(leftShoulder, rightShoulder, POSE_COLOR, 2);
    this.drawPoint(leftShoulder, POSE_COLOR, 5);
    this.drawPoint(rightShoulder, POSE_COLOR, 5);
  }

  private drawHand(hand: TrackedHand): void {
    const color = hand.side === 'left' ? LEFT_COLOR : RIGHT_COLOR;

    HAND_CONNECTIONS.forEach(({ start, end }) => {
      const from = hand.landmarks[start];
      const to = hand.landmarks[end];

      if (from && to) {
        this.drawLine(from, to, color, 1.6);
      }
    });

    hand.landmarks.forEach((landmark) => this.drawPoint(landmark, color, 2.4));
    this.drawPoint(hand.center, '#ffffff', 4);
    this.drawPoint(hand.thumbTip, '#f38ba8', 4);
    this.drawPoint(hand.indexFingerTip, '#b4f9f8', 4);
  }

  private drawVirtualEndpoints(snapshot: WholeSystemIntentSnapshot): void {
    const left = snapshot.virtualLeftEndpoint;
    const right = snapshot.virtualRightEndpoint;

    if (!left || !right || snapshot.controlState === 'Inactive') {
      return;
    }

    this.drawLine(left, right, ENDPOINT_COLOR, 1.2);
    this.drawEndpoint(left, snapshot.leftEndpointMatched ? LEFT_COLOR : ENDPOINT_COLOR);
    this.drawEndpoint(right, snapshot.rightEndpointMatched ? RIGHT_COLOR : ENDPOINT_COLOR);
  }

  private drawEndpoint(point: NormalizedPoint, color: string): void {
    const { x, y } = this.mapPoint(point);

    this.context.beginPath();
    this.context.arc(x, y, 8, 0, Math.PI * 2);
    this.context.strokeStyle = color;
    this.context.lineWidth = 2;
    this.context.stroke();

    this.context.beginPath();
    this.context.arc(x, y, 2.5, 0, Math.PI * 2);
    this.context.fillStyle = color;
    this.context.fill();
  }

  private drawPoint(point: NormalizedPoint, color: string, radius: number): void {
    const { x, y } = this.mapPoint(point);

    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.fillStyle = color;
    this.context.fill();
  }

  private drawLine(
    from: NormalizedPoint,
    to: NormalizedPoint,
    color: string,
    width: number,
  ): void {
    const start = this.mapPoint(from);
    const end = this.mapPoint(to);

    this.context.beginPath();
    this.context.moveTo(start.x, start.y);
    this.context.lineTo(end.x, end.y);
    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    this.context.stroke();
  }

  private mapPoint(point: NormalizedPoint): { x: number; y: number } {
    return mapNormalizedToStagePixel(point, this.layout);
  }
}

function shouldDrawLegacyVirtualEndpoints(
  interactionState?: InteractionState,
): boolean {
  return (
    interactionState !== 'SolarOpening' &&
    interactionState !== 'SolarActive' &&
    interactionState !== 'SolarFreeHover' &&
    interactionState !== 'SolarHandleControl' &&
    interactionState !== 'SolarClosing' &&
    interactionState !== 'BodyHover' &&
    interactionState !== 'BodyGrabbed' &&
    interactionState !== 'BodyDetached' &&
    interactionState !== 'BodyReturning'
  );
}
