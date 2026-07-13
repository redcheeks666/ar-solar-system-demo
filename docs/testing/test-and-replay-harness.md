# Test & Replay Harness

Testing strategy for gesture logic, solar-system control, and (later) replay diagnostics and browser checks. This is a cross-cutting workflow, not a product milestone.

## Purpose

Manual webcam gesture testing stays for final acceptance, but it is too expensive for normal regression work. The harness locks the deterministic parts with Vitest first, then adds structured gesture replay and browser-level checks later.

## Commands

```bash
npm test            # all Vitest suites
npm run test:unit   # tests/unit
npm run test:gesture# tests/gesture
```

Pre-merge local check: `npm run typecheck && npm test && npm run build`.

## Determinism Guardrail

All gesture controllers are deterministic given `(input, timestamp)`: `src/interaction/**` contains no `Math.random`, `Date.now`, or `performance.now`; time is injected via `update(..., timestamp)` and only the render loop in `main.ts` reads the clock. `tests/unit/determinism.test.ts` enforces this. Randomized visuals (star dust, particles) belong in rendering/solar code, never in interaction controllers.

## Testing Layers

### Layer 0 — Leaf pure functions (done, keep extending)

Fast, stateless tests under `tests/unit/` for `math`, `coordinateMapping` (contain/mirror/world mapping), `handPairing` (visual-left/right ≠ MediaPipe handedness), `palmOrientation`, `handPose` (image + world landmarks), `intentScoring` (invariant/boundary assertions over golden numbers), `gestureCalibration`, `gestureInputFrame`, `solarSystemData` (registry invariants), `stateMachine`, and `solarSystemInteraction` (activation/orbit-pause/focus-overlay/return-animation semantics).

Run in Vitest `environment: 'node'`. Never import `src/rendering/scene.ts` or anything constructing a `WebGLRenderer`; only Three.js math (`PerspectiveCamera`, `Raycaster`, `Vector3`, `Plane`) is needed.

### Layer 1 — Controller sequence tests (done, keep extending)

Stateful tests under `tests/gesture/` driving controllers with synthetic `TrackingSnapshot` sequences and injected timestamps — no `main.ts`, browser, camera, or render loop. Covered: startup (close→pull), solar opening/lifecycle, whole-system intent (hold/release/re-grip/collapse), handle place-down, planet activation (hover/pinch hysteresis, A→B switching, DoubleClose entry), planet focus (intro cooldown, heat-zone-clear gate, single/two-hand dwell follow, distance scaling, downgrade, PinchTap release, wait-for-clear, tracking-gap tolerance), return button (hit, 1s hold, reset), fresh-frame gate, and the debug recorder.

Conventions:

- Inject fixed `GestureThresholds` from `tests/helpers/testThresholds.ts` so controller logic is tested independently of session calibration (which has its own test).
- Shared synthetic builders live in `tests/helpers/` (`syntheticHands`, `trackingSnapshots`, `testCamera`, `testThresholds`) — single source, do not re-write per test file.
- When gesture/solar-control logic changes, add or update the matching test in the same change.

### Layer 2 — JSON gesture replay (todo)

Multi-frame replay of recorded tracking noise, sourced from `gestureDebugRecorder` JSON exports (structured landmarks only — never raw webcam video). Goals: reproduce hand-overlap dropout, fast withdrawal, edge-of-frame partial tracking, and confusing release/re-grip sequences without re-waving hands.

- [ ] Record a first batch of short, cleaned, anonymized fixtures.
- [ ] `tests/replay/replayRunner.ts` — drive controllers from multi-frame fixtures using fixture timestamps (preserve them; they are test data).
- [ ] `tests/replay/*.test.ts` — fast-withdraw stability, noisy release/re-grip, lost-hand overlap.

### Layer 3 — Browser E2E (todo, last)

Playwright replay through a dev/test-only route (`/?replay=...`) — needs a `main.ts`/`TrackingSource` seam, deferred until controller-level replay has proven useful. Would verify: empty scene before pull-open, canvas blank→nonblank, no console errors, viewport layouts, `?solarPreview=1` stays dev-only. Do not add `src/testing/` before this layer genuinely needs it.

### Continuous Integration (todo)

- [ ] `.github/workflows/ci.yml` running `npm ci`, `typecheck`, `test:unit`, `test:gesture`, `build` on push/PR — deterministic headless layers only, no camera/GPU.
- [ ] `test:replay` / `test:e2e` join as separate CI steps once those layers exist. Do not add npm scripts before their tests exist.

## Fixture Policy

- Never commit raw webcam video.
- Prefer synthetic landmarks for unit and controller tests.
- Single-frame fixtures (`tests/fixtures/frames/*.json`, Layer 0 pure-function input) need no timestamps or replay machinery; multi-frame sequence fixtures (Layer 2) are time-ordered and keep their timestamps.
- Recorded fixtures must be short, focused, and anonymized before committing; keep personal long-form gesture logs local.

## What Still Needs Manual Camera Verification

Automated tests do not replace camera acceptance: real lighting, hand shapes and comfort, fist-overlap occlusion, edge-of-frame tracking, webcam angle/quality differences, status-copy readability while moving, and final threshold/ergonomics tuning. The goal is that manual testing happens at milestone acceptance and threshold-tuning moments, not after every small code change.
