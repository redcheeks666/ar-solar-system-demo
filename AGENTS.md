# AGENTS.md

## Project Identity

This repository is for a browser-based webcam AR gesture interaction demo called **AR Solar System**.

The MVP experience is:

1. The user opens a Web Demo and grants webcam permission.
2. The camera feed shows the user as a complete, uncropped AR preview background.
3. The initial interaction scene is empty: no 3D sun, planet, orbit, nebula, singularity, or decorative 3D object is visible.
4. The user brings both hands or fists together anywhere in the visible camera frame.
5. The user pulls both hands apart.
6. A 3D solar system is pulled open between the hands, with the opening endpoints visually attached to both hands.
7. After opening, the solar system may initially use a body-relative reference for AR feel, but after release it can free-hover at any user-chosen position instead of being constrained to the chest anchor or screen center.
8. The user can re-grip the solar-system left/right endpoints to control the whole-system handle lifecycle, including placement, release, and reverse collapse.
9. After the solar system is released into free hover, one-hand spread/contract, fist-hold reset, and push gestures no longer zoom, shrink, reset, or pan the solar-system view; the released solar system waits for endpoint re-grip or reverse collapse.
10. The user can hover and pinch-activate Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
11. A pinch-activated body stops its original orbit but keeps natural self-rotation; after activation, two closeDown events from the same activating hand's thumb/index pair enter a single-planet focus view.
12. In the single-planet focus view, the selected body remains self-rotating while it is heat-zone-followed, released to floating, and inspected; one-hand focus zoom, pan, and reset controls are retired. The background solar system is dimmed and interaction-locked while preserving basic motion.
13. In focus view, heat-zone follow is gated by an intro cooldown and heat-zone-clear rule: after DoubleClose enters the focus view, wait for the focused body to finish its centered intro, then require the hands to leave the focused body's heat zone before any follow dwell can begin.
14. One hand touching the focused body's heat zone for 1 second enters single-hand follow, while two hands touching the heat zone for 1 second enter two-hand follow; focused-body size is driven by the distance between the two hands (not by either hand's own pinch), and if one hand leaves the heat zone the staying hand keeps move-only control.
15. During single-hand follow, that hand's thumb-to-any-finger close-open `PinchTap` places the body down; during two-hand follow, either following hand can perform the same `PinchTap` to place it down and clear follow selection. After place-down, the controller must wait until all hands leave the focused body's heat zone before returning to the selectable idle/floating state. It remains floating in the planet focus view and does not return to orbit.
16. In the single-planet focus view, a transparent glass-style rectangular button appears at the top-left of the screen with a return icon and the label "长按返回太阳系"; placing the tracked index fingertip on that button and holding it there for a stable 1 second fills a progress bar, returns the focused body to its original orbit, then exits back to the solar-system view after a 0.5 second position/scale adjustment animation. Mouse/pointer clicking the DOM button is not the product interaction. The palm-facing open-hand return gesture is retired.

This is not a normal 3D solar system page. It is a **webcam AR interaction demo** where the 3D content appears to exist in the camera-visible space controlled by the user's hands.

## Source of Truth

Read these files before making product or architecture decisions:

1. `ar_solar_system_prd.md` — product requirements and interaction rules.
2. `TODO.md` — current milestone status, task breakdown, and implementation plan.
3. `AGENTS.md` — durable rules for Codex and future coding agents.

`TODO.zh-CN.md` is a Chinese reading mirror of `TODO.md` for the user. It is not a source of truth for Codex decisions. Agents must continue to use the English `TODO.md` as the task board and planning reference.

If the current uploaded PRD has a temporary filename, copy or rename it to `ar_solar_system_prd.md` in the repository root before development starts.

## Agent Companion Repository

This project has a private companion repository for Codex and agent-development memory:

- GitHub repo: `<private-companion-repo>`
- Local sibling path: `~/CodeXProject/agent-companion-repo`

Use the companion repo for agent-related records, including Codex/user requirement interactions, TODO update notes, workflow/tooling decisions, and generated snapshots of source-of-truth docs.

Do not move product source code into the companion repo. Do not store secrets, tokens, raw webcam captures, or unrelated personal data there.

Whenever the main code repo is committed, the companion repo must be updated in the same working session. The main repo provides:

```bash
npm run sync:agent:push
```

The local git config should use `.githooks/post-commit` through `core.hooksPath=.githooks`, so normal commits automatically refresh, commit, and push the companion repo. If automatic sync fails, run `npm run sync:agent:push` manually and mention the failure in the final response.

## Required Documentation Sync Protocol

When the user changes, clarifies, or fine-tunes requirements during a Codex session, Codex must keep the project documents aligned.

A requirement change is considered aligned when Codex has restated the new behavior and the user has accepted it explicitly or implicitly by asking Codex to implement it.

Before Codex claims the requirement is complete, it must do all applicable items below:

1. Update `ar_solar_system_prd.md` when the product behavior, interaction rule, acceptance criteria, non-goal, or milestone scope changes.
2. Update `TODO.md` when task status, milestone order, acceptance criteria, blockers, or implementation plan changes.
3. Update `TODO.zh-CN.md` whenever `TODO.md` changes, keeping it as a Chinese reading mirror only.
4. Update `AGENTS.md` when durable development rules, architecture constraints, documentation rules, or do-not rules change.
5. Update the private companion repo `agent-companion-repo` when the change affects requirements, TODO status, agent workflow, or tool usage context.
6. Add a short entry to the `TODO.md` change log with date, the change (a requirement change, or a durable engineering/refactor/convention change), affected files, and remaining ambiguity if any.
7. In the final response, include a `Documentation updated` section that lists which docs were changed.

Do not mark a task or milestone as `DONE` if the implementation changed product behavior but the relevant docs were not updated.

If code and docs disagree, the latest explicit user-approved requirement wins. Update the docs in the same change set so later sessions do not inherit stale assumptions.

## MVP Boundary

Start with a Web Demo.

Use the browser as the first delivery surface. Do not introduce Electron, Tauri, TouchDesigner, Unity, Unreal, Vision Pro, Quest, mobile support, backend services, authentication, databases, cloud accounts, or deployment infrastructure unless the user explicitly asks.

The first successful demo should prove this loop:

```text
camera on
→ initial empty AR scene
→ in `EmptyIdle`, hands together anywhere in the visible camera frame enter `HandsClosed`
→ hands pull apart from the `HandsClosed` baseline into `PullArmed`
→ solar system opens between both hands
→ solar system free-hovers at the released position
→ both hands can re-grip endpoints for handle control, release, and reverse collapse
→ one-hand spread/contract/fist/push no longer controls the free-hovered solar-system view
→ hover and pinch-activate a body
→ same activating hand thumb/index DoubleClose enters a single-planet focus view
→ inspect the self-rotating body with heat-zone dwell follow, release-to-floating, and return gestures
→ after the intro and heat-zone clear, one-hand 1s heat-zone dwell moves the body; two-hand 1s heat-zone dwell moves and scales it by hand distance
→ a following hand PinchTap leaves it floating in the focus view, then all hands must leave the heat zone before it becomes selectable again
→ tracked index fingertip held on the top-left glass return button for 1 second returns it to orbit and exits back to the solar-system view after the 0.5 second return adjustment animation
```

## Recommended Tech Stack

Use this default stack unless the user explicitly changes it:

- Vite for the local Web Demo.
- TypeScript for app code.
- Three.js for 3D rendering.
- MediaPipe Tasks Vision for pose and hand landmarks.
- Browser MediaDevices API for webcam input.
- RequestAnimationFrame for the main render loop.
- Three.js built-ins for projection, rotation, and transforms (`Raycaster` / `unproject`, `Quaternion` / `slerp`); see Coding Rules → "Reuse vs. Custom" for when self-written code is the right call instead.
- Lightweight CSS for UI and debug panels.

React is optional. Do not add React just because it is familiar. Add it only if it clearly improves structure or if the project already uses it.

GSAP or another animation library may be added only after the native Three.js interpolation approach becomes insufficient.

## Expected Repository Shape

Prefer this structure for the first Web Demo:

```text
/
  AGENTS.md
  TODO.md
  TODO.zh-CN.md
  ar_solar_system_prd.md
  package.json
  index.html
  src/
    main.ts
    styles.css
    camera/
      camera.ts
    tracking/
      mediapipe.ts
      poseTracker.ts
      handTracker.ts
      smoothing.ts
    interaction/
      stateMachine.ts
      gestures.ts
      handStartupGesture.ts
      handPrimitives.ts
      handPairing.ts
      handLandmarks.ts
      gestureInputFrame.ts
      freshFrameGate.ts
      gestureCalibration.ts
      gestureDebugRecorder.ts
      wholeSystemIntent.ts
      palmOrientation.ts
      handPose.ts
      intentScoring.ts
      intentTuning.ts
      bodyReference.ts
      coordinateMapping.ts
      solarOpeningController.ts
      planetActivationController.ts
      planetFocusController.ts
      planetReturnButton.ts
    solar/
      solarSystem.ts
      celestialBody.ts
      solarSystemData.ts
      proceduralMaterials.ts
      orbitController.ts
    rendering/
      scene.ts
      effects.ts
      labels.ts
      debugOverlay.ts
    utils/
      math.ts
      types.ts
```

Keep camera, tracking, interaction, solar-system simulation, and rendering logic separated. Avoid putting the whole app in one large file.

## Product Invariants

These rules must not be broken without explicit user approval and documentation updates.

### Initial Empty Scene

At startup and before the pull-open gesture:

- Show the webcam video.
- Allow minimal 2D instruction text.
- Allow debug landmarks only when debug mode is enabled.
- Do not show any 3D sun, planet, orbit, nebula, star dust, singularity, glowing portal, or decorative object.
- Code-placeholder solar-system visuals must default to hidden in the normal product path. A dev-only URL preview such as `?solarPreview=1` may show them for visual testing, but it must not change the normal startup empty scene or bypass the hand-only pull-open rule.

### Hand-Only Startup And Pull-Open Gesture

The solar system must not appear because of a timer or page load.

The startup gesture is hand-only and must not depend on chest anchor, shoulders, or body pose.

It must appear only after a valid two-hand closed-to-pull gesture:

- the current interaction state is `EmptyIdle` and the visible scene is still the empty camera view with no solar-system 3D content;
- both hands detected;
- hands initially close to each other anywhere in the visible camera frame;
- `PullArmed` can only be reached from `HandsClosed`; a generic two-hand pull-apart motion must not directly arm startup;
- if the hands overlap and one hand is briefly lost, the startup state may hold recent valid two-hand evidence for a short window;
- a single detected hand must not start the gesture unless both hands were recently detected close together;
- after leaving the empty startup chain, closed/pull hand motion belongs to the active scene state such as endpoint control, reverse collapse, or planet interaction, and must not re-enter `HandsClosed` or `PullArmed`;
- while the hands/fists remain closed, no solar-system animation or 3D content should play;
- hand distance increases over a short time window;
- the opening progress is driven by current hand distance;
- if the hands pause, the opening progress should pause or hold rather than auto-complete;
- the left and right opening endpoints should visually follow the left and right hands.

### Body-Relative Placement And Free Hover

The opened solar system should feel like it exists in front of the user, but it must not be permanently pinned to the chest.

- Left and right shoulders may be used as an optional body-relative reference for initial placement or AR feel.
- The chest/body reference must not be required for startup, release, re-grip, free-hover behavior, or reverse collapse.
- Because the body reference currently gates nothing, `PoseLandmarker` is disabled by default via `ENABLE_POSE_TRACKING` in `src/tracking/config.ts` to free CPU for hand tracking and gesture stability. Pose data must not be assumed present; the debug panel shows `Pose: missing` while disabled. Re-enable the flag (it then runs throttled at `POSE_DETECTION_INTERVAL_MS`) only when M4+ actually consumes body-relative placement.
- Do not leave the solar system fixed at the screen center after opening.
- When the user releases the whole-system two-hand handle, keep the solar system hovering at the last stable transform instead of snapping back to a chest/body reference or the screen center.
- A released solar system can hover at any visible in-frame position chosen by the user's hands.

### Whole-System Handle, Release, and Re-Grip

The opened solar system should behave like a manipulable object suspended in the air.

- During pull-open, the left and right visual endpoints should stay attached to the left and right hands.
- Once 3D solar content is visible, the whole-system control affordance should be two independent control endpoints on the solar-system left/right edges. Do not use a connected joystick/rod-style line as the primary control visual over the solar system.
- Releasing both hands from the endpoints should place the whole solar system in a free-hover state at the last stable position, scale, and orientation.
- Returning both hands near the left and right endpoints should re-grip the whole-system handle without requiring a planet pinch.
- After initial pull-open completes, arbitrary visible hands must not keep moving the solar system. Post-opening whole-system handle control requires both hands to stably hit the left/right control endpoints and enter `SolarHandleControl`.
- Do not add a hand-pose gate to post-opening endpoint re-grip until explicitly requested; for now endpoint proximity is the gate so control remains easy to reacquire.
- The primary whole-system release gesture is both hands opening fully, with fingers extended and grip-pose confidence low for a short confirmation window.
- Open-hand release must not win from a single frame; it needs a short stable confirmation window before `ReleaseCandidate`.
- Once an open-hand release is accepted, release should latch: endpoints freeze immediately, and re-grip is blocked until both hands have clearly moved away from the frozen endpoints. Fingers relaxing during withdrawal must not reattach the handle.
- Slightly curved hands should be treated as still holding the endpoints, not as a release.
- Palms-up cupped hands near the endpoints may remain useful as a legacy/debug signal for protecting against false release, but they are not the current user-facing whole-system rotation gesture.
- Whole-system intent priority is hold/handle-protection first, reverse collapse second, and open-hand release last.
- Complete hand loss, endpoint mismatch, or low whole-control confidence may remain fallback release signals, but they must not replace open-hand release as the primary user-facing gesture.
- Re-grip should use a forgiving magnetic zone around the frozen visual endpoints. For visible M4 solar content, those endpoints are the solar-system-owned 3D left/right control endpoints and re-grip requires stable endpoint hits before entering `SolarHandleControl`; the older 2D virtual endpoint snap-back behavior is protocol/debug-only until explicitly reconnected.
- Moving gripped hands inward from the opened state should collapse the solar system in reverse; when fully closed, the scene returns to the initial empty camera view.
- M5.5 one-hand solar inspection controls are retired: after `SolarFreeHover`, single-hand spread, contract, fist-hold reset, and push must not zoom, shrink, reset, or pan the solar-system view. Free-hover waits for endpoint re-grip or reverse collapse.
- Palm-forward side-to-side "sliding glass" scaling and palms-up whole-system 3D rotation are retired M5 semantics. Keep related protocol/debug fields only when useful for diagnostics; do not implement them as active product controls unless the user explicitly reopens that requirement.
- Whole-system handle gestures must remain separate from pinch-activating individual planets.

### Pre-3D Whole-System Interaction Protocol

Before visible solar-system 3D content is attached, whole-system interaction must pass through an explicit protocol layer rather than mapping MediaPipe landmarks directly to Three.js objects.

The protocol layer should follow this shape:

```text
MediaPipe landmarks
→ HandPrimitives
→ SessionCalibration
→ WholeSystemIntent
→ future SolarSystemController
```

Protocol output should include:

- Hand primitive values such as hand axis angle, midpoint, distance, distance velocity, palm scale, close intent score, pull intent score, and tracking confidence.
- Session-adaptive thresholds for close distance, pull delta, endpoint radii, re-grip magnet radius, and reverse-collapse distance. These should be in-memory by default and not persistent unless the user explicitly asks.
- Whole-system control state.
- Control confidence.
- Release confidence.
- Re-grip confidence.
- Endpoint hit score and tracking confidence.
- Legacy scale diagnostic and score.
- Legacy rotation diagnostic and score.
- Reverse-collapse intent score.
- Palm normal and palm orientation scores.
- Open-hand and grip-pose scores.
- Release gesture state and accepted-release lock state.
- Release stable time, release-block reason, grip-hold state, and re-grip reason.
- Virtual visual-left/visual-right endpoints and endpoint match state.
- Structured transition reasons for startup and whole-system state decisions.

Palm orientation is a legacy/debug intent-confidence signal only. Do not make palm-forward or palms-up a hard gate, because normal webcam hand depth and palm normals can be noisy. Do not reintroduce M5.5-style one-hand spread/contract, fist-hold reset, or push controls after `SolarFreeHover` unless the user explicitly reopens that requirement.

Virtual endpoint left/right labels should mean the user's visual left/right in the mirrored camera preview. They are not the same thing as MediaPipe handedness labels.

Virtual endpoints may be displayed only as debug-only 2D overlay markers before Milestone 4. They are not solar-system 3D content. Do not render the sun, planets, orbit rings, nebula, particles, singularity, or any 3D model in the protocol-validation milestone. The only exception is the explicit dev-only code placeholder preview route, which must stay hidden from the normal camera/startup path.

### Spatial Orientation

If a future approved interaction rotates the whole solar system or focused bodies, the rotation must feel 3D. The retired M5 palms-up whole-system rotation gesture is not an active product control.

- Use quaternions, arcball-style mapping, or equivalent 3D orientation logic.
- Avoid implementing any approved rotation as only a flat 2D screen-plane rotation.
- The orbit plane and body orientation should visibly tilt in depth.

### Interactive Bodies

MVP interactive bodies are:

- Mercury
- Venus
- Earth
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Moon

Use one unified body data model and one unified activation/focus/return pipeline. Do not implement each planet with unrelated one-off code.

Only one body may be activated or focused at a time in the MVP.

### Planet Activation, Focus, Release, and Return Rules

- Pinch near a hovered body enters `PlanetActivated`.
- A `PlanetActivated` body stops its original orbit but keeps natural self-rotation; other bodies continue normal orbit and self-rotation.
- Only the currently activated body may have its original orbit paused, except for the Earth-Moon bound pair. Activating Earth pauses Earth's solar orbit while Moon may keep orbiting Earth. Activating Moon pauses both Earth's solar orbit and Moon's local orbit around Earth. Earth and Moon keep self-rotating in both cases. When activation switches from A to B, or A is cleared because the user touches/hovers B, A immediately resumes orbiting unless it is paused by this Earth-Moon binding.
- After activation, two closeDown events from the same activating hand's thumb/index pair enter `PlanetFocusView`; the initial activation pinch does not count, and a long closed hold must not count as two closeDown events. The reopen between the two closeDown events is a small thumb/index click reopen, not a full pinch release beyond the activation pinch-end threshold.
- A `PlanetActivated` body remains selected through brief same-hand heat-zone exits so the user can complete close-open-close timing; leaving the heat zone for about 1 second while open cancels selection.
- Passing over another body while the activating thumb/index pair is open must not switch selection or reset DoubleClose progress; switching to another body requires a closed touch/pinch on that new body.
- In `PlanetFocusView`, the background solar system is dimmed by directly lowering the opacity of background solar-system objects, not by adding a camera-covering mask/backdrop; it remains interaction-locked but keeps basic motion.
- The first visible `PlanetFocusView` implementation uses one unified focused-body overlay driven by body metadata for every interactive body, not separate per-planet pages.
- Entering `PlanetFocusView` should feel continuous: the focused body starts from its original solar-system world position and current scale, then moves and scales into the centered focus position over about 0.3 seconds rather than jumping.
- The focused-body overlay should be vertically centered in the visible frame; focused body sphere height should map to roughly 1/2 to 2/3 of the screen height, and the focused overlay should avoid spotlight-style lighting or bright glare.
- The focused body keeps self-rotating during activation, focus, heat-zone follow, release-to-floating, and inspection.
- One-hand spread/contract, one-hand push, and contract-to-fist hold are retired focus controls; they must not zoom, pan, or reset the focused body unless the user explicitly reopens that requirement.
- After entering `PlanetFocusView`, focus follow enters an intro cooldown state until the focused body is actually near the screen-centered focus position. This is not a fixed-time unlock: hands that are already touching the focused body's heat zone during or after the intro must leave the heat zone, then re-enter it, before a new dwell can begin.
- One hand touching the current focused body's heat zone for 1 second enters single-hand follow; the focused body follows that hand's thumb+index pinch midpoint and stays constrained to the visible screen. A second (off) hand merely appearing in frame outside the heat zone must not drop single-hand follow; control stays with the original hand (the controller re-acquires the active hand by spatial continuity even if its internal hand key shifts when the hand count changes).
- Two hands touching the current focused body's heat zone for 1 second enter two-hand follow; the focused body follows the midpoint between the two hands' thumb+index pinch midpoints. Focused-body size is driven only by the distance between the two hands, not by either hand's own thumb/index pinch, so closing a pinch must not scale the body or be misread as a place-down; drawing the two hands together can shrink the body well below its engaged size.
- During two-hand follow, if one hand clearly leaves the focused body's heat zone while the other keeps gripping, control downgrades to single-hand (move-only, scale frozen) follow with the staying hand rather than dragging the body toward the withdrawing hand. Bringing a second hand back into the heat zone and dwelling 1 second re-enters two-hand follow.
- During single-hand follow, the following hand can perform a thumb-to-any-finger close-open `PinchTap` to place the body down.
- During two-hand follow, either following hand can perform the same `PinchTap` to place the body down and clear follow selection. In the current product semantics, clearing follow selection means entering `PlanetFocusFloating`; it does not exit focus view or return the body to orbit.
- After any follow `PinchTap` places the focused body down, the controller must enter a deselected/wait-for-clear state: no new follow dwell may begin until every visible hand is outside the focused body's heat zone.
- A floating focused body must not automatically return to orbit.
- The old pinch-and-throw return command is retired. The palm-facing-screen five-finger open-hand return command is also retired. In `PlanetFocusView`, `PlanetFocusControlled`, and `PlanetFocusFloating`, show a transparent glass-style rectangular button at the top-left of the screen with a return icon and the label "长按返回太阳系"; holding the tracked index fingertip on the button for 1 second fills the button progress bar and enters `BodyReturning`. Mouse/pointer clicking the DOM button must not be required for the product path.
- A returning body animates back to its original solar-system position and scale over about 0.5 seconds, restores its original layer/relationship, resumes orbiting, restores background solar-system opacity, unlocks solar-system interaction, and exits back to the solar-system view.

## Interaction State Machine

Implement the interaction as explicit states rather than scattered booleans.

Minimum states:

```text
CameraReady
EmptyIdle
HandsClosed
PullArmed
SolarOpening
SolarActive
SolarFreeHover
SolarHandleControl
SolarClosing
BodyHover
PlanetActivated
PlanetFocusView
PlanetFocusControlled
PlanetFocusFloating
BodyReturning
```

The state machine should be inspectable in the debug panel.

Debug labels should distinguish startup and whole-system protocol state clearly:
`Startup state` means the hand-only closed-to-pull startup state, while `Whole control` means the whole-system handle/release/re-grip protocol state.

The user-facing Chinese status summary must follow the latest product interaction state, not stale protocol internals. Once visible solar-system 3D is driven by `SolarOpeningController`, the status summary should use `interactionState` plus the solar controller reason/progress/scale. Legacy `wholeSystemIntent` values such as `Lock`, `Re-grip`, and `Transition` may remain in the Debug panel only; do not use them as the main status explanation for visible solar-system behavior.

## Coordinate and Smoothing Rules

Use normalized camera coordinates as the tracking input and map them into the Three.js scene.

Required smoothing:

- Low-pass filter for the optional body reference, if used.
- Low-pass filter for hand positions.
- Short hold window for missing hands during startup gestures and active planet activation/focus.
- Hysteresis thresholds for pinch start and pinch end.
- Slerp or equivalent smoothing for 3D rotations.
- Stable tracked-index-fingertip hold timing for the top-left return button progress.
- Once visible 3D solar-system content is driven by hand endpoints, reject abrupt endpoint-geometry outliers before updating the solar-system transform. Fast hand withdrawal, edge-of-frame partial hand tracking, or one-frame MediaPipe mis-detection must hold the last stable transform instead of shrinking or jumping the model.
- Run the interaction controllers only on a fresh MediaPipe detection frame (`freshFrameGate.ts`), fed the detection timestamp, so re-rendered stale frames do not inject zero-velocity samples into pull, endpoint, release stability, or return-button index-finger dwell. Rendering still runs every requestAnimationFrame.
- Assign visual-left/right hand identity from the previous frame's trajectory before smoothing, then smooth per visual slot (`gestureInputFrame.ts`). Do not smooth per MediaPipe handedness, which swaps history when hands cross.
- Keep MediaPipe image-landmark z out of screen-plane gesture distances (close / pull / endpoint / hover / support); use 2D x/y. Prefer world landmarks for hand-shape (open-hand / fist / pinch).

Avoid single-frame state flips for important gesture actions such as pull open, pinch start, and pinch end; UI return requires the tracked index fingertip to stay on the top-left button for 1 second.

## Debug and Recording Requirements

Keep a debug panel available behind a toggle.

Debug panel should eventually show:

- FPS.
- Camera permission status.
- Pose detected or not.
- Left hand detected or not.
- Right hand detected or not.
- Current interaction state.
- Left hand x/y.
- Right hand x/y.
- Hand midpoint x/y.
- Body reference x/y, if a body-relative reference is being debugged.
- Hand distance.
- Hand distance velocity.
- Whether both hands are visible.
- Whether lost-hand hold is active.
- Whole-system control state.
- Control/release/re-grip confidence.
- Legacy scale/rotation diagnostics and current reverse-collapse intent.
- Palm normals and palm orientation scores.
- Open-hand and grip-pose scores.
- Release gesture state and accepted-release lock state.
- Release stable time, release-block reason, grip-hold state, and re-grip reason.
- Virtual visual-left/visual-right endpoints and endpoint match state.
- Hand primitives, session calibration thresholds, endpoint hit score, tracking confidence, and structured transition reasons.
- A concise Chinese interaction status summary near the Debug toggle that states the current interpreted user intent, the reason, and the key parameters behind the decision.
- A debug gesture recorder that can export structured landmarks, primitives, calibration values, intent scores, states, and transition reasons as JSON without recording raw webcam video or uploading data.
- `openProgress`.
- Current solar scale.
- Current hovered body.
- Current activated/focused body.
- Pinch state.
- Single-planet return button visibility and long-press progress.

Add a recording mode or presentation mode that hides debug UI and leaves only minimal user-facing guidance.

## Development Workflow

Work milestone by milestone. Do not attempt to implement the full product in one large change.

For every task:

1. Restate the target milestone.
2. Inspect existing files first.
3. Make the smallest useful implementation change.
4. Run available checks.
5. Update docs when behavior, scope, or task status changes.
6. Sync the private companion repo when agent records, requirements, TODO status, or commits change.
7. Summarize changed files, validation results, and manual camera-test needs.

When a milestone or acceptance item needs user/manual verification, Codex must provide a separate manual verification checklist for the user. Each checklist item must include:

1. The user action to perform in plain language.
2. Where to observe the result, such as the debug panel, visible UI, browser console, or camera preview.
3. The exact pass condition, including expected state names or values when applicable.

Do not mark a milestone `DONE` from `NEEDS_MANUAL_VERIFY` until the user explicitly reports that the manual verification passed. If the user reports a failed or confusing verification item, keep the milestone in `NEEDS_MANUAL_VERIFY` and refine the implementation, thresholds, or checklist until the user confirms it passes.

Use this prompt structure when asking Codex to do work:

```text
Goal:
<what to build or fix>

Context:
Read @ar_solar_system_prd.md, @TODO.md, and @AGENTS.md.
Focus on <specific section or milestone>.

Constraints:
- Web Demo first.
- Do not break initial empty scene.
- Do not introduce Electron or another engine.
- Keep existing commands working.
- Update docs if requirements or task status change.

Done when:
- npm run build passes.
- No obvious console errors.
- The specified behavior can be manually tested in the browser.
- TODO.md status is updated.
- Product docs are updated if behavior changed.
```

## Verification Commands

Use the package manager already present in the repository. If no package manager has been chosen yet, prefer npm.

Expected commands after project setup:

```bash
npm install
npm run dev
npm run build
```

Available verification scripts:

```bash
npm run typecheck
npm test            # all Vitest suites (tests/unit + tests/gesture)
npm run test:unit
npm run test:gesture
npm run build
```

Before marking implementation tasks complete:

1. Run `npm run typecheck`.
2. Run `npm test`. All Vitest suites must pass.
3. Run `npm run build`.
4. Run `npm run lint` if available.
5. When you add or change gesture / solar-control logic, add or update the matching test under `tests/` and tick the item in `docs/testing/testing-todo.md`. Use `docs/testing/test-and-replay-harness.md` to decide which layer the test belongs to (Layer 0 leaf pure function, Layer 1 controller sequence, etc.).
6. Note any manual camera/gesture test that could not be performed in the current environment.

Do not pretend to have tested webcam or hand gestures if running in a headless environment without camera access. Mark those items as `Needs manual camera verification` in `TODO.md`.

## Test & Replay Harness Workflow

Use `docs/testing/test-and-replay-harness.md` as the project testing strategy for automated gesture regression work.

- Treat the testing plan as a cross-cutting workflow, not as a stale product milestone inserted before M4. The current product baseline has retired M5.5 one-hand solar inspection controls.
- First priority is deterministic Vitest coverage for leaf pure functions and controller sequences: `math`, `coordinateMapping`, `handPairing`, `palmOrientation`, `handPose`, `intentScoring`, startup, whole-system intent, and solar opening.
- Do not modify `main.ts`, add `src/testing/`, or introduce a live `TrackingSource`/replay bootstrap seam in the first testing slice. Add those only after lower-level tests are useful and the current whole-system/free-hover behavior has stabilized.
- JSON gesture replay should preserve fixture timestamps and use structured recorder output only. Do not commit raw webcam video.
- Browser-level Playwright replay comes after controller-level replay, because replay time injection through `requestAnimationFrame` is the fragile part.
- Gesture modules under `src/interaction/**` must contain no `Math.random`, `Date.now`, or `performance.now` (all time is injected via `update(..., timestamp)`); a guardrail test enforces this so controller/leaf tests stay deterministic.
- The retired M5.5 solar-inspection verification harness is removed; do not add new `verify:m5.5` coverage unless the user explicitly reopens that gesture surface.
- CI (GitHub Actions) running `typecheck` + unit + gesture + `build` on push/PR is the automation endpoint; browser/replay jobs join later as separate steps.

## Coding Rules

- Prefer clear TypeScript types for landmarks, anchors, gesture states, and celestial-body states.
- Use named constants for thresholds instead of magic numbers inside logic.
- Keep visual constants separate from gesture thresholds.
- Use requestAnimationFrame for rendering and tracking updates.
- Avoid expensive per-frame allocations in the render loop.
- Avoid layout-reading calls (`getBoundingClientRect`, `getComputedStyle`) per landmark/point; read once per frame and reuse, and gate debug-only metrics behind debug visibility.
- Dispose of Three.js geometries, materials, and textures when no longer needed.
- Do not keep controller state that is written but never read; when a field falls out of use after tuning, remove it in the same change (watch the timer/latch-heavy state machines in `wholeSystemIntent.ts` and `handStartupGesture.ts`).
- Keep UI responsive when tracking models are loading.
- Fail gracefully when camera permission is denied.
- Provide lightweight user guidance for camera permission, poor lighting, or missing hands.

### Single Sources of Truth (do not duplicate)

These shared modules exist so the same logic is not re-derived in multiple files. Reuse them instead of re-implementing:

- `src/utils/math.ts` — shared vector/scalar math (`clamp`, `clamp01`, `lerp`, `inverseLerp`, `average`, `averageNullable`, `averagePoints`, `distance2d/3d`, `subtract`, `cross`, `normalize`, `cosineSimilarity`, `unwrapAngle`). Do not define local copies of these in any module (tracking, interaction, or rendering); import from here. The only sanctioned per-file math is genuinely module-specific (e.g. the calibration smoothing helpers in `gestureCalibration.ts`).
- `src/interaction/handPairing.ts` — visual-left/right hand assignment. Visual-left = the hand the user sees on the LEFT of the mirrored preview = the LARGER camera-frame x. All gesture modules (startup, primitives, whole-system) must use `getVisualTrackedHandPair` / `sortVisualLeftRight`; do not invent a per-file left/right convention, and do not confuse this with MediaPipe handedness labels.
- `src/interaction/intentTuning.ts` — every tunable whole-system gesture threshold and blend weight. When tuning gesture behavior, change values here. Do not reintroduce magic numbers into the scoring functions (now in `intentScoring.ts` and `handPose.ts`).
- `src/interaction/handLandmarks.ts` — MediaPipe hand landmark index constants, shared by palm-orientation and hand-pose code. Do not re-declare landmark indices per file.
- `src/interaction/palmOrientation.ts` — palm normal / facing-camera / up-score primitives from hand landmarks (`computePalmOrientation`, `averagePalmNormal`, `createEmptyPalm`). Pure and stateless.
- `src/interaction/handPose.ts` — open-hand / grip-pose / release-ready scoring (`computeHandPoseIntent`, `computeReleaseGesture`, `createEmptyHandPose`). Pure and stateless.
- `src/interaction/intentScoring.ts` — pure whole-system scoring: control/release/re-grip confidence, legacy scale/rotation diagnostics, collapse intent, endpoint matching, and pinch separation, plus the shared `HandPointPair` / `VirtualEndpoints` / `EndpointMatch` types. No cross-frame state.
- `src/interaction/wholeSystemIntent.ts` — the orchestration layer ONLY: the `WholeSystemIntentController` state machine plus cross-frame state (endpoints, latches, stable timers, previous hand-axis angle/palm normal). Stateful rotation-velocity scoring stays here because it needs previous-frame data; all stateless computation is delegated to the modules above. Do not move pure scoring back in, and do not relocate the stateful rotation methods out.
- `src/interaction/coordinateMapping.ts` — the only place that converts normalized MediaPipe coordinates into displayed stage pixels and Three.js world coordinates. It is `object-fit: contain` and mirror aware. `mapNormalizedToWorld` unprojects with three's `Raycaster` against the real `scene.getCamera()` and the `z = INTERACTION_PLANE_Z` plane, so it stays correct for any camera pose; do not reintroduce a fixed-camera `tan(fov/2)` projection. The debug landmark overlay and all future 3D content (M4+) must map through it, passing `scene.getCamera()`, so hands, virtual endpoints, and 3D content stay pixel-aligned. Do not hand-roll `(1 - x) * width` style mapping elsewhere.
- `src/interaction/gestureInputFrame.ts` — turns raw MediaPipe hands into stabilized hands by assigning visual-left/right identity from the previous frame's trajectory BEFORE smoothing (per visual slot), so a MediaPipe handedness flip during a hand crossing cannot swap smoother history. `HandTracker` builds raw hands (`buildTrackedHand`) and runs them through this; do not move smoothing back ahead of visual pairing.
- `src/interaction/freshFrameGate.ts` — `isFreshTrackingFrame`: interaction controllers update only when `TrackingSnapshot.lastUpdatedAt` changes, fed the detection timestamp, so re-rendered stale frames do not inject zero-velocity samples into pull, endpoint, or release stability. The `main.ts` render loop enforces this; do not run gesture controllers every requestAnimationFrame. UI-only long-press progress may run on render frames.

Gesture geometry conventions:

- Screen-plane gestures (hand close/pull distance, endpoint hit, hover, support) use 2D x/y only. Never put MediaPipe image-landmark z into "are the hands close / far" or the pull axis — it is noisy single-camera depth.
- Hand-shape geometry (open-hand / fist / pinch) prefers MediaPipe world landmarks (`TrackedHand.worldLandmarks`) when present, falling back to image landmarks; the scores are palm-scale ratios, so the same formulas work in either space.

### Reuse vs. Custom (library built-ins)

Requirement fit comes first. Self-written code is legitimate when it matches our data and needs better than a dependency — do not force-fit `three` or `@mediapipe/tasks-vision` just to avoid writing code, and do not rewrite working custom code into a library call for uniformity alone.

That said, do not reinvent what a dependency already does correctly. Before hand-writing projection/unprojection, rotation, skeleton connection tables, or canvas-drawing helpers, check the library first: `Raycaster` / `Vector3.unproject` for projection, `Quaternion` / `slerp` for rotation, `HandLandmarker.HAND_CONNECTIONS` for the hand skeleton. Reuse it when it fits — e.g. do not reintroduce a fixed-camera `tan(fov/2)` projection in place of `Raycaster`.

When you deliberately choose custom over an available built-in, record the reason here so later sessions keep the decision instead of "fixing" it. Sanctioned so far:

- `src/utils/math.ts` scalar/vector helpers — landmark data is plain `{x, y, z, visibility}` objects, so `THREE.Vector3` would add per-frame allocation/conversion with no benefit.
- `landmarkOverlay.ts` `drawLine` / `drawPoint` — must route through `coordinateMapping` for mirror + `object-fit: contain` + retina-DPR alignment, which `DrawingUtils` (raw `x * canvas.width`, no mirror/contain hook) cannot honor. The connection *table* still comes from `HandLandmarker.HAND_CONNECTIONS`.

## Visual Rules

- Webcam feed is the preview background layer.
- Preserve the camera feed's aspect ratio. For the 16:9 webcam MVP, use a 16:9 preview stage and `object-fit: contain`; do not use `cover` or force the video into a square/portrait region that crops the user's body.
- Three.js canvas is transparent and aligned above the video, using the same displayed width and height as the video preview.
- Any interaction/debug overlay used for coordinate inspection should share the same preview-stage dimensions as the video and canvas so gesture coordinates do not drift from the displayed image.
- User-facing UI is minimal and should not cover the hands or chest area.
- Hover, activation, focus, PinchTap release-to-floating, and return states need visible feedback.
- Small bodies such as Mercury and Moon require expanded interaction hit areas.
- Saturn must have a recognizable ring.
- The code-placeholder solar system should use procedural materials only, keep visuals data-driven, and allow future texture replacement through material/data sources without changing interaction logic.
- Star dust, nebula, and glow effects appear only after the pull-open interaction begins.

## Do Not

- Do not convert the project into a generic 3D solar system viewer.
- Do not show a 3D singularity or decorative object in the initial empty scene.
- Do not auto-play the opening animation independent of hand distance.
- If implementing any approved rotation, do not implement it as only 2D screen rotation.
- Do not make PinchTap place-down, ordinary pinch relaxation, or tracking loss return a body to orbit.
- Do not make ordinary open-hand motion return a body to orbit; single-planet return is now UI-driven by holding the tracked index fingertip on the top-left "长按返回太阳系" button for 1 second, not by mouse-clicking the DOM button.
- Do not add real backend services for the MVP.
- Do not add login, database, payments, analytics, or deployment setup for the MVP.
- Do not add Electron, Unity, Unreal, TouchDesigner, or XR support unless explicitly requested.
- Do not leave docs stale after a requirement change.

## Definition of Done

A task is done only when:

1. The behavior matches the latest user-approved requirement.
2. The implementation is scoped to the current milestone.
3. `npm run typecheck`, `npm test`, and `npm run build` pass, or failures are clearly documented.
4. When gesture / solar-control logic changed, the matching `tests/` coverage is added or updated and `docs/testing/testing-todo.md` is ticked.
5. The debug panel exposes enough state to inspect the new behavior.
6. `TODO.md` status is updated.
7. `TODO.zh-CN.md` is updated whenever `TODO.md` changes.
8. `ar_solar_system_prd.md` is updated if product behavior changed.
9. `AGENTS.md` is updated if durable development rules changed.
10. The final response states what changed, how it was verified, and what still needs manual camera testing.
