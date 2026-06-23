# Test & Replay Harness

Date: 2026-06-23  
Status: planned cross-cutting workflow  
Scope: automated regression testing for gesture logic, solar-system control, replay diagnostics, and later browser rendering checks.

## Purpose

The AR Solar System demo currently depends on repeated manual webcam gesture testing. That is necessary for final acceptance, but it is too expensive for normal regression work. This harness is designed to reduce "wave hands every time" testing by locking the deterministic parts first, then gradually adding structured gesture replay and browser-level checks.

This is a cross-cutting workflow, not a product milestone inserted before Milestone 4. The current product baseline is Milestone 5.5 and later. Testing work should support the current timeline instead of renumbering earlier milestones.

## Core Decision

Do not start by building a full replay framework.

Start with Vitest coverage for leaf pure functions and controller sequences that do not touch `main.ts`, do not open the camera, and do not need MediaPipe. Add JSON replay and Playwright only after the M5.5 surface is stable enough that changing the app bootstrap will not shake two unstable systems at once.

## Determinism Guardrail

Every Layer 0 and Layer 1 test depends on the gesture modules being deterministic given `(input, timestamp)`. As of 2026-06-23, `src/interaction/**` and `src/solar/**` contain no `Math.random`, `Date.now`, or `performance.now`; all time is injected through `update(..., timestamp)` and the render loop in `main.ts` is the only place that reads the clock.

Keep it that way with a cheap guardrail test that fails if any module under `src/interaction/**` introduces `Math.random`, `Date.now`, or `performance.now`. This turns "time and randomness must be injected" from a convention into an enforced invariant, so a future change cannot silently make the gesture tests flaky. Randomized visuals (star dust, particles) belong in rendering/solar visual code, never in the interaction controllers under test.

## Testing Layers

### Layer 0: Leaf Pure Functions

This is the cheapest and most stable regression net. It should be implemented first.

Target modules:

- `src/utils/math.ts`
- `src/interaction/coordinateMapping.ts`
- `src/interaction/handPairing.ts`
- `src/interaction/palmOrientation.ts`
- `src/interaction/handPose.ts`
- `src/interaction/intentScoring.ts`

Why this layer matters:

- `coordinateMapping.ts` is the single source of truth for normalized MediaPipe coordinates to stage pixels and Three.js world coordinates. Endpoint-to-hand alignment in M4/M5 depends on it.
- `handPairing.ts` defines visual-left/visual-right, which must stay distinct from MediaPipe handedness labels.
- `palmOrientation.ts`, `handPose.ts`, and `intentScoring.ts` were deliberately split out as stateless logic. They are ideal for fast, deterministic tests.
- `math.ts` is shared by tracking and interaction code; regressions here spread everywhere.

Example coverage:

- `clamp`, `lerp`, `inverseLerp`, `distance2d/3d`, `normalize`, `cosineSimilarity`, and `unwrapAngle` edge cases.
- `object-fit: contain` coordinate mapping with letterboxing.
- mirrored stage x mapping.
- `mapNormalizedToWorld` returns stable points for a real `PerspectiveCamera` and returns `null` for invalid layouts or impossible ray/plane intersections.
- visual-left hand is the hand appearing on the left side of the mirrored preview, not necessarily MediaPipe's `Left`.
- open-hand, grip-pose, and release-ready scoring respond predictably to synthetic landmarks.
- endpoint hit/re-grip/collapse/release scores obey threshold boundaries.

Notes:

- Run these in Vitest with `environment: 'node'`. Do not import `src/rendering/scene.ts` or anything that constructs a `WebGLRenderer` from unit tests; only Three.js math (`PerspectiveCamera`, `Raycaster`, `Vector3`, `Plane`) is needed, and it runs headlessly (the existing `verify-m5_5` script already proves this under Node).
- `palmOrientation.ts` and `handPose.ts` take 21-point hand landmarks. Synthesizing realistic geometry is fiddly, so these may also be tested with a few frozen real single-frame fixtures (see Fixture Policy → single-frame fixtures). A single frame fed to a pure function is not "replay" and needs no replay machinery.
- For the scoring functions in `intentScoring.ts`, prefer invariant/boundary assertions (monotonicity, range `[0, 1]`, symmetry) over hard-coded golden numbers. Property-based testing (e.g. `fast-check`) is a reasonable later enhancement and is more robust to threshold tuning.

### Layer 1: Controller Sequence Tests

This layer tests stateful logic using synthetic `TrackingSnapshot` sequences and injected timestamps. It still does not touch `main.ts`, the browser, real camera input, or the render loop.

Target controllers:

- `src/interaction/handStartupGesture.ts`
- `src/interaction/wholeSystemIntent.ts`
- `src/interaction/solarOpeningController.ts`
- `src/interaction/solarInspectionController.ts`
- later: planet activation, focus, PinchTap release, and throw-return controllers.

High-value first tests:

| Test | What it covers | Needs replay framework |
|---|---|---|
| `pull-open-happy` | synthetic close, pull, `PullArmed`, `SolarOpening`, `SolarActive` | no |
| `hold-closed-no-solar` | hands close but not pulled apart; no visible solar content/opening progress | no |
| `pause-mid-opening` | opening progress holds when hand distance holds | no |
| `reverse-collapse` | re-gripped endpoint control moves inward and returns to `EmptyIdle` | no |
| `release-regrip-basic` | open-hand release freezes endpoints; stable endpoint return re-grips | partial |
| `fast-withdraw-stability` | one-frame landmark jumps and real tracking loss during withdrawal | yes, best with recorded fixture |

The key observation is that most painful M4/M5 regressions can be covered by pure controller tests immediately. Only noisy real-world tracking cases need recorded gesture fixtures.

Notes:

- Inject fixed `GestureThresholds` (not the session-adaptive calibration) so controller logic is tested independently of `gestureCalibration.ts`. Calibration gets its own dedicated test.
- Reuse in-app verification accumulators as test oracles where they exist. `src/interaction/solarInspectionVerification.ts` already encodes the M5.5 acceptance checklist (free-hover, zoom-in/out, pan, reset-hold, reset, handle-off). A sequence test can drive the controller and assert `verification.completed === true` instead of hand-writing per-frame expectations — less brittle, and it reuses the acceptance definition.
- `wholeSystemIntent.update(...)` consumes a `HandStartupGestureSnapshot`, so `tests/helpers/` should provide builders for both `TrackingSnapshot` and `HandStartupGestureSnapshot`.

### Layer 2: Absorb the Existing M5.5 Verification Script

The project already has a deterministic, headless M5.5 verification:

- `scripts/verify-m5_5-solar-inspection.ts`
- `scripts/run-m5_5-verification.mjs`

This script is, in practice, a hand-written Layer 1 suite: it builds a `PerspectiveCamera`, constructs synthetic `TrackingSnapshot` / `TrackedHand` frames via local `step()` and `point()` helpers, drives `SolarInspectionController`, and checks expected intents. It should be **absorbed into Vitest rather than maintained as a parallel runner**:

- Extract its `step()` / `point()` / camera / layout builders into `tests/helpers/` as the single source of synthetic-driving utilities.
- Port its cases into `tests/gesture/solarInspectionController.test.ts` with `expect` assertions. Vitest runs TypeScript natively, so the custom `run-m5_5-verification.mjs` loader is no longer needed.
- Reduce `npm run verify:m5.5` to a thin alias that runs that test file, or retire it once the port lands, so there is one harness instead of two.

Until the port is done, `npm run verify:m5.5` stays the deterministic M5.5 check.

### Layer 3: JSON Gesture Replay

Replay should come after the first Vitest layers and after M5.5 stabilizes.

This layer is specifically about **multi-frame sequences** — reproducing how state evolves across time under real tracking noise. Single-frame inputs to pure functions belong in Layer 0, not here.

Use the existing debug recorder as the source:

- `src/interaction/gestureDebugRecorder.ts`

Recorder payloads contain structured landmarks, primitives, calibration values, intent scores, states, and transition reasons. They must not contain raw webcam video.

Replay goals:

- Reproduce real tracking noise without requiring the user to move every time.
- Exercise landmark dropout when hands overlap.
- Exercise fast hand withdrawal and edge-of-frame partial tracking.
- Reproduce confusing release/re-grip sequences.
- Preserve fixture frame timestamps and use those timestamps to drive controller updates.

The main technical risk is time injection. Most controllers already accept `timestamp`, which is good. Browser replay is harder because `main.ts` currently gets time from `requestAnimationFrame`. Fixture replay must be driven by the fixture's frame times, not by whatever timing the browser happens to produce during the test.

### Layer 4: Browser E2E Replay

Playwright-based replay is useful, but it should be last.

This layer may eventually introduce a dev/test-only route such as:

```text
/?replay=/fixtures/pull-open-happy.json
```

It would verify:

- default startup route stays visually empty before the valid pull-open gesture.
- WebGL canvas is blank before opening and nonblank only after legal opening.
- status summary and Debug values match replayed states.
- console has no obvious errors.
- desktop and mobile viewports keep UI from overlapping important content.
- `?solarPreview=1` remains a dev-only visual preview and does not change normal startup.

Do not implement this layer until the lower layers are useful and the M5.5 product path is stable.

## Proposed Code Path Architecture

Create test files outside `src/` first.

```text
docs/
  testing/
    test-and-replay-harness.md
    fixture-policy.md                 # add later, when fixtures start landing

tests/
  unit/
    math.test.ts
    coordinateMapping.test.ts
    handPairing.test.ts
    palmOrientation.test.ts
    handPose.test.ts
    intentScoring.test.ts
    determinism.test.ts               # guardrail: no Math.random/Date.now/performance.now in src/interaction/**
  gesture/
    handStartupGesture.test.ts
    solarOpeningController.test.ts
    wholeSystemIntent.test.ts
    solarInspectionController.test.ts  # ported from scripts/verify-m5_5-solar-inspection.ts
  helpers/                            # extracted from verify-m5_5; single source, not re-written
    syntheticHands.ts
    trackingSnapshots.ts              # builds TrackingSnapshot and HandStartupGestureSnapshot
    testCamera.ts
    testThresholds.ts                 # fixed GestureThresholds for deterministic controller tests
  fixtures/
    frames/                           # single-frame hand snapshots for Layer 0 pure-fn tests
      open-hand.json
      fist.json
      palm-up.json
    pull-open-happy.json              # later, multi-frame sequence (Layer 3)
    fast-withdraw-stability.json      # later, multi-frame sequence (Layer 3)
    release-regrip-noisy.json         # later, multi-frame sequence (Layer 3)
  replay/
    replayLog.test.ts                 # later
    replayRunner.ts                   # later
  e2e/
    replay.spec.ts                    # later
```

Avoid adding `src/testing/` in the first phase. A `src/testing/` seam implies product-code integration and can tempt early changes to `main.ts`. Add it only when browser replay genuinely needs an app-level replay source.

Potential future app-level paths:

```text
src/testing/
  replayTypes.ts
  gestureReplaySource.ts
  replayClock.ts
```

Add those only after M5.5 stabilizes and after controller-level replay has proven useful.

## Fixture Policy

Initial fixture policy:

- Do not commit raw webcam video.
- Prefer synthetic landmarks for unit and controller tests.
- Distinguish two fixture kinds: **single-frame fixtures** (`tests/fixtures/frames/*.json`, one hand snapshot, used as Layer 0 pure-function input) and **multi-frame sequence fixtures** (`tests/fixtures/*.json`, time-ordered frames, used for Layer 3 replay). Single-frame fixtures do not need timestamps or replay machinery.
- Recorded JSON fixtures must be short, focused, and anonymized or normalized before committing.
- Keep personal long-form gesture logs local unless the user explicitly approves storing them.
- Fixture files should describe the expected behavior they test.
- Sequence-fixture timestamps are part of the test data and must be preserved.

Later, this can become `docs/testing/fixture-policy.md` once real fixtures are introduced.

## Recommended Implementation Order

1. Add Vitest (`environment: 'node'`) and scripts without touching product runtime code.
2. Add the determinism guardrail test for `src/interaction/**`.
3. Extract the synthetic builders from `scripts/verify-m5_5-solar-inspection.ts` into `tests/helpers/`.
4. Add Layer 0 tests for pure helper modules.
5. Add Layer 1 controller tests for startup/opening/collapse, reusing in-app verification accumulators as oracles where available.
6. Port the M5.5 verification cases into a Vitest gesture test; reduce `npm run verify:m5.5` to an alias (or retire it).
7. Add CI (GitHub Actions) running `typecheck` + `test:unit` + `test:gesture` + `build` on push/PR.
8. Add controller-level multi-frame JSON replay after the above are useful and M5.5 stabilizes.
9. Add browser replay and Playwright only after M5.5 behavior stabilizes.

## Suggested Scripts

Short-term:

```json
{
  "test:unit": "vitest run tests/unit",
  "test:gesture": "vitest run tests/gesture",
  "verify:m5.5": "node scripts/run-m5_5-verification.mjs"
}
```

Commit-time or pre-merge local check:

```bash
npm run typecheck
npm run test:unit
npm run test:gesture
npm run verify:m5.5
npm run build
```

Future:

```json
{
  "test:replay": "vitest run tests/replay",
  "test:e2e": "playwright test",
  "test:all": "npm run typecheck && npm run test:unit && npm run test:gesture && npm run verify:m5.5 && npm run build && npm run test:replay && npm run test:e2e"
}
```

Do not add future scripts before their tests exist.

## Continuous Integration

The end state of "ultimately automated" is not a local pre-commit checklist but CI that runs on every push/PR. Add a GitHub Actions workflow (e.g. `.github/workflows/ci.yml`) that runs:

```bash
npm ci
npm run typecheck
npm run test:unit
npm run test:gesture
npm run build
```

Keep CI to the deterministic, headless layers (typecheck, unit, gesture, build) so it stays fast and green without a camera or GPU. Heavier or browser-dependent jobs (`test:replay`, `test:e2e`) join as separate, later steps once those layers exist. This is independent of the existing `post-commit` companion-repo sync, which is a local convenience, not CI.

## What Still Needs Manual Camera Verification

Automated tests reduce regression pain, but they do not replace final camera acceptance.

Keep manual verification for:

- MediaPipe behavior under real lighting.
- user hand shapes and comfort.
- hand occlusion when fists overlap.
- edge-of-frame partial tracking.
- different webcam angles and camera quality.
- whether status copy and debug guidance are understandable while the user is moving.
- final M5.5 tuning before moving from `NEEDS_MANUAL_VERIFY` to `DONE`.

The goal is not zero manual testing. The goal is that manual testing happens at milestone acceptance and threshold-tuning moments, not after every small code change.

## First Slice

The smallest useful next implementation is:

1. Add Vitest (`environment: 'node'`).
2. Extract `tests/helpers/` builders (synthetic hands, `TrackingSnapshot`, test camera, fixed thresholds) from `scripts/verify-m5_5-solar-inspection.ts` — single source, do not re-write.
3. Add `tests/unit/determinism.test.ts` (the guardrail).
4. Add `tests/unit/coordinateMapping.test.ts`.
5. Add `tests/unit/handPose.test.ts` (synthetic, or a frozen single-frame fixture if synthetic geometry is awkward).
6. Add `tests/gesture/handStartupGesture.test.ts`.
7. Add `tests/gesture/solarOpeningController.test.ts`.
8. Wire `test:unit` and `test:gesture` scripts.

This first slice gives immediate regression value with no product-code seam changes.

