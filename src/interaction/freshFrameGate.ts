/**
 * Fresh-tracking-frame gate.
 *
 * The render loop runs independently from MediaPipe detection. The tracking Worker publishes
 * completed snapshots asynchronously, so `MediaPipeTrackingController.update()` usually returns
 * the previous result and `lastUpdatedAt` advances only on a genuinely new detection. Without
 * this gate, interaction controllers would re-consume the same hand
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
