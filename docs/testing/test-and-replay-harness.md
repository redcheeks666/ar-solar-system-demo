# Test & Replay Harness

Testing strategy for gesture logic, solar-system control, and (later) replay diagnostics and browser checks. This is a cross-cutting workflow, not a product milestone.

## Purpose

Manual webcam gesture testing stays for final acceptance, but it is too expensive for normal regression work. The harness locks the deterministic parts with Vitest first, then adds structured gesture replay and browser-level checks later.

## Commands

```bash
npm test            # all Vitest suites
npm run test:unit   # tests/unit
npm run test:gesture# tests/gesture
npm run test:replay # tests/replay
```

Pre-merge local check: `npm run typecheck && npm test && npm run build`.

## Determinism Guardrail

All gesture controllers are deterministic given `(input, timestamp)`: `src/interaction/**` contains no `Math.random`, `Date.now`, or `performance.now`; time is injected via `update(..., timestamp)` and only the render loop in `main.ts` reads the clock. `tests/unit/determinism.test.ts` enforces this. Randomized visuals (star dust, particles) belong in rendering/solar code, never in interaction controllers.

## Testing Layers

### Layer 0 — Leaf pure functions (done, keep extending)

Fast tests under `tests/unit/` for `math`, `coordinateMapping` (contain/mirror/world mapping), `handPairing` (visual-left/right ≠ MediaPipe handedness), Worker client protocol / one-frame-in-flight scheduling / raw hand-result conversion, `palmOrientation`, `handPose` (image + world landmarks), `intentScoring` (invariant/boundary assertions over golden numbers), `gestureCalibration`, `gestureInputFrame`, `solarSystemData` (registry invariants), `stateMachine`, and `solarSystemInteraction` (activation/orbit-pause/focus-overlay/return-animation semantics).

Run in Vitest `environment: 'node'`. Never import `src/rendering/scene.ts` or anything constructing a `WebGLRenderer`; only Three.js math (`PerspectiveCamera`, `Raycaster`, `Vector3`, `Plane`) is needed.

### Layer 1 — Controller sequence tests (done, keep extending)

Stateful tests under `tests/gesture/` driving controllers with synthetic `TrackingSnapshot` sequences and injected timestamps — no `main.ts`, browser, camera, or render loop. Covered: startup (close→pull), solar opening/lifecycle, whole-system intent (hold/release/re-grip/collapse), handle place-down, planet activation (hover/pinch hysteresis, open-hover→new-pinch A→B switching, closed-cycle body/interaction-point locking, ratio-only valley→peak→valley DoubleClose with unequal deep/shallow two-frame valleys, palm-scale invariance, jitter/held-close negatives, timeout diagnostics, and required final stable reopen), planet focus (intro cooldown, heat-zone-clear gate, single/two-hand dwell follow, distance scaling, downgrade, PinchTap release, wait-for-clear, tracking-gap tolerance), reusable index-finger UI holds (Earth-Moon switch and demo hand-model toggle: hit, 0.5s hold, reset/clear gate), passive-focus upper-left/upper-right return throws (`PlanetFocusView` positive, `PlanetFocusFloating` 250ms arm delay, `PlanetFocusControlled` exclusion, body-target/start-clearance gate, peak-speed + displacement + recent-away-trend positives, slow/closed/toward-body negatives, three-frame gap bridge, off-screen endpoint, handedness flip/array reorder/static off-hand), fresh-frame gate, and the debug recorder.

Conventions:

- Inject fixed `GestureThresholds` from `tests/helpers/testThresholds.ts` so controller logic is tested independently of session calibration (which has its own test).
- Shared synthetic builders live in `tests/helpers/` (`syntheticHands`, `trackingSnapshots`, `testCamera`, `testThresholds`) — single source, do not re-write per test file.
- When gesture/solar-control logic changes, add or update the matching test in the same change.

### Layer 2 — JSON gesture replay (runner done; real fixtures pending)

Multi-frame replay of recorded tracking noise, sourced from `gestureDebugRecorder` JSON exports (structured landmarks only — never raw webcam video). Goals: reproduce hand-overlap dropout, fast withdrawal, edge-of-frame partial tracking, and confusing release/re-grip sequences without re-waving hands.

- [x] Schema v3 records image + world landmarks, exact legacy pinch ratios/penalty, the active `SolarOpeningController` endpoint gate (distances, radius, score, dwell), layout/camera/plane inputs, solar output, and focused-body target context. It still records no image or video pixels.
- [x] `tests/replay/replayRunner.ts` restores tracking/camera inputs and drives `SolarOpeningController` from `PullArmed`, `PlanetActivationController` through hover/activation/DoubleClose, `PlanetFocusController` from `PlanetFocusView`, or the independent `PlanetReturnWaveController` from each recorded `PlanetFocusView` / `PlanetFocusFloating` / `PlanetFocusControlled` state with its recorded focused-body target. Additive schema-v3 activation target inputs are used when present; older v3 logs reconstruct their active/hover targets from recorded diagnostics, and a log beginning in `PlanetActivated` receives only the minimal pre-recording activation seed. A recorder session that already starts in `PlanetFocusFloating` may use an empty centered seed to rebuild the post-release focus gate. Original detection timestamps remain authoritative.
- [x] `tests/replay/replayRunner.test.ts` covers schema rejection, solar pull-open replay, activation/DoubleClose replay, focus-entry/dwell replay, floating-session seeding, `PlanetFocusView` return replay with body target, and separate legacy-vs-active endpoint curve extraction.
- [x] Local, uncommitted v3 recordings cover three true `PlanetFocusView` throws and one false reach toward Earth, while the existing A/B/D inputs cover handle and PinchTap regressions. All are opt-in assertions in `tests/replay/localRecordingRegression.test.ts`.
- [ ] Record, clean, and anonymize compact A/B/C/D fixtures before committing any real fixture. C re-grip remains pending.

### Threshold-tuning capture protocol

Each `Record` starts a fresh session. Keep one scenario per export and stop shortly after the observed result; the recorder retains at most 1200 fresh detection frames.

- **A — initial endpoint grab fails:** begin in `EmptyIdle` before the closed-to-pull startup, then record through pull-open and the first endpoint hold. The replay must contain `PullArmed`.
- **B — focus follow falsely releases:** preferably begin before the same-hand DoubleClose and its final stable reopen enter focus, then record focus intro, heat-zone clear/re-entry, single-hand follow, and the unintended loss. This full replay must contain `PlanetFocusView`. A shorter diagnostic started in `PlanetFocusFloating` can still replay re-selection/follow/PinchTap through the empty seed, but it does not validate focus entry, DoubleClose, or the final reopen gate.
- **C — free-hover re-grip fails:** begin in `EmptyIdle`, record pull-open, deliberate fist→open place-down, hands clearing the endpoints, and the failed re-grip. The replay must contain `PullArmed` so frozen endpoint state is rebuilt rather than guessed.
- **D — intentional PinchTap succeeds:** use the same start point as B, but finish with one deliberate close→open PinchTap. This positive control prevents a false-release fix from making product place-down unreachable.
- **E — upper-corner throw returns:** record either `PlanetFocusView` or `PlanetFocusFloating` with the focused-body target visible. Start the throwing hand outside the body hit zone, make one large high-impulse throw toward either upper corner, and allow the hand to leave the frame naturally. For `PlanetFocusFloating`, include the first 250ms after place-down. Record separate negatives for reaching toward the body, slow diagonal movement, start-inside-hit-zone movement, and `PlanetFocusControlled` motion.

Schema v2 logs remain useful as preliminary diagnostics, but they cannot be used as final same-input replay evidence because they omit world landmarks, the active endpoint gate, and controller input context.

### Current local v3 replay coverage

The supplied recordings stay local and are reference samples, not personal calibration targets. Thresholds use rounded semantic margins and every behavioral change also has synthetic boundary tests.

| Scenario | Recorded controller output | Same-input replay after change | Interpretation |
|---|---:|---:|---|
| A — endpoint grab appears to fail | 11 max-width auto place-down transitions immediately after otherwise successful endpoint dwell/re-grip | 0 max-width releases; 156 replay frames remain in `SolarHandleControl` | Root cause was the old 0.72 one-frame width release, not endpoint confidence or pinch penalty. |
| B — focus stops following | 2 PinchTap release transitions | 2 releases are reproduced by the restored historical controller | The user explicitly requires the original immediate ratio-hysteresis PinchTap semantics; this recording remains diagnostic and must not be used to introduce a new debounce/place-down protocol. |
| D — deliberate PinchTap is hard to trigger | Recording made with the rejected debounced controller releases 5575ms after two-hand follow starts | Restored historical controller releases after 3400ms, on the first clearly completed close-open cycle | Historical behavior is preserved: either following hand may complete one `ratio <= 0.32` then `ratio >= 0.45` cycle, with no added phase dwell or close-time window. |
| DC-C — completed DoubleClose | Recording enters `PlanetFocusView` | Ratio-only replay enters no later than the recorded transition | Positive control keeps focus entry responsive. |
| DC-D — repeated DoubleClose | Recording remains in `PlanetActivated` for all 399 frames | Ratio-only replay reaches `PlanetFocusView` | Full human valley→peak→valley motion is accepted without pixel-distance calibration. |
| E1 — three true `PlanetFocusView` throws | Recorded controller stays `Inactive / inactive-state` | Same-input segment replays trigger at original frame indices 63, 159, and 248 | Cross-gap peak speeds are 8.43, 5.95, and 5.66 short-sides/s; each endpoint is in a recent away-from-body trend. |
| E2 — reach toward Earth | Recorded controller falsely returns during a stable reach | Same-input full replay has zero return transitions | Peak impulse plus endpoint body-distance trend separates the reach from a throw without changing focus-follow semantics. |

Opt-in local replay command (paths are never stored in the repository):

```bash
GESTURE_REPLAY_A=/path/to/A.json GESTURE_REPLAY_B=/path/to/B.json GESTURE_REPLAY_PINCH_POSITIVE=/path/to/D.json GESTURE_REPLAY_RETURN_WAVE_TRUE=/path/to/E1.json GESTURE_REPLAY_RETURN_WAVE_FALSE=/path/to/E2.json GESTURE_REPLAY_DOUBLE_CLOSE_SUCCESS=/path/to/DC-C.json GESTURE_REPLAY_DOUBLE_CLOSE_RETRY=/path/to/DC-D.json npm run test:replay -- --run tests/replay/localRecordingRegression.test.ts --reporter=verbose
```

The local D recording confirms PinchTap remains reachable; the return-wave E1/E2 pair validates both true throws and the reach negative without changing place-down semantics. C remains unverified. These local recordings are regression inputs rather than calibration targets, and none of the replays replace manual camera verification.

### Layer 3 — Browser E2E (todo, last)

Playwright replay through a dev/test-only route (`/?replay=...`) — needs a `main.ts`/`TrackingSource` seam, deferred until controller-level replay has proven useful. Would verify: empty scene before pull-open, canvas blank→nonblank, no console errors, viewport layouts, `?solarPreview=1` stays dev-only. Do not add `src/testing/` before this layer genuinely needs it.

### Continuous Integration (todo)

- [ ] `.github/workflows/ci.yml` running `npm ci`, `typecheck`, `test:unit`, `test:gesture`, `build` on push/PR — deterministic headless layers only, no camera/GPU.
- [ ] Add the existing `test:replay` command, and later `test:e2e`, as separate CI steps once CI exists.

## Fixture Policy

- Never commit raw webcam video.
- Prefer synthetic landmarks for unit and controller tests.
- Single-frame fixtures (`tests/fixtures/frames/*.json`, Layer 0 pure-function input) need no timestamps or replay machinery; multi-frame sequence fixtures (Layer 2) are time-ordered and keep their timestamps.
- Recorded fixtures must be short, focused, and anonymized before committing; keep personal long-form gesture logs local.

## What Still Needs Manual Camera Verification

Automated tests do not replace camera acceptance: real lighting, hand shapes and comfort, fist-overlap occlusion, edge-of-frame tracking, webcam angle/quality differences, status-copy readability while moving, and final threshold/ergonomics tuning. The goal is that manual testing happens at milestone acceptance and threshold-tuning moments, not after every small code change.
