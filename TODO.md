# TODO.md

Project: AR Solar System Webcam Gesture Demo
Current planning baseline: PRD v0.5, 2026-06-23
Primary delivery target: Web Demo first

## How to Use This File

This file is the working task board for Codex and future coding agents.

Canonical rule:

- `TODO.md` is the canonical working task board.
- `TODO.zh-CN.md` is a Chinese reading mirror for the user only.
- Codex and future agents must continue to use the English `TODO.md` for planning and status decisions.
- Whenever `TODO.md` changes, update `TODO.zh-CN.md` in the same change set.

Status values:

- `TODO` — not started.
- `IN_PROGRESS` — being implemented.
- `BLOCKED` — cannot continue without a decision, dependency, or manual test.
- `NEEDS_MANUAL_VERIFY` — code exists, but webcam/gesture behavior must be tested by a human in-browser.
- `DONE` — implemented, checked, and docs are synchronized.

A task can be marked `DONE` only when its acceptance criteria are met and the documentation sync rules in `AGENTS.md` have been followed.

## Documentation Sync Checklist

Use this checklist whenever requirements change during a Codex conversation.

- [ ] Restate the changed requirement in plain language.
- [ ] Confirm that the user agrees or proceeds with the new interpretation.
- [ ] Update `ar_solar_system_prd.md` if product behavior, interaction rules, acceptance criteria, or scope changed.
- [ ] Update `TODO.md` if milestone scope, status, task order, acceptance criteria, blockers, or current plan changed.
- [ ] Update `TODO.zh-CN.md` whenever `TODO.md` changes; keep it as a reading mirror only.
- [ ] Update `AGENTS.md` if durable coding rules, architecture constraints, workflow rules, or do-not rules changed.
- [ ] Update the private `agent-companion-repo` companion repo if the change affects requirements, TODO status, agent workflow, or tool usage context.
- [ ] Add an entry to the Change Log at the bottom of this file.
- [ ] Mention changed docs in the final Codex response.

## Current Non-Negotiable Product Rules

- [ ] Web Demo first.
- [ ] Initial AR scene is empty: no 3D sun, planet, orbit, nebula, singularity, star dust, or decorative 3D object before the pull-open gesture.
- [ ] Solar system appears only after the user brings both hands/fists together anywhere in the visible camera frame and pulls them apart.
- [ ] Closed hands/fists alone do not play any solar-system animation or show 3D content.
- [ ] Opening progress is driven by hand distance and should not auto-complete if hands stop.
- [ ] Opening endpoints visually follow both hands.
- [ ] Opened solar system may use body-relative placement for initial AR feel, but after release it can hover at any user-chosen position.
- [ ] Releasing the whole-system two-hand handle leaves the solar system hovering at its last stable transform.
- [ ] Re-gripping the left and right endpoints lets the user continue whole-system handle control for placement, release, and collapse.
- [ ] Moving gripped hands inward from the opened state collapses the solar system in reverse and returns to the empty camera view when fully closed.
- [ ] Current solar-system inspection controls are the Milestone 5.5 one-hand controls after `SolarFreeHover`: spread to zoom in, contract to shrink, fist-hold to reset, and push to pan.
- [ ] Palm-forward "sliding glass" scaling and palms-up whole-system rotation are retired M5 gesture semantics; keep them only as legacy/debug protocol context unless the user explicitly reopens them.
- [ ] Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon can be hovered and pinch-activated in MVP.
- [ ] A pinch-activated body stops its original orbit but keeps natural self-rotation; other bodies continue normal orbit and self-rotation.
- [ ] Main-hand pinch lock plus off-hand open/spread enters a single-planet focus view.
- [ ] In the single-planet focus view, the background solar system is dimmed and interaction-locked while preserving basic motion.
- [ ] The focused body keeps self-rotating during activation, focus, zoom, pan, support-follow, release-to-floating, and inspection.
- [ ] Main-hand support plus off-hand `PinchTap` releases follow-control and leaves the body floating in the focus view.
- [ ] A clear pinch-and-throw gesture toward the original orbit target returns the focused body to orbit and exits back to the solar-system view.
- [ ] Documentation is updated when requirements or completed scope change, including `TODO.zh-CN.md` whenever `TODO.md` changes.
- [ ] The private `agent-companion-repo` companion repo is updated whenever the main code repo is committed or agent workflow context changes.

## Milestone 0 — Repository and Document Setup

Status: `DONE`

Goal: Prepare the repo so Codex has stable context and can work milestone by milestone.

Tasks:

- [x] Create or confirm repository root.
- [x] Place the latest PRD at `ar_solar_system_prd.md`.
- [x] Add `AGENTS.md` to the repository root.
- [x] Add `TODO.md` to the repository root.
- [x] Initialize a Vite TypeScript Web Demo.
- [x] Add basic scripts: `dev`, `build`, and preferably `typecheck`.
- [x] Add a minimal README with local run commands.
- [x] Confirm `npm install` and `npm run build` work.

Acceptance criteria:

- [x] Codex can read `AGENTS.md`, `TODO.md`, and `ar_solar_system_prd.md` from repo root.
- [x] Running `npm run dev` starts a local browser demo.
- [x] Running `npm run build` succeeds.
- [x] No Electron, backend, login, database, deployment, or non-web engine has been introduced.

Suggested Codex prompt:

```text
Goal:
Set up the repository for the AR Solar System Web Demo.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.

Constraints:
- Web Demo first.
- Use Vite + TypeScript.
- Do not add Electron, backend services, or another engine.
- Keep the project small and easy to run locally.

Done when:
- npm install works.
- npm run dev starts the app.
- npm run build passes.
- TODO.md is updated with the status of Milestone 0.
```

## Milestone 1 — Camera Background and Transparent 3D Overlay

Status: `DONE`

Goal: Show the webcam as a complete 16:9 AR preview background and layer a matching transparent Three.js canvas above it, with no initial 3D model visible.

Tasks:

- [x] Request webcam permission via browser MediaDevices API.
- [x] Display the video as the AR preview background layer.
- [x] Mirror the video horizontally for selfie-like interaction.
- [x] Preserve the full 16:9 camera feed in a 16:9 preview stage without `cover` cropping.
- [x] Add a transparent Three.js WebGL canvas above the video.
- [x] Keep video, canvas, and preview overlay dimensions aligned.
- [x] Add startup UI: title, `开启摄像头` button, and minimal instruction text.
- [x] Add a debug panel toggle, but keep it hidden by default.
- [x] Add temporary debug values for video source size, display size, display ratio, `object-fit`, and canvas size.
- [x] Ensure the initial render loop contains no visible 3D objects.
- [x] Handle camera permission denied or unavailable states gracefully.

Acceptance criteria:

- [x] User can start the camera from the browser.
- [x] Webcam feed is shown completely in the 16:9 preview stage without obvious distortion or cropping.
- [x] Three.js canvas is transparent and aligned with the video.
- [x] Initial scene shows no 3D sun, planet, orbit, nebula, star dust, singularity, or decorative 3D object.
- [x] `npm run build` passes.
- [x] Webcam behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 1: webcam background plus transparent Three.js overlay.

Context:
Read @ar_solar_system_prd.md section 7.1 and 7.3, plus @AGENTS.md product invariants.

Constraints:
- Initial scene must be empty of all 3D content.
- Only minimal 2D instructions and hidden debug UI are allowed.
- Keep camera and rendering logic separated.

Done when:
- npm run build passes.
- The browser can show webcam video as the background.
- The transparent WebGL canvas sits above the video.
- TODO.md reflects the new milestone status.
```

## Milestone 2 — Pose and Hand Tracking Foundation

Status: `DONE`

Goal: Detect body pose, both hands, and expose stable landmark data for later interaction.

Note (2026-06-22): Pose tracking is implemented but disabled by default via `ENABLE_POSE_TRACKING` in `src/tracking/config.ts`, because shoulder/body data currently gates no interaction and the pose model stole CPU from hand tracking. Hand tracking is unaffected; the debug panel shows `Pose: missing`. Re-enable (runs throttled at `POSE_DETECTION_INTERVAL_MS`) when M4+ consumes body-relative placement.

Tasks:

- [x] Add MediaPipe Tasks Vision dependency.
- [x] Implement pose tracker for shoulder landmarks.
- [x] Implement hand tracker for left and right hands.
- [x] Compute hand center, thumb tip, index finger tip, palm scale, and optional wrist point.
- [x] Normalize tracking coordinates into a consistent app coordinate system.
- [x] Add smoothing utilities for hand and shoulder landmarks.
- [x] Add debug overlay for pose/hand detection status.
- [x] Show landmark debug visualization only when debug mode is enabled.

Acceptance criteria:

- [x] Debug panel reports pose detected or missing.
- [x] Debug panel reports left hand and right hand detected or missing.
- [x] Hand positions are stable enough for basic interaction.
- [x] No 3D solar elements appear in the initial empty scene.
- [x] `npm run build` passes.
- [x] Camera/gesture behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 2: MediaPipe pose and hand tracking foundation.

Context:
Read @ar_solar_system_prd.md sections 7.2, 7.3, 10, 12, and 13.

Constraints:
- Do not show solar-system 3D content yet.
- Landmarks may be shown only in debug mode.
- Keep tracking code separate from rendering code.

Done when:
- Debug panel shows pose and both-hand detection state.
- Landmark data is available to interaction modules.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 3 — Hand-Only Closed-to-Pull Armed Idle State

Status: `NEEDS_MANUAL_VERIFY`

Goal: Detect the startup gesture based only on both hands: both hands close together, then pull apart. This gesture must not depend on the chest anchor, shoulders, or body pose. The user should be able to trigger the prepared pull state with both hands near the chest, above the head, at the side of the body, or anywhere else in the visible camera frame.

Tasks:

- [x] Detect stable left-hand and right-hand center points.
- [x] Compute hand midpoint, hand distance, hand direction vector, and hand distance velocity.
- [x] Smooth both hand positions and hand distance with a low-pass filter.
- [x] Briefly hold the last stable hand positions when hand tracking is temporarily lost.
- [x] Detect when both hands are close together in any visible area of the camera frame.
- [x] Detect when both hands continuously move apart after the closed-hands state.
- [x] Tolerate short one-hand tracking loss when closed hands/fists overlap, using only recent valid two-hand close evidence.
- [x] Add grace windows so `HandsClosed` and `PullArmed` do not flicker during slow starts, brief pauses, or short hand occlusion.
- [x] Add interaction states: `CameraReady`, `EmptyIdle`, `HandsClosed`, and `PullArmed`.
- [x] `HandsClosed` means both hands are close together, but no 3D content should appear.
- [x] `PullArmed` means a valid pull-apart trend has been detected, but no solar system should appear yet.
- [x] Show minimal 2D guidance when the user has not entered the closed-hands state.
- [x] Add debug values: left hand x/y, right hand x/y, hand midpoint, hand distance, hand direction vector, hand distance velocity, current state, whether both hands are visible, and whether lost-hand hold is active.
- [x] Do not use chest anchor, shoulder position, or body pose as required conditions for `HandsClosed` or `PullArmed`.

Acceptance Criteria:

- [x] After the camera starts, the app visually remains empty with no 3D solar content.
- [x] When both hands close together anywhere in the visible camera frame, the app can enter `HandsClosed`.
- [x] When both hands continuously pull apart from the closed state, the app can enter `PullArmed`.
- [x] Closing and pulling both hands above the head can enter `PullArmed`, pending manual camera verification.
- [x] Closing and pulling both hands near the chest can enter `PullArmed`, pending manual camera verification.
- [x] Closing and pulling both hands at the side of the body can enter `PullArmed`, pending manual camera verification.
- [x] If both hands are lost or the pull-apart trend stops, the app returns to `EmptyIdle` or another appropriate idle state.
- [x] If tightly closed hands briefly cause one hand to disappear from MediaPipe, the app holds recent valid two-hand evidence instead of immediately flickering state.
- [x] Entering `HandsClosed` or `PullArmed` does not render the sun, planets, orbit rings, nebula, particles, singularity, or any 3D model.
- [x] The debug panel shows stable hand positions, hand distance, distance velocity, midpoint, and state changes.
- [x] `npm run build` passes.
- [x] Behavior is marked `NEEDS_MANUAL_VERIFY` for real webcam positions above the head, near the chest, and at the side of the body.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 3: hand-only closed-to-pull armed idle state.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.
This is a requirement adjustment. The startup gesture must no longer depend on the chest anchor, shoulders, or body position. The core trigger is hand gesture only: both hands close together, then pulled apart.

Requirements:
1. Detect left-hand and right-hand centers.
2. Smooth both hand positions.
3. Compute hand midpoint, hand distance, hand distance velocity, and hand direction vector.
4. Detect when both hands are close together anywhere in the visible camera frame.
5. Detect when both hands continuously move apart after being close.
6. Add states: `CameraReady`, `EmptyIdle`, `HandsClosed`, and `PullArmed`.
7. Show debug values for left hand, right hand, hand midpoint, hand distance, distance velocity, current state, both-hands-visible, and lost-hand hold.
8. Keep the AR scene empty. Do not render the solar system yet.

Constraints:
- Do not use chest anchor, shoulder landmarks, or body pose as required conditions for this milestone.
- The gesture must work even if the user raises both hands above the head.
- The gesture must work even if both hands are on the side of the body, as long as both hands are visible.
- Do not implement solar system opening yet; that belongs to the next milestone.
- Do not show any 3D solar content, including sun, planets, orbit rings, nebula, particles, glowing singularity, or any 3D model.
- Keep existing camera and transparent canvas behavior stable.
- Use smoothing and short lost-hand hold to avoid jitter and flickering.

Documentation Sync:
This milestone changes the product requirement from “hands close in front of the chest” to “hands close anywhere in the camera frame”.
After implementation, update:
- `ar_solar_system_prd.md`
- `TODO.md`
- `TODO.zh-CN.md`
- `AGENTS.md` if it contains the old chest-dependent startup rule.

Done When:
- `npm run build` passes.
- The page starts with camera video only and no 3D model.
- The debug panel shows `EmptyIdle` / `HandsClosed` / `PullArmed` state changes.
- Hands closed near the chest can enter `HandsClosed`.
- Hands closed above the head can enter `HandsClosed`.
- Hands closed at the side of the body can enter `HandsClosed`.
- Pulling hands apart from any of those positions can enter `PullArmed`.
- `TODO.md` is updated with implementation status and manual verification notes.
```

## Milestone 3.5 — Pre-3D Whole-System Interaction Contract

Status: `NEEDS_MANUAL_VERIFY`

Goal: Lock and debug the whole-system interaction semantics before adding visible solar-system 3D content. This milestone defines a protocol layer between MediaPipe landmarks and the future solar-system controller, exposing debug-only intent signals for release, re-grip, reverse collapse, and legacy scale/rotation diagnostics without rendering the sun, planets, orbit rings, nebula, particles, singularity, or any 3D model.

Tasks:

- [x] Define a protocol layer: `MediaPipe landmarks -> HandFrame -> WholeSystemIntent -> future SolarSystemController`.
- [x] Define whole-system lifecycle states: `Inactive`, `VirtualOpeningHandle`, `SolarHandleControl`, `ReleaseCandidate`, `SolarFreeHover`, `ReGripCandidate`, and `SolarClosing`.
- [x] Define release detection primarily from both hands opening fully: high open-hand score, enough extended fingers, and low grip-pose score.
- [x] Latch an accepted open-hand release immediately: freeze endpoints, block re-grip while hands withdraw, and only allow re-grip after both hands clearly leave and then return to the frozen endpoints.
- [x] Require stable open-hand release evidence before entering `ReleaseCandidate`; single-frame release spikes must not detach control.
- [x] Use palms-up cupped hands near endpoints as a legacy hold-protection diagnostic so release does not win incorrectly.
- [x] Use a wider re-grip magnetic zone around frozen endpoints before snapping virtual endpoints back to the current hands.
- [x] Keep endpoint mismatch, complete hand loss, or low whole-control confidence as fallback release signals.
- [x] Define re-grip detection using both hands near the frozen visual left/right endpoints without requiring a planet pinch.
- [x] Define legacy scale-intent diagnostics from hand-distance velocity and boost them when both palms appear camera-facing.
- [x] Define reverse-collapse intent when gripped hands move inward and hand distance approaches the close threshold.
- [x] Define palms-up gentle rotation and palm-normal motion as legacy rotation diagnostic signals, and expose 2D-vs-3D rotation intent in debug.
- [x] Define palm orientation primitives from MediaPipe hand landmarks: wrist, index MCP, middle MCP, pinky MCP, palm normal, facing-camera score, and up score.
- [x] Keep palm orientation as an intent-confidence signal, not a hard gate.
- [x] Keep whole-system control separate from individual planet pinch-activation intent by adding an early pinch penalty to whole-control confidence.
- [x] Add debug-only visual-left/visual-right virtual endpoints and endpoint match state; these are 2D debug markers only, not 3D solar content.
- [x] Add debug fields for whole-control state, control/release/re-grip confidence, scale/rotation/collapse intent, palm normals, palm scores, open-hand/grip-pose scores, release gesture lock, release stable time, release-block reason, grip-hold state, re-grip reason, and virtual endpoints.
- [x] Add a concise Chinese interaction status summary beside the Debug button, showing the current interpreted intent, reason, and key parameters.
- [x] Keep the AR scene visually empty while this contract is being validated.

Acceptance Criteria:

- [x] The documented state model distinguishes `SolarOpening`, `SolarFreeHover`, `SolarHandleControl`, and `SolarClosing`.
- [x] Release means the future solar system will remain at the last stable position, scale, and orientation instead of snapping to chest anchor or screen center.
- [x] Accepted open-hand release freezes the endpoints and prevents immediate re-grip while the user slowly pulls hands away.
- [x] Palms-up cupped hold diagnostics keep `SolarHandleControl` instead of being mistaken for release.
- [x] Re-grip can recover through a forgiving magnetic zone without requiring the user to precisely realign body/camera position.
- [x] Re-grip means returning both hands near visual left/right endpoints can resume whole-system control without pinch.
- [x] Palm-forward side-to-side movement is kept only as a legacy debug/protocol diagnostic; it is not a current user-facing solar zoom control.
- [x] Moving gripped hands inward from the opened state is specified and debugged as reverse collapse, not just ordinary scale-down.
- [x] Reverse collapse returns to the initial empty camera view when fully closed.
- [x] Palms-up gentle rotation and palm-normal motion are kept only as legacy debug/protocol diagnostics; they are not current user-facing whole-system rotation controls.
- [x] Debug panel exposes whole-system protocol values without rendering solar-system 3D content.
- [x] The top-right Chinese status summary avoids presenting retired scale/rotation diagnostics as product controls; visible solar behavior is explained through the current interaction state, release/re-grip/close lifecycle, and M5.5 inspection intent.
- [x] Debug overlay may show only 2D virtual endpoint markers when debug mode is enabled.
- [x] `npm run typecheck` passes.
- [x] `npm run build` passes.
- [ ] Real webcam verification confirms the debug values are understandable and stable enough to start Milestone 4.
- [x] `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, and `AGENTS.md` are aligned before Milestone 4 starts.
- [x] Status remains `NEEDS_MANUAL_VERIFY` until the user confirms the Milestone 3.5 checklist passes.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 3.5: debug-only whole-system interaction protocol before adding 3D solar content.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.
Do not start Milestone 4 yet.

Constraints:
- Do not render solar-system 3D content.
- Keep the initial AR scene empty.
- Keep startup hand-only.
- Separate whole-system control from individual planet pinch activation.
- Palm orientation should boost confidence, not act as a hard gate.
- Virtual endpoints may be shown only as debug-only 2D markers.

Done when:
- Release/re-grip/reverse-collapse values and legacy scale/rotation diagnostics are visible in the debug panel as debug-only historical signals, not current product controls.
- No sun, planet, orbit, nebula, particle, singularity, or 3D model appears.
- npm run typecheck and npm run build pass.
- TODO.md and TODO.zh-CN.md are updated.
```

## Milestone 3.6 — Gesture Diagnostics and Session-Adaptive Thresholds

Status: `NEEDS_MANUAL_VERIFY`

Goal: Make the pre-3D gesture foundation more robust before Milestone 4 by adding a unified hand primitives layer, session-adaptive thresholds, structured transition reasons, and a no-video gesture debug recorder.

Tasks:

- [x] Add a unified `HandPrimitives` layer that exposes hand distance, midpoint, axis direction, axis angle, distance velocity, average palm scale, close intent score, pull intent score, and tracking confidence.
- [x] Add session-only dynamic calibration for close distance, comfortable open distance, palm scale, endpoint radii, re-grip magnet radius, and collapse thresholds.
- [x] Feed adaptive thresholds into startup detection instead of relying only on fixed normalized distances.
- [x] Feed adaptive endpoint and collapse thresholds into whole-system control, re-grip, and reverse-collapse logic.
- [x] Add structured `transitionReason` values for startup and whole-system protocol decisions.
- [x] Add `endpointHitScore` and `trackingConfidence` to whole-system debug output and scoring.
- [x] Add a debug recorder that stores structured landmarks, primitives, calibration, intent scores, states, and transition reasons in memory only.
- [x] Add Debug UI buttons to start/stop recording, export a JSON log, and clear the in-memory recording.
- [x] Confirm the recorder does not capture raw camera video or upload data.
- [x] Keep the AR scene visually empty and avoid rendering any solar-system 3D content.

Acceptance Criteria:

- [x] Debug panel shows hand primitive values: axis angle, tracking confidence, close/pull scores, and primitive reason.
- [x] Debug panel shows session calibration values: palm scale, closed/open calibration, close thresholds, endpoint radii, and collapse thresholds.
- [x] Debug panel shows startup and whole-system transition reasons.
- [x] Whole-system scoring uses tracking confidence instead of only visible/missing hand booleans.
- [x] Startup, endpoint re-grip, and collapse thresholds can adapt during the current camera session without persistent history.
- [x] Debug recorder can export structured JSON containing landmarks and computed values, but no raw camera frames.
- [x] `npm run typecheck` passes.
- [x] `npm run build` passes.
- [ ] Real webcam verification confirms the adaptive thresholds and transition reasons are understandable and do not make M3/M3.5 behavior less stable.
- [x] `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, and `AGENTS.md` are aligned before Milestone 4 starts.

Manual verification checklist:

- [ ] Open the page, start the camera, open Debug, and confirm `Calibration` changes from defaults to `session-adaptive` after both hands are visible.
- [ ] Close both hands naturally and confirm `Closed / open calib` records a closed distance and `Close thresholds` stay near that value instead of acting like arbitrary fixed numbers.
- [ ] Pull hands apart naturally and confirm `Closed / open calib` records an open distance, while `PullArmed` behavior still works.
- [ ] Test release and re-grip, and confirm `Endpoint hit`, `Whole tracking conf`, `Whole reason`, and `Re-grip reason` explain the result.
- [ ] Click `Record`, perform a short failed or successful gesture sequence, click `Stop`, export JSON, and confirm the file contains structured values rather than video frames.

Suggested Codex prompt:

```text
Goal:
Implement or refine Milestone 3.6: gesture diagnostics and session-adaptive thresholds before adding 3D solar content.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.
Do not start Milestone 4 yet.

Constraints:
- Do not render solar-system 3D content.
- Keep startup hand-only.
- Do not persist personal gesture history unless explicitly requested.
- Record only structured debug data, not webcam video.

Done when:
- Hand primitives, adaptive thresholds, transition reasons, and recorder state are visible in Debug.
- npm run typecheck and npm run build pass.
- TODO.md and TODO.zh-CN.md are updated.
```

## Milestone 3.7 — Code Placeholder Solar System Visual Layer

Status: `DONE`

Goal: Add a data-driven, all-code placeholder solar-system rendering layer before Milestone 4, so sphere/orbit/revolution/self-rotation visuals can be tested without changing the normal empty startup scene.

Tasks:

- [x] Add a `src/solar/` layer with data, procedural materials, celestial body nodes, and a reusable solar-system controller.
- [x] Define a unified celestial body data model for the sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus, and Neptune.
- [x] Include placeholder metadata for activation hit radius, focus default transform, parent body, and return/orbit target.
- [x] Generate procedural `CanvasTexture` materials with asymmetric markers so self-rotation is visible.
- [x] Render orbit rings, planet revolution, self-rotation, Moon orbiting Earth, and a recognizable Saturn ring.
- [x] Expose `group`, `update`, `setVisible`, `setOpeningProgress`, `setTransform`, and `dispose` on the placeholder solar-system layer.
- [x] Add renderer `addObject3D` / `removeObject3D` helpers and frame timing values so visual layers can update before render.
- [x] Add the dev-only `?solarPreview=1` URL entry, while keeping the normal product path visually empty.
- [x] Keep the placeholder independent from startup gestures, hover, activation, focus, and throw-return logic.

Acceptance criteria:

- [x] Default page load keeps the Three.js solar-system layer hidden.
- [x] `?solarPreview=1` displays the full code placeholder solar system without requiring camera permission.
- [x] Bodies have visible procedural patterns and self-rotation.
- [x] Planets revolve around the sun; Moon revolves around Earth.
- [x] Saturn has a clear ring.
- [x] Future texture replacement can happen through material/data sources without changing interaction logic.
- [x] `npm run typecheck` passes.
- [x] `npm run build` passes.
- [x] Browser preview is checked for a nonblank 3D canvas in `?solarPreview=1` and a blank 3D canvas in the default route.

## Milestone 4 — Hand-Attached Pull-Open Solar System

Status: `IN_PROGRESS`

Goal: Implement the first high-impact moment: the user pulls the solar system open from the empty scene using both hands.

Implementation note (2026-06-23): M4-A/B/C/D code is in place. `PullArmed` now enters `SolarOpening`; the code placeholder solar system is driven by hand distance, midpoint, visual hand axis, and `openProgress`; and fully opening transitions to `SolarActive`. The opening affordance is two solar-system-local 3D control endpoints at the left and right edges, with no connecting rod-style control line. After opening completes, `SolarActive` now holds the last stable transform by default; arbitrary visible hands no longer move the model. Whole-system control resumes only when both hands stably hit the left/right endpoints, which transitions to `SolarHandleControl`. Releasing endpoint control transitions to `SolarFreeHover` and keeps the last stable transform; and (2026-06-23 stabilization) when the hands are not holding both endpoints, `SolarActive` itself now settles into `SolarFreeHover` after a short grace, so one-hand inspection starts without forcing an endpoint re-grip first. Moving controlled endpoint hands inward enters `SolarClosing`; reaching the collapse threshold hides all solar content and returns to `EmptyIdle`. No hand-pose gate is required yet, so endpoint re-grip remains easy. Abrupt hand-geometry outliers during fast withdrawal or edge mis-tracking are rejected so they do not shrink or jump the model. This still needs real webcam verification.

Tasks:

- [x] Add `SolarOpening` and `SolarActive` states.
- [x] Detect hands moving apart from the `PullArmed` state.
- [x] Compute `openProgress` from hand distance.
- [x] Clamp and smooth `openProgress`.
- [x] Prevent auto-completion when hand distance stops increasing.
- [x] Support reverse progress when opened endpoint hands move inward.
- [x] Connect the reusable code placeholder solar-system group to `SolarOpening` progress and hand-driven transform.
- [x] Keep all solar-system 3D objects invisible until opening begins.
- [x] Keep `HandsClosed` visually static with no solar-system animation or 3D content.
- [x] During opening, bind visual left/right endpoints to left/right hands.
- [x] Render the opening controls as two independent 3D endpoints on the solar-system edges, not as a connected joystick/rod overlay.
- [x] Reject abrupt hand-geometry outliers so fast hand withdrawal or edge mis-tracking holds the last stable solar-system transform instead of shrinking/jumping.
- [x] After full opening, hold the last stable transform in `SolarActive`; both hands stably hitting the endpoints re-grip to `SolarHandleControl`, and not holding the endpoints settles into `SolarFreeHover` (2026-06-23) so one-hand inspection works without an extra re-grip.
- [x] Use `SolarHandleControl` as the only state where post-opening two-hand endpoint movement can resume whole-system handle control, release, or reverse collapse.
- [x] Keep endpoint re-grip hand-pose-free for now; open hands passing near the model should not control unless both endpoints are hit.
- [x] Keep the user-facing status summary aligned with the latest M4 state machine; old `wholeSystemIntent` release/re-grip values stay debug-only.
- [ ] Reveal sun, orbits, bodies, star dust, and nebula progressively based on `openProgress`.
- [x] On completion, place the solar system between the opened hands, optionally biased by body-relative context for AR feel.
- [x] When reverse collapse reaches the closed threshold, hide all solar-system content and return to `EmptyIdle`.
- [x] On whole-system release, hold the last stable solar-system transform instead of recentering.
- [x] Add debug values for `openProgress`, start distance, target distance, and state.

Acceptance criteria:

- [ ] Before valid pull-open gesture, no 3D solar content is visible.
- [ ] Pulling both hands apart after the hand-only `PullArmed` state starts the opening.
- [ ] Opening width/progress clearly follows hand distance.
- [ ] If the hands pause, opening holds rather than auto-playing to 100%.
- [ ] Opening endpoints visibly follow both hands.
- [ ] When complete, solar system appears at the hand-opened position rather than being forced to the chest or screen center.
- [ ] After completion, arbitrary visible hands passing over the solar system do not move it.
- [ ] Releasing both endpoint hands leaves the solar system hovering where it was released.
- [ ] Moving both endpoint hands inward collapses the solar system in reverse.
- [ ] When the collapse completes, the scene returns to camera video plus 2D UI only.
- [ ] Failed trigger does not cause flicker or partial random solar objects.
- [x] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

M4-A/B/C/D manual verification checklist:

| Item | User action | Where to look | Pass condition |
|---|---|---|---|
| Empty scene still holds | Open `/`, start camera, keep hands out of view or hold hands apart without first closing. | Camera preview and WebGL overlay. | No 3D sun, planets, orbit rings, Saturn ring, or placeholder solar content appears. |
| HandsClosed remains static | Put both hands/fists together and hold them still. | Preview and Debug panel. | `Startup state` reaches `HandsClosed`; no 3D solar-system content appears while hands stay closed. |
| Pull starts opening | From `HandsClosed`, pull both hands apart. | Preview, status summary, Debug `Startup state`, `openProgress`, and `Solar scale`. | State reaches `SolarOpening`; the placeholder solar system appears between the hands; `openProgress` rises from near `0` as hand distance increases. |
| Edge endpoint controls | Continue the opening after the solar system appears. | Preview, especially the left/right edges of the placeholder solar system. | Two small control endpoints appear at the solar-system left/right edges and follow the opened hands. There is no connecting green rod/joystick line over the solar system. |
| Opening follows hands | While in `SolarOpening`, pause hands, then continue pulling. | Preview and Debug `openProgress`. | Solar-system size/progress holds while hands pause and continues increasing only when hands pull farther apart. |
| Midpoint and hand axis follow | Move the pulling hands slightly left/right/up/down or diagonally while continuing the opening. | Preview. | The solar-system center stays near the hand midpoint and the orbit plane rotates roughly with the left/right hand axis. |
| Fully opened hold | Pull far enough to complete opening, then move both hands through or near the solar system without staying on both endpoints. | Status summary, Debug `Startup state` / `openProgress`, and preview. | Interaction state becomes `SolarActive` and then settles into `SolarFreeHover` once the hands are not on both endpoints; `openProgress` is `1.00`; the solar system holds the last stable transform instead of following arbitrary two-hand motion. |
| Endpoint re-grip control | From `SolarActive`, place both hands near the left/right 3D control endpoints and hold briefly, then move both hands together. | Status summary and preview. | State transitions to `SolarHandleControl`; only then does the solar system follow the hand midpoint, distance, and visual hand axis. |
| Endpoint release to free hover | While in `SolarHandleControl`, move one or both hands away from the endpoints or out of frame. | Status summary and preview. | State transitions to `SolarFreeHover`; the solar system freezes at the last stable transform. |
| Fast hand withdrawal stability | After the model is mostly or fully opened, quickly move one or both hands out toward the screen edges/out of frame. | Preview and Debug `Solar scale`. | The model holds its last stable transform during brief tracking glitches; it must not suddenly jump to one side or collapse to a tiny scale. |
| Free-hover after release | From `SolarHandleControl`, move one or both hands clearly away from the endpoints. | Status summary and preview. | Interaction state becomes `SolarFreeHover`; the solar system stays at the released position, scale, and orientation. |
| Re-grip from free hover | From `SolarFreeHover`, return both hands near the left/right control endpoints and hold briefly. | Status summary and preview. | Interaction state returns to `SolarHandleControl`; moving the hands now controls the solar system again. |
| Reverse collapse | From `SolarHandleControl`, move both endpoint hands inward toward each other. | Preview, status summary, and Debug `openProgress`. | Interaction state becomes `SolarClosing`; `openProgress` decreases as hand distance decreases. |
| Collapse completes to empty | Continue moving both endpoint hands inward until they are close together. | Preview and status summary. | Interaction state returns to `EmptyIdle`; all 3D solar content disappears and the initial empty camera view is restored. |

Suggested Codex prompt:

```text
Goal:
Implement Milestone 4: hand-attached pull-open solar system.

Context:
Read @ar_solar_system_prd.md sections 5.2, 5.3, 7.4, 8.3, and 17.

Constraints:
- Initial state must remain empty until opening starts.
- Opening progress must be controlled by hand distance, not a fixed timeline.
- Opening endpoints must visually attach to both hands.
- Do not implement planet activation logic yet.

Done when:
- EmptyIdle -> HandsClosed -> PullArmed -> SolarOpening -> SolarActive -> SolarHandleControl -> SolarFreeHover -> SolarHandleControl -> SolarClosing -> EmptyIdle works.
- The status summary uses `interactionState` plus `solarReason`, not legacy `wholeSystemIntent` values.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 5 — Retired Two-Hand Scale/Rotation Semantics

Status: `DONE`

Goal: Retire the old M5 gesture surface so future work does not implement it as the active product plan.

Decision note (2026-06-23): The latest user-approved solar-system inspection controls live in Milestone 5.5. The older gestures that treated two-hand distance as zoom, palm-forward side-to-side movement as "sliding glass" scaling, and palms-up twisting as whole-system 3D rotation are no longer active product acceptance criteria. Keep M3.5 scale/rotation/palm protocol fields only as legacy debug diagnostics until the code is cleaned up.

Tasks:

- [x] Remove active TODO acceptance criteria for two-hand pull-apart zoom, palm-forward sliding-glass scaling, and palms-up whole-system rotation.
- [x] Keep endpoint re-grip, release, free-hover, and reverse-collapse in M4 as the current whole-system handle lifecycle.
- [x] Treat M5.5 as the active milestone for solar-system zoom, shrink, reset, and pan after release into `SolarFreeHover`.

Acceptance criteria:

- [x] Future implementation prompts point to M5.5 for user-facing solar inspection controls.
- [x] `SolarHandleControl` is not expanded with the old palm-forward or palms-up M5 gesture semantics unless the user explicitly reopens that requirement.
- [x] Documentation distinguishes legacy protocol debug fields from current product controls.

## Milestone 5.5 — Solar Free-Hover Single-Hand Inspection Controls

Status: `NEEDS_MANUAL_VERIFY`

Goal: Let the user zoom, shrink, reset, and pan the released solar-system view with one hand after the whole-system handle has been released into `SolarFreeHover`.

Current control baseline (2026-06-23): This is the latest user-approved solar-system inspection gesture model and supersedes the retired M5 two-hand/palm gesture semantics.

Tuning note (2026-06-23): Zoom gestures are now phase-locked. A spread-to-zoom-in gesture consumes only the finger-opening phase; the natural return after opening is ignored until the hand settles back into a neutral spread range. A shrink gesture starts from a briefly stable open hand and consumes only the closing phase; the natural relaxation after shrinking is ignored. Pan uses a stable-spread clutch and smoothed palm displacement from an anchor, not raw per-frame palm delta.

Tasks:

- [x] Add a single-hand intent layer for `fingerSpread`, `fingerSpreadVelocity`, `palmCenter`, `palmCenterVelocity`, fist hold time, and transition reasons.
- [x] Enable single-hand solar inspection only while the solar system is in `SolarFreeHover`; keep it disabled during two-hand endpoint control.
- [x] Map five-finger spread to solar view zoom-in when hand center movement is low, with rebound lock so the natural hand return does not immediately zoom out.
- [x] Map five-finger contraction from a briefly stable open hand to solar view zoom-out when hand center movement is low, with rebound lock so the natural relaxation does not immediately zoom in.
- [x] Map contraction into a fist held for about 2 seconds to default solar size and position.
- [x] Map left/right/up/down hand pushes to solar view pan after a stable-spread clutch, using smoothed palm displacement from the clutch anchor.
- [x] Limit M5.5 inspection zoom rate and low-pass pan offset so slow/quick hand motion stays recoverable.
- [x] Allow a zoomed solar system to move partially outside the screen while preserving a recoverable default reset.
- [x] Add debug values for single-hand intent, spread score, pan score, reset hold time, solar inspection scale, and solar inspection offset.
- [x] Add a runtime Debug checklist that records whether the current browser session has actually hit M5.5 free-hover, zoom-in, zoom-out, pan, reset-hold, reset, handle-control-disabled, and re-grip-after-inspection signals, with progress count, remaining item labels, the next required item, next action, observation point, and pass condition; zoom, pan, and reset checklist items require actual inspection scale/offset evidence rather than intent labels alone.
- [x] Add a Debug-only `Export M5.5` control that downloads a compact verification summary JSON without raw camera video, including a self-describing checklist array with stable ids, user actions, observation points, and pass conditions built through a typed report helper covered by `npm run verify:m5.5`; the export stays available even at 0/8 so failed or blocked manual attempts can produce evidence.
- [x] Add a Debug-only `Reset M5.5` control so manual testers can clear the runtime checklist without refreshing the page.
- [x] Add `npm run verify:m5.5` to deterministically exercise M5.5 controller state transitions with synthetic hand landmarks, including slow gesture stability and zoom bounds.

Acceptance criteria:

- [x] In `SolarFreeHover`, one-hand spread zooms the solar system larger without the return motion immediately shrinking it again, pending manual camera verification.
- [x] One-hand contraction from a briefly stable open hand shrinks it without the relaxation motion immediately enlarging it again, pending manual camera verification.
- [x] Contract-to-fist held for about 2 seconds restores default size and centered position with endpoints visible, pending manual camera verification.
- [x] One-hand push pans the zoomed solar-system view smoothly after clutching, without requiring two-hand endpoint control, pending manual camera verification.
- [x] Single-hand solar inspection does not trigger during `SolarHandleControl`, pending manual camera verification.
- [x] Re-grip after M5.5 zoom/pan uses the visually updated endpoints instead of the old release center, pending manual camera verification.
- [x] Zoom/pan and spread/pan classification do not flicker during slow gestures, pending manual camera verification.
- [x] `npm run verify:m5.5` passes.
- [x] `npm run build` passes.
- [x] Behavior is marked `NEEDS_MANUAL_VERIFY` until the Milestone 5.5 camera checklist passes.

## Milestone 6 — Celestial Body Data Model and Nine Interactive Targets

Status: `TODO`

Goal: Create a unified data-driven model for all MVP interactive celestial bodies, including hover, activation, focus, and return metadata.

Tasks:

- [ ] Define `CelestialBodyId` for Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
- [ ] Define body metadata: name, label, approximate visual size, orbit radius, orbit speed, self-rotation speed, color/texture placeholder, activation hit radius, focus default transform, return/orbit target, parent body if any.
- [ ] Implement simplified visual models for each body.
- [ ] Add recognizable Saturn ring.
- [ ] Make Moon orbit Earth by default.
- [ ] Keep all bodies in a registry used by rendering, hover, activation, focus, floating, and return logic.
- [ ] Add labels that can be shown during hover/activation/focus.
- [ ] Add original orbit transform data for return behavior.
- [ ] Ensure no duplicated one-off activation or focus logic per planet.

Acceptance criteria:

- [ ] All nine MVP bodies are represented in one data model.
- [ ] Bodies render on simplified orbits after solar opening.
- [ ] Moon is visually distinguishable from Earth.
- [ ] Saturn has a clear ring.
- [ ] Original orbit position/layer data is available for return-to-orbit logic.
- [ ] Focus default size/position and activation hit radii are available for the later gesture pipeline.
- [ ] `npm run build` passes.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 6: data-driven celestial body model for nine MVP interactive bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 7.9-7.12, 8.2, and 17.

Constraints:
- Use one shared celestial body model and registry.
- Include Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
- Include hover, activation, focus default, and return target metadata.
- Keep visuals lightweight and MVP-friendly.
- Do not implement the full planet focus gesture pipeline yet unless needed for data hooks.

Done when:
- All nine bodies render after opening.
- Activation hit radii and return targets are available.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 7 — Hover, Highlight, and Pinch Activation

Status: `TODO`

Goal: Let the user's hand select and pinch-activate any of the nine MVP bodies without dragging the solar system or freezing self-rotation.

Tasks:

- [ ] Project each interactive body's 3D position to screen coordinates.
- [ ] Compute hand-to-body screen-space distance.
- [ ] Add expanded hit areas for Mercury and Moon.
- [ ] Select nearest valid body with hysteresis to avoid flickering.
- [ ] Add hover visual feedback: glow ring, label, and orbit highlight.
- [ ] Detect pinch start and pinch end using thumb/index distance and hand scale.
- [ ] Use different pinch start and end thresholds.
- [ ] Implement `BodyHover` and `PlanetActivated` transitions.
- [ ] On pinch activation, stop the selected body's original orbit while keeping natural self-rotation.
- [ ] Keep all non-selected bodies orbiting and self-rotating normally.
- [ ] Prevent solar-system zoom/pan/drag while a body is pinch-activated.
- [ ] Add clear activation feedback and preserve the original orbit target for return behavior.
- [ ] Add short tracking-loss tolerance while pinch activation is held.

Acceptance criteria:

- [ ] Hand near a body highlights it clearly.
- [ ] Highlight does not flicker rapidly between nearby bodies.
- [ ] Pinch near a highlighted body activates it.
- [ ] Activated body stops orbiting but keeps self-rotating.
- [ ] Non-selected bodies continue normal motion.
- [ ] Activated body does not drag or scale the whole solar system.
- [ ] Each of the nine bodies can be highlighted and activated.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 7: hover, highlight, and pinch activation for all nine MVP bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 7.8, 7.9, and 12.4.

Constraints:
- Use one unified hover/activation pipeline.
- Only one body can be activated at a time.
- Use pinch hysteresis.
- Do not freeze self-rotation on activation.
- Do not let activation drag the whole solar system.

Done when:
- All nine bodies can be hovered and activated.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 8 — Planet Focus View and Single-Planet Controls

Status: `TODO`

Goal: Enter a single-planet focus view from an activated body, then let the user inspect, zoom, pan, support, and reset the focused body while it keeps self-rotating.

Tasks:

- [ ] Add `PlanetFocusView`, `PlanetFocusControlled`, and `PlanetFocusFloating` lifecycle states or equivalent substates.
- [ ] Detect the entry gesture: main-hand pinch lock on the activated body plus off-hand five-finger open/spread.
- [ ] Dim and interaction-lock the background solar system while preserving basic motion.
- [ ] Keep the focused body self-rotating during activation, focus, zoom, pan, support-follow, floating, and inspection.
- [ ] Map one-hand spread to focused-body zoom-in.
- [ ] Map one-hand contraction to focused-body zoom-out.
- [ ] Map contract-to-fist held for about 2 seconds to focused-body default size and position.
- [ ] Map one-hand pushes to focused-body pan.
- [ ] Detect support-follow using stable conditions: hand open, palm center below the body, close to the lower body edge, low velocity, and 300-500ms dwell.
- [ ] Keep the focused body constrained within the visible screen during support-follow.
- [ ] Ensure focused-body controls do not affect the whole solar-system transform.
- [ ] Show clear state feedback for activated, focused, controlled, and floating states.

Acceptance criteria:

- [ ] Main-hand pinch lock plus off-hand open/spread enters `PlanetFocusView`.
- [ ] Background solar system is dimmed, interaction-locked, and still has basic motion.
- [ ] Focused body remains self-rotating throughout all focus interactions.
- [ ] One-hand spread/contraction zooms the focused body.
- [ ] Fist hold for about 2 seconds restores default focus size and position.
- [ ] One-hand push pans the focused body without moving the solar system.
- [ ] Support-follow moves the focused body and keeps it inside the screen.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 8: planet focus view and single-planet controls.

Context:
Read @ar_solar_system_prd.md sections 5.5, 7.10, and 7.11.

Constraints:
- A focused body keeps self-rotating; do not freeze self-rotation.
- Background solar-system interaction is locked during PlanetFocusView.
- Single-body manipulation must not affect solar-system scale or rotation.
- Keep the focused body inside the visible screen during support-follow.
- Update docs if any interaction mapping changes.

Done when:
- Activation -> focus view -> zoom/pan/support works.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 9 — PinchTap Release, Floating Focus, and Throw Return

Status: `TODO`

Goal: Let the user place the focused body down in the single-planet focus view, keep it floating there, then explicitly pinch-and-throw it back to its original orbit.

Tasks:

- [ ] Detect off-hand `PinchTap` anywhere in the screen while the main hand is supporting the focused body.
- [ ] Require low main-hand support velocity before accepting `PinchTap` as release-to-floating.
- [ ] On accepted `PinchTap`, release support-follow and keep the focused body floating at the current position in `PlanetFocusView`.
- [ ] Keep the floating focused body self-rotating and do not return to orbit automatically.
- [ ] Show the original orbit target or directional cue in the background for throw-return.
- [ ] Allow the floating focused body to be pinch-selected again.
- [ ] Track recent hand velocity while pinch-holding the focused body.
- [ ] Define throw velocity threshold based on normalized screen/scene units.
- [ ] Detect throw intent only when high velocity occurs shortly before pinch release.
- [ ] Bias throw confidence when hand movement direction points toward the original orbit target.
- [ ] Add `BodyReturning` state.
- [ ] Animate returning body back to original orbit position with visible tail/streak feedback.
- [ ] Add visible tail, streak, or light feedback during return.
- [ ] Restore original body scale and parent relationship on return.
- [ ] Resume original orbit after return and keep self-rotation.
- [ ] After return completes, exit `PlanetFocusView`, return to the solar-system view, and unlock solar-system interaction.
- [ ] Ensure low-velocity release remains floating in `PlanetFocusView`.
- [ ] Add debug values for PinchTap, floating state, throw velocity, throw direction score, and throw confidence.

Acceptance criteria:

- [ ] Main-hand support plus off-hand `PinchTap` places the focused body down.
- [ ] Placed-down body remains floating in `PlanetFocusView` and keeps self-rotating.
- [ ] Low-velocity pinch release does not return body to orbit.
- [ ] Clear pinch-and-throw toward the orbit target returns body to orbit.
- [ ] Return animation is visible and smooth.
- [ ] Body resumes original orbit relationship after return.
- [ ] After return, the app exits to the solar-system view and unlocks solar interaction.
- [ ] Moon can return to Earth/Moon relationship correctly.
- [ ] False positives are low enough for a 30-60 second demo.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 9: PinchTap release, floating focus, and throw-return behavior.

Context:
Read @ar_solar_system_prd.md sections 7.11, 7.12, and 13.

Constraints:
- PinchTap release keeps the body floating in PlanetFocusView.
- Floating focus must not return to orbit automatically.
- Throw return requires clear velocity and direction near pinch release.
- Returning body should restore original scale, orbit layer, and motion, then exit back to the solar-system view.
- Update docs if thresholds or behavior are changed.

Done when:
- Focused body can be placed down, left floating, then thrown back to orbit.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 10 — Visual Polish, Robustness, and Recording Mode

Status: `TODO`

Goal: Make the demo suitable for a 30-60 second recording.

Tasks:

- [ ] Improve solar glow, orbit materials, and body readability.
- [ ] Add star dust and nebula effects only after opening begins.
- [ ] Add hand-proximity feedback such as small light rings or particles.
- [ ] Add return tail effect.
- [ ] Tune smoothing for body reference, hands, scale, rotation, pinch, and throw.
- [ ] Tune trigger thresholds for common laptop webcam framing.
- [ ] Reduce particle count or post-processing if FPS is unstable.
- [ ] Add presentation/recording mode that hides debug UI.
- [ ] Add fallback guidance for poor lighting, missing pose, or missing hands.
- [ ] Test the full 30-60 second flow.

Acceptance criteria:

- [ ] A viewer can understand the solar system is pulled from between the hands.
- [ ] A viewer can understand the solar system is a hand-controlled object that can free-hover where it is released.
- [ ] Scaling and rotation look spatial.
- [ ] Activation, planet focus, PinchTap release-to-floating, and throw-return are visually obvious.
- [ ] Demo runs at a usable frame rate on a normal laptop.
- [ ] Recording mode hides debug clutter.
- [ ] `npm run build` passes.
- [ ] Full flow is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 10: polish, robustness, and recording mode for a 30-60 second demo.

Context:
Read @ar_solar_system_prd.md sections 8, 13, 15, 16, and 17.

Constraints:
- Do not break the core interaction loop.
- Do not show 3D content in initial empty scene.
- Tune performance before adding heavy effects.
- Keep debug mode available but hidden for recording.

Done when:
- Full demo flow can be recorded cleanly.
- npm run build passes.
- TODO.md is updated.
```

## Cross-Milestone Engineering Tasks

Status: `TODO`

- [ ] Define shared TypeScript types for landmarks, hand state, pose state, interaction states, celestial bodies, and body lifecycle states.
- [x] Create named constants for gesture thresholds. Done: all whole-system tunables live in `src/interaction/intentTuning.ts`; do not reintroduce magic numbers into `wholeSystemIntent.ts`.
- [x] Centralize the normalized→stage/world coordinate mapping in `src/interaction/coordinateMapping.ts` (M4 prerequisite); `mapNormalizedToWorld` unprojects via three's `Raycaster` and `src/rendering/scene.ts` exposes `getCamera()`.
- [x] Unify visual-left/right hand assignment in `src/interaction/handPairing.ts` so startup, hand primitives, and whole-system agree.
- [x] Consolidate shared vector/scalar math in `src/utils/math.ts`.
- [x] Disable the unused `PoseLandmarker` by default (`ENABLE_POSE_TRACKING`) and remove per-point `getBoundingClientRect` thrash in the landmark overlay to free CPU for hand tracking.
- [x] Split the whole-system protocol (`wholeSystemIntent.ts`) into orchestration + stateless modules (`palmOrientation`, `handPose`, `intentScoring`, `handLandmarks`); the controller now owns only the state machine, cross-frame state, and stateful rotation scoring. State-machine split deferred to post-M4 (Step 8).
- [ ] Create a debug state store so debug UI does not depend directly on internal classes.
- [ ] Keep frame loop performance stable and avoid unnecessary per-frame allocations.
- [ ] Add camera permission error UI.
- [ ] Add manual test checklist in README.
- [ ] Add screenshot or short GIF instructions after MVP works.
- [x] Create private companion repository `<private-companion-repo>` for Codex interaction logs, TODO update notes, and agent workflow context.
- [x] Add `npm run sync:agent:push` and a versioned `post-commit` hook so each main-repo commit syncs the companion repo.

## Cross-Cutting Workflow — Test & Replay Harness

Status: `TODO`

Goal: Reduce repeated manual webcam gesture regression testing by adding deterministic tests first, then structured gesture replay, and finally browser-level replay once M5.5 is stable.

Reference document:

- `docs/testing/test-and-replay-harness.md`

Plan:

- [x] Document the latest test strategy, including the user review that leaf pure functions and controller tests should come before replay/E2E.
- [ ] Add Vitest (`environment: 'node'`) without changing `main.ts` or the live camera/runtime bootstrap.
- [ ] Add a determinism guardrail test that fails if `src/interaction/**` uses `Math.random`/`Date.now`/`performance.now`.
- [ ] Extract synthetic builders from `scripts/verify-m5_5-solar-inspection.ts` into shared `tests/helpers/` (single source, not re-written).
- [ ] Add Layer 0 tests for pure modules: `math`, `coordinateMapping`, `handPairing`, `palmOrientation`, `handPose`, and `intentScoring`.
- [ ] Add Layer 1 controller sequence tests for startup, solar opening, free-hover/re-grip basics, and reverse collapse using synthetic `TrackingSnapshot` data and injected timestamps; reuse `solarInspectionVerification` as an oracle where available.
- [ ] Absorb the M5.5 verification cases into a Vitest gesture test and reduce `npm run verify:m5.5` to an alias instead of keeping two parallel harnesses.
- [ ] Add CI (GitHub Actions) running `typecheck` + unit + gesture + `build` on push/PR.
- [ ] Defer JSON fixture replay (multi-frame sequences) until the pure/controller test layers are useful and M5.5 has stabilized.
- [ ] Defer Playwright/browser replay and any `main.ts`/`TrackingSource` seam until replay timing requirements are clear.

Constraints:

- Do not commit raw webcam video.
- Prefer synthetic landmarks for early tests.
- Distinguish single-frame fixtures (Layer 0 pure-function input) from multi-frame sequence fixtures (Layer 3 replay).
- Do not add `src/testing/` or modify product runtime wiring in the first testing slice.
- Preserve fixture timestamps when replay (sequence) fixtures are eventually introduced.

## Manual Test Script

Use this script for human verification after each milestone that involves camera or hand tracking.

Manual verification handoff rule:

- For each milestone that needs user verification, Codex must provide a separate checklist written for the user.
- Each checklist row must say what action to perform, where to look, and what counts as passing.
- A milestone stays `NEEDS_MANUAL_VERIFY` until the user explicitly says the checklist passed.
- If any checklist item fails or is confusing, keep the milestone open and refine either the behavior or the checklist.

1. Open the Web Demo in a browser.
2. Click `开启摄像头`.
3. Confirm only the webcam feed and minimal 2D UI are visible.
4. Stand centered in the camera frame.
5. Bring both hands/fists together anywhere in the visible camera frame.
6. Pull hands apart and observe whether the startup state changes from `HandsClosed` to `PullArmed` and, in later milestones, whether the solar system opens between hands.
7. Pause hands halfway and confirm opening does not auto-complete.
8. Complete opening and confirm the solar system appears where the hands opened it and can later hover where released.
9. Release the endpoint handle and confirm the solar system stays at the released transform instead of following the torso or screen center.
10. In `SolarFreeHover`, use one-hand spread/contract to confirm solar inspection zoom and shrink.
11. In `SolarFreeHover`, use one-hand push to pan and contract-to-fist for about 2 seconds to reset the solar-system view.
12. Hover over each interactive body and confirm label/glow.
13. Pinch-activate a body and confirm it stops orbiting but keeps self-rotating.
14. Hold the pinch lock with the main hand and open/spread the off-hand to enter the planet focus view.
15. Support the focused body, then use off-hand PinchTap to place it down; confirm it floats in the focus view and keeps self-rotating.
16. Pinch the floating body again and throw toward the orbit target; confirm it returns to orbit and exits back to the solar-system view.
17. Repeat with Moon and Saturn.
18. Run recording mode and confirm debug UI is hidden.

### Milestone 3 Manual Verification Checklist

Use this checklist to verify the hand-only closed-to-pull startup state.

| Item | User action | Where to look | Pass condition |
|---|---|---|---|
| Initial empty scene | Open the page, click `开启摄像头`, and wait for tracking to load. | Camera preview and debug panel. | Preview shows only camera video plus 2D UI/debug. No sun, planet, orbit, nebula, particle, singularity, or 3D model appears. Debug `Startup state` starts at `EmptyIdle` after camera starts. |
| Debug values visible | Click `Debug`. Keep both hands visible. | Debug panel. | `Left center`, `Right center`, `Both hands`, `Hand midpoint`, `Hand distance`, and `Distance velocity` are visible. `Both hands` reads `visible` when both hands are detected. |
| HandsClosed near chest | Put both hands/fists close together near the chest and hold briefly. | Debug panel `Startup state`. | `Startup state` changes to `HandsClosed`. No 3D solar content appears. |
| PullArmed near chest | From the near-chest closed pose, pull both hands apart to the sides. | Debug panel `Startup state`, `Hand distance`, and `Distance velocity`. | `Startup state` changes to `PullArmed`; `Hand distance` increases during the pull. No 3D solar content appears. |
| Closed-hand occlusion tolerance | Put both hands/fists very close together so the landmark overlay may briefly show only one tracked hand, then keep the closed pose steady. | Debug panel `Both hands`, `Lost-hand hold`, and `Startup state`. | If both hands were just detected close together, short one-hand loss shows `Lost-hand hold` as `active` and `Startup state` stays in or can enter `HandsClosed` instead of rapidly flickering to `EmptyIdle`. |
| HandsClosed above head | Raise both hands above the head, close them together, and hold briefly while both hands stay visible. | Debug panel `Startup state`. | `Startup state` changes to `HandsClosed`. This must work without moving hands near the chest. |
| PullArmed above head | From the above-head closed pose, pull both hands apart. | Debug panel `Startup state`, `Hand distance`, and `Distance velocity`. | `Startup state` changes to `PullArmed`; `Hand distance` increases. No 3D solar content appears. |
| HandsClosed at side | Move both hands to one side of the body, close them together, and hold briefly while both hands stay visible. | Debug panel `Startup state`. | `Startup state` changes to `HandsClosed`. This must work without moving hands near the chest. |
| PullArmed at side | From the side closed pose, pull both hands apart. | Debug panel `Startup state`, `Hand distance`, and `Distance velocity`. | `Startup state` changes to `PullArmed`; `Hand distance` increases. No 3D solar content appears. |
| Lost-hand hold | While in `HandsClosed` or `PullArmed`, briefly hide one hand for less than about 2 seconds, then show it again. | Debug panel `Lost-hand hold` and `Startup state`. | `Lost-hand hold` reads `active` during the short loss, and the startup state does not flicker immediately. |
| Lost hands return idle | Hide one or both hands for longer than about 2.5 seconds. | Debug panel `Both hands`, `Lost-hand hold`, and `Startup state`. | `Both hands` becomes `missing`; `Lost-hand hold` becomes `inactive`; `Startup state` returns to `EmptyIdle` or another appropriate idle state. |
| Pull stops return idle | Enter `PullArmed`, then stop moving the hands apart and hold them steady. | Debug panel `Startup state` and `Distance velocity`. | After a short pause, `Startup state` returns to `EmptyIdle` or another appropriate idle state. |
| No 3D content in startup states | Repeat any `HandsClosed` or `PullArmed` test. | Camera preview. | Entering `HandsClosed` or `PullArmed` never displays solar-system content. |

### Milestone 3.5 Manual Verification Checklist

Use this checklist to verify the debug-only whole-system interaction protocol before Milestone 4.

Note (2026-06-23): after M4 visible solar content is active, the user-facing top-right status summary follows `interactionState` plus `solarReason`. The legacy `Whole control` / `wholeSystemIntent` values are protocol-debug rows only, and should not be used as the main status explanation for visible solar-system behavior. Its scale/rotation/palm rows are historical protocol diagnostics only; M5.5 is the current user-facing solar inspection control model.

| Item | User action | Where to look | Pass condition |
|---|---|---|---|
| M3.5 empty scene | Open the page, click `开启摄像头`, turn on `Debug`, and keep hands out of view. | Camera preview, debug panel, and debug overlay. | Camera preview shows no 3D sun, planets, orbits, nebula, particles, singularity, or model. `Whole control` reads `Inactive`. |
| Legacy protocol debug fields | Keep `Debug` open and perform any M3.5 action. | Debug panel protocol rows such as `Whole control`, release/re-grip fields, intent scores, and endpoint circles. | Legacy protocol values remain inspectable in Debug. The top-right status card should not show stale protocol labels such as `Lock`, `Re-grip`, or `Transition` for visible M4 solar behavior. |
| Protocol arms after pull | Close both hands anywhere visible, then pull them apart until `Startup state` reaches `PullArmed`. | Debug panel `Whole control`, `Control confidence`, and 2D endpoint circles. | `Whole control` changes from `Inactive` to `VirtualOpeningHandle` and then `SolarHandleControl`. Two small 2D debug endpoint circles appear near the hands only when `Debug` is on. |
| Palm orientation values | Hold both hands visible and slowly rotate each palm toward the camera, sideways, and upward. | Debug panel `Visual L palm normal`, `Visual R palm normal`, `Visual L palm facing/up`, and `Visual R palm facing/up`. | Palm normal values update continuously. Facing/up scores stay in the `0.00-1.00` range and visibly change when palm orientation changes. |
| Bent-hand hold | While `Whole control` is `SolarHandleControl`, keep both hands slightly curved as if holding two handles. | Debug panel `Visual L open/grip`, `Visual R open/grip`, `Grip hold`, `Release stable`, `Release gesture`, and `Whole control`. | `Grip hold` reads `yes`, `Release stable` stays near `0ms`, `Release gesture` stays `no`, and `Whole control` stays in `SolarHandleControl`. The virtual endpoints continue to follow the hands. |
| Legacy palms-up hold diagnostic | While `Whole control` is `SolarHandleControl`, turn both palms upward with slightly curved fingers as if holding a tray, then gently move the two-hand handle. | Debug panel `Rotation intent`, `Release blocked`, `Grip hold`, `Release stable`, `Release gesture`, and `Whole control`. | Legacy `Rotation intent` may change, and `Release blocked` may read `rotationHold` or `cuppedGrip`; this is only a debug/protocol diagnostic. `Grip hold` should read `yes`, `Release stable` should not climb to the release threshold, and `Whole control` should remain `SolarHandleControl`. |
| Open-hand release | While `Whole control` is `SolarHandleControl`, fully open both hands with fingers clearly extended and stop rotating. After `Release stable` climbs past about `280ms` and `Release gesture` reads `yes / lock on`, slowly pull the hands back or relax them. | Debug panel `Visual L open/grip`, `Visual R open/grip`, `Release stable`, `Release blocked`, `Release gesture`, `Whole control`, and the 2D endpoint circles. | Open scores rise, grip scores fall, `Release blocked` reads `none`, `Release stable` climbs past about `280ms`, `Release gesture` becomes `yes / lock on`, `Whole control` changes to `ReleaseCandidate`, then becomes `SolarFreeHover`. The endpoint circles freeze even if the fingers relax during slow withdrawal, and `Whole control` must not jump back to `SolarHandleControl` until both hands first leave the frozen endpoints and then intentionally return. |
| Legacy scale-intent diagnostic | While `Whole control` is `SolarHandleControl`, move both hands farther apart and closer together without fully closing. | Debug panel `Scale intent`, `Hand distance`, `Distance velocity`, and `Collapse intent`. | Legacy `Scale intent` may change with hand distance; this is only a debug/protocol diagnostic. Current user-facing solar inspection zoom belongs to M5.5 one-hand controls after `SolarFreeHover`. |
| Reverse-collapse intent | From `SolarHandleControl`, keep moving both hands inward until they are close together. | Debug panel `Whole control` and `Collapse intent`. | `Collapse intent` rises toward `1.00`; `Whole control` can enter `SolarClosing` and then reset toward `Inactive` when fully closed. No 3D content appears. |
| Fallback release | Reach `SolarHandleControl`, then move both hands out of frame or hide them for a few seconds. | Debug panel `Whole control`, `Release confidence`, and endpoint circles. | `Whole control` changes to `ReleaseCandidate`, then `SolarFreeHover`. The virtual endpoint circles remain frozen at the last stable positions. |
| Re-grip frozen endpoints | After `SolarFreeHover`, first move both hands clearly away from the frozen endpoint circles, then bring both hands back near those two circles. You should not need to perfectly realign your body or camera distance. | Debug panel `Release gesture`, `Whole control`, `Re-grip confidence`, `Re-grip reason`, and `Visual endpoint matched`. | After the hands leave the endpoints, `Release gesture` changes to `no / lock off`. When the hands return near the circles, `Re-grip reason` should become `endpoint` or `wideMagnet`, `Re-grip confidence` rises, and `Whole control` changes through `ReGripCandidate` back to `SolarHandleControl`. |
| Legacy rotation-intent diagnostic | While `SolarHandleControl`, hold palms generally upward or tilted away from camera and gently rotate/twist the two-hand handle. | Debug panel `Rotation intent`, `Rotation intent score`, palm facing/up scores, and palm normals. | Legacy `Rotation intent` may change from `none` to `rotate2d` or `rotate3d`; this is only protocol/debug output and not a current product acceptance gesture. |
| Whole vs pinch separation | While `SolarHandleControl`, pinch with one hand as if activating a future planet. | Debug panel `Control confidence`. | `Control confidence` should drop rather than treating a strong pinch as better whole-system control. No planet is activated in this milestone. |

### Milestone 5.5 Manual Verification Checklist

Use this checklist to verify the current solar-system inspection controls after the whole system is released into `SolarFreeHover`.

| Item | User action | Where to look | Pass condition |
|---|---|---|---|
| Reach free hover | Open the camera, pull the solar system open, enter endpoint control, then release the endpoint handle so it floats. | Camera preview, top-right status summary, and Debug panel. | Solar content remains visible at the released transform. `Startup state` / interaction state reads `SolarFreeHover`, and the status summary says the system is waiting for one-hand inspection or endpoint re-grip. |
| One-hand zoom in | In `SolarFreeHover`, show one hand near the preview and spread the fingers open while keeping the hand center mostly still, then naturally relax the hand back. A brief second-hand flash at the edge should not reset the gesture (dominant-hand lock). | Camera preview and Debug rows `Solar inspect`, `Inspect spread`, `Inspect spread velocity`, and `Inspect scale / offset`. | The solar system grows during the opening phase. `Solar inspect` becomes `zoomIn / active`, `Inspect spread velocity` is positive, and inspection scale rises above `1.00`. The natural return should not immediately produce a matching `zoomOut` shrink jump. |
| One-hand shrink | In `SolarFreeHover`, show exactly one open hand, hold the open pose briefly, then contract the fingers while keeping the hand center mostly still; after shrinking, naturally relax the hand. | Camera preview and Debug rows `Solar inspect`, `Inspect spread velocity`, and `Inspect scale / offset`. | The solar system shrinks during the closing phase. `Solar inspect` becomes `zoomOut / active`, `Inspect spread velocity` is negative, and inspection scale decreases from its previous value. The natural relaxation should not immediately produce a matching `zoomIn` jump. |
| One-hand pan | After zooming in, keep one hand open enough, let the spread feel stable, then push it left/right/up/down without changing finger spread much. | Camera preview and Debug rows `Solar inspect`, `Inspect pan score`, `Inspect palm velocity`, and `Inspect scale / offset`. | The solar system pans smoothly in the push direction after the pan clutch engages. `Solar inspect` becomes `pan / active`, `Inspect pan score` rises above `0.00`, and inspection offset changes without obvious frame-to-frame jumping. |
| Fist reset hold | In `SolarFreeHover`, contract the same hand into a fist and hold for about 2 seconds. | Camera preview, top-right status summary, and Debug rows `Solar inspect`, `Inspect reset hold`, and `Inspect scale / offset`. | During the hold, `Solar inspect` reads `resetHold / active` and reset hold time climbs toward about `2000ms`. After completion, `Solar inspect` reads `reset / active`, inspection scale returns near `1.00`, offset returns near `0, 0, 0`, and endpoints are visible/recoverable. |
| Endpoint control priority | While in or returning to `SolarHandleControl`, keep one hand moving or spreading as if trying M5.5 controls. | Debug panel and camera preview. | Single-hand inspection does not move the solar system during endpoint control. `Solar inspect` reads `inactive / idle` or remains non-active while `SolarHandleControl` owns the transform. |
| Re-grip after inspection | Pan or zoom the free-hovered solar system, then bring both hands near the visible left/right endpoints. | Camera preview and Debug rows `Startup state`, `Solar reason`, and endpoint/re-grip rows. | Re-grip still works at the visually updated endpoint positions, and the state can return to `SolarHandleControl` without snapping back to the old release center. |
| Slow gesture stability | Repeat slow spread, natural hand return, stable-open contract, natural relaxation, and slow push motions. | Top-right status summary and Debug rows `Solar inspect`, `Inspect spread velocity`, and `Inspect pan score`. | The classification is understandable and does not rapidly flicker between zoom and pan during deliberate slow gestures. Rebound motions after zoom-in/zoom-out should be ignored instead of becoming the opposite zoom. If it does flicker, keep Milestone 5.5 in `NEEDS_MANUAL_VERIFY` and tune thresholds. |

## Open Questions to Resolve During Implementation

These should not block early milestones, but Codex should record decisions when resolved.

- [x] Exact package choice and loading strategy for MediaPipe Tasks Vision. Decision: use `@mediapipe/tasks-vision@0.10.35`, load wasm from the matching jsDelivr package path, and load the official Google-hosted lite pose and float16 hand `.task` models for the MVP.
- [x] Whether to use plain TypeScript modules or add React. Decision: use plain TypeScript modules for the initial Web Demo.
- [x] Exact mapping from MediaPipe landmark coordinates to Three.js scene coordinates. Decision: centralized in `src/interaction/coordinateMapping.ts` (object-fit: contain + mirror aware); `mapNormalizedToWorld` unprojects with three's `Raycaster` against `scene.getCamera()` and the `z = INTERACTION_PLANE_Z` plane. The debug overlay already maps through it; M4 3D content must use the same module. Final world-plane depth still subject to M4 tuning.
- [ ] Final pinch threshold values after real webcam testing.
- [ ] Final throw velocity threshold after real webcam testing.
- [ ] Final PinchTap timing threshold after real webcam testing.
- [ ] Final focused-body screen clamp and return-target direction thresholds after real webcam testing.
- [ ] How strong original-orbit placeholder markers should be.
- [ ] Whether labels use Chinese names, English names, or both.

## Deferred / Post-MVP Ideas

Do not implement these until the MVP loop works and the user explicitly asks.

- [ ] Electron desktop packaging.
- [ ] TouchDesigner, Unity, Unreal, or XR migration.
- [ ] Mobile adaptation.
- [ ] Real spatial AR anchoring.
- [ ] Multi-user interaction.
- [ ] Planet information panels.
- [ ] Solar-system education mode.
- [ ] Realistic astronomical scale mode.
- [ ] Real collision physics.
- [ ] Recording/export pipeline.
- [ ] Theme presets.

## Change Log

### 2026-06-23 — Gesture pipeline stabilization (8-task refactor)

- Stabilized the hand-tracking → gesture pipeline before adding new gestures, targeting real-camera jitter / over-sensitivity / dropouts. No new product gestures; no speculative threshold tuning; the initial empty scene and the disabled pose tracking are unchanged.
- Fresh-frame gate (`freshFrameGate.ts`): interaction controllers update only on a new MediaPipe detection (`TrackingSnapshot.lastUpdatedAt` change) and use the detection timestamp, so re-rendered stale frames no longer inject fake zero-velocity samples into pull / zoom / pan velocity. Recording is gated too. `main.ts` gates the controllers; rendering still runs every frame.
- Pairing before smoothing (`gestureInputFrame.ts`): `HandTracker` builds raw hands, assigns visual-left/right by trajectory, then smooths per visual slot — a MediaPipe handedness flip during a crossing no longer swaps smoother history.
- Screen-plane distances use 2D x/y only (startup, primitives, solar-opening), removing noisy image-landmark z from "are the hands close / far" and the pull axis.
- `TrackedHand.worldLandmarks` added; hand-shape (open-hand / fist in `handPose`, pinch in `intentScoring`) prefers metric world landmarks when present, with image fallback.
- `SolarActive` releases to `SolarFreeHover` when the hands stop holding the endpoints, so one-hand inspection starts after opening without an extra endpoint re-grip.
- Single-hand inspection locks onto a dominant hand instead of requiring exactly one detected hand, so a weak second-hand blip no longer resets the gesture.
- Tests: 85 → 97 passing. Added regression tests for fresh-frame gating, opening→free-hover, second-hand blip, 2D-distance vs z jitter, visual-identity-before-smoothing, and world-landmark hand shape.
- Affected files: `src/main.ts`, `src/tracking/handTracker.ts`, `src/utils/types.ts`, `src/interaction/{freshFrameGate,gestureInputFrame,handStartupGesture,handPrimitives,handPose,intentScoring,solarOpeningController,solarInspectionController}.ts`, `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, and new `tests/` files.
- Remaining ambiguity: real-camera verification still needed (handedness-flip stability, feel, thresholds); the structural fixes intentionally avoided threshold tuning. No product behavior / acceptance change, so `ar_solar_system_prd.md` is unchanged.

### 2026-06-23 — Test & Replay Harness plan refined after review

- Refined `docs/testing/test-and-replay-harness.md` with: a Determinism Guardrail (no `Math.random`/`Date.now`/`performance.now` in `src/interaction/**`, enforced by a guardrail test); absorbing `scripts/verify-m5_5-solar-inspection.ts` into a Vitest gesture test (extract its builders into shared `tests/helpers/`, reduce `verify:m5.5` to an alias) instead of maintaining two harnesses; single-frame fixtures (Layer 0) split from multi-frame replay fixtures (Layer 3); and a Continuous Integration section as the automation endpoint.
- Aligned the AGENTS and TODO harness summaries to the refined doc, fixing a contradiction where TODO still said to keep `verify:m5.5` as a separate script.
- Affected files: `docs/testing/test-and-replay-harness.md`, `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: none for the plan; the first implementation slice is still pending.

### 2026-06-23 — M5.5 phase-locked zoom and clutch pan tuning

- Requirement tuning: user reported that spreading fingers to zoom in naturally ends with pulling the open hand back, which the old continuous spread-velocity model interpreted as an immediate shrink jump. The same rebound problem applied after shrink, and left/right push pan felt choppy.
- Implementation update: `SolarInspectionController` now uses phase-locked zoom. Zoom-in consumes only the finger-opening phase, then locks out the reverse return until the hand settles in a neutral spread range. Zoom-out requires a briefly stable open hand, consumes only the closing phase, and locks out the relaxation rebound.
- Pan update: one-hand push pan now uses a stable-spread clutch, anchored palm displacement, a small world-space dead zone, and lower low-pass alpha instead of raw per-frame palm deltas.
- Documentation update: PRD, AGENTS, TODO, and TODO.zh-CN now describe rebound-protected M5.5 zoom/shrink and clutch-smoothed pan.
- Affected files: `src/interaction/solarInspectionController.ts`, `ar_solar_system_prd.md`, `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: exact spread thresholds, open-hold duration, rebound unlock range, and pan smoothing still require manual camera verification.

### 2026-06-23 — Test & Replay Harness workflow documented

- Workflow update: added a dedicated testing strategy document that prioritizes leaf pure-function tests and controller sequence tests before JSON replay or browser E2E.
- Planning update: added a cross-cutting `Test & Replay Harness` workflow to TODO instead of inserting a stale `Milestone 3.7` into the product timeline.
- Durable rule update: AGENTS now points future sessions to the test strategy document and cautions against touching `main.ts`/runtime replay seams before M5.5 stabilizes.
- Affected files: `docs/testing/test-and-replay-harness.md`, `TODO.md`, `TODO.zh-CN.md`, `AGENTS.md`, `scripts/sync-agent-repo.mjs`.
- Remaining ambiguity: exact Vitest test files and fixture formats are deferred until the first implementation slice.

### 2026-06-23 — TODO legacy M5 wording tightened after doc review

- Requirement/doc correction: user pointed out that TODO entries for two-hand zoom, palm-forward "sliding glass" scaling, palms-up whole-system rotation, and flat-vs-3D rotation came from the old gesture semantics; the latest active controls are the M5.5 one-hand `SolarFreeHover` inspection controls.
- Documentation update: tightened the Milestone 3.5 acceptance wording so palm-forward and palms-up signals are explicitly debug-only historical diagnostics, not current user-facing product controls or unchecked acceptance items.
- Historical-log update: marked the 2026-06-21 whole-system scale/rotation language as superseded by the 2026-06-23 M5.5 decision while preserving it as project history.
- Affected files: `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: none for the documentation correction; M5.5 still needs real webcam tuning before it can move from `NEEDS_MANUAL_VERIFY` to `DONE`.

### 2026-06-23 — M5.5 re-grip-after-inspection added to runtime verification

- Verification update: the runtime M5.5 Debug checklist now has 8 items and includes `re-grip-after-inspection`, so manual testers can see whether re-grip still works after a zoom/pan inspection changed the free-hover transform.
- Implementation update: `updateSolarInspectionVerification` only grants `re-grip-after-inspection` after zoom-in, zoom-out, or pan has already been observed and the app subsequently returns to `SolarHandleControl`; initial endpoint control no longer counts for this item.
- Report/test update: the exported M5.5 summary JSON includes the new checklist item through the existing checklist array, and `npm run verify:m5.5` now covers both 8/8 completion and the guard that prevents premature re-grip credit.
- Affected files: `src/utils/types.ts`, `src/interaction/solarInspectionVerification.ts`, `scripts/verify-m5_5-solar-inspection.ts`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: the runtime signal proves the state transition sequence, but real camera verification is still needed to confirm the visual endpoints are comfortable to reacquire after zoom/pan.

### 2026-06-23 — M5.5 pending export enabled for manual evidence

- Manual-verification support: `Export M5.5` is now available even before any checklist item has been completed, so a tester can export a 0/8 or partially complete report when the first step fails or behavior is confusing.
- Report/test update: `npm run verify:m5.5` now asserts that the pending report preserves all 8 checklist items, exposes `free-hover` as the next required item, stays `passed: false`, and contains no landmark arrays.
- Affected files: `src/main.ts`, `scripts/verify-m5_5-solar-inspection.ts`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: none for export availability; real camera verification is still required for the gesture behavior itself.

### 2026-06-23 — M5.5 exported checklist made self-describing

- Manual-verification support: every exported M5.5 checklist item now includes its user action, where to observe it, and the pass condition, so the JSON report can stand alone without requiring the reader to cross-reference `TODO.md`.
- Report/test update: `npm run verify:m5.5` now asserts that both completed and pending reports include these self-describing checklist fields while still excluding landmark arrays.
- Affected files: `src/interaction/solarInspectionVerification.ts`, `scripts/verify-m5_5-solar-inspection.ts`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: none for report self-description; real camera verification is still required for the gesture behavior itself.

### 2026-06-23 — M5.5 checklist evidence tightened without adding tests

- Verification behavior update: runtime M5.5 checklist items for zoom-in, zoom-out, pan, and reset now require matching `inspectionScale` or `inspectionOffset` evidence instead of trusting the `Solar inspect` intent label alone.
- Implementation update: `SolarInspectionVerificationSnapshot` keeps the previous inspection scale and offset so `updateSolarInspectionVerification` can confirm scale increases, scale decreases, pan offset changes, and reset returning near the default transform.
- Workflow note: the user will manually run the M5.5 checklist for acceptance; no new test-script coverage was added for this tightening.
- Affected files: `src/utils/types.ts`, `src/interaction/solarInspectionVerification.ts`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: real camera verification is still required for the gesture behavior itself; the automatic checklist now only makes its recorded evidence stricter.

### 2026-06-23 — M5.5 debug panel shows next manual step

- Manual-verification support: Debug now shows `M5.5 next action`, `M5.5 observe`, and `M5.5 pass` derived from the exported checklist metadata, so the user can run the manual checklist from the browser without constantly cross-referencing `TODO.md`.
- Workflow note: this is an app-side manual-test affordance only; M5.5 checklist acceptance remains user-run manual verification.
- Affected files: `src/rendering/debugOverlay.ts`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: real camera verification is still required for the gesture behavior itself.

### 2026-06-23 — M5.5 single-hand solar inspection implementation

- Implementation update: added `SolarInspectionController` for `SolarFreeHover` only, with one-hand spread zoom-in, contraction zoom-out, fist-hold reset, and stable-spread palm push pan. The controller syncs the inspected free-hover transform back to `SolarOpeningController` so later endpoint re-grip uses the visible updated endpoint positions.
- Debug/status update: added solar inspection debug rows for intent, spread, spread velocity, pan score, palm velocity, reset hold, inspection scale, and inspection offset; updated the Chinese status summary and guidance text to use the M5.5 semantics instead of retired M5 scale/rotation wording.
- Smoothing update: M5.5 inspection zoom now has an explicit per-second scale-rate cap, and pan offset uses frame-adjusted low-pass smoothing while preserving the reset path.
- Documentation update: Milestone 5.5 is now `NEEDS_MANUAL_VERIFY`, code-level tasks are checked, and a dedicated Milestone 5.5 manual verification checklist was added.
- Manual-verification support: Debug now includes `M5.5 checklist`, `M5.5 remaining`, `M5.5 next`, and `M5.5 last hit` rows that show session progress count, remaining item labels, the next required item, and the last matched M5.5 intent.
- Manual-verification support: Debug now records `completedAt` when the session checklist first reaches 8/8 and exposes `Export M5.5` to download the current verification summary JSON, including pending or failed 0/8 attempts. The report schema is centralized in `solarInspectionReport.ts`, includes stable checklist item ids, action/observation/pass-condition text, plus `nextItem`, and is covered by `npm run verify:m5.5`.
- Manual-verification support: Debug controls now include `Reset M5.5`, which clears the current session checklist so repeated camera-test passes do not require a page refresh.
- Verification update: added `npm run verify:m5.5`, which compiles and runs a synthetic-landmark controller check for inactive gating, exact-one-hand gating, spread zoom-in, contraction zoom-out, zoom-rate clamping, stable push pan, pan low-pass smoothing, slow-spread/no-pan stability, slow-push/no-zoom stability, zoom bounds, fist-hold reset, and runtime checklist completion. The npm script now delegates to `scripts/run-m5_5-verification.mjs` instead of embedding a long shell command.
- Verification: `npm run verify:m5.5`, `npm run typecheck`, and `npm run build` pass. Local Vite smoke verified that `/` serves the entry HTML and `/src/main.ts` serves the app module with `SolarInspectionController` wired in.
- Affected files: `src/interaction/solarInspectionController.ts`, `src/interaction/solarOpeningController.ts`, `src/main.ts`, `src/rendering/debugOverlay.ts`, `src/rendering/interactionStatusSummary.ts`, `src/utils/types.ts`, `scripts/verify-m5_5-solar-inspection.ts`, `package.json`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: real webcam tuning is still needed for spread/contraction velocity thresholds, pan classification, reset hold ergonomics, and scale/offset limits; the milestone remains `NEEDS_MANUAL_VERIFY` until the checklist passes.

### 2026-06-23 — M5.5 supersedes old two-hand scale/rotation controls

- Requirement correction: user clarified that the old M5 gestures (two-hand farther/closer scaling, palm-forward "sliding glass" scaling, palms-up whole-system rotation, and flat-vs-3D rotation acceptance items) are obsolete; the M5.5 one-hand `SolarFreeHover` inspection controls are the latest product baseline.
- Documentation update: retired Milestone 5 as an active implementation target, marked its old gesture semantics as legacy/debug protocol context, and promoted Milestone 5.5 as the current solar-system zoom/shrink/reset/pan milestone.
- Updated PRD, AGENTS, TODO, TODO.zh-CN, manual test script, and M3.5 protocol checklist wording so old palm/rotation/scale fields are clearly diagnostics rather than current product controls.
- Affected files: `ar_solar_system_prd.md`, `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: M5.5 still needs real webcam tuning for one-hand spread/contraction thresholds, pan classification, reset hold timing, and inspection scale/offset limits.

### 2026-06-23 — M4 openProgress smoothing and start/target debug values

- Implementation update: `SolarOpeningController` now eases displayed `openProgress` toward the raw hand-driven value with a frame-time-aware low-pass (`OPENING_PROGRESS_SMOOTHING`) plus a per-frame rise cap (`MAX_OPENING_PROGRESS_RISE_PER_FRAME`), so a sudden hand-distance jump opens smoothly instead of snapping. Clamping was already in place; this adds the rise smoothing. Genuine reverse pulls still ease back down, and the abrupt-drop outlier guard now compares against the raw previous progress so smoothing lag is not mistaken for a glitch.
- Implementation update: surfaced opening `start distance` / `target distance` in the Debug panel (`Open start / target`) via new `DebugSnapshot.solarStartDistance` / `solarTargetDistance` fields.
- Affected files: `src/interaction/solarOpeningController.ts`, `src/utils/types.ts`, `src/main.ts`, `src/rendering/debugOverlay.ts`, `TODO.md`, `TODO.zh-CN.md`.
- Remaining ambiguity: smoothing factor and rise cap need real webcam tuning so opening still feels responsive while staying jitter-free; M4 stays `IN_PROGRESS` pending manual camera verification.

### 2026-06-23 — Documentation alignment for current M4 control semantics

- Documentation-only sync: clarified that the M4 manual checklist now covers M4-A/B/C/D, and that endpoint release transitions to `SolarFreeHover` rather than back to `SolarActive`.
- Historical scope note: at this point Milestone 5 was still framed around endpoint re-grip, scale, visual-axis control, free-hover release, and reverse collapse. This was superseded later on 2026-06-23 by the M5.5 clarification that retired the old scale/rotation gesture semantics.
- Protocol clarification: M3.5 `Whole control` / `wholeSystemIntent` rows are legacy protocol debug values only; the user-facing status summary should follow `interactionState` plus `solarReason` for visible M4 solar behavior.
- Affected files: `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, and `AGENTS.md`. No application code changed in this documentation pass.
- Superseded ambiguity: old M5 scale/rotation tuning was replaced by M5.5 one-hand inspection tuning.

### 2026-06-23 — User-facing status summary aligned to M4 solar control

- Bug fix: the status summary could still show legacy `wholeSystemIntent` copy such as `Lock`, `Re-grip`, and `Transition=missing-hand-pair`, even though the visible solar system is now driven by `interactionState` + `SolarOpeningController`.
- Implementation update: the status summary now only uses latest M4 solar states (`SolarActive`, `SolarHandleControl`, `SolarFreeHover`, `SolarClosing`) and the real `solarReason` from `SolarOpeningController`. Legacy whole-system protocol values remain in the Debug panel only.
- Affected files: `src/utils/types.ts`, `src/main.ts`, `src/rendering/debugOverlay.ts`, `src/rendering/interactionStatusSummary.ts`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`.
- Remaining ambiguity: once the old pre-M4 protocol is fully retired, `wholeSystemIntent` debug rows can be renamed or hidden behind an advanced debug section.

### 2026-06-23 — M4C/D free-hover release and reverse collapse

- Implementation update: released endpoint control now transitions to `SolarFreeHover` and keeps the last stable transform. Returning both hands to the left/right endpoints re-enters `SolarHandleControl`.
- Implementation update: moving controlled endpoint hands inward enters `SolarClosing`; `openProgress` reverses with hand distance, and reaching the collapse-complete threshold hides the placeholder solar system and returns to `EmptyIdle`.
- Affected files: `src/interaction/solarOpeningController.ts`, `src/interaction/stateMachine.ts`, `src/rendering/interactionStatusSummary.ts`, `src/main.ts`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`.
- Remaining ambiguity: endpoint release grace, collapse start/complete thresholds, and whether closing should cancel back to handle control or free hover on hand loss need real webcam tuning.

### 2026-06-23 — M4-A/B endpoint-gated post-opening control

- Requirement refinement: after the initial pull-open completes, arbitrary visible hands should not keep controlling the solar system. Post-opening control requires both hands to stably hit the solar-system left/right control endpoints.
- Implementation update: `SolarActive` now holds the last stable transform by default and only transitions to `SolarHandleControl` after endpoint hit stability. Historical note: this originally described `SolarHandleControl` as the only move/scale/rotate state; later 2026-06-23 documentation retired the old scale/rotation product semantics in favor of M5.5 one-hand inspection controls. Hand-pose gating is intentionally deferred so the endpoints remain easy to grab.
- Affected files: `src/interaction/solarOpeningController.ts`, `src/rendering/interactionStatusSummary.ts`, `src/main.ts`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `AGENTS.md`.
- Remaining ambiguity: endpoint enter/exit radius and stable timing need real webcam tuning.

### 2026-06-23 — M4-A/B fast-withdraw stability guard

- Bug fix: fast hand withdrawal or edge-of-frame MediaPipe mis-tracking could produce a one-frame false midpoint and much smaller hand distance, causing the placeholder solar system to jump sideways and shrink.
- Implementation update: `SolarOpeningController` now rejects abrupt progress, distance, scale, and midpoint outliers before updating the solar-system transform, and only accepts a hand pair as the new pairing reference after the candidate geometry passes stability checks.
- Affected files: `src/interaction/solarOpeningController.ts`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `AGENTS.md`.
- Remaining ambiguity: real webcam testing should tune the outlier thresholds so deliberate future reverse-collapse gestures remain possible without reintroducing fast-withdraw jumps.

### 2026-06-22 — M4-A/B visual endpoint controls replace rod overlay

- Requirement refinement: whole-system opening should not use a joystick/rod-style control affordance. The solar system should show two independent 3D control endpoints at its left and right edges.
- Implementation update: the placeholder solar-system group now owns those two endpoint markers, and opening scale uses the same endpoint span. Legacy 2D virtual endpoint markers are hidden during visible solar-system states.
- Affected files: `src/solar/solarSystem.ts`, `src/solar/solarSystemData.ts`, `src/interaction/solarOpeningController.ts`, `src/rendering/landmarkOverlay.ts`, `src/main.ts`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `AGENTS.md`.
- Remaining ambiguity: endpoint color/size and exact hand-to-edge alignment still need webcam tuning.

### 2026-06-22 — M4-A/B pull-open placeholder solar system connected

- Implementation update: wired the hand-only startup flow into the code placeholder solar-system layer. `PullArmed` now enters `SolarOpening`; hand distance drives `openProgress`; hand midpoint, span, and visual hand axis drive the placeholder transform; full opening transitions to `SolarActive`.
- Scope boundary: this implements M4-A/B only. M4-C release/free-hover, M4-D reverse collapse, per-element reveal timing, and final smoothing/tuning remain open.
- Verified: `npm run typecheck`, `npm run build`, and headless Chrome desktop/mobile visual regression checks pass. Real webcam gesture behavior still needs user verification.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `src/main.ts`, `src/rendering/interactionStatusSummary.ts`, and new `src/interaction/solarOpeningController.ts`.
- Remaining ambiguity: real webcam testing must tune opening target distance, visual scale, rotation feel, and whether the solar system appears too early or too late after `PullArmed`.

### 2026-06-22 — Code placeholder solar-system visual layer added

- Requirement implementation: added a dev-only, all-code placeholder solar-system layer before Milestone 4. The normal product path remains visually empty; `?solarPreview=1` shows the procedural solar preview without camera permission.
- Added a reusable data-driven solar layer with procedural textures, orbit rings, revolution, self-rotation, Moon orbiting Earth, Saturn ring, future interaction metadata, renderer object hooks, and frame timing.
- Updated Milestone 3.7 as `DONE` and adjusted Milestone 4 so it connects the reusable placeholder layer instead of rebuilding the initial solar-system group.
- Verified: `npm run typecheck`, `npm run build`, and headless Chrome desktop/mobile preview checks pass. Default route WebGL canvas is blank; `?solarPreview=1` is nonblank and moving; console errors are empty.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `index.html`, `src/main.ts`, `src/rendering/scene.ts`, `src/utils/types.ts`, and new `src/solar/solarSystemData.ts`, `proceduralMaterials.ts`, `celestialBody.ts`, `solarSystem.ts`.
- Remaining ambiguity: final M4 hand-driven placement, opening reveal curve, and production texture sources still need implementation/tuning.

### 2026-06-22 — Planet focus gesture model and milestone plan updated

- Requirement refinement: replaced the old body grab/freeze/release flow with the new planet interaction model: hover, pinch activation, main-hand pinch lock plus off-hand spread to enter `PlanetFocusView`, always-on self-rotation, single-planet zoom/pan/support, off-hand `PinchTap` release-to-floating, and pinch-and-throw return.
- Added Milestone 5.5 for one-hand solar-system free-hover inspection controls, and rewrote Milestones 6-9 around interactive body metadata, pinch activation, planet focus view, PinchTap release, floating focus, and throw return.
- Updated PRD and durable agent rules so activated/focused bodies stop original orbiting but keep self-rotation; normal place-down does not return to orbit or exit the focus view.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, and `~/CodeXProject/物理宇宙资料/手势操控语义整理.md`.
- Remaining ambiguity: exact single-hand spread/contraction thresholds, PinchTap timing, support-follow dwell, focused-body clamp limits, and throw direction thresholds need real webcam tuning.

### 2026-06-22 — Convention update: reuse-vs-custom balance, dead-state rule, changelog scope

- Documentation/convention change only; no code behavior change. Closes gaps found by auditing the change log of real pitfalls against the convention sections.
- Reframed the vague `Recommended Tech Stack` line that said "use Three.js vector math": it went unenforced (we hand-rolled a `tan(fov/2)` projection and a copied `HAND_CONNECTIONS` table) and conflicted with the deliberate choice to keep `src/utils/math.ts`. Added a balanced `Coding Rules → Reuse vs. Custom` subsection — requirement fit comes first, self-written code is legitimate when it matches our data/needs, do not force-fit a dependency, and record the sanctioned custom exceptions (`utils/math.ts`; `landmarkOverlay` draw helpers) so later sessions do not "fix" them. It also keeps the "check the library first" expectation (e.g. `Raycaster` over `tan(fov/2)`).
- Added a `Coding Rules` bullet against dead controller state (written but never read), after `pullTrendSince` lingered across sessions before being removed.
- Broadened the change-log sync rule (`AGENTS.md` sync protocol item 6) so durable engineering/refactor/convention changes are logged too, not only requirement changes.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`. No product behavior changed, so `ar_solar_system_prd.md` is unchanged.
- Remaining ambiguity: none.

### 2026-06-22 — Pre-M4 refactor: reuse library primitives for hand skeleton + world unprojection

- Engineering refactor only; no product behavior or acceptance-criteria change. Removes two hand-rolled reimplementations of capabilities already provided by existing dependencies.
- `src/rendering/landmarkOverlay.ts` now sources the 21-point hand skeleton edges from MediaPipe's `HandLandmarker.HAND_CONNECTIONS` instead of a hand-copied connection table. The drawing itself stays custom (`drawLine` / `drawPoint`) because it must route through `coordinateMapping.mapNormalizedToStagePixel` for mirror + `object-fit: contain` + retina-DPR alignment, which the library's `DrawingUtils` (raw `x * canvas.width`, no mirror/contain hook) does not support.
- `coordinateMapping.mapNormalizedToWorld` now unprojects with three's `Raycaster` against the real camera (`scene.getCamera()`) and the `z = INTERACTION_PLANE_Z` plane, replacing a hand-rolled `tan(fov/2)` projection that was only correct for a fixed, axis-aligned camera. It is allocation-free (reused `Raycaster` / `Vector2` / `Vector3` / `Plane`) and returns `null` when the layout has no size or the ray is parallel to the plane.
- Signature change: `mapNormalizedToWorld(point, layout, camera, planeZ)` (was `(point, layout, viewport)`). Removed the now-unused `PerspectiveViewport` type and `scene.getInteractionViewport()`; `scene` exposes `getCamera()` instead. Both were M4-only and unused, so no live caller changed.
- Decision (kept as-is): `src/utils/math.ts` scalar/vector helpers were NOT switched to `THREE.MathUtils` / `Vector3` — landmark data is plain `{x,y,z,visibility}` objects, so Vector3 would add per-frame allocation/conversion with no benefit. One Euro Filter for smoothing is likewise deferred until M4 direct-manipulation makes the jitter/lag tradeoff user-visible.
- Verified: `npm run typecheck` and `npm run build` pass.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `src/rendering/landmarkOverlay.ts`, `src/interaction/coordinateMapping.ts`, and `src/rendering/scene.ts`. No product behavior changed, so `ar_solar_system_prd.md` is unchanged.
- Remaining ambiguity: M4 must confirm `mapNormalizedToWorld` visually attaches endpoints to hands once 3D content exists and the camera may move.

### 2026-06-22 — Pre-M4 refactor: split wholeSystemIntent.ts into focused modules (Steps 4–7)

- Split the ~1428-line whole-system protocol file into an orchestration layer plus focused stateless modules, with no behavior change. Verified as a pure relocation: every moved function and the controller class are byte-identical to before once tuning constants are resolved to numbers (typecheck + build green at each step).
- New modules: `handLandmarks.ts` (shared MediaPipe landmark indices), `palmOrientation.ts` (palm normal / facing / up), `handPose.ts` (open-hand / grip / release scoring), `intentScoring.ts` (pure control/release/re-grip confidence, scale/rotation/collapse intent, endpoint matching, pinch separation, plus the shared `HandPointPair` / `VirtualEndpoints` / `EndpointMatch` types).
- `wholeSystemIntent.ts` is now orchestration only: the `WholeSystemIntentController` state machine, cross-frame state, and the stateful rotation-velocity scoring (which must stay because it needs previous-frame angle/normal). 1428 → 792 lines.
- Step 8 (splitting the state machine itself into release/re-grip/collapse controllers) is intentionally deferred until after M4/M5, so 3D work and a state-machine refactor are not destabilized at once.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `src/interaction/wholeSystemIntent.ts`, and new `src/interaction/handLandmarks.ts`, `palmOrientation.ts`, `handPose.ts`, `intentScoring.ts`. No product behavior, interaction rule, or acceptance criteria changed, so `ar_solar_system_prd.md` is unchanged.
- Remaining ambiguity: none for this refactor; the deferred record/replay + unit-test strategy is to be revisited next.

### 2026-06-22 — Pre-M4 refactor follow-up: finish math consolidation and remove dead state

- Folded the remaining duplicated math into `src/utils/math.ts`: added `averagePoints` (was copied in `handTracker.ts` and `wholeSystemIntent.ts`), and switched `smoothing.ts` (`lerp`), `gestureCalibration.ts` (`clamp`), and `handTracker.ts` (`distance3d`) to import from it. No local copies of shared math remain outside `utils/math.ts`.
- Removed the dead `pullTrendSince` state from `handStartupGesture.ts` (it was only written, never read); startup behavior is unchanged.
- Strengthened the AGENTS "Single Sources of Truth" rule so future modules import shared math instead of redefining it.
- Verified: `npm run typecheck` and `npm run build` pass.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `src/utils/math.ts`, `src/tracking/smoothing.ts`, `src/tracking/handTracker.ts`, `src/interaction/gestureCalibration.ts`, `src/interaction/wholeSystemIntent.ts`, and `src/interaction/handStartupGesture.ts`.
- Remaining ambiguity: none.

### 2026-06-22 — Pre-M4 refactor: coordinate-mapping SoT, centralized tuning, unified left/right, pose disabled

- Engineering refactor only; no product behavior or acceptance-criteria change. Prepares for Milestone 4 and removes future-conflict hazards.
- Added `src/interaction/coordinateMapping.ts` as the single normalized→stage-pixel/world mapping source (object-fit: contain + mirror aware). `src/rendering/scene.ts` now exports camera params and `getInteractionViewport()`. The debug landmark overlay maps through it; M4 3D endpoints must use the same module so content stays pixel-aligned with the hands.
- Extracted all whole-system gesture thresholds and blend weights into `src/interaction/intentTuning.ts`. Values are unchanged, so gesture behavior is identical; tune gestures there instead of editing scoring functions.
- Unified visual-left/right hand assignment in `src/interaction/handPairing.ts` (visual-left = larger camera x in the mirrored preview). Startup and hand-primitive modules previously used the opposite raw-camera convention; this only corrects debug read-outs because whole-system already re-sorted to visual order.
- Consolidated duplicated vector/scalar math into `src/utils/math.ts`.
- Performance: `PoseLandmarker` is disabled by default via `ENABLE_POSE_TRACKING` in `src/tracking/config.ts` (it gated nothing and stole CPU from hand tracking; runs throttled when enabled). Removed per-point `getBoundingClientRect` thrash in the landmark overlay and gated preview debug metrics behind debug visibility.
- Verified: `npm run typecheck` and `npm run build` pass; coordinate-mapping math sanity-checked numerically. Real webcam gesture re-verification (M3/M3.5/M3.6 `NEEDS_MANUAL_VERIFY`) still pending.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `src/tracking/config.ts`, `src/tracking/mediapipe.ts`, `src/utils/math.ts`, `src/interaction/handPairing.ts`, `src/interaction/coordinateMapping.ts`, `src/interaction/intentTuning.ts`, `src/interaction/handStartupGesture.ts`, `src/interaction/handPrimitives.ts`, `src/interaction/wholeSystemIntent.ts`, `src/rendering/scene.ts`, `src/rendering/landmarkOverlay.ts`, and `src/main.ts`.
- Remaining ambiguity: M4 must confirm the world-plane depth and that endpoints visually attach to hands using the new mapping. `pullTrendSince` in `handStartupGesture.ts` remains dead state to clean up later.

### 2026-06-22 — M3.6 gesture diagnostics and adaptive thresholds added

- Requirement refinement: before Milestone 4, add a unified hand primitives layer, session-adaptive thresholds, structured transition reasons, tracking confidence, and a no-video gesture debug recorder.
- Startup close/pull thresholds, whole-system endpoint radii, re-grip radius, and reverse-collapse distances now come from current-session calibration values derived from palm scale and observed closed/open hand distances.
- Debug now exposes primitive scores, calibration values, endpoint hit score, tracking confidence, startup/whole transition reasons, and recorder status; recorder export is structured JSON only.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `index.html`, `src/main.ts`, `src/styles.css`, `src/utils/types.ts`, `src/interaction/handPrimitives.ts`, `src/interaction/gestureCalibration.ts`, `src/interaction/gestureDebugRecorder.ts`, `src/interaction/handStartupGesture.ts`, `src/interaction/wholeSystemIntent.ts`, `src/rendering/debugOverlay.ts`, and `src/rendering/interactionStatusSummary.ts`.
- Remaining ambiguity: real webcam testing must confirm adaptive thresholds improve stability and that exported debug logs are enough to diagnose failed gestures.

### 2026-06-22 — Free-hover placement rule clarified

- Requirement correction: the future 3D solar system is not constrained to the chest anchor; after release it can hover at any user-chosen position based on the last stable transform.
- Reframed shoulder/chest data as an optional body-relative reference for initial AR feel, not a required anchor for startup, release, re-grip, scale, rotation, or free-hover.
- Hid the shoulder debug line by default and renamed the debug label from `Chest X/Y` to `Body ref X/Y` to avoid implying a chest-fixed solar system.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `src/rendering/debugOverlay.ts`, and `src/rendering/landmarkOverlay.ts`.
- Remaining ambiguity: future M4/M5 implementation should decide how much optional body-relative bias to use during initial placement without overriding hand-driven free-hover.

### 2026-06-22 — Top-right Chinese interaction status summary added

- Requirement refinement: before the next manual camera pass, the page should show a concise Chinese explanation of the current state-machine interpretation beside the Debug button.
- Added a status summary that translates `Startup state` and `Whole control` into human-readable states such as waiting, holding, rotating, releasing, free-hovering, re-gripping, scaling, and closing.
- The summary shows the reason and core parameters behind the decision, so mismatches between the user's intended gesture and the system interpretation can be reported precisely.
- Affected files: `index.html`, `src/main.ts`, `src/styles.css`, `src/rendering/interactionStatusSummary.ts`, `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, and `ar_solar_system_prd.md`.
- Remaining ambiguity: real webcam testing should confirm the summary text is readable without covering important hand regions.

### 2026-06-22 — M3.5 hold/rotate priority and magnetic re-grip tuning

- Requirement refinement: palms-up cupped hands near endpoints should be treated as holding/rotating, not as release; hold/rotate intent has priority over scale/collapse, and open-hand release is last.
- Changed release behavior so open-hand release requires stable evidence for a short window before entering `ReleaseCandidate`, reducing single-frame release spikes.
- Changed re-grip behavior to use a wider magnetic zone around frozen endpoints, then snap virtual endpoints back to the current hands once control is reacquired.
- Added debug fields for release stable time, release-block reason, grip-hold state, and re-grip reason; updated the M3.5 manual checklist around palms-up rotation and re-grip recovery.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `src/interaction/wholeSystemIntent.ts`, `src/rendering/debugOverlay.ts`, and `src/utils/types.ts`.
- Remaining ambiguity: real webcam testing still needs to confirm the `rotationHold`/`cuppedGrip` blockers do not make intentional open-hand release too hard.

### 2026-06-21 — Open-hand release latch and debug state naming clarified

- Requirement refinement: an accepted open-hand release must latch immediately, freeze the virtual endpoints, and block re-grip until both hands clearly leave the frozen endpoints and later return.
- Clarified debug naming: `Startup state` is the Milestone 3 closed-to-pull startup state; `Whole control` is the Milestone 3.5 whole-system protocol state to watch for `ReleaseCandidate`, `SolarFreeHover`, `ReGripCandidate`, and `SolarHandleControl`.
- Updated manual verification so slow hand withdrawal after `Release gesture` reaches `yes / lock on` is a required pass case.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `src/interaction/wholeSystemIntent.ts`, `src/rendering/debugOverlay.ts`, and `src/utils/types.ts`.
- Remaining ambiguity: real webcam testing still needs to confirm the release lock clears at a natural distance without making deliberate re-grip feel too strict.

### 2026-06-21 — Milestone 3.5 release, visual endpoint, and rotate3d tuning

- Requirement refinement: whole-system release should primarily use a clear open-hand gesture, while slightly curved hands should keep holding the endpoints.
- Clarified debug naming so virtual endpoints use visual left/right in the mirrored camera preview, not MediaPipe handedness left/right.
- Broadened `rotate3d` detection to use palm-normal motion and a wider spatial palm posture score instead of only requiring a high palm-up score.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `src/interaction/wholeSystemIntent.ts`, `src/rendering/debugOverlay.ts`, and `src/utils/types.ts`.
- Remaining ambiguity: real webcam testing must tune open-hand/grip-pose thresholds and confirm `rotate3d` appears without making normal holding or release unstable.

### 2026-06-21 — Milestone 3.5 whole-system protocol implemented for debug validation

- Implemented the pre-3D whole-system interaction protocol as a debug-only layer between MediaPipe hand data and the future solar-system controller.
- Added palm orientation primitives, virtual endpoints, control/release/re-grip confidence, scale/rotation/reverse-collapse intent values, and endpoint match debug output.
- Added a Milestone 3.5 manual verification checklist with user action, observation point, and pass condition for each test.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `src/main.ts`, `src/utils/types.ts`, `src/interaction/stateMachine.ts`, `src/interaction/wholeSystemIntent.ts`, `src/rendering/debugOverlay.ts`, and `src/rendering/landmarkOverlay.ts`.
- Remaining ambiguity: real webcam testing must calibrate palm-facing/up scores, virtual endpoint hit radius, visible-hand release behavior, rotation intent thresholds, and the exact collapse threshold before Milestone 4 starts.

### 2026-06-21 — Reverse collapse to empty scene requirement added

- Requirement clarification: from an opened or whole-system handle state, moving both gripped endpoint hands inward should collapse the solar system in reverse.
- The collapse progress should follow hand distance, pause when hands pause, and return to the initial empty camera view when fully closed.
- Updated the durable state model to include `SolarClosing` and updated Milestones 3.5, 4, and 5 to distinguish ordinary scale-down from intentional reverse collapse.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, and `ar_solar_system_prd.md`.
- Remaining ambiguity: exact collapse threshold and hysteresis between scale-down and full collapse need debug calibration before visible 3D content is attached.

### 2026-06-21 — Pre-M4 whole-system interaction semantics clarified

- Historical requirement clarification, superseded on 2026-06-23: before adding solar-system 3D content, the project should lock the whole-system interaction contract for no-animation closed hands, hand-attached opening, release-to-free-hover, re-grip by endpoints, palm-forward scaling, and palms-up 3D rotation.
- Added Milestone 3.5 as a pre-3D design/debug gate before Milestone 4.
- Updated Milestones 4 and 5 so opening, release, re-grip, scale, and rotation semantics matched that then-current interaction model. Current solar-system inspection controls are now M5.5 one-hand controls after `SolarFreeHover`; old scale/rotation signals remain debug-only history unless explicitly reopened.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, and `ar_solar_system_prd.md`.
- Superseded ambiguity: exact palm-orientation thresholds for old scale/rotation controls are no longer product acceptance blockers; endpoint hit zones remain relevant to handle re-grip/release.

### 2026-06-21 — Milestone 3 webcam stability tuning after user recording

- Real webcam recording showed `State` flicker and one-hand dropouts when both hands/fists were tightly closed together.
- Tuned M3 startup detection to latch recent valid two-hand close evidence during short overlap occlusion, add grace windows for `HandsClosed`/`PullArmed`, stabilize two-hand assignment, and lower MediaPipe hand confidence thresholds slightly.
- Updated the M3 manual verification checklist with a closed-hand occlusion tolerance test.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `src/interaction/handStartupGesture.ts`, and `src/tracking/handTracker.ts`.
- Remaining ambiguity: needs another real camera pass to confirm the new thresholds feel stable without making false positives too easy.

### 2026-06-21 — Manual verification checklist handoff rule added

- Changed workflow requirement: whenever a milestone needs user/manual verification, Codex must provide a separate checklist that states the user action, where to observe the result, and the exact pass condition.
- Added a Milestone 3 manual verification checklist for `HandsClosed`, `PullArmed`, lost-hand hold, return-to-idle behavior, and no-3D-content checks.
- Affected files: `AGENTS.md`, `TODO.md`, and `TODO.zh-CN.md`.
- Remaining ambiguity: none.

### 2026-06-21 — Private agent companion repository added

- Changed workflow requirement: create and keep a private companion repository named `agent-companion-repo` for Codex/user interaction records, TODO update notes, agent workflow/tooling decisions, and generated main-doc snapshots.
- Added sync mechanism: `npm run sync:agent:push`, `scripts/sync-agent-repo.mjs`, and `.githooks/post-commit` so each main-repo commit can update, commit, and push the companion repo.
- Added local workflow rule: main repo should use `core.hooksPath=.githooks`; if automatic sync fails, Codex must run the sync command manually and report the failure.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `package.json`, `scripts/sync-agent-repo.mjs`, `.githooks/post-commit`, and the new private companion repo `agent-companion-repo`.
- Remaining ambiguity: none for initial setup; future sessions should decide the right level of detail for each interaction note.

### 2026-06-21 — Milestone 3 startup gesture changed to hand-only and implemented

- Changed requirement: startup gesture now uses only both hands closing anywhere in the visible camera frame, then pulling apart; it must not depend on chest anchor, shoulders, or body pose.
- Changed task status: Milestone 2 marked `DONE`; Milestone 3 marked `NEEDS_MANUAL_VERIFY`.
- Implemented `HandsClosed` and hand-only `PullArmed` detection using smoothed hand centers, midpoint, direction vector, distance, distance velocity, and short lost-hand hold.
- Added debug values for left/right hand x/y, midpoint, direction, hand distance velocity, both-hands-visible, and lost-hand hold.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, `ar_solar_system_prd.md`, `index.html`, `src/main.ts`, `src/utils/types.ts`, `src/interaction/stateMachine.ts`, `src/interaction/handStartupGesture.ts`, `src/tracking/smoothing.ts`, and `src/rendering/debugOverlay.ts`.
- Remaining ambiguity: needs manual camera verification for closed-to-pull gestures near the chest, above the head, and at the side of the body; threshold tuning may be needed after real testing.

### 2026-06-21 — Milestone 2 MediaPipe tracking foundation implemented

- Changed task status: Milestone 1 marked `DONE` after user acceptance; Milestone 2 marked `NEEDS_MANUAL_VERIFY`.
- Added `@mediapipe/tasks-vision@0.10.35` with MediaPipe Pose Landmarker and Hand Landmarker loading through a dedicated `tracking/` module.
- Implemented smoothed shoulder landmarks, left/right hand summaries, hand center, wrist, thumb tip, index finger tip, palm scale, normalized coordinates, debug detection state, and debug-only landmark overlay.
- Affected files: `package.json`, `package-lock.json`, `index.html`, `src/main.ts`, `src/styles.css`, `src/utils/types.ts`, `src/tracking/`, `src/rendering/debugOverlay.ts`, `src/rendering/landmarkOverlay.ts`, `TODO.md`, and `TODO.zh-CN.md`.
- Remaining ambiguity: real webcam pose/hand detection, handedness labels, and landmark overlay alignment still need manual in-browser verification with camera access and external MediaPipe model/CDN access.

### 2026-06-21 — Chinese TODO reading mirror added

- Changed requirement: keep `TODO.zh-CN.md` synchronized with `TODO.md` as a Chinese reading mirror for the user only; Codex and future agents must keep using English `TODO.md` as the canonical task board.
- Added the mirror rule to the documentation sync protocol and Definition of Done.
- Affected files: `AGENTS.md`, `TODO.md`, and `TODO.zh-CN.md`.
- Remaining ambiguity: none.

### 2026-06-21 — Camera preview aspect ratio and debug metrics fixed

- Changed requirement: the camera preview must preserve the complete 16:9 feed using a 16:9 preview stage and `object-fit: contain`; it must not use `cover` cropping or force the feed into a near-square viewport.
- Implemented matching video, transparent Three.js canvas, and preview overlay dimensions so future gesture coordinates share the same displayed image basis.
- Added temporary debug metrics for video source size, display size, display ratio, `object-fit`, canvas display size, canvas buffer size, and overlay size.
- Affected files: `index.html`, `src/styles.css`, `src/main.ts`, `src/rendering/scene.ts`, `src/rendering/debugOverlay.ts`, `src/utils/types.ts`, `ar_solar_system_prd.md`, `AGENTS.md`, `README.md`, and `TODO.md`.
- Remaining ambiguity: real camera framing still needs manual in-browser verification with Chrome camera permission enabled.

### 2026-06-21 — Milestone 0 complete and Milestone 1 ready for manual camera verification

- Changed task status: Milestone 0 marked `DONE`; Milestone 1 marked `NEEDS_MANUAL_VERIFY`.
- Added Vite + TypeScript + Three.js Web Demo structure, local scripts, and README run/manual-test notes.
- Implemented webcam permission flow, mirrored video preview layer, transparent empty Three.js canvas, and hidden-by-default debug panel.
- Upgraded Vite to `8.0.16` after npm audit reported dev-server dependency vulnerabilities; `npm audit` now reports 0 vulnerabilities.
- Affected files: `package.json`, `package-lock.json`, `index.html`, `README.md`, `tsconfig.json`, `vite.config.ts`, `src/`, and `TODO.md`.
- Remaining ambiguity: real webcam permission, video framing, and browser console behavior still need manual in-browser verification on a machine with camera access.

### 2026-06-21 — Initial Codex working docs created

- Baseline PRD: v0.2 dated 2026-06-20.
- Created `AGENTS.md` as durable Codex guidance.
- Created `TODO.md` as milestone task board.
- Locked Web Demo as first delivery target.
- Added documentation sync rule: when requirements are refined and considered aligned, Codex must update `ar_solar_system_prd.md`, `TODO.md`, and/or `AGENTS.md` as applicable before claiming completion.
