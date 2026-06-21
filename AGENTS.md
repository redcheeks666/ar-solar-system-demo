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
7. After opening, the solar system floats around the user's chest anchor, not the screen center.
8. The user scales and spatially rotates the solar system with both hands.
9. The user can hover and pinch-grab Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
10. A grabbed body attaches to the hand, freezes autonomous rotation/orbit, and can be inspected, scaled, and spatially rotated.
11. A normal pinch release does **not** return the body to orbit. It remains detached at the release location and resumes natural self-rotation.
12. A clear throw gesture returns the detached body to its original orbit with a visible return animation.

This is not a normal 3D solar system page. It is a **webcam AR interaction demo** where the 3D content appears to exist in front of the user's chest and hands.

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
6. Add a short entry to the `TODO.md` change log with date, changed requirement, affected files, and remaining ambiguity if any.
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
→ hands together anywhere in the visible camera frame
→ hands pull apart
→ solar system opens between both hands
→ solar system floats near chest
→ both hands scale and spatially rotate it
→ pinch-grab a body
→ inspect the body while it is frozen
→ normal release leaves it floating and self-rotating
→ throw release returns it to orbit
```

## Recommended Tech Stack

Use this default stack unless the user explicitly changes it:

- Vite for the local Web Demo.
- TypeScript for app code.
- Three.js for 3D rendering.
- MediaPipe Tasks Vision for pose and hand landmarks.
- Browser MediaDevices API for webcam input.
- RequestAnimationFrame for the main render loop.
- Three.js interpolation, quaternions, and vector math for smoothing, rotation, and transforms.
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
      wholeSystemIntent.ts
      chestAnchor.ts
      coordinateMapping.ts
      grabController.ts
      throwDetector.ts
    solar/
      solarSystem.ts
      celestialBody.ts
      solarSystemData.ts
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

### Hand-Only Startup And Pull-Open Gesture

The solar system must not appear because of a timer or page load.

The startup gesture is hand-only and must not depend on chest anchor, shoulders, or body pose.

It must appear only after a valid two-hand closed-to-pull gesture:

- both hands detected;
- hands initially close to each other anywhere in the visible camera frame;
- if the hands overlap and one hand is briefly lost, the startup state may hold recent valid two-hand evidence for a short window;
- a single detected hand must not start the gesture unless both hands were recently detected close together;
- while the hands/fists remain closed, no solar-system animation or 3D content should play;
- hand distance increases over a short time window;
- the opening progress is driven by current hand distance;
- if the hands pause, the opening progress should pause or hold rather than auto-complete;
- the left and right opening endpoints should visually follow the left and right hands.

### Chest-Anchored AR Feel

The opened solar system should feel attached to the user's chest area.

- Use left and right shoulders to estimate the chest anchor.
- Smooth the chest anchor to reduce jitter.
- Keep the last stable chest anchor briefly if shoulders are temporarily lost.
- Do not leave the solar system fixed at the screen center after opening.
- When the user releases the whole-system two-hand handle, keep the solar system hovering at the last stable transform instead of snapping back to the chest anchor or screen center.

### Whole-System Handle, Release, and Re-Grip

The opened solar system should behave like a manipulable object suspended in the air.

- During pull-open, the left and right visual endpoints should stay attached to the left and right hands.
- Releasing both hands from the endpoints should place the whole solar system in a free-hover state at the last stable position, scale, and orientation.
- Returning both hands near the left and right endpoints should re-grip the whole-system handle without requiring a planet pinch.
- The primary whole-system release gesture is both hands opening fully, with fingers extended and grip-pose confidence low for a short confirmation window.
- Once an open-hand release is accepted, release should latch: endpoints freeze immediately, and re-grip is blocked until both hands have clearly moved away from the frozen endpoints. Fingers relaxing during withdrawal must not reattach the handle.
- Slightly curved hands should be treated as still holding the endpoints, not as a release.
- Complete hand loss, endpoint mismatch, or low whole-control confidence may remain fallback release signals, but they must not replace open-hand release as the primary user-facing gesture.
- Moving gripped hands farther apart or closer together should scale the whole solar system.
- Moving gripped hands inward from the opened state should collapse the solar system in reverse; when fully closed, the scene returns to the initial empty camera view.
- Palm-forward, side-to-side motion should be understood as a scale gesture, like pushing or pulling two glass panels apart/together.
- Palms-up gentle rotation should rotate the whole solar system in 3D.
- Whole-system handle gestures must remain separate from pinch-grabbing individual planets.

### Pre-3D Whole-System Interaction Protocol

Before visible solar-system 3D content is attached, whole-system interaction must pass through an explicit protocol layer rather than mapping MediaPipe landmarks directly to Three.js objects.

The protocol layer should follow this shape:

```text
MediaPipe landmarks
→ HandFrame
→ WholeSystemIntent
→ future SolarSystemController
```

Protocol output should include:

- Whole-system control state.
- Control confidence.
- Release confidence.
- Re-grip confidence.
- Scale intent and score.
- Rotation intent and score.
- Reverse-collapse intent score.
- Palm normal and palm orientation scores.
- Open-hand and grip-pose scores.
- Release gesture state and accepted-release lock state.
- Virtual visual-left/visual-right endpoints and endpoint match state.

Palm orientation is an intent-confidence signal only. Do not make palm-forward or palms-up a hard gate, because normal webcam hand depth and palm normals can be noisy.

Virtual endpoint left/right labels should mean the user's visual left/right in the mirrored camera preview. They are not the same thing as MediaPipe handedness labels.

Virtual endpoints may be displayed only as debug-only 2D overlay markers before Milestone 4. They are not solar-system 3D content. Do not render the sun, planets, orbit rings, nebula, particles, singularity, or any 3D model in the protocol-validation milestone.

### Spatial Rotation

Rotation must feel 3D.

- Use quaternions, arcball-style mapping, or equivalent 3D orientation logic.
- Avoid implementing only a flat 2D screen-plane rotation.
- The orbit plane and body orientation should visibly tilt in depth.

### Grabbable Bodies

MVP grabbable bodies are:

- Mercury
- Venus
- Earth
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Moon

Use one unified body data model and one unified grab pipeline. Do not implement each planet with unrelated one-off code.

Only one body may be grabbed at a time in the MVP.

### Grab, Release, and Return Rules

- Pinch near a hovered body enters `grabbed` state.
- A grabbed body attaches to the hand and stops autonomous self-rotation and orbiting.
- The grabbed body may be scaled and spatially rotated independently from the solar system.
- A normal release enters `detached` state.
- A detached body remains at the release position and resumes self-rotation.
- A detached body must not automatically return to orbit.
- A clear throw gesture enters `returning` state.
- A returning body animates back to its original orbit, restores its original scale/layer, and resumes orbiting.

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
BodyGrabbed
BodyDetached
BodyReturning
```

The state machine should be inspectable in the debug panel.

Debug labels should distinguish startup and whole-system protocol state clearly:
`Startup state` means the hand-only closed-to-pull startup state, while `Whole control` means the whole-system handle/release/re-grip protocol state.

## Coordinate and Smoothing Rules

Use normalized camera coordinates as the tracking input and map them into the Three.js scene.

Required smoothing:

- Low-pass filter for chest anchor.
- Low-pass filter for hand positions.
- Short hold window for missing hands during startup gestures and active grab.
- Hysteresis thresholds for pinch start and pinch end.
- Slerp or equivalent smoothing for 3D rotations.
- Velocity smoothing for throw detection.

Avoid single-frame state flips for important actions such as pull open, pinch start, pinch end, and throw return.

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
- Chest anchor x/y.
- Hand distance.
- Hand distance velocity.
- Whether both hands are visible.
- Whether lost-hand hold is active.
- Whole-system control state.
- Control/release/re-grip confidence.
- Scale, rotation, and reverse-collapse intent.
- Palm normals and palm orientation scores.
- Open-hand and grip-pose scores.
- Release gesture state and accepted-release lock state.
- Virtual visual-left/visual-right endpoints and endpoint match state.
- `openProgress`.
- Current solar scale.
- Current hovered body.
- Current grabbed body.
- Pinch state.
- Throw velocity.

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

Add these scripts when possible:

```bash
npm run typecheck
npm run lint
```

Before marking implementation tasks complete:

1. Run `npm run build`.
2. Run `npm run typecheck` if available.
3. Run `npm run lint` if available.
4. Start the dev server if possible.
5. Note any manual camera/gesture test that could not be performed in the current environment.

Do not pretend to have tested webcam or hand gestures if running in a headless environment without camera access. Mark those items as `Needs manual camera verification` in `TODO.md`.

## Coding Rules

- Prefer clear TypeScript types for landmarks, anchors, gesture states, and celestial-body states.
- Use named constants for thresholds instead of magic numbers inside logic.
- Keep visual constants separate from gesture thresholds.
- Use requestAnimationFrame for rendering and tracking updates.
- Avoid expensive per-frame allocations in the render loop.
- Dispose of Three.js geometries, materials, and textures when no longer needed.
- Keep UI responsive when tracking models are loading.
- Fail gracefully when camera permission is denied.
- Provide lightweight user guidance for camera permission, poor lighting, or missing hands.

## Visual Rules

- Webcam feed is the preview background layer.
- Preserve the camera feed's aspect ratio. For the 16:9 webcam MVP, use a 16:9 preview stage and `object-fit: contain`; do not use `cover` or force the video into a square/portrait region that crops the user's body.
- Three.js canvas is transparent and aligned above the video, using the same displayed width and height as the video preview.
- Any interaction/debug overlay used for coordinate inspection should share the same preview-stage dimensions as the video and canvas so gesture coordinates do not drift from the displayed image.
- User-facing UI is minimal and should not cover the hands or chest area.
- Hover, grab, release, detach, and return states need visible feedback.
- Small bodies such as Mercury and Moon require expanded interaction hit areas.
- Saturn must have a recognizable ring.
- Star dust, nebula, and glow effects appear only after the pull-open interaction begins.

## Do Not

- Do not convert the project into a generic 3D solar system viewer.
- Do not show a 3D singularity or decorative object in the initial empty scene.
- Do not auto-play the opening animation independent of hand distance.
- Do not implement rotation as only 2D screen rotation.
- Do not make normal release return a body to orbit.
- Do not make throw return trigger on every release.
- Do not add real backend services for the MVP.
- Do not add login, database, payments, analytics, or deployment setup for the MVP.
- Do not add Electron, Unity, Unreal, TouchDesigner, or XR support unless explicitly requested.
- Do not leave docs stale after a requirement change.

## Definition of Done

A task is done only when:

1. The behavior matches the latest user-approved requirement.
2. The implementation is scoped to the current milestone.
3. Build and available checks pass, or failures are clearly documented.
4. The debug panel exposes enough state to inspect the new behavior.
5. `TODO.md` status is updated.
6. `TODO.zh-CN.md` is updated whenever `TODO.md` changes.
7. `ar_solar_system_prd.md` is updated if product behavior changed.
8. `AGENTS.md` is updated if durable development rules changed.
9. The final response states what changed, how it was verified, and what still needs manual camera testing.
