import { describe, expect, it, vi } from 'vitest';
import { HandLandmarkerWorkerClient } from '../../src/tracking/handLandmarkerWorkerClient';
import type {
  HandLandmarkerWorkerRequest,
  HandLandmarkerWorkerResponse,
} from '../../src/tracking/handLandmarkerWorkerProtocol';

class FakeWorker {
  onmessage: ((event: MessageEvent<HandLandmarkerWorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly posted: Array<{
    message: HandLandmarkerWorkerRequest;
    transfer: Transferable[];
  }> = [];
  readonly terminate = vi.fn();

  postMessage(
    message: HandLandmarkerWorkerRequest,
    transfer: Transferable[] = [],
  ): void {
    this.posted.push({ message, transfer });
  }

  emit(message: HandLandmarkerWorkerResponse): void {
    this.onmessage?.({ data: message } as MessageEvent<HandLandmarkerWorkerResponse>);
  }
}

function fakeBitmap(): ImageBitmap {
  return { close: vi.fn() } as unknown as ImageBitmap;
}

describe('HandLandmarkerWorkerClient', () => {
  it('initializes once and transfers an ImageBitmap for detection', async () => {
    const worker = new FakeWorker();
    const client = new HandLandmarkerWorkerClient(() => worker);
    const initializing = client.initialize();

    expect(worker.posted[0]?.message).toEqual({ type: 'initialize' });
    worker.emit({ type: 'ready', delegate: 'GPU' });
    await expect(initializing).resolves.toBe('GPU');
    await expect(client.initialize()).resolves.toBe('GPU');
    expect(worker.posted).toHaveLength(1);

    const frame = fakeBitmap();
    const detecting = client.detect(frame, 200, 180);
    const request = worker.posted[1]?.message;
    expect(request).toMatchObject({
      type: 'detect',
      timestamp: 200,
      videoCurrentTimeMs: 180,
    });
    expect(worker.posted[1]?.transfer).toEqual([frame]);

    const requestId = request?.type === 'detect' ? request.requestId : -1;
    worker.emit({
      type: 'result',
      requestId,
      timestamp: 200,
      videoCurrentTimeMs: 180,
      inferenceMs: 12,
      hands: [],
    });

    await expect(detecting).resolves.toEqual({
      timestamp: 200,
      videoCurrentTimeMs: 180,
      inferenceMs: 12,
      hands: [],
    });
  });

  it('rejects the matching request on Worker errors and terminates on dispose', async () => {
    const worker = new FakeWorker();
    const client = new HandLandmarkerWorkerClient(() => worker);
    const initializing = client.initialize();
    worker.emit({ type: 'ready', delegate: 'CPU' });
    await initializing;

    const detecting = client.detect(fakeBitmap(), 300, 280);
    const request = worker.posted.at(-1)?.message;
    const requestId = request?.type === 'detect' ? request.requestId : -1;
    worker.emit({
      type: 'error',
      phase: 'detect',
      requestId,
      message: 'detect failed',
    });

    await expect(detecting).rejects.toThrow('detect failed');
    client.dispose();
    expect(worker.posted.at(-1)?.message).toEqual({ type: 'dispose' });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
