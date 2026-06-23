# Testing TODO

Tracking list for the Test & Replay Harness. Plan lives in [`test-and-replay-harness.md`](./test-and-replay-harness.md); this file is the checkable progress board.

Status legend: `[ ]` todo · `[x]` done · `[~]` in progress

---

## Phase 0 — First Slice (Vitest + first tests, no recordings, no `main.ts` changes)

Status: **done — first slice landed; current total is covered by `npm test`, no camera. Retired M5.5 solar-inspection tests and `verify:m5.5` have been removed.**

- [x] Add Vitest (`environment: 'node'`) + `vitest.config.ts`; wire `test` / `test:unit` / `test:gesture` scripts.
- [x] Extract shared builders into `tests/helpers/` (single source for the Vitest suites):
  - [x] `syntheticHands.ts` — `point()`, `createHand({ center, spread })`.
  - [x] `trackingSnapshots.ts` — `createTrackingSnapshot()`.
  - [x] `testCamera.ts` — test `PerspectiveCamera` + `TEST_LAYOUT`.
  - [x] `testThresholds.ts` — fixed `GestureThresholds`.
  - Note: the retired M5.5 one-hand solar-inspection harness has been removed; do not restore `verify:m5.5` unless that gesture surface is explicitly reopened.
- [x] `tests/unit/determinism.test.ts` — guardrail: no `Math.random` / `Date.now` / `performance.now` in `src/interaction/**`.
- [x] `tests/unit/coordinateMapping.test.ts` — contain rect (16:9, 4:3 pillarbox, unknown), mirror mapping, world center→origin, mirror in world, null on zero layout.
- [x] `tests/unit/handPose.test.ts` — open hand vs fist: open-hand/grip scores and `releaseReady`; `computeReleaseGesture` active only for two open hands.
- [x] `tests/gesture/handStartupGesture.test.ts` — `EmptyIdle` close → `HandsClosed` → pull apart → `PullArmed`; close-only stays `HandsClosed`; non-empty states ignore startup close/pull.
- [x] `tests/gesture/solarOpeningController.test.ts` — pull-open reaches `SolarActive`; pause holds `openProgress`; `HandsClosed` shows no solar content.

## Phase 1 — More controller / leaf coverage

- [x] `tests/unit/math.test.ts` — clamp/clamp01/lerp/inverseLerp/distance/normalize/cosineSimilarity/unwrapAngle edges.
- [x] `tests/unit/handPairing.test.ts` — visual-left = larger camera x; previous-pair cost matching (no flip when stable, flip on cross).
- [x] `tests/unit/intentScoring.test.ts` — endpoint/control/release/re-grip/scale/rotation/collapse score invariants and boundaries.
- [x] `tests/unit/palmOrientation.test.ts` — palm facing-camera vs palms-up scores from synthetic hands.
- [x] `tests/gesture/wholeSystemIntent.test.ts` — hold / open-hand release (latched) / re-grip / reverse-collapse sequences.
- [x] Retire the deleted `tests/gesture/solarInspectionController.test.ts` coverage with the removed M5.5 one-hand solar-inspection controller.
- [x] `tests/unit/gestureCalibration.test.ts` — session-adaptive thresholds behave (its own test, separate from fixed-threshold controller tests).
- [x] Remove `npm run verify:m5.5` instead of keeping a parallel retired gesture harness.
- [x] `tests/unit/solarSystemData.test.ts` — M6 registry invariants for the nine MVP interactive bodies, activation/focus/return metadata, Moon parentage, and Saturn ring.
- [x] `tests/unit/stateMachine.test.ts` — M7 regression: released solar browsing states can enter `PlanetActivated` directly without throwing.
- [x] `tests/unit/solarSystemInteraction.test.ts` — M7 regression: activated bodies pause only orbit movement, keep self-rotation, and previous bodies resume orbit when activation switches.
- [x] `tests/unit/solarSystemInteraction.test.ts` — Earth-Moon binding: Earth activation lets Moon continue local orbit; Moon activation freezes both Earth solar orbit and Moon local orbit; both keep self-rotation.
- [x] `tests/gesture/planetActivationController.test.ts` — M7 hover hysteresis, pinch start/end hysteresis, inactive whole-handle guard, and brief tracking-loss tolerance.
- [x] `tests/gesture/planetActivationController.test.ts` — regression: pinch midpoint can activate a body even when the palm center is far away.
- [x] `tests/gesture/planetActivationController.test.ts` — regression: activation can switch from A to B so A is no longer the paused-orbit body.
- [x] Extend `tests/gesture/solarOpeningLifecycle.test.ts` so body hover/activation states keep the solar-system snapshot visible.

## Phase 2 — JSON gesture replay (after Phase 0/1 are useful and active gesture surfaces stabilize)

- [ ] Record a first batch of cleaned, short, anonymized fixtures (user records; see harness doc fixture policy).
- [ ] `tests/replay/replayRunner.ts` — drive controllers from multi-frame fixtures using fixture timestamps.
- [ ] `tests/replay/*.test.ts` — `fast-withdraw-stability`, `release-regrip-noisy`, lost-hand overlap.
- [ ] `tests/fixtures/frames/*` — single-frame fixtures for Layer 0 `handPose`/`palmOrientation` if synthetic geometry proves awkward.

## Phase 3 — Browser E2E (last, after active gesture surfaces stabilize)

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
