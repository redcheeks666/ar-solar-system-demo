// Syncs MediaPipe runtime assets into public/ so the app never depends on
// external CDNs at runtime (jsdelivr / storage.googleapis.com are unreliable
// or blocked in some demo environments).
//
// - wasm: copied from the installed @mediapipe/tasks-vision package, so the
//   runtime always matches the npm version — no pinned-URL drift.
// - hand_landmarker.task: downloaded once from Google's model storage and
//   kept locally afterwards.
//
// Runs automatically via the `predev` / `prebuild` npm hooks.
import {
  cpSync,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const wasmSourceDir = join(
  projectRoot,
  'node_modules/@mediapipe/tasks-vision/wasm',
);
const wasmTargetDir = join(projectRoot, 'public/mediapipe/wasm');
const modelTargetPath = join(
  projectRoot,
  'public/mediapipe/models/hand_landmarker.task',
);
const HAND_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const MIN_VALID_MODEL_BYTES = 1_000_000;

if (!existsSync(wasmSourceDir)) {
  console.error(
    '[mediapipe-sync] 找不到 node_modules/@mediapipe/tasks-vision/wasm,请先 npm install。',
  );
  process.exit(1);
}

mkdirSync(wasmTargetDir, { recursive: true });
cpSync(wasmSourceDir, wasmTargetDir, { recursive: true });

const hasValidModel =
  existsSync(modelTargetPath) &&
  statSync(modelTargetPath).size >= MIN_VALID_MODEL_BYTES;

if (!hasValidModel) {
  mkdirSync(dirname(modelTargetPath), { recursive: true });
  try {
    const response = await fetch(HAND_LANDMARKER_MODEL_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    writeFileSync(modelTargetPath, Buffer.from(await response.arrayBuffer()));
    console.log('[mediapipe-sync] hand_landmarker.task 下载完成。');
  } catch (error) {
    // Keep dev/build usable; hand tracking just won't initialize until the
    // model file exists.
    console.warn(
      `[mediapipe-sync] 手部模型下载失败(${error})。请在有网络时重跑,或手动下载\n  ${HAND_LANDMARKER_MODEL_URL}\n到 ${modelTargetPath}`,
    );
  }
}
