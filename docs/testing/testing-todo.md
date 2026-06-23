# Testing TODO

Tracking list for the Test & Replay Harness. Plan lives in [`test-and-replay-harness.md`](./test-and-replay-harness.md); this file is the checkable progress board.

Status legend: `[ ]` todo · `[x]` done · `[~]` in progress

---

## Phase 0 — First Slice (Vitest + first tests, no recordings, no `main.ts` changes)

Status: **done — 34 tests passing (`npm test`), ~160ms, no camera.**

- [x] Add Vitest (`environment: 'node'`) + `vitest.config.ts`; wire `test` / `test:unit` / `test:gesture` scripts.
- [x] Extract shared builders into `tests/helpers/` (single source for the Vitest suites):
  - [x] `syntheticHands.ts` — `point()`, `createHand({ center, spread })`.
  - [x] `trackingSnapshots.ts` — `createTrackingSnapshot()`.
  - [x] `testCamera.ts` — test `PerspectiveCamera` + `TEST_LAYOUT`.
  - [x] `testThresholds.ts` — fixed `GestureThresholds`.
  - Note: `scripts/verify-m5_5-solar-inspection.ts` still has its own inline copies of these; it will switch to the shared helpers when it is ported in Phase 1 (the "Absorb `verify:m5.5`" item).
- [x] `tests/unit/determinism.test.ts` — guardrail: no `Math.random` / `Date.now` / `performance.now` in `src/interaction/**`.
- [x] `tests/unit/coordinateMapping.test.ts` — contain rect (16:9, 4:3 pillarbox, unknown), mirror mapping, world center→origin, mirror in world, null on zero layout.
- [x] `tests/unit/handPose.test.ts` — open hand vs fist: open-hand/grip scores and `releaseReady`; `computeReleaseGesture` active only for two open hands.
- [x] `tests/gesture/handStartupGesture.test.ts` — close → `HandsClosed` → pull apart → `PullArmed`; close-only stays `HandsClosed`.
- [x] `tests/gesture/solarOpeningController.test.ts` — pull-open reaches `SolarActive`; pause holds `openProgress`; `HandsClosed` shows no solar content.

## Phase 1 — More controller / leaf coverage

- [ ] `tests/unit/math.test.ts` — clamp/clamp01/lerp/inverseLerp/distance/normalize/cosineSimilarity/unwrapAngle edges.
- [ ] `tests/unit/handPairing.test.ts` — visual-left = larger camera x; previous-pair cost matching (no flip when stable, flip on cross).
- [ ] `tests/unit/intentScoring.test.ts` — endpoint/control/release/re-grip/scale/rotation/collapse score invariants and boundaries.
- [ ] `tests/unit/palmOrientation.test.ts` — palm facing-camera vs palms-up scores from synthetic hands.
- [ ] `tests/gesture/wholeSystemIntent.test.ts` — hold / open-hand release (latched) / re-grip / reverse-collapse sequences.
- [ ] `tests/gesture/solarInspectionController.test.ts` — port the `verify-m5_5` cases; reuse `solarInspectionVerification` as oracle.
- [ ] `tests/unit/gestureCalibration.test.ts` — session-adaptive thresholds behave (its own test, separate from fixed-threshold controller tests).
- [ ] Absorb `npm run verify:m5.5`: reduce it to an alias of the ported Vitest test (or retire it).

## Phase 2 — JSON gesture replay (after Phase 0/1 useful and M5.5 stable)

- [ ] Record a first batch of cleaned, short, anonymized fixtures (user records; see harness doc fixture policy).
- [ ] `tests/replay/replayRunner.ts` — drive controllers from multi-frame fixtures using fixture timestamps.
- [ ] `tests/replay/*.test.ts` — `fast-withdraw-stability`, `release-regrip-noisy`, lost-hand overlap.
- [ ] `tests/fixtures/frames/*` — single-frame fixtures for Layer 0 `handPose`/`palmOrientation` if synthetic geometry proves awkward.

## Phase 3 — Browser E2E (last, after M5.5 stabilizes)

- [ ] Add a dev/test-only replay route (`/?replay=...`) feeding fixtures instead of camera (needs a `main.ts`/`TrackingSource` seam — deferred).
- [ ] Playwright smoke: empty before pull-open, canvas blank→nonblank, no console errors, desktop/mobile layout, `?solarPreview=1` is dev-only.

## Continuous Integration

- [ ] `.github/workflows/ci.yml` — run `typecheck` + `test:unit` + `test:gesture` + `build` on push/PR.
- [ ] Add `test:replay` / `test:e2e` as separate later CI steps once those layers exist.

---

## Notes

- Determinism: all gesture controllers take an injected `timestamp`; tests control time fully. Do not introduce `Math.random`/`Date.now`/`performance.now` into `src/interaction/**` (the guardrail test enforces this).
- Test files live under `tests/` (outside `src/`), so they do not affect `npm run build` (`tsconfig` includes only `src`).
- Manual camera verification is NOT replaced by these tests; it stays for lighting, hand shape, occlusion, feel, and milestone acceptance.
