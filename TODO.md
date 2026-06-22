# TODO.md

Project: AR Solar System Webcam Gesture Demo  
Current planning baseline: PRD v0.3, 2026-06-21  
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
- [ ] Re-gripping the left and right endpoints lets the user continue whole-system control.
- [ ] Two-hand scaling changes solar system size, including palm-forward side-to-side "sliding glass" movement.
- [ ] Moving gripped hands inward from the opened state collapses the solar system in reverse and returns to the empty camera view when fully closed.
- [ ] Two-hand spatial rotation creates visible 3D tilt and depth, not only 2D rotation, including palms-up gentle rotation.
- [ ] Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon are grabbable in MVP.
- [ ] Pinch grab attaches the selected body to the hand and freezes autonomous motion.
- [ ] Normal release leaves the body detached, floating at the release position, and self-rotating.
- [ ] Throw release returns the body to its original orbit.
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

Goal: Lock and debug the whole-system interaction semantics before adding visible solar-system 3D content. This milestone defines a protocol layer between MediaPipe landmarks and the future solar-system controller, exposing debug-only intent signals for release, re-grip, scale, reverse collapse, and rotation without rendering the sun, planets, orbit rings, nebula, particles, singularity, or any 3D model.

Tasks:

- [x] Define a protocol layer: `MediaPipe landmarks -> HandFrame -> WholeSystemIntent -> future SolarSystemController`.
- [x] Define whole-system lifecycle states: `Inactive`, `VirtualOpeningHandle`, `SolarHandleControl`, `ReleaseCandidate`, `SolarFreeHover`, `ReGripCandidate`, and `SolarClosing`.
- [x] Define release detection primarily from both hands opening fully: high open-hand score, enough extended fingers, and low grip-pose score.
- [x] Latch an accepted open-hand release immediately: freeze endpoints, block re-grip while hands withdraw, and only allow re-grip after both hands clearly leave and then return to the frozen endpoints.
- [x] Require stable open-hand release evidence before entering `ReleaseCandidate`; single-frame release spikes must not detach control.
- [x] Prioritize hold/rotate intent over release when palms-up cupped hands remain near the endpoints.
- [x] Use a wider re-grip magnetic zone around frozen endpoints before snapping virtual endpoints back to the current hands.
- [x] Keep endpoint mismatch, complete hand loss, or low whole-control confidence as fallback release signals.
- [x] Define re-grip detection using both hands near the frozen visual left/right endpoints without requiring a planet pinch.
- [x] Define scale intent from hand-distance velocity and boost it when both palms appear camera-facing.
- [x] Define reverse-collapse intent when gripped hands move inward and hand distance approaches the close threshold.
- [x] Define palms-up gentle rotation and palm-normal motion as 3D rotation intent signals, and expose 2D-vs-3D rotation intent in debug.
- [x] Define palm orientation primitives from MediaPipe hand landmarks: wrist, index MCP, middle MCP, pinky MCP, palm normal, facing-camera score, and up score.
- [x] Keep palm orientation as an intent-confidence signal, not a hard gate.
- [x] Keep whole-system control separate from individual planet pinch-grab intent by adding an early pinch penalty to whole-control confidence.
- [x] Add debug-only visual-left/visual-right virtual endpoints and endpoint match state; these are 2D debug markers only, not 3D solar content.
- [x] Add debug fields for whole-control state, control/release/re-grip confidence, scale/rotation/collapse intent, palm normals, palm scores, open-hand/grip-pose scores, release gesture lock, release stable time, release-block reason, grip-hold state, re-grip reason, and virtual endpoints.
- [x] Add a concise Chinese interaction status summary beside the Debug button, showing the current interpreted intent, reason, and key parameters.
- [x] Keep the AR scene visually empty while this contract is being validated.

Acceptance Criteria:

- [x] The documented state model distinguishes `SolarOpening`, `SolarFreeHover`, `SolarHandleControl`, and `SolarClosing`.
- [x] Release means the future solar system will remain at the last stable position, scale, and orientation instead of snapping to chest anchor or screen center.
- [x] Accepted open-hand release freezes the endpoints and prevents immediate re-grip while the user slowly pulls hands away.
- [x] Palms-up cupped rotation keeps `SolarHandleControl` instead of being mistaken for release.
- [x] Re-grip can recover through a forgiving magnetic zone without requiring the user to precisely realign body/camera position.
- [x] Re-grip means returning both hands near visual left/right endpoints can resume whole-system control without pinch.
- [x] Palm-forward side-to-side movement is specified and debugged as a scale-intent confidence boost.
- [x] Moving gripped hands inward from the opened state is specified and debugged as reverse collapse, not just ordinary scale-down.
- [x] Reverse collapse returns to the initial empty camera view when fully closed.
- [x] Palms-up gentle rotation and palm-normal motion are specified and debugged as 3D rotation intent.
- [x] Debug panel exposes whole-system protocol values without rendering solar-system 3D content.
- [x] The top-right Chinese status summary explains whether the system currently thinks the user is waiting, holding, rotating, releasing, free-hovering, re-gripping, scaling, or closing, with the core parameters behind that decision.
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
- Separate whole-system control from individual planet pinch-grab.
- Palm orientation should boost confidence, not act as a hard gate.
- Virtual endpoints may be shown only as debug-only 2D markers.

Done when:
- Release/re-grip/scale/reverse-collapse/rotation intent values are visible in the debug panel.
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

## Milestone 4 — Hand-Attached Pull-Open Solar System

Status: `TODO`

Goal: Implement the first high-impact moment: the user pulls the solar system open from the empty scene using both hands.

Tasks:

- [ ] Add `SolarOpening` and `SolarActive` states.
- [ ] Detect hands moving apart from the `PullArmed` state.
- [ ] Compute `openProgress` from hand distance.
- [ ] Clamp and smooth `openProgress`.
- [ ] Prevent auto-completion when hand distance stops increasing.
- [ ] Support reverse progress when opened endpoint hands move inward.
- [ ] Build initial solar system group with sun, simplified orbits, and bodies.
- [ ] Keep all solar-system 3D objects invisible until opening begins.
- [ ] Keep `HandsClosed` visually static with no solar-system animation or 3D content.
- [ ] During opening, bind visual left/right endpoints to left/right hands.
- [ ] Reveal sun, orbits, bodies, star dust, and nebula progressively based on `openProgress`.
- [ ] On completion, place the solar system between the opened hands, optionally biased by body-relative context for AR feel.
- [ ] When reverse collapse reaches the closed threshold, hide all solar-system content and return to `EmptyIdle`.
- [ ] On whole-system release, hold the last stable solar-system transform instead of recentering.
- [ ] Add debug values for `openProgress`, start distance, target distance, and state.

Acceptance criteria:

- [ ] Before valid pull-open gesture, no 3D solar content is visible.
- [ ] Pulling both hands apart after the hand-only `PullArmed` state starts the opening.
- [ ] Opening width/progress clearly follows hand distance.
- [ ] If the hands pause, opening holds rather than auto-playing to 100%.
- [ ] Opening endpoints visibly follow both hands.
- [ ] When complete, solar system appears at the hand-opened position rather than being forced to the chest or screen center.
- [ ] Releasing both hands leaves the solar system hovering where it was released.
- [ ] Moving both endpoint hands inward collapses the solar system in reverse.
- [ ] When the collapse completes, the scene returns to camera video plus 2D UI only.
- [ ] Failed trigger does not cause flicker or partial random solar objects.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

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
- Do not implement grab logic yet.

Done when:
- EmptyIdle -> HandsClosed -> PullArmed -> SolarOpening -> SolarActive works.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 5 — Solar System Scaling and Spatial Rotation

Status: `TODO`

Goal: Let both hands control the opened solar system's scale and 3D orientation.

Tasks:

- [ ] Compute baseline hand distance at `SolarActive` entry.
- [ ] Detect whole-system re-grip when both hands return near the left/right endpoints.
- [ ] Map hand distance to solar-system scale.
- [ ] Distinguish ordinary scale-down from intentional reverse collapse near the closed threshold.
- [ ] Treat palm-forward side-to-side hand movement as scale intent.
- [ ] Clamp scale to a practical range, initially around `0.6x` to `2.5x`.
- [ ] Smooth scale changes.
- [ ] Compute two-hand control vector in mapped 3D space.
- [ ] Estimate palm orientation or equivalent hand pose for palm-forward and palms-up intent.
- [ ] Implement quaternion or arcball-style rotation mapping.
- [ ] Treat palms-up gentle rotation as whole-system 3D rotation intent.
- [ ] Apply slerp smoothing for rotation.
- [ ] Make orbit plane visibly tilt in 3D.
- [ ] Prevent fast flips or uncontrolled spin.
- [ ] Add debug values for scale and rotation state.

Acceptance criteria:

- [ ] Moving hands farther apart scales the solar system larger.
- [ ] Moving hands closer scales the solar system smaller.
- [ ] Palm-forward side-to-side movement scales the solar system like sliding glass panels.
- [ ] Moving gripped hands close enough together can transition into reverse collapse and return to empty scene.
- [ ] Twisting or changing relative hand posture tilts/rotates the solar system in 3D.
- [ ] Palms-up gentle rotation rotates the solar system in 3D.
- [ ] Rotation is visibly not just a flat 2D screen-plane rotation.
- [ ] Body-relative placement may inform initial AR feel, but manipulation and free-hover are driven by the released/controlled transform.
- [ ] Releasing the whole-system handle leaves the current transform stable.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 5: two-hand scaling and 3D spatial rotation of the active solar system.

Context:
Read @ar_solar_system_prd.md sections 5.4, 7.5, 7.6, 12.3, and 12.4.

Constraints:
- Use quaternion, arcball, or equivalent 3D rotation logic.
- Do not fake rotation with only screen-plane 2D rotation.
- Keep rotation and scale smoothed.
- Do not add planet grab logic yet.

Done when:
- Scaling and 3D rotation can be inspected in browser.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 6 — Celestial Body Data Model and Nine Grabbable Targets

Status: `TODO`

Goal: Create a unified data-driven model for all MVP grabbable celestial bodies.

Tasks:

- [ ] Define `CelestialBodyId` for Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
- [ ] Define body metadata: name, label, approximate visual size, orbit radius, orbit speed, self-rotation speed, color/texture placeholder, hit radius, parent body if any.
- [ ] Implement simplified visual models for each body.
- [ ] Add recognizable Saturn ring.
- [ ] Make Moon orbit Earth by default.
- [ ] Keep all bodies in a registry used by rendering, hover, grab, detach, and return logic.
- [ ] Add labels that can be shown during hover/grab.
- [ ] Add original orbit transform data for return behavior.
- [ ] Ensure no duplicated one-off grab logic per planet.

Acceptance criteria:

- [ ] All nine MVP bodies are represented in one data model.
- [ ] Bodies render on simplified orbits after solar opening.
- [ ] Moon is visually distinguishable from Earth.
- [ ] Saturn has a clear ring.
- [ ] Original orbit position/layer data is available for return-to-orbit logic.
- [ ] `npm run build` passes.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 6: data-driven celestial body model for nine MVP grabbable bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 8.2, and 17.

Constraints:
- Use one shared celestial body model and registry.
- Include Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
- Keep visuals lightweight and MVP-friendly.
- Do not implement full grab interaction yet unless needed for data hooks.

Done when:
- All nine bodies render after opening.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 7 — Hover, Highlight, and Pinch Grab

Status: `TODO`

Goal: Let the user's hand select and grab any of the nine MVP bodies.

Tasks:

- [ ] Project each grabbable body's 3D position to screen coordinates.
- [ ] Compute hand-to-body screen-space distance.
- [ ] Add expanded hit areas for Mercury and Moon.
- [ ] Select nearest valid body with hysteresis to avoid flickering.
- [ ] Add hover visual feedback: glow ring, label, and orbit highlight.
- [ ] Detect pinch start and pinch end using thumb/index distance and hand scale.
- [ ] Use different pinch start and end thresholds.
- [ ] Implement `BodyHover` and `BodyGrabbed` transitions.
- [ ] Animate grabbed body from orbit to hand anchor.
- [ ] Bind grabbed body position to hand anchor.
- [ ] Stop grabbed body's autonomous orbit and self-rotation.
- [ ] Add short tracking-loss tolerance while grabbed.

Acceptance criteria:

- [ ] Hand near a body highlights it clearly.
- [ ] Highlight does not flicker rapidly between nearby bodies.
- [ ] Pinch near a highlighted body grabs it.
- [ ] Grabbed body attaches to and follows the hand.
- [ ] Grabbed body stops orbiting and self-rotating while held.
- [ ] Each of the nine bodies can be highlighted and grabbed.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 7: hover, highlight, and pinch grab for all nine MVP bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 7.8, 7.9, and 12.4.

Constraints:
- Use one unified hover/grab pipeline.
- Only one body can be grabbed at a time.
- Use pinch hysteresis.
- Do not make normal release return to orbit.

Done when:
- All nine bodies can be hovered and grabbed.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 8 — Single-Body Inspection, Release, and Detached Hover

Status: `TODO`

Goal: Support the product rule that grabbed bodies are for inspection, and normal release leaves them floating rather than returning them.

Tasks:

- [ ] Add `BodyDetached` state.
- [ ] On normal pinch release, keep the body at its current scene position.
- [ ] Resume natural self-rotation after release.
- [ ] Keep the body out of its original orbit while detached.
- [ ] Leave a weak placeholder marker or ghost at the original orbit location.
- [ ] Allow the detached body to be grabbed again.
- [ ] Add independent scaling for grabbed/detached inspection using the second hand.
- [ ] Add independent 3D rotation for grabbed body using two-hand relative motion.
- [ ] Ensure single-body scale/rotation does not affect the whole solar system.
- [ ] Show clear state feedback: grabbed, released/detached, inspectable.

Acceptance criteria:

- [ ] While held, the grabbed body is stable and frozen.
- [ ] Normal release does not return the body to orbit.
- [ ] Released body remains near release position and self-rotates.
- [ ] User can grab the detached body again.
- [ ] User can scale and spatially rotate the body independently.
- [ ] Other solar-system bodies keep their normal motion.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 8: grabbed-body inspection, normal release to detached state, and independent body scale/rotation.

Context:
Read @ar_solar_system_prd.md sections 5.5, 7.10, and 7.11.

Constraints:
- Normal release must not return to orbit.
- Detached body remains inspectable and can be grabbed again.
- Independent body manipulation must not affect solar-system scale or rotation.
- Update docs if any interaction mapping changes.

Done when:
- Grab -> inspect -> normal release -> detached hover works.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 9 — Throw Gesture and Return to Orbit

Status: `TODO`

Goal: Implement explicit throw-to-return behavior so detached bodies can be sent back to orbit.

Tasks:

- [ ] Track recent hand velocity while holding a body.
- [ ] Define throw velocity threshold based on normalized screen/scene units.
- [ ] Detect throw intent only when high velocity occurs shortly before pinch release.
- [ ] Optionally bias throw confidence when hand movement direction points toward original orbit.
- [ ] Add `BodyReturning` state.
- [ ] Animate returning body back to original orbit position.
- [ ] Add visible tail, streak, or light feedback during return.
- [ ] Restore original body scale and parent relationship on return.
- [ ] Resume original orbit and self-rotation after return.
- [ ] Ensure low-velocity release remains detached.
- [ ] Add debug values for throw velocity and throw confidence.

Acceptance criteria:

- [ ] Normal release does not return body to orbit.
- [ ] Clear throw release does return body to orbit.
- [ ] Return animation is visible and smooth.
- [ ] Body resumes original orbit after return.
- [ ] Moon can return to Earth/Moon relationship correctly.
- [ ] False positives are low enough for a 30-60 second demo.
- [ ] `npm run build` passes.
- [ ] Behavior is manually tested or marked `NEEDS_MANUAL_VERIFY`.

Suggested Codex prompt:

```text
Goal:
Implement Milestone 9: throw gesture and return-to-orbit behavior.

Context:
Read @ar_solar_system_prd.md sections 7.11, 7.12, and 13.

Constraints:
- Normal release must remain detached.
- Throw return requires clear velocity near release.
- Returning body should restore original scale, orbit layer, and motion.
- Update docs if thresholds or behavior are changed.

Done when:
- Detached body can be thrown back to orbit.
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
- [ ] Grab, release, detached hover, and return are visually obvious.
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
- [x] Centralize the normalized→stage/world coordinate mapping in `src/interaction/coordinateMapping.ts` (M4 prerequisite); `src/rendering/scene.ts` exposes `getInteractionViewport()`.
- [x] Unify visual-left/right hand assignment in `src/interaction/handPairing.ts` so startup, hand primitives, and whole-system agree.
- [x] Consolidate shared vector/scalar math in `src/utils/math.ts`.
- [x] Disable the unused `PoseLandmarker` by default (`ENABLE_POSE_TRACKING`) and remove per-point `getBoundingClientRect` thrash in the landmark overlay to free CPU for hand tracking.
- [ ] Create a debug state store so debug UI does not depend directly on internal classes.
- [ ] Keep frame loop performance stable and avoid unnecessary per-frame allocations.
- [ ] Add camera permission error UI.
- [ ] Add manual test checklist in README.
- [ ] Add screenshot or short GIF instructions after MVP works.
- [x] Create private companion repository `<private-companion-repo>` for Codex interaction logs, TODO update notes, and agent workflow context.
- [x] Add `npm run sync:agent:push` and a versioned `post-commit` hook so each main-repo commit syncs the companion repo.

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
9. Move torso slightly left/right and confirm the solar system follows smoothly.
10. Move hands farther/closer and confirm scale changes.
11. Twist hands and confirm 3D rotation is visible.
12. Hover over each grabbable body and confirm label/glow.
13. Pinch-grab a body and confirm it attaches to the hand and freezes.
14. Release normally and confirm it stays detached and self-rotates.
15. Grab again and throw-release; confirm it returns to orbit.
16. Repeat with Moon and Saturn.
17. Run recording mode and confirm debug UI is hidden.

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

| Item | User action | Where to look | Pass condition |
|---|---|---|---|
| M3.5 empty scene | Open the page, click `开启摄像头`, turn on `Debug`, and keep hands out of view. | Camera preview, debug panel, and debug overlay. | Camera preview shows no 3D sun, planets, orbits, nebula, particles, singularity, or model. `Whole control` reads `Inactive`. |
| Top-right status summary | Keep `Debug` either open or closed and perform any M3.5 action. | The small Chinese status panel to the left of the `Debug` button. | It shows a human-readable title, state, reason, and core parameters. The title should match the current action intent, such as waiting, holding, rotating, releasing, free-hovering, re-gripping, scaling, or closing. |
| Protocol arms after pull | Close both hands anywhere visible, then pull them apart until `Startup state` reaches `PullArmed`. | Debug panel `Whole control`, `Control confidence`, and 2D endpoint circles. | `Whole control` changes from `Inactive` to `VirtualOpeningHandle` and then `SolarHandleControl`. Two small 2D debug endpoint circles appear near the hands only when `Debug` is on. |
| Palm orientation values | Hold both hands visible and slowly rotate each palm toward the camera, sideways, and upward. | Debug panel `Visual L palm normal`, `Visual R palm normal`, `Visual L palm facing/up`, and `Visual R palm facing/up`. | Palm normal values update continuously. Facing/up scores stay in the `0.00-1.00` range and visibly change when palm orientation changes. |
| Bent-hand hold | While `Whole control` is `SolarHandleControl`, keep both hands slightly curved as if holding two handles. | Debug panel `Visual L open/grip`, `Visual R open/grip`, `Grip hold`, `Release stable`, `Release gesture`, and `Whole control`. | `Grip hold` reads `yes`, `Release stable` stays near `0ms`, `Release gesture` stays `no`, and `Whole control` stays in `SolarHandleControl`. The virtual endpoints continue to follow the hands. |
| Palms-up cupped rotation hold | While `Whole control` is `SolarHandleControl`, turn both palms upward with slightly curved fingers as if holding a tray, then gently rotate/twist the two-hand handle. | Debug panel `Rotation intent`, `Release blocked`, `Grip hold`, `Release stable`, `Release gesture`, and `Whole control`. | `Rotation intent` can become `rotate2d` or `rotate3d`; `Release blocked` should read `rotationHold` or `cuppedGrip` during the hold, `Grip hold` should read `yes`, `Release stable` should not climb to the release threshold, and `Whole control` should remain `SolarHandleControl`. |
| Open-hand release | While `Whole control` is `SolarHandleControl`, fully open both hands with fingers clearly extended and stop rotating. After `Release stable` climbs past about `280ms` and `Release gesture` reads `yes / lock on`, slowly pull the hands back or relax them. | Debug panel `Visual L open/grip`, `Visual R open/grip`, `Release stable`, `Release blocked`, `Release gesture`, `Whole control`, and the 2D endpoint circles. | Open scores rise, grip scores fall, `Release blocked` reads `none`, `Release stable` climbs past about `280ms`, `Release gesture` becomes `yes / lock on`, `Whole control` changes to `ReleaseCandidate`, then becomes `SolarFreeHover`. The endpoint circles freeze even if the fingers relax during slow withdrawal, and `Whole control` must not jump back to `SolarHandleControl` until both hands first leave the frozen endpoints and then intentionally return. |
| Scale-up intent | While `Whole control` is `SolarHandleControl`, move both hands farther apart. | Debug panel `Scale intent`, `Hand distance`, and `Distance velocity`. | `Scale intent` becomes `scaleUp` during the outward movement, and `Hand distance` increases. No 3D solar content appears. |
| Scale-down intent | While `Whole control` is `SolarHandleControl`, move both hands closer together, but not fully closed. | Debug panel `Scale intent`, `Hand distance`, and `Collapse intent`. | `Scale intent` becomes `scaleDown`; `Hand distance` decreases. `Collapse intent` may rise but should not need to complete unless the hands get very close. |
| Reverse-collapse intent | From `SolarHandleControl`, keep moving both hands inward until they are close together. | Debug panel `Whole control` and `Collapse intent`. | `Collapse intent` rises toward `1.00`; `Whole control` can enter `SolarClosing` and then reset toward `Inactive` when fully closed. No 3D content appears. |
| Fallback release | Reach `SolarHandleControl`, then move both hands out of frame or hide them for a few seconds. | Debug panel `Whole control`, `Release confidence`, and endpoint circles. | `Whole control` changes to `ReleaseCandidate`, then `SolarFreeHover`. The virtual endpoint circles remain frozen at the last stable positions. |
| Re-grip frozen endpoints | After `SolarFreeHover`, first move both hands clearly away from the frozen endpoint circles, then bring both hands back near those two circles. You should not need to perfectly realign your body or camera distance. | Debug panel `Release gesture`, `Whole control`, `Re-grip confidence`, `Re-grip reason`, and `Visual endpoint matched`. | After the hands leave the endpoints, `Release gesture` changes to `no / lock off`. When the hands return near the circles, `Re-grip reason` should become `endpoint` or `wideMagnet`, `Re-grip confidence` rises, and `Whole control` changes through `ReGripCandidate` back to `SolarHandleControl`. |
| Rotation intent | While `SolarHandleControl`, hold palms generally upward or tilted away from camera and gently rotate/twist the two-hand handle. | Debug panel `Rotation intent`, `Rotation intent score`, palm facing/up scores, and palm normals. | `Rotation intent` changes from `none` to `rotate2d` or `rotate3d`; with a spatial palm posture or clear palm-normal change, `rotate3d` should appear. |
| Whole vs pinch separation | While `SolarHandleControl`, pinch with one hand as if grabbing a future planet. | Debug panel `Control confidence`. | `Control confidence` should drop rather than treating a strong pinch as better whole-system control. No planet is grabbed in this milestone. |

## Open Questions to Resolve During Implementation

These should not block early milestones, but Codex should record decisions when resolved.

- [x] Exact package choice and loading strategy for MediaPipe Tasks Vision. Decision: use `@mediapipe/tasks-vision@0.10.35`, load wasm from the matching jsDelivr package path, and load the official Google-hosted lite pose and float16 hand `.task` models for the MVP.
- [x] Whether to use plain TypeScript modules or add React. Decision: use plain TypeScript modules for the initial Web Demo.
- [x] Exact mapping from MediaPipe landmark coordinates to Three.js scene coordinates. Decision: centralized in `src/interaction/coordinateMapping.ts` (object-fit: contain + mirror aware), with camera params from `scene.getInteractionViewport()`. The debug overlay already maps through it; M4 3D content must use the same module. Final world-plane depth still subject to M4 tuning.
- [ ] Final pinch threshold values after real webcam testing.
- [ ] Final throw velocity threshold after real webcam testing.
- [ ] Whether detached bodies should stay in front of the solar system plane or preserve release depth.
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

- Requirement clarification: before adding solar-system 3D content, the project should lock the whole-system interaction contract for no-animation closed hands, hand-attached opening, release-to-free-hover, re-grip by endpoints, palm-forward scaling, and palms-up 3D rotation.
- Added Milestone 3.5 as a pre-3D design/debug gate before Milestone 4.
- Updated Milestones 4 and 5 so opening, release, re-grip, scale, and rotation semantics match the new long-term interaction model.
- Affected files: `AGENTS.md`, `TODO.md`, `TODO.zh-CN.md`, and `ar_solar_system_prd.md`.
- Remaining ambiguity: exact palm-orientation thresholds and endpoint hit zones still need debug-only calibration before 3D content is attached.

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
