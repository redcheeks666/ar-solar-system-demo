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
- [ ] Opening progress is driven by hand distance and should not auto-complete if hands stop.
- [ ] Opening endpoints visually follow both hands.
- [ ] Opened solar system anchors near the chest, not the screen center.
- [ ] Two-hand scaling changes solar system size.
- [ ] Two-hand spatial rotation creates visible 3D tilt and depth, not only 2D rotation.
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

## Milestone 4 — Hand-Attached Pull-Open Solar System

Status: `TODO`

Goal: Implement the first high-impact moment: the user pulls the solar system open from the empty scene using both hands.

Tasks:

- [ ] Add `SolarOpening` and `SolarActive` states.
- [ ] Detect hands moving apart from the `PullArmed` state.
- [ ] Compute `openProgress` from hand distance.
- [ ] Clamp and smooth `openProgress`.
- [ ] Prevent auto-completion when hand distance stops increasing.
- [ ] Build initial solar system group with sun, simplified orbits, and bodies.
- [ ] Keep all solar-system 3D objects invisible until opening begins.
- [ ] During opening, bind visual left/right endpoints to left/right hands.
- [ ] Reveal sun, orbits, bodies, star dust, and nebula progressively based on `openProgress`.
- [ ] On completion, place the solar system around the chest anchor.
- [ ] Add debug values for `openProgress`, start distance, target distance, and state.

Acceptance criteria:

- [ ] Before valid pull-open gesture, no 3D solar content is visible.
- [ ] Pulling both hands apart after the hand-only `PullArmed` state starts the opening.
- [ ] Opening width/progress clearly follows hand distance.
- [ ] If the hands pause, opening holds rather than auto-playing to 100%.
- [ ] Opening endpoints visibly follow both hands.
- [ ] When complete, solar system floats near the chest anchor.
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
- [ ] Map hand distance to solar-system scale.
- [ ] Clamp scale to a practical range, initially around `0.6x` to `2.5x`.
- [ ] Smooth scale changes.
- [ ] Compute two-hand control vector in mapped 3D space.
- [ ] Implement quaternion or arcball-style rotation mapping.
- [ ] Apply slerp smoothing for rotation.
- [ ] Make orbit plane visibly tilt in 3D.
- [ ] Prevent fast flips or uncontrolled spin.
- [ ] Add debug values for scale and rotation state.

Acceptance criteria:

- [ ] Moving hands farther apart scales the solar system larger.
- [ ] Moving hands closer scales the solar system smaller.
- [ ] Twisting or changing relative hand posture tilts/rotates the solar system in 3D.
- [ ] Rotation is visibly not just a flat 2D screen-plane rotation.
- [ ] Chest anchoring remains active while manipulating the solar system.
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
- [ ] Tune smoothing for chest anchor, hands, scale, rotation, pinch, and throw.
- [ ] Tune trigger thresholds for common laptop webcam framing.
- [ ] Reduce particle count or post-processing if FPS is unstable.
- [ ] Add presentation/recording mode that hides debug UI.
- [ ] Add fallback guidance for poor lighting, missing pose, or missing hands.
- [ ] Test the full 30-60 second flow.

Acceptance criteria:

- [ ] A viewer can understand the solar system is pulled from between the hands.
- [ ] A viewer can understand the solar system floats near the user's chest.
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
- [ ] Create named constants for gesture thresholds.
- [ ] Create a debug state store so debug UI does not depend directly on internal classes.
- [ ] Keep frame loop performance stable and avoid unnecessary per-frame allocations.
- [ ] Add camera permission error UI.
- [ ] Add manual test checklist in README.
- [ ] Add screenshot or short GIF instructions after MVP works.
- [x] Create private companion repository `<private-companion-repo>` for Codex interaction logs, TODO update notes, and agent workflow context.
- [x] Add `npm run sync:agent:push` and a versioned `post-commit` hook so each main-repo commit syncs the companion repo.

## Manual Test Script

Use this script for human verification after each milestone that involves camera or hand tracking.

1. Open the Web Demo in a browser.
2. Click `开启摄像头`.
3. Confirm only the webcam feed and minimal 2D UI are visible.
4. Stand centered in the camera frame.
5. Bring both hands/fists together anywhere in the visible camera frame.
6. Pull hands apart and observe whether the startup state changes from `HandsClosed` to `PullArmed` and, in later milestones, whether the solar system opens between hands.
7. Pause hands halfway and confirm opening does not auto-complete.
8. Complete opening and confirm the solar system floats near the chest.
9. Move torso slightly left/right and confirm the solar system follows smoothly.
10. Move hands farther/closer and confirm scale changes.
11. Twist hands and confirm 3D rotation is visible.
12. Hover over each grabbable body and confirm label/glow.
13. Pinch-grab a body and confirm it attaches to the hand and freezes.
14. Release normally and confirm it stays detached and self-rotates.
15. Grab again and throw-release; confirm it returns to orbit.
16. Repeat with Moon and Saturn.
17. Run recording mode and confirm debug UI is hidden.

## Open Questions to Resolve During Implementation

These should not block early milestones, but Codex should record decisions when resolved.

- [x] Exact package choice and loading strategy for MediaPipe Tasks Vision. Decision: use `@mediapipe/tasks-vision@0.10.35`, load wasm from the matching jsDelivr package path, and load the official Google-hosted lite pose and float16 hand `.task` models for the MVP.
- [x] Whether to use plain TypeScript modules or add React. Decision: use plain TypeScript modules for the initial Web Demo.
- [ ] Exact mapping from MediaPipe landmark coordinates to Three.js scene coordinates.
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
