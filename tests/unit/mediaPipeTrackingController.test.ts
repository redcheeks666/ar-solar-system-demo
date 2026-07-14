import { describe, expect, it, vi } from 'vitest';
import { MediaPipeTrackingController } from '../../src/tracking/mediapipe';
import type {
  HandLandmarkerInferenceClient,
  HandLandmarkerInferenceResult,
} from '../../src/tracking/handLandmarkerWorkerClient';
import type { RawWorkerHand } from '../../src/tracking/handLandmarkerWorkerProtocol';
import { createHand, point } from '../helpers/syntheticHands';

class FakeVideo {
  videoWidth = 1280;
  videoHeight = 720;
  currentTime = 0;
}

class DeferredHandClient implements HandLandmarkerInferenceClient {
  readonly dispose = vi.fn();
  readonly requests: Array<{
    timestamp: number;
    videoCurrentTimeMs: number;
    resolve: (result: HandLandmarkerInferenceResult) => void;
  }> = [];

  initialize(): Promise<'GPU'> {
    return Promise.resolve('GPU');
  }

  detect(
    _frame: ImageBitmap,
    timestamp: number,
    videoCurrentTimeMs: number,
  ): Promise<HandLandmarkerInferenceResult> {
    return new Promise((resolve) => {
      this.requests.push({ timestamp, videoCurrentTimeMs, resolve });
    });
  }
}

function fakeBitmap(): ImageBitmap {
  return { close: vi.fn() } as unknown as ImageBitmap;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function resolveRequest(
  handClient: DeferredHandClient,
  requestIndex: number,
  inferenceMs = 10,
  hands: RawWorkerHand[] = [],
): void {
  const request = handClient.requests[requestIndex];
  request?.resolve({
    timestamp: request.timestamp,
    videoCurrentTimeMs: request.videoCurrentTimeMs,
    inferenceMs,
    hands,
  });
}

function rawWorkerHand(): RawWorkerHand {
  const hand = createHand({
    center: point(0.5, 0.5),
    spread: 1.2,
    worldLandmarks: Array.from({ length: 21 }, () => point(0.5, 0.5, 0.1)),
  });

  return {
    landmarks: hand.landmarks,
    worldLandmarks: hand.worldLandmarks,
    side: 'right',
    handednessScore: 0.95,
  };
}

describe('MediaPipeTrackingController Worker scheduling', () => {
  it('publishes completed results asynchronously without blocking update()', async () => {
    const video = new FakeVideo();
    const handClient = new DeferredHandClient();
    let now = 0;
    const controller = new MediaPipeTrackingController({
      createHandClient: () => handClient,
      createFrame: async () => fakeBitmap(),
      now: () => now,
    });

    await controller.initialize();

    video.currentTime = 0.1;
    now = 100;
    expect(controller.update(video as unknown as HTMLVideoElement, 100)).toMatchObject({
      status: 'ready',
      lastUpdatedAt: null,
    });
    await flushPromises();
    expect(handClient.requests).toHaveLength(1);
    expect(handClient.requests[0]).toMatchObject({
      timestamp: 100,
      videoCurrentTimeMs: 100,
    });

    now = 114;
    resolveRequest(handClient, 0, 11);
    await flushPromises();

    expect(controller.getSnapshot()).toMatchObject({
      status: 'ready',
      lastUpdatedAt: 100,
      hands: { detectedHands: 0, lastUpdatedAt: 100 },
    });
    expect(controller.getPerformanceSnapshot()).toMatchObject({
      handDelegate: 'GPU',
      handDetectMs: 11,
      workerRoundTripMs: 14,
      detectionFrameCount: 1,
    });
  });

  it('keeps one frame in flight and submits the newest frame immediately after completion', async () => {
    const video = new FakeVideo();
    const handClient = new DeferredHandClient();
    const controller = new MediaPipeTrackingController({
      createHandClient: () => handClient,
      createFrame: async () => fakeBitmap(),
      now: () => 0,
    });

    await controller.initialize();
    video.currentTime = 0.1;
    controller.update(video as unknown as HTMLVideoElement, 100);
    await flushPromises();

    video.currentTime = 0.134;
    controller.update(video as unknown as HTMLVideoElement, 134);
    controller.update(video as unknown as HTMLVideoElement, 140);
    await flushPromises();

    expect(handClient.requests).toHaveLength(1);
    expect(controller.getPerformanceSnapshot().droppedVideoFrameCount).toBe(1);

    resolveRequest(handClient, 0);
    await flushPromises();

    // The legacy loop did not wait for a newly decoded camera frame after a slow detection. As
    // soon as the main thread became available, the next eligible rAF could submit the current
    // video image again. Keep the same currentTime here to lock that migration invariant down.
    controller.update(video as unknown as HTMLVideoElement, 141);
    await flushPromises();
    expect(handClient.requests).toHaveLength(2);
    expect(handClient.requests[1]).toMatchObject({
      timestamp: 141,
      videoCurrentTimeMs: 134,
    });

    controller.dispose();
    expect(handClient.dispose).toHaveBeenCalledOnce();
  });

  it('preserves the pre-Worker 33ms cadence and still detects repeated camera frames', async () => {
    const video = new FakeVideo();
    const handClient = new DeferredHandClient();
    const controller = new MediaPipeTrackingController({
      createHandClient: () => handClient,
      createFrame: async () => fakeBitmap(),
      now: () => 0,
    });

    await controller.initialize();
    video.currentTime = 0.1;
    controller.update(video as unknown as HTMLVideoElement, 100);
    await flushPromises();
    resolveRequest(handClient, 0);
    await flushPromises();

    controller.update(video as unknown as HTMLVideoElement, 132);
    await flushPromises();
    expect(handClient.requests).toHaveLength(1);

    controller.update(video as unknown as HTMLVideoElement, 133);
    await flushPromises();
    expect(handClient.requests).toHaveLength(2);
    expect(handClient.requests[1]).toMatchObject({
      timestamp: 133,
      videoCurrentTimeMs: 100,
    });

    resolveRequest(handClient, 1);
    await flushPromises();
    expect(controller.getPerformanceSnapshot()).toMatchObject({
      detectionFrameCount: 2,
      repeatedVideoFrameCount: 1,
      videoFrameDeltaMs: 0,
    });
  });

  it('backs off after two seconds without hands and restores 33ms cadence on detection', async () => {
    const video = new FakeVideo();
    const handClient = new DeferredHandClient();
    const controller = new MediaPipeTrackingController({
      createHandClient: () => handClient,
      createFrame: async () => fakeBitmap(),
      now: () => 0,
    });

    await controller.initialize();
    controller.update(video as unknown as HTMLVideoElement, 100);
    await flushPromises();
    resolveRequest(handClient, 0);
    await flushPromises();

    // Still inside the two-second grace period: the active 33ms cadence remains eligible.
    controller.update(video as unknown as HTMLVideoElement, 2099);
    await flushPromises();
    expect(handClient.requests).toHaveLength(2);
    resolveRequest(handClient, 1);
    await flushPromises();

    controller.update(video as unknown as HTMLVideoElement, 2132);
    controller.update(video as unknown as HTMLVideoElement, 2218);
    await flushPromises();
    expect(handClient.requests).toHaveLength(2);

    controller.update(video as unknown as HTMLVideoElement, 2219);
    await flushPromises();
    expect(handClient.requests).toHaveLength(3);
    resolveRequest(handClient, 2, 10, [rawWorkerHand()]);
    await flushPromises();
    expect(controller.getSnapshot().hands.detectedHands).toBe(1);

    controller.update(video as unknown as HTMLVideoElement, 2251);
    await flushPromises();
    expect(handClient.requests).toHaveLength(3);

    controller.update(video as unknown as HTMLVideoElement, 2252);
    await flushPromises();
    expect(handClient.requests).toHaveLength(4);
  });
});
