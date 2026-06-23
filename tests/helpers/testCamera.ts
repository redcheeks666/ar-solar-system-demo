import { PerspectiveCamera } from 'three';
import type { PreviewLayout } from '../../src/interaction/coordinateMapping';

/** 16:9 preview layout matching the app's default 1280x720 webcam stage (mirrored). */
export const TEST_LAYOUT: PreviewLayout = {
  stageWidth: 1280,
  stageHeight: 720,
  sourceWidth: 1280,
  sourceHeight: 720,
  mirrored: true,
};

/** A PerspectiveCamera matching the app scene (fov 45, looking down -z from z=6). */
export function createTestCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    45,
    TEST_LAYOUT.stageWidth / TEST_LAYOUT.stageHeight,
    0.1,
    100,
  );
  camera.position.set(0, 0, 6);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}
