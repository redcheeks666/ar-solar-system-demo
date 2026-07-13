# AGENTS.md

## Project Identity

Browser-based webcam AR gesture interaction demo: **AR Solar System**. The user pulls a 3D solar system open between their hands in front of a webcam, manipulates it, focuses individual planets, and returns them to orbit — all hand-gesture driven. This is not a generic 3D solar-system viewer; the 3D content must feel like it exists in the camera-visible space controlled by the user's hands.

The MVP interaction loop:

```text
camera on → initial empty AR scene
→ in EmptyIdle, hands close together anywhere in frame → HandsClosed
→ hands pull apart → PullArmed → solar system opens between both hands
→ solar system free-hovers at the released position (fixed oblique visual angle)
→ both hands re-grip left/right endpoints for handle control, place-down, or reverse collapse
→ hover + pinch activates a body (8 overview entries; Moon maps to the Earth-Moon group)
→ same activating hand thumb/index DoubleClose enters single-planet focus view
→ heat-zone dwell (1s) enters single-hand follow; two-hand dwell follows + scales by hand distance
→ following-hand PinchTap places the body down floating in the focus view
→ index fingertip held 1s on the top-left "长按返回太阳系" glass button returns it to orbit
```

## Source of Truth

1. `ar_solar_system_prd.md` — product requirements and interaction rules.
2. `AGENTS.md` — durable rules for coding agents.
3. `docs/testing/test-and-replay-harness.md` — testing strategy and status.

When the user changes or clarifies a requirement, update the affected docs in the same change set. If code and docs disagree, the latest explicit user-approved requirement wins. Do not leave docs stale after a behavior change; the final response should state which docs were updated.

## Agent Companion Repository

Private companion repo for agent-development memory: `<private-companion-repo>`, local sibling at `~/CodeXProject/agent-companion-repo`. It stores requirement interactions, workflow decisions, and doc snapshots — never product source code, secrets, or raw webcam captures.

Commits in the main repo should refresh the companion repo via `.githooks/post-commit` (`core.hooksPath=.githooks`). If automatic sync fails, run `npm run sync:agent:push` manually and mention the failure.

## MVP Boundary

Web Demo only. Do not introduce Electron, Tauri, TouchDesigner, Unity, Unreal, XR devices, mobile support, backend services, authentication, databases, analytics, or deployment infrastructure unless the user explicitly asks.

## Tech Stack

- Vite + TypeScript, Three.js for 3D, MediaPipe Tasks Vision for hand/pose landmarks, browser MediaDevices for webcam, requestAnimationFrame render loop, lightweight CSS for UI/debug panels.
- Prefer Three.js built-ins (`Raycaster`/`unproject`, `Quaternion`/`slerp`) — see "Reuse vs. Custom" below.
- No React, GSAP, or other frameworks unless native approaches become insufficient and the user agrees.

## Repository Shape

Keep camera (`src/camera/`), tracking (`src/tracking/`), interaction (`src/interaction/`), solar-system simulation (`src/solar/`), and rendering (`src/rendering/`) separated. Shared math and types live in `src/utils/`. Tests live under `tests/` (unit / gesture / helpers), outside `src`. Avoid putting the whole app in one large file.

## Product Invariants

These rules must not be broken without explicit user approval and doc updates.

### Initial Empty Scene

At startup and before pull-open: webcam video, minimal 2D instruction text, and debug landmarks (debug mode only). No 3D sun, planet, orbit, nebula, star dust, singularity, or decorative object. The dev-only `?solarPreview=1` route may show placeholder visuals for testing but must not change the normal startup path.

### Hand-Only Startup

The solar system appears only after a valid two-hand closed-to-pull gesture — never from a timer or page load. Startup is hand-only: no chest anchor, shoulder, or body-pose dependency.

- `HandsClosed` requires `EmptyIdle` + both hands detected close together anywhere in frame.
- `PullArmed` is reachable only from `HandsClosed`; a generic pull-apart must not arm startup.
- Brief one-hand loss during overlap may hold recent two-hand evidence; a single hand alone must not start.
- While hands stay closed, no solar content or animation plays.
- Opening progress is driven by current hand distance; pausing hands pauses progress (no auto-complete).
- The left/right opening endpoints visually follow the left/right hands.
- After leaving the startup chain, closed/pull motion belongs to the active scene state and must not re-enter `HandsClosed`/`PullArmed`.

### Free Hover and Placement

- After release, the solar system hovers at the last stable position and scale — never snapping to screen center or a chest/body reference.
- The whole-system overview keeps a fixed AE-equivalent oblique visual angle; runtime controllers update only position and scale. No gesture-driven whole-system rotation.
- Pose tracking (`PoseLandmarker`) is disabled by default (`ENABLE_POSE_TRACKING` in `src/tracking/config.ts`) because nothing currently consumes body reference; do not assume pose data is present.

### Whole-System Handle, Release, Re-Grip

- Control affordance = two independent 3D control endpoints on the solar system's left/right edges (no connected joystick/rod visual).
- Post-opening handle control requires both hands to stably hit the endpoints ~0.5s (`ENDPOINT_ENTER_STABLE_MS`) to enter `SolarHandleControl`; the same 0.5s endpoint dwell re-grips from `SolarFreeHover`. Endpoint proximity, not hand pose, is the re-grip gate.
- While controlled, the system stays hand-attached; leaving the endpoints is NOT place-down. Place-down comes only from: (1) both hands fist→reopen (armed fist freezes transform; timeout `PLACE_DOWN_ARMED_TIMEOUT_MS` resumes follow), (2) auto place-down when the two-hand screen-x span reaches `MAX_VISUAL_WIDTH_SCREEN_FRACTION`, (3) sustained full loss of both hands (`HANDLE_HAND_LOSS_RELEASE_MS`); a one-frame gap must not place down.
- Gripped hands moving inward reverse-collapse the system; fully closed returns to the empty scene.
- Handle gestures must remain separate from planet pinch activation; strong pinch intent lowers whole-system control confidence.

### Interactive Bodies

Overview entries: Mercury, Venus, Earth-Moon group, Mars, Jupiter, Saturn, Uranus, Neptune. One unified body data model and one unified activation/focus/return pipeline — no per-planet one-off code. Moon renders as an Earth satellite and is a focusable overlay, but hitting Moon in the overview maps to the Earth-Moon group. Only one entry may be activated/focused at a time; Earth-Moon focus shows Earth by default.

### Activation, Focus, Follow, Return

- Pinch near a hovered body enters `PlanetActivated`: that body stops orbiting but keeps self-rotation; others continue normally. Earth-Moon exception: Earth's solar orbit pauses while Moon may keep orbiting Earth. Switching activation to another body immediately resumes the previous body's orbit.
- Two closeDown events from the same activating hand's thumb/index pair enter `PlanetFocusView` (the initial activation pinch does not count; a long hold is not two events; the reopen between them is a small click reopen, not a full pinch release). Brief same-hand heat-zone exits keep selection; ~1s away while open cancels. Passing over another body while open must not switch selection.
- Focus view: background solar system dims by directly lowering object opacity (no camera-covering mask), stays interaction-locked but keeps basic motion. One unified focused-body overlay driven by body metadata. Focus entry animates from the body's original position/scale over ~0.3s; the focused sphere is vertically centered at ~1/2–2/3 screen height, unlit (no spotlight glare), and keeps self-rotating throughout.
- Follow gating: after the intro centers the body, hands already in the heat zone must leave and re-enter before any dwell can begin. One hand dwelling 1s in the heat zone → single-hand follow (body tracks that hand's thumb+index midpoint, clamped on-screen). Two hands dwelling 1s → two-hand follow (midpoint tracking; size driven ONLY by the distance between the two hands, never by a hand's own pinch). An off hand appearing outside the heat zone must not drop single-hand follow (spatial-continuity re-acquisition). One hand leaving two-hand follow downgrades to move-only single-hand follow with the staying hand.
- `PinchTap` (thumb-to-any-finger close-open) by a following hand places the body down → `PlanetFocusFloating` (still in focus view, not back to orbit). After place-down, all hands must leave the heat zone before re-selection. A floating body never auto-returns to orbit.
- Return is UI-driven only: a top-left transparent glass button (return icon + "长按返回太阳系") shown in all focus states; the tracked index fingertip held on it 1 second fills a progress bar and enters `BodyReturning` — mouse/DOM clicks are not the product path. The Earth-Moon focus additionally shows a second glass button ("长按切换月球视角"/"长按切换地球视角", 0.5s hold) to swap the focused overlay; it must not appear in other focus views. Return animates ~0.5s back to the original orbit position/scale, restores background opacity, unlocks interaction, and exits to the solar-system view.

### Retired Semantics (do not reintroduce)

Retired by explicit user decision; do not re-implement unless the user explicitly reopens them:

- M5.5 one-hand solar inspection after `SolarFreeHover`: spread-zoom, contract-shrink, fist-hold reset, push-pan.
- Whole-system gesture rotation, palms-up rotation, palm-forward "sliding glass" scaling, two-hand distance zoom of the released overview.
- Open-hand release / palms-up hold-protection / release-latch as the product place-down (protocol/debug-only now).
- Pinch-and-throw return and the palm-facing open-hand return gesture.
- Old one-hand zoom/pan/reset inside planet focus.
- Moon as a separate overview activation entry.
- The `verify:m5.5` script and its harness.

Legacy protocol fields (palm normals, scale/rotation diagnostics, release confidences) may stay in the Debug panel as diagnostics; never as active product controls or the main status explanation.

## Interaction State Machine

Implement interaction as explicit states, inspectable in the debug panel:

```text
CameraReady, EmptyIdle, HandsClosed, PullArmed,
SolarOpening, SolarActive, SolarFreeHover, SolarHandleControl, SolarClosing,
BodyHover, PlanetActivated, PlanetFocusView, PlanetFocusControlled,
PlanetFocusFloating, BodyReturning
```

Debug labels distinguish `Startup state` (closed-to-pull startup) from `Whole control` (handle protocol). The user-facing Chinese status summary follows `interactionState` plus solar controller reason/progress/scale — legacy `wholeSystemIntent` values stay Debug-panel-only.

## Coordinate and Smoothing Rules

- Normalized camera coordinates are the tracking input, mapped into the Three.js scene through `coordinateMapping.ts` only.
- Low-pass filter hand positions; short hold windows for missing hands during startup and activation/focus; hysteresis for pinch start/end; stable index-fingertip timing for button holds.
- Reject abrupt endpoint-geometry outliers before updating solar position/scale: fast withdrawal, edge-of-frame partial tracking, or one-frame mis-detection must hold the last stable transform.
- Run interaction controllers only on fresh MediaPipe detection frames (`freshFrameGate.ts`, fed the detection timestamp); rendering still runs every rAF. UI-only long-press progress may run on render frames.
- Assign visual-left/right hand identity from the previous frame's trajectory BEFORE smoothing, per visual slot (`gestureInputFrame.ts`) — never smooth per MediaPipe handedness.
- Screen-plane gesture distances (close/pull/endpoint/hover/support) use 2D x/y only — never MediaPipe image-landmark z. Hand-shape scoring (open/fist/pinch) prefers world landmarks.
- No single-frame state flips for important gesture actions.

## Debug and Recording

Keep a debug panel behind a toggle: FPS, camera/tracking status, interaction state, hand positions/distance/velocity, whole-system protocol state and confidences, endpoints and match state, calibration thresholds, pinch state, hovered/activated/focused body, focus-controller snapshot (control mode, heat-zone distances, dwell timers, PinchTap state, return-button progress), display/canvas dimensions, and performance costs. Include a concise Chinese status summary stating the current interpreted intent, reason, and key parameters.

The debug gesture recorder exports structured landmarks, primitives, calibration values, intent scores, states, and transition reasons as JSON (including the `planetFocus` snapshot in focus flows). Never record raw webcam video or upload data. Each recording start opens a fresh session.

Demo mode (`?demo=1`) is the presentation route: it hides the top-right Debug toggle, the Chinese status summary card, and the bottom gesture guidance text without changing interaction behavior. The default route keeps all debug UI.

## Development Workflow

Work milestone by milestone; make the smallest useful change; inspect existing files first; run available checks; update docs when behavior or scope changes; sync the companion repo; summarize changed files, validation results, and manual camera-test needs.

### Visual Effects Guardrail

Visual-effects work (materials, textures, lighting, glow, particles, labels, UI polish, performance) sits ON TOP of tested interaction behavior. Do not modify gesture state machines, thresholds, hand pairing, fresh-frame gating, coordinate mapping, opening/release/re-grip/collapse semantics, activation/focus/follow/return semantics, or the object visibility lifecycle unless the user explicitly requests it. If a visual goal appears to require an interaction change, pause and state the proposed change and risk first.

The AE rift boundary halo must stay close to the approved PNG look: keep the dark support pass + additive AE border pass; no extra runtime glow passes, global bloom, independent halo rotation/scale, or autoplaying visual lifecycles without explicit approval.

### Manual Verification

When a milestone or acceptance item needs camera verification, provide a checklist: the user action, where to observe, and the exact pass condition. Do not mark gesture-dependent work done until the user confirms it passes. Never pretend to have tested webcam gestures from a headless environment — mark them "Needs manual camera verification".

## Verification Commands

```bash
npm run typecheck
npm test            # all Vitest suites (tests/unit + tests/gesture)
npm run build
```

Before marking implementation tasks complete: typecheck, all tests pass, build passes. When gesture/solar-control logic changes, add or update the matching test under `tests/`; use `docs/testing/test-and-replay-harness.md` to decide which layer it belongs to.

Gesture modules under `src/interaction/**` must contain no `Math.random`, `Date.now`, or `performance.now` — all time is injected via `update(..., timestamp)`; a guardrail test enforces this.

## Coding Rules

- Clear TypeScript types for landmarks, gesture states, and celestial-body states.
- Named constants for thresholds; visual constants separate from gesture thresholds.
- No expensive per-frame allocations in the render loop; avoid per-landmark layout reads (`getBoundingClientRect` etc.) — read once per frame; gate debug-only metrics behind debug visibility.
- Dispose Three.js geometries/materials/textures when no longer needed.
- Remove controller state that is written but never read, in the same change that obsoletes it.
- Keep UI responsive while models load; fail gracefully on denied camera permission.

### Single Sources of Truth (do not duplicate)

- `src/utils/math.ts` — shared vector/scalar math. No local copies in other modules.
- `src/interaction/handPairing.ts` — visual-left/right assignment (visual-left = larger camera-frame x in the mirrored preview). All gesture modules use `getVisualTrackedHandPair`/`sortVisualLeftRight`; never confuse with MediaPipe handedness.
- `src/interaction/intentTuning.ts` — every tunable whole-system gesture threshold and blend weight. No magic numbers in scoring functions.
- `src/interaction/handLandmarks.ts` — hand landmark index constants.
- `src/interaction/palmOrientation.ts` / `handPose.ts` / `intentScoring.ts` — pure, stateless scoring. Cross-frame state lives only in `wholeSystemIntent.ts` (the orchestration layer); do not move pure scoring back in.
- `src/interaction/coordinateMapping.ts` — the ONLY place converting normalized MediaPipe coordinates to stage pixels and Three.js world coordinates (`object-fit: contain` + mirror aware; unprojects via `Raycaster` against the real camera and `z = INTERACTION_PLANE_Z`). No hand-rolled `(1 - x) * width` mapping elsewhere; no fixed-camera `tan(fov/2)` projection.
- `src/interaction/gestureInputFrame.ts` — visual identity assignment before smoothing.
- `src/interaction/freshFrameGate.ts` — `isFreshTrackingFrame` gating for controllers.

### Reuse vs. Custom

Requirement fit first: don't force-fit a library call, and don't rewrite working custom code for uniformity. But check library built-ins before hand-writing projection, rotation, skeleton tables, or drawing helpers. Sanctioned custom choices (keep, don't "fix"):

- `src/utils/math.ts` scalar/vector helpers — landmark data is plain objects; `THREE.Vector3` would add per-frame allocation for no benefit.
- `landmarkOverlay.ts` `drawLine`/`drawPoint` — must route through `coordinateMapping` for mirror/contain/DPR alignment, which `DrawingUtils` cannot honor. The connection table still comes from `HandLandmarker.HAND_CONNECTIONS`.

## Visual Rules

- Webcam feed is the background; 16:9 preview stage with `object-fit: contain` (never `cover`/cropping). The transparent Three.js canvas and any debug overlay share the exact displayed dimensions of the video.
- Minimal user-facing UI; visible feedback for hover, activation, focus, PinchTap place-down, and return.
- Small bodies (Mercury) get expanded hit areas; Saturn keeps a recognizable ring.
- Star dust, nebula, and glow appear only after pull-open begins.

## Do Not

- Do not turn this into a generic 3D solar-system viewer.
- Do not show any 3D object in the initial empty scene, or auto-play opening independent of hand distance.
- Do not let PinchTap, pinch relaxation, tracking loss, or ordinary open-hand motion return a body to orbit (return is the 1s button hold only).
- Do not reintroduce retired semantics (see list above).
- Do not add backend, login, database, payments, analytics, deployment, or non-web engines for the MVP.
- Do not leave docs stale after a requirement change.

## Definition of Done

1. Behavior matches the latest user-approved requirement, scoped to the current task.
2. `npm run typecheck`, `npm test`, and `npm run build` pass (or failures are clearly documented).
3. Gesture/solar-control changes carry matching `tests/` coverage.
4. The debug panel exposes enough state to inspect the new behavior.
5. `ar_solar_system_prd.md` updated if product behavior changed; `AGENTS.md` updated if durable rules changed.
6. The final response states what changed, how it was verified, and what still needs manual camera testing.
