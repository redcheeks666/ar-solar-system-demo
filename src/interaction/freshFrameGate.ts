/**
 * Fresh-tracking-frame gate.
 *
 * The render loop runs faster than MediaPipe detection (requestAnimationFrame ~60fps vs
 * detection ~30fps). `MediaPipeTrackingController.update()` returns the previous snapshot when
 * called inside the detection interval, so its `lastUpdatedAt` only advances on a real new
 * detection. Without this gate, interaction controllers would re-consume the same hand
 * positions with an advancing render timestamp, injecting fake zero-velocity frames into
 * distance / finger-spread / pan velocity — exactly the features the gestures rely on.
 *
 * Gate the interaction controllers (not the renderer) on a change of `lastUpdatedAt`, and feed
 * them the detection timestamp so velocity dt matches the true detection interval.
 */
export function isFreshTrackingFrame(
  lastUpdatedAt: number | null,
  lastProcessedAt: number | null,
): boolean {
  return lastUpdatedAt !== null && lastUpdatedAt !== lastProcessedAt;
}
