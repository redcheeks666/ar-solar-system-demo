# AR Solar System Demo

Browser-based webcam AR gesture interaction demo. The scene starts empty; pulling both hands apart in front of the camera opens a 3D solar system that can be moved, collapsed, and inspected planet-by-planet with hand gestures.

Docs:

- [ar_solar_system_prd.md](ar_solar_system_prd.md) — product requirements and interaction rules.
- [AGENTS.md](AGENTS.md) — durable rules for coding agents.
- [docs/testing/test-and-replay-harness.md](docs/testing/test-and-replay-harness.md) — testing strategy.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run typecheck
npm test
```

`npm run dev` / `npm run build` first sync MediaPipe wasm + the hand model into `public/mediapipe/` (gitignored), so tracking runs fully offline after the first sync. NASA master/4k source textures live in `assets-src/` and are not shipped.

URL routes on the dev server:

- `/` — responsive public landing page with the experience intro, gesture guide, and Douyin follow card.
- `/debug` — full camera app with Debug toggle, status summary, gesture guidance, and recorder.
- `/?demo=1` — presentation mode: same interactions, a title-only current-operation HUD, no full debug UI or bottom guidance, plus a 0.5s index-fingertip hold card that toggles the hand skeleton.
- `/?solarPreview=1` — dev-only static solar-system visual preview (no camera/gestures).

The landing page remains readable on touch/small-screen devices and without WebGL2 by using a static decorative backdrop. `开启体验` requires a WebGL2-capable desktop browser with a camera. For a subpath build, every route and asset URL is resolved relative to `VITE_BASE_PATH`.

## Manual Camera Check

1. Open `/`, confirm the landing page scrolls through Hero, all 10 gesture cards, and the Douyin card, then click `开启体验` on a desktop browser.
2. On `/?demo=1`, click `开启摄像头` and grant camera permission.
3. Confirm the webcam appears as a complete mirrored 16:9 preview with no visible 3D content.
4. Bring both hands together anywhere in frame, then pull them apart — the solar system should open between the hands.
5. Open `/debug` and toggle `Debug` to inspect tracking state, interaction state, and performance values.
6. In `/?demo=1`, confirm the compact HUD shows only the current operation, then hold an index fingertip on the hand-model card for 0.5s to show/hide the hand skeleton.
