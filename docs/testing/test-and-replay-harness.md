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

Fast tests under `tests/unit/` for `math` (including shared transition easing), `coordinateMapping` (contain/mirror/world mapping), `handPairing` (visual-left/right ≠ MediaPipe handedness), Worker client protocol / one-frame-in-flight scheduling / raw hand-result conversion, `palmOrientation`, `handPose` (image + world landmarks), `intentScoring` (invariant/boundary assertions over golden numbers), `gestureCalibration`, `gestureInputFrame`, `solarSystemData` (registry invariants), `stateMachine`, `interactionAudioDirector` (user-approved final transition table including intentional silence, ambience cleanup, release edges, and the shared UI-hold lifecycle), and `solarSystemInteraction` (activation/orbit-pause/focus-overlay, focused-ring tilt hierarchy/front-back painter order/radial UVs, gravity-return corner direction, speed-scaled strength, nonzero radial fallback, Earth/Moon world-tangent merge, reusable Bloom VFX, and completion cleanup).

Run in Vitest `environment: 'node'`. Never import `src/rendering/scene.ts` or anything constructing a `WebGLRenderer`; only Three.js math (`PerspectiveCamera`, `Raycaster`, `Vector3`, `Plane`) is needed.

### Layer 1 — Controller sequence tests (done, keep extending)

Stateful tests under `tests/gesture/` driving controllers with synthetic `TrackingSnapshot` sequences and injected timestamps — no `main.ts`, browser, camera, or render loop. Covered: startup (close→pull), solar opening/lifecycle, whole-system intent (hold/release/re-grip/collapse), handle place-down, planet activation (hover/pinch hysteresis, short-side-normalized wrist-anchored Locked→Seeking translation, in-place fingertip motion that preserves DoubleClose, same-body re-anchor progress retention, held-pinch A→B landing, no transit-body commits, target-drift lock, relaxed-hand empty landing cancel, stationary open-hand cancel, interaction-point locking, ratio-only valley→peak→valley DoubleClose with unequal deep/shallow two-frame valleys, palm-scale invariance, jitter/held-close negatives, timeout diagnostics, and required final stable reopen), planet focus (intro cooldown, heat-zone-clear gate, single/two-hand dwell follow, distance scaling, downgrade, PinchTap release, wait-for-clear, tracking-gap tolerance), reusable index-finger UI holds (Earth-Moon switch, demo hand-model toggle, and focus-return card: hit, 0.5s hold, progress, cancel/success, reset/clear gate), passive-focus return throws (`PlanetFocusView` positive, `PlanetFocusFloating` 250ms arm delay, `PlanetFocusControlled` gesture exclusion, body-target/start-clearance gate, peak-speed + displacement + recent-away-trend positives, detector-sparse large-step completion on immediate middle-frame loss, edge-origin interior re-entry, visible/gap bridge metric accumulation, palm-scale/direction jump rejection, slow/closed/toward-body negatives, off-screen endpoint, handedness flip/array reorder/static off-hand), focus-return hold state transitions including `PlanetFocusControlled`, fresh-frame gate, and the debug recorder.

Conventions:

- Inject fixed `GestureThresholds` from `tests/helpers/testThresholds.ts` so controller logic is tested independently of session calibration (which has its own test).
- Shared synthetic builders live in `tests/helpers/` (`syntheticHands`, `trackingSnapshots`, `testCamera`, `testThresholds`) — single source, do not re-write per test file.
- When gesture/solar-control logic changes, add or update the matching test in the same change.

### Layer 2 — JSON gesture replay (runner done; real fixtures pending)

Multi-frame replay of recorded tracking noise, sourced from `gestureDebugRecorder` JSON exports (structured landmarks only — never raw webcam video). Goals: reproduce hand-overlap dropout, fast withdrawal, edge-of-frame partial tracking, and confusing release/re-grip sequences without re-waving hands.

- [x] Schema v3 records image + world landmarks, exact legacy pinch ratios/penalty, the active `SolarOpeningController` endpoint gate (distances, radius, score, dwell), layout/camera/plane inputs, solar output, and focused-body target context. It still records no image or video pixels.
- [x] `tests/replay/replayRunner.ts` restores tracking/camera inputs and drives `SolarOpeningController` from `PullArmed`, `PlanetActivationController` through hover/activation/DoubleClose, `PlanetFocusController` from `PlanetFocusView`, or the independent `PlanetReturnWaveController` from each recorded `PlanetFocusView` / `PlanetFocusFloating` / `PlanetFocusControlled` state with its recorded focused-body target. Additive schema-v3 activation target inputs are used when present; older v3 logs reconstruct their active/hover targets from recorded diagnostics, and a log beginning in `PlanetActivated` receives only the minimal pre-recording activation seed. A recorder session that already starts in `PlanetFocusFloating` may use an empty centered seed to rebuild the post-release focus gate. Original detection timestamps remain authoritative.
- [x] `tests/replay/replayRunner.test.ts` covers schema rejection, solar pull-open replay, activation/DoubleClose replay, anchored activation movement across transit bodies into a final settled target, focus-entry/dwell replay, floating-session seeding, `PlanetFocusView` return replay with body target, and separate legacy-vs-active endpoint curve extraction.
- [x] Local, uncommitted v3 recordings cover activation DoubleClose with fingertip motion, three true `PlanetFocusView` throws, one false reach toward Earth, and a detector-dropout fast return with an accepted high-impulse bridge, while the existing A/B/D inputs cover handle and PinchTap regressions. All are opt-in assertions in `tests/replay/localRecordingRegression.test.ts`.
- [ ] Record, clean, and anonymize compact A/B/C/D fixtures before committing any real fixture. C re-grip remains pending.

### Threshold-tuning capture protocol

Each `Record` starts a fresh session. Keep one scenario per export and stop shortly after the observed result; the recorder retains at most 1200 fresh detection frames.

- **A — initial endpoint grab fails:** begin in `EmptyIdle` before the closed-to-pull startup, then record through pull-open and the first endpoint hold. The replay must contain `PullArmed`.
- **B — focus follow falsely releases:** preferably begin before the same-hand DoubleClose and its final stable reopen enter focus, then record focus intro, heat-zone clear/re-entry, single-hand follow, and the unintended loss. This full replay must contain `PlanetFocusView`. A shorter diagnostic started in `PlanetFocusFloating` can still replay re-selection/follow/PinchTap through the empty seed, but it does not validate focus entry, DoubleClose, or the final reopen gate.
- **C — free-hover re-grip fails:** begin in `EmptyIdle`, record pull-open, deliberate fist→open place-down, hands clearing the endpoints, and the failed re-grip. The replay must contain `PullArmed` so frozen endpoint state is rebuilt rather than guessed.
- **D — intentional PinchTap succeeds:** use the same start point as B, but finish with one deliberate close→open PinchTap. This positive control prevents a false-release fix from making product place-down unreachable.
- **E — fast-away throw returns:** record either `PlanetFocusView` or `PlanetFocusFloating` with the focused-body target visible. Start the throwing hand outside the body hit zone, make one large coherent high-impulse throw away from the body in any display direction, and allow the hand to leave the frame naturally. For `PlanetFocusFloating`, include the first 250ms after place-down. Record separate negatives for reaching toward the body, slowly lowering the hand, start-inside-hit-zone movement, cross-gap palm-scale/direction discontinuities, and `PlanetFocusControlled` motion.

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
| AC-WRIST — in-place activation DoubleClose | Recording contains activation hand/fingertip motion | Wrist-anchored replay produces DoubleClose and reaches `PlanetFocusView` | Finger articulation remains available to the ratio detector while wrist translation independently gates switching. |
| E1 — three true `PlanetFocusView` throws | Recorded controller stays `Inactive / inactive-state` | Same-input segment replays trigger at original frame indices 63, 159, and 248 | Cross-gap peak speeds are 8.43, 5.95, and 5.66 short-sides/s; each endpoint is in a recent away-from-body trend. |
| E2 — reach toward Earth | Recorded controller falsely returns during a stable reach | Same-input full replay has zero return transitions | Peak impulse plus endpoint body-distance trend separates the reach from a throw without changing focus-follow semantics. |
| E3 — fast return followed by detector loss | Structured replay segment contains the large final hand step and following empty frame | Same-input replay triggers at frame index 246 with bridge metrics preserved | Terminal completion accepts validated high-impulse evidence without requiring the final visible point to be near an edge. |
| E4 — one prior success plus two natural downward-outward throws | The first throw returns; the later two do not | Same-input isolated segments all return with the direction angle retained only for diagnosis | Any-direction acceptance is covered by the recording, while synthetic tests cover right-down, left-up, straight-down, horizontal, slow lowering, toward-body motion, identity discontinuity, and the capped 150ms radius. |

Opt-in local replay command (paths are never stored in the repository):

```bash
GESTURE_REPLAY_A=/path/to/A.json GESTURE_REPLAY_B=/path/to/B.json GESTURE_REPLAY_PINCH_POSITIVE=/path/to/D.json GESTURE_REPLAY_RETURN_WAVE_TRUE=/path/to/E1.json GESTURE_REPLAY_RETURN_WAVE_FALSE=/path/to/E2.json GESTURE_REPLAY_RETURN_WAVE_DROPOUT=/path/to/E3.json GESTURE_REPLAY_RETURN_WAVE_ANY_DIRECTION=/path/to/E4.json GESTURE_REPLAY_DOUBLE_CLOSE_SUCCESS=/path/to/DC-C.json GESTURE_REPLAY_DOUBLE_CLOSE_RETRY=/path/to/DC-D.json GESTURE_REPLAY_ACTIVATION_WRIST_ANCHOR=/path/to/AC-WRIST.json npm run test:replay -- --run tests/replay/localRecordingRegression.test.ts --reporter=verbose
```

The local D recording confirms PinchTap remains reachable; E1/E2 validate true throws and a reach negative, while E4 preserves one prior success and adds two natural downward-outward positives without changing place-down semantics. C remains unverified. These local recordings are regression inputs rather than calibration targets, and none of the replays replace manual camera verification.

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

For interaction audio, manually verify in a real browser with speakers/headphones:

1. Start from the camera button and confirm no autoplay warning or console error.
2. Complete summon → handle → hover/select → focus/dwell/follow/release → fast-away return → close. Confirm sound only at whole-system release, focus placement release, UI holds, and solar ambience. Summon, hover/select, focus dwell/control/return, return landing, comet flyby, and inward close all stay silent.
3. Abort a partial pull, a UI hold, and a close/reopen once each. Partial pull has no audio; interrupted UI charging stops its shared loop; returning to empty clears ambience.
4. Toggle `M`, reload with `?mute=1`, and confirm both master-mute paths fade cleanly.
5. Sweep rapidly across bodies and complete a return while a comet crosses the scene; confirm all three remain silent.
6. Refresh and repeat the full chain to catch stale one-session state.
7. Confirm every retained sound uses 100% of its current manifest gain. Future mix changes require a new explicit listening decision and a manifest update; do not add runtime gain overrides.
8. After the solar system finishes opening, confirm the selected warm `Warm Pad Fragment – Short` ambience fades in at manifest gain `0.25`, loops without a click or silence gap, and the previous darker ambience is gone.

For anchored activation switching and cancellation:

1. Pinch-activate one body, keep the same hand naturally pinched or relaxed, move the wrist to a different body, and stop. Observe the activated label and Debug `Activation motion/landing`. Pass: wrist phase changes `Locked → Seeking → Locked`, transit bodies never activate, and only the settled body switches.
2. Hold the activating wrist within a small area while completing DoubleClose and while neighbouring bodies/hit zones move behind it. Pass: wrist travel/speed stay stable, phase remains `Locked`, and the activated body, interaction-point kind, and DoubleClose progress do not jump; finger articulation and target drift alone neither switch nor cancel.
3. With a naturally relaxed thumb/index pair, move from the activated body to clear empty space and stop. Pass: `settleTarget=empty` appears after the low-speed frames and activation cancels after the short dwell without requiring a deliberate finger reopen.
4. Activate again and keep the hand at the anchor, then deliberately open thumb/index and hold. Pass: the stationary release fallback cancels; a normal two-click valley→peak→valley cadence still enters focus instead of cancelling.

For the gravity-capture return, manually verify both directions and the child orbit:

1. In `PlanetFocusView`, throw once toward the visible upper-left and once toward the visible upper-right. Observe the focused body, not the landmark overlay. Pass: the launch first travels toward the same display corner, never the mirrored opposite, before curving back.
2. Repeat with a just-over-threshold throw and a clearly faster throw. Pass: both return, and the faster throw has a visibly longer launch arc without leaving the useful view.
3. Enter the Earth-Moon focus, switch to the Moon, and return it. Pass: the Moon finishes tangentially along its Earth-parented orbit rather than radially striking the orbit.
4. Repeat focus/return several times. Pass: the capture ripple, afterimages, streak, solar pulse, and target-orbit glow all clear after each run; the restored body resumes from the merge point with no visible jump.

For the focused Saturn ring:

1. Enter Saturn focus and observe the planet bands, both ring limbs, and the ring segment crossing the sphere. Pass: the ellipse long axis follows the same tilt as the bands, the far half is hidden by the sphere, the near half remains in front, and both outer side arcs are intact.
2. Pick up, place, and return Saturn. Pass: both ring halves follow every focus transform with no seam flash, detached arc, or residue; other focused planets and the overview Saturn remain visually unchanged.
