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

- `/` — full app with debug UI (Debug toggle, status summary, gesture guidance).
- `/?demo=1` — presentation mode: same interactions, no debug UI or bottom guidance text.
- `/?solarPreview=1` — dev-only static solar-system visual preview (no camera/gestures).

## Manual Camera Check

1. Open the local dev URL shown by Vite, click `开启摄像头`, and grant camera permission.
2. Confirm the webcam appears as a complete mirrored 16:9 preview with no visible 3D content.
3. Bring both hands together anywhere in frame, then pull them apart — the solar system should open between the hands.
4. Toggle `Debug` to inspect tracking state, interaction state, and performance values.
