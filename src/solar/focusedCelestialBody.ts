import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Texture,
  Vector3,
} from 'three';
import { BLOOM_RENDER_LAYER } from '../rendering/renderLayers';
import { CAMERA_FOV, CAMERA_Z } from '../rendering/scene';
import {
  clamp,
  clamp01,
  easeInOutCubic,
  easeOutBack,
  easeOutExpo,
  inverseLerp,
  lerp,
  smoothstep,
} from '../utils/math';
import {
  getFocusPlanetProfile,
  type FocusAtmosphereProfile,
  type FocusLuminanceTextureOverlayProfile,
  type FocusNightLightsOverlayProfile,
  type FocusPlanetProfile,
  type FocusProceduralOverlayProfile,
  type FocusRingProfile,
  type FocusShadowProfile,
} from './focusPlanetProfiles';
import { getTextureAssetPath } from './planetTextureMaterials';
import { createSaturnRingMaterial, createUnlitPlaceholderBodyMaterial } from './proceduralMaterials';
import { applyRadialRingTextureUvs } from './ringTextureMapping';
import type { TextureAsset } from './solarAssetManifest';
import type {
  CelestialBodyDefinition,
  InteractiveCelestialBodyId,
} from './solarSystemData';
import { loadTexture } from './textureAssets';

export const FOCUS_BODY_WORLD_Z = 0.62;
export const FOCUS_BODY_MIN_SCREEN_HEIGHT_FRACTION = 0.5;
export const FOCUS_BODY_MAX_SCREEN_HEIGHT_FRACTION = 2 / 3;
export const FOCUS_INTRO_DURATION_SECONDS = 0.3;
export const FOCUS_RETURN_DURATION_SECONDS = 0.9;

const FOCUS_RENDER_ORDER = 96;
const SPHERE_WIDTH_SEGMENTS = 56;
const SPHERE_HEIGHT_SEGMENTS = 32;
const RING_SEGMENTS = 180;
const RING_HALF_SEGMENTS = RING_SEGMENTS / 2;
const FOCUS_RING_OPEN_ANGLE = Math.PI * 0.38;
const FOCUS_RING_BACK_RENDER_ORDER = FOCUS_RENDER_ORDER - 0.5;
const FOCUS_RING_FRONT_RENDER_ORDER = FOCUS_RENDER_ORDER + 5;
const FOCUS_MIN_REFERENCE_RADIUS = 0.026;
const FOCUS_MAX_REFERENCE_RADIUS = 0.18;
const FOCUS_LIGHT_DIRECTION = new Vector3(-0.82, 0.22, 0.35).normalize();
const FOCUS_VIEWPORT_HEIGHT =
  2 *
  (CAMERA_Z - FOCUS_BODY_WORLD_Z) *
  Math.tan((CAMERA_FOV * Math.PI) / 360);
const RETURN_ANTICIPATION_END = 0.09;
const RETURN_LAUNCH_END = 0.39;
const RETURN_CAPTURE_END = 0.83;
const RETURN_CAPTURE_PULSE_PROGRESS = 0.92;
const RETURN_LAUNCH_PATH_END = 0.38;
const RETURN_CAPTURE_PATH_END = 0.84;
const RETURN_THROW_MIN_STRENGTH = FOCUS_VIEWPORT_HEIGHT * 0.12;
const RETURN_THROW_MAX_STRENGTH = FOCUS_VIEWPORT_HEIGHT * 0.35;
const RETURN_THROW_PEAK_SPEED_REFERENCE = 6;
const RETURN_TANGENT_LEAD_IN = FOCUS_VIEWPORT_HEIGHT * 0.16;
const RETURN_CONTROL_POINT_VIEW_FRACTION = 0.48;
const RETURN_ANTICIPATION_DISTANCE_SCALE = 0.035;
const RETURN_MAX_STRETCH = 1.4;
const RETURN_MAX_SPIN_MULTIPLIER = 3.6;
const RETURN_AFTERIMAGE_COUNT = 4;
const RETURN_RIPPLE_DURATION_SECONDS = 0.36;
const RETURN_RIPPLE_RENDER_ORDER = FOCUS_RENDER_ORDER + 7;
const RETURN_AFTERIMAGE_RENDER_ORDER = FOCUS_RENDER_ORDER - 2;
const MIN_DIRECTION_LENGTH_SQUARED = 0.000001;

export interface FocusedBodyReturnMotion {
  readonly throwDirection: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  };
  readonly throwStrength: number;
}

interface ReturnAfterimage {
  readonly mesh: Mesh;
  readonly material: MeshBasicMaterial;
}

interface FocusOverlaySpinGroup {
  readonly group: Group;
  readonly speedScale: number;
}

export class FocusedCelestialBody {
  readonly root = new Group();
  readonly transitionVfxRoot = new Group();

  private readonly targetWorldScale: number;
  private readonly targetWorldPosition = new Vector3(0, 0, FOCUS_BODY_WORLD_Z);
  private readonly transitionSourceWorldPosition = new Vector3();
  private readonly returnControlPoint1 = new Vector3();
  private readonly returnControlPoint2 = new Vector3();
  private readonly returnThrowDirection = new Vector3(0, 1, 0);
  private readonly returnOrbitTangent = new Vector3();
  private readonly transitionVelocityWorld = new Vector3();
  private readonly transitionVisualGroup = new Group();
  private readonly spinGroup = new Group();
  private readonly tiltGroup = new Group();
  private readonly overlaySpinGroups: FocusOverlaySpinGroup[] = [];
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private transitionKind: 'intro' | 'return' | null = null;
  private transitionElapsedSeconds = FOCUS_INTRO_DURATION_SECONDS;
  private transitionDurationSeconds = FOCUS_INTRO_DURATION_SECONDS;
  private transitionSourceWorldScale = 1;
  private transitionTargetWorldScale: number;
  private returnThrowStrength = getFocusedBodyReturnThrowStrength(null);
  private returnPathProgress = 0;
  private returnCaptureTriggered = false;
  private returnCapturePending = false;
  private returnRippleElapsedSeconds = RETURN_RIPPLE_DURATION_SECONDS;
  private scaleMultiplier = 1;
  private transitionStreakMesh: Mesh | null = null;
  private transitionStreakMaterial: ShaderMaterial | null = null;
  private focusBodyGeometry: SphereGeometry | null = null;
  private focusBodyMaterial: MeshBasicMaterial | null = null;
  private focusAtmosphereMaterial: ShaderMaterial | null = null;
  private readonly returnAfterimages: ReturnAfterimage[] = [];
  private returnRippleMesh: Mesh | null = null;
  private returnRippleMaterial: ShaderMaterial | null = null;
  private disposed = false;

  constructor(readonly definition: CelestialBodyDefinition) {
    this.targetWorldScale = getFocusedBodyWorldScale(definition);
    this.transitionTargetWorldScale = this.targetWorldScale;
    this.root.name = `focus-${definition.id}-root`;
    this.root.visible = false;
    this.transitionVfxRoot.name = `focus-${definition.id}-return-vfx-root`;

    this.transitionVisualGroup.name = `focus-${definition.id}-transition-visual`;
    this.tiltGroup.name = `focus-${definition.id}-tilt`;
    this.spinGroup.name = `focus-${definition.id}-spin`;
    this.tiltGroup.rotation.z = definition.axialTilt;
    this.root.add(this.transitionVisualGroup);
    this.transitionVisualGroup.add(this.tiltGroup);
    this.tiltGroup.add(this.spinGroup);

    this.addBodyMesh();
    this.addPlanetRing();
    this.addTransitionStreaks();
    this.addReturnAfterimages();
    this.addReturnRipple();
  }

  update(deltaSeconds: number, parent: Group): void {
    if (!this.root.visible) {
      return;
    }

    if (this.transitionElapsedSeconds < this.transitionDurationSeconds) {
      this.transitionElapsedSeconds = Math.min(
        this.transitionDurationSeconds,
        this.transitionElapsedSeconds + deltaSeconds,
      );
    }

    const transitionProgress = this.getTransitionProgress();
    const spinMultiplier = getReturnSpinMultiplier(
      this.transitionKind,
      transitionProgress,
    );
    this.spinGroup.rotation.y +=
      this.definition.rotationSpeed * spinMultiplier * deltaSeconds;
    this.overlaySpinGroups.forEach(({ group, speedScale }) => {
      group.rotation.y +=
        this.definition.rotationSpeed *
        speedScale *
        spinMultiplier *
        deltaSeconds;
    });

    if (
      this.transitionKind === 'return' &&
      !this.returnCaptureTriggered &&
      transitionProgress >= RETURN_CAPTURE_PULSE_PROGRESS
    ) {
      this.returnCaptureTriggered = true;
      this.returnCapturePending = true;
      this.returnRippleElapsedSeconds = 0;
    }

    this.applyScreenCenteredLayout(parent);
    this.updateTransitionStreaks();
    this.updateReturnAfterimages(parent);
  }

  updatePersistentVfx(deltaSeconds: number, parent: Group): void {
    if (!this.returnRippleMesh || !this.returnRippleMaterial) {
      return;
    }

    if (this.returnRippleElapsedSeconds >= RETURN_RIPPLE_DURATION_SECONDS) {
      this.returnRippleMesh.visible = false;
      this.returnRippleMaterial.uniforms.opacity.value = 0;
      return;
    }

    this.returnRippleElapsedSeconds = Math.min(
      RETURN_RIPPLE_DURATION_SECONDS,
      this.returnRippleElapsedSeconds + deltaSeconds,
    );
    const progress =
      this.returnRippleElapsedSeconds / RETURN_RIPPLE_DURATION_SECONDS;
    const scale = lerp(0.2, 1.5, easeOutExpo(progress));

    parent.updateMatrixWorld(true);
    parent.worldToLocal(
      TEMP_RIPPLE_LOCAL_POSITION.copy(this.targetWorldPosition),
    );
    parent.getWorldScale(TEMP_PARENT_SCALE);
    const parentScale = getMaxAbsScale(TEMP_PARENT_SCALE);

    this.returnRippleMesh.position.copy(TEMP_RIPPLE_LOCAL_POSITION);
    this.returnRippleMesh.scale.setScalar(
      (this.transitionTargetWorldScale * scale) / parentScale,
    );
    this.returnRippleMesh.visible = progress < 1;
    this.returnRippleMaterial.uniforms.progress.value = progress;
    this.returnRippleMaterial.uniforms.opacity.value = (1 - progress) ** 2;
  }

  setVisible(visible: boolean): void {
    this.root.visible = visible;
    if (!visible) {
      this.hideReturnAfterimages();
      if (this.transitionStreakMesh) {
        this.transitionStreakMesh.visible = false;
      }
    }
  }

  startIntroTransition(
    parent: Group,
    sourceWorldPosition: Vector3,
    sourceWorldScale: number,
  ): void {
    this.transitionKind = 'intro';
    this.transitionDurationSeconds = FOCUS_INTRO_DURATION_SECONDS;
    this.targetWorldPosition.set(0, 0, FOCUS_BODY_WORLD_Z);
    this.transitionTargetWorldScale = this.targetWorldScale;
    this.scaleMultiplier = 1;
    this.transitionSourceWorldPosition.copy(sourceWorldPosition);
    this.transitionSourceWorldScale = Math.max(sourceWorldScale, 0.0001);
    this.transitionElapsedSeconds = 0;
    this.resetReturnTransitionVisuals(true);
    this.root.visible = true;
    this.applyScreenCenteredLayout(parent);
  }

  startReturnTransition(
    parent: Group,
    targetWorldPosition: Vector3,
    targetWorldScale: number,
    motion: FocusedBodyReturnMotion,
    orbitVelocity: Vector3,
  ): void {
    this.transitionKind = 'return';
    this.transitionDurationSeconds = FOCUS_RETURN_DURATION_SECONDS;
    this.transitionSourceWorldPosition.copy(this.getWorldPosition(TEMP_CURRENT_WORLD_POSITION));
    this.transitionSourceWorldScale = Math.max(
      this.getMaxWorldScale(TEMP_CURRENT_WORLD_SCALE),
      0.0001,
    );
    this.targetWorldPosition.copy(targetWorldPosition);
    this.transitionTargetWorldScale = Math.max(targetWorldScale, 0.0001);
    this.applyReturnMotion(motion);
    this.returnOrbitTangent.copy(orbitVelocity);
    if (this.returnOrbitTangent.lengthSq() > MIN_DIRECTION_LENGTH_SQUARED) {
      this.returnOrbitTangent.normalize();
    } else {
      this.returnOrbitTangent.set(0, 0, 0);
    }
    this.createReturnBezierControlPoints();
    this.transitionElapsedSeconds = 0;
    this.returnPathProgress = 0;
    this.returnCaptureTriggered = false;
    this.returnCapturePending = false;
    this.returnRippleElapsedSeconds = RETURN_RIPPLE_DURATION_SECONDS;
    this.resetReturnTransitionVisuals(false);
    this.root.visible = true;
    this.applyScreenCenteredLayout(parent);
  }

  setWorldPlacement(
    parent: Group,
    worldPosition: Vector3,
    scaleMultiplier: number,
  ): void {
    this.transitionKind = null;
    this.transitionDurationSeconds = FOCUS_INTRO_DURATION_SECONDS;
    this.targetWorldPosition.copy(worldPosition);
    this.scaleMultiplier = clamp(scaleMultiplier, 0.3, 1.8);
    this.transitionTargetWorldScale = this.targetWorldScale * this.scaleMultiplier;
    this.transitionElapsedSeconds = this.transitionDurationSeconds;
    this.resetReturnTransitionVisuals(false);
    this.applyScreenCenteredLayout(parent);
  }

  isReturnTransitionComplete(): boolean {
    return (
      this.transitionKind === 'return' &&
      this.transitionElapsedSeconds >= this.transitionDurationSeconds
    );
  }

  isReturnTransitionActive(): boolean {
    return (
      this.transitionKind === 'return' &&
      this.transitionElapsedSeconds < this.transitionDurationSeconds
    );
  }

  consumeReturnCapturePulse(): boolean {
    if (!this.returnCapturePending) {
      return false;
    }

    this.returnCapturePending = false;
    return true;
  }

  applyScreenCenteredLayout(parent: Group): void {
    parent.updateMatrixWorld(true);
    parent.getWorldScale(TEMP_PARENT_SCALE);
    const parentScale = getMaxAbsScale(TEMP_PARENT_SCALE);
    const progress = this.getTransitionProgress();
    let targetWorldScale: number;

    if (this.transitionKind === 'return') {
      targetWorldScale = this.applyReturnWorldLayout(progress);
    } else {
      const introProgress = smoothstep(progress);
      targetWorldScale = lerp(
        this.transitionSourceWorldScale,
        this.transitionTargetWorldScale,
        introProgress,
      );
      TEMP_FOCUS_WORLD_POSITION
        .copy(this.transitionSourceWorldPosition)
        .lerp(this.targetWorldPosition, introProgress);
      this.transitionVelocityWorld
        .copy(this.targetWorldPosition)
        .sub(this.transitionSourceWorldPosition);
      this.transitionVisualGroup.rotation.z = 0;
      this.transitionVisualGroup.scale.set(1, 1, 1);
      this.setFocusAtmosphereIntensity(1);
    }

    parent.worldToLocal(TEMP_FOCUS_LOCAL_POSITION.copy(TEMP_FOCUS_WORLD_POSITION));
    parent.getWorldQuaternion(TEMP_PARENT_QUATERNION);

    this.root.position.copy(TEMP_FOCUS_LOCAL_POSITION);
    this.root.quaternion.copy(TEMP_PARENT_QUATERNION).invert();
    this.root.scale.setScalar(targetWorldScale / parentScale);
  }

  private getTransitionProgress(): number {
    if (this.transitionDurationSeconds <= 0.000001) {
      return 1;
    }

    return clamp01(
      this.transitionElapsedSeconds / this.transitionDurationSeconds,
    );
  }

  private applyReturnWorldLayout(progress: number): number {
    if (progress >= 1) {
      TEMP_FOCUS_WORLD_POSITION.copy(this.targetWorldPosition);
      this.transitionVelocityWorld
        .copy(this.targetWorldPosition)
        .sub(this.returnControlPoint2);
      this.transitionVisualGroup.rotation.z = 0;
      this.transitionVisualGroup.scale.set(1, 1, 1);
      this.setFocusAtmosphereIntensity(1);
      this.returnPathProgress = 1;
      return this.transitionTargetWorldScale;
    }

    if (progress < RETURN_ANTICIPATION_END) {
      const phase = clamp01(progress / RETURN_ANTICIPATION_END);
      const compression = Math.sin(phase * Math.PI);
      TEMP_FOCUS_WORLD_POSITION
        .copy(this.transitionSourceWorldPosition)
        .addScaledVector(
          this.returnThrowDirection,
          -this.returnThrowStrength *
            RETURN_ANTICIPATION_DISTANCE_SCALE *
            compression,
        );
      this.transitionVelocityWorld.copy(this.returnThrowDirection);
      this.transitionVisualGroup.rotation.z = Math.atan2(
        this.returnThrowDirection.y,
        this.returnThrowDirection.x,
      );
      this.transitionVisualGroup.scale.set(
        lerp(1, 0.94, compression),
        lerp(1, 1.03, compression),
        1,
      );
      this.setFocusAtmosphereIntensity(1 + 1.4 * smoothstep(phase));
      this.returnPathProgress = 0;
      return this.transitionSourceWorldScale;
    }

    this.returnPathProgress = getReturnPathProgress(progress);
    setCubicBezierPoint(
      TEMP_FOCUS_WORLD_POSITION,
      this.transitionSourceWorldPosition,
      this.returnControlPoint1,
      this.returnControlPoint2,
      this.targetWorldPosition,
      this.returnPathProgress,
    );
    setCubicBezierDerivative(
      this.transitionVelocityWorld,
      this.transitionSourceWorldPosition,
      this.returnControlPoint1,
      this.returnControlPoint2,
      this.targetWorldPosition,
      this.returnPathProgress,
    );

    const scaleProgress = smoothstep(
      (progress - RETURN_ANTICIPATION_END) /
        (RETURN_CAPTURE_END - RETURN_ANTICIPATION_END),
    );
    let worldScale = lerp(
      this.transitionSourceWorldScale,
      this.transitionTargetWorldScale,
      scaleProgress,
    );
    if (progress >= RETURN_CAPTURE_END) {
      const mergePhase = clamp01(
        (progress - RETURN_CAPTURE_END) / (1 - RETURN_CAPTURE_END),
      );
      worldScale =
        this.transitionTargetWorldScale *
        (1 + 0.06 * Math.sin(mergePhase * Math.PI));
    }

    this.applyReturnMotionStretch(progress);
    const launchPhase = clamp01(
      (progress - RETURN_ANTICIPATION_END) /
        (RETURN_LAUNCH_END - RETURN_ANTICIPATION_END),
    );
    this.setFocusAtmosphereIntensity(
      progress < RETURN_LAUNCH_END ? lerp(2.4, 1, launchPhase) : 1,
    );

    return worldScale;
  }

  private applyReturnMotionStretch(progress: number): void {
    if (
      progress >= RETURN_CAPTURE_END ||
      this.transitionVelocityWorld.lengthSq() <= MIN_DIRECTION_LENGTH_SQUARED
    ) {
      this.transitionVisualGroup.rotation.z = 0;
      this.transitionVisualGroup.scale.set(1, 1, 1);
      return;
    }

    const stretchEnvelope =
      progress <= RETURN_LAUNCH_END
        ? easeOutExpo(
            (progress - RETURN_ANTICIPATION_END) /
              (RETURN_LAUNCH_END - RETURN_ANTICIPATION_END),
          )
        : 1 -
          clamp01(
            (progress - RETURN_LAUNCH_END) /
              (RETURN_CAPTURE_END - RETURN_LAUNCH_END),
          );
    const relativeSpeed = clamp01(
      this.transitionVelocityWorld.length() /
        Math.max(this.returnThrowStrength * 3, 0.0001),
    );
    const stretch =
      1 + (RETURN_MAX_STRETCH - 1) * relativeSpeed * stretchEnvelope;
    this.transitionVisualGroup.rotation.z = Math.atan2(
      this.transitionVelocityWorld.y,
      this.transitionVelocityWorld.x,
    );
    this.transitionVisualGroup.scale.set(
      stretch,
      1 / Math.sqrt(stretch),
      1,
    );
  }

  private applyReturnMotion(motion: FocusedBodyReturnMotion): void {
    this.returnThrowDirection.set(
      motion.throwDirection.x,
      motion.throwDirection.y,
      motion.throwDirection.z,
    );
    if (
      !isFiniteVector(this.returnThrowDirection) ||
      this.returnThrowDirection.lengthSq() <= MIN_DIRECTION_LENGTH_SQUARED
    ) {
      this.returnThrowDirection.set(0, 1, 0);
    } else {
      this.returnThrowDirection.normalize();
    }

    this.returnThrowStrength = Number.isFinite(motion.throwStrength)
      ? clamp(
          motion.throwStrength,
          RETURN_THROW_MIN_STRENGTH,
          RETURN_THROW_MAX_STRENGTH,
        )
      : getFocusedBodyReturnThrowStrength(null);
  }

  private createReturnBezierControlPoints(): void {
    this.returnControlPoint1
      .copy(this.transitionSourceWorldPosition)
      .addScaledVector(this.returnThrowDirection, this.returnThrowStrength);
    clampReturnControlPoint(this.returnControlPoint1);

    TEMP_CONTROL_POINT_DELTA
      .copy(this.returnControlPoint1)
      .sub(this.transitionSourceWorldPosition);
    if (TEMP_CONTROL_POINT_DELTA.dot(this.returnThrowDirection) <= 0.0001) {
      this.returnControlPoint1
        .copy(this.transitionSourceWorldPosition)
        .addScaledVector(
          this.returnThrowDirection,
          Math.min(this.returnThrowStrength, FOCUS_VIEWPORT_HEIGHT * 0.04),
        );
      clampReturnControlPoint(this.returnControlPoint1);
    }

    this.returnControlPoint2.copy(this.targetWorldPosition);
    if (this.returnOrbitTangent.lengthSq() > MIN_DIRECTION_LENGTH_SQUARED) {
      this.returnControlPoint2.addScaledVector(
        this.returnOrbitTangent,
        RETURN_TANGENT_LEAD_IN,
      );
    }
  }

  private updateTransitionStreaks(): void {
    if (!this.transitionStreakMesh || !this.transitionStreakMaterial) {
      return;
    }

    const progress = this.getTransitionProgress();
    const introActive = this.transitionKind === 'intro' && progress < 1;
    const returnActive = this.transitionKind === 'return' && progress < 1;
    this.transitionStreakMesh.visible = introActive || returnActive;

    if (!this.transitionStreakMesh.visible) {
      this.transitionStreakMaterial.uniforms.opacity.value = 0;
      return;
    }

    if (introActive) {
      this.transitionStreakMesh.position.set(
        0,
        0,
        -this.definition.radius * 1.6,
      );
      this.transitionStreakMesh.rotation.z = 0;
      this.transitionStreakMesh.scale.set(1, 1, 1);
      this.transitionStreakMaterial.uniforms.progress.value = progress;
      this.transitionStreakMaterial.uniforms.opacity.value =
        Math.sin(progress * Math.PI) * 0.85;
      return;
    }

    TEMP_STREAK_DIRECTION.copy(this.transitionVelocityWorld);
    if (TEMP_STREAK_DIRECTION.lengthSq() <= MIN_DIRECTION_LENGTH_SQUARED) {
      TEMP_STREAK_DIRECTION.copy(this.returnThrowDirection);
    } else {
      TEMP_STREAK_DIRECTION.normalize();
    }
    const captureFade =
      progress < RETURN_LAUNCH_END
        ? smoothstep(
            (progress - RETURN_ANTICIPATION_END) / 0.06,
          )
        : progress < RETURN_CAPTURE_END
          ? lerp(
              0.95,
              0.25,
              smoothstep(
                (progress - RETURN_LAUNCH_END) /
                  (RETURN_CAPTURE_END - RETURN_LAUNCH_END),
              ),
            )
          : 0.25 *
            (1 -
              clamp01(
                (progress - RETURN_CAPTURE_END) /
                  (1 - RETURN_CAPTURE_END),
              ));
    this.transitionStreakMesh.position.set(
      -TEMP_STREAK_DIRECTION.x * this.definition.radius * 2.1,
      -TEMP_STREAK_DIRECTION.y * this.definition.radius * 2.1,
      -this.definition.radius * 1.6,
    );
    this.transitionStreakMesh.rotation.z = Math.atan2(
      TEMP_STREAK_DIRECTION.y,
      TEMP_STREAK_DIRECTION.x,
    );
    this.transitionStreakMesh.scale.set(1.75, 0.62, 1);
    this.transitionStreakMaterial.uniforms.progress.value =
      this.returnPathProgress;
    this.transitionStreakMaterial.uniforms.opacity.value = captureFade;
  }

  private updateReturnAfterimages(parent: Group): void {
    const progress = this.getTransitionProgress();
    if (
      this.transitionKind !== 'return' ||
      progress < RETURN_ANTICIPATION_END ||
      progress >= RETURN_CAPTURE_PULSE_PROGRESS
    ) {
      this.hideReturnAfterimages();
      return;
    }

    parent.getWorldScale(TEMP_PARENT_SCALE);
    const parentScale = getMaxAbsScale(TEMP_PARENT_SCALE);
    const fadeEnvelope =
      progress < RETURN_LAUNCH_END
        ? smoothstep(
            (progress - RETURN_ANTICIPATION_END) /
              (RETURN_LAUNCH_END - RETURN_ANTICIPATION_END),
          )
        : 1 -
          smoothstep(
            (progress - RETURN_LAUNCH_END) /
              (RETURN_CAPTURE_PULSE_PROGRESS - RETURN_LAUNCH_END),
          );

    this.returnAfterimages.forEach(({ mesh, material }, index) => {
      const sampleOffset = 0.035 + index * 0.04;
      const sampleProgress = clamp01(this.returnPathProgress - sampleOffset);
      setCubicBezierPoint(
        TEMP_AFTERIMAGE_WORLD_POSITION,
        this.transitionSourceWorldPosition,
        this.returnControlPoint1,
        this.returnControlPoint2,
        this.targetWorldPosition,
        sampleProgress,
      );
      parent.worldToLocal(
        TEMP_AFTERIMAGE_LOCAL_POSITION.copy(TEMP_AFTERIMAGE_WORLD_POSITION),
      );
      const sampleWorldScale = lerp(
        this.transitionSourceWorldScale,
        this.transitionTargetWorldScale,
        smoothstep(sampleProgress),
      );
      mesh.position.copy(TEMP_AFTERIMAGE_LOCAL_POSITION);
      mesh.scale.setScalar(
        (sampleWorldScale * (1 - index * 0.055)) / parentScale,
      );
      mesh.visible = fadeEnvelope > 0.01;
      material.opacity = fadeEnvelope * (0.28 - index * 0.045);
    });
  }

  private hideReturnAfterimages(): void {
    this.returnAfterimages.forEach(({ mesh, material }) => {
      mesh.visible = false;
      material.opacity = 0;
    });
  }

  private resetReturnTransitionVisuals(cancelRipple: boolean): void {
    this.transitionVisualGroup.rotation.z = 0;
    this.transitionVisualGroup.scale.set(1, 1, 1);
    this.setFocusAtmosphereIntensity(1);
    this.hideReturnAfterimages();
    if (this.transitionStreakMesh) {
      this.transitionStreakMesh.visible = false;
    }
    if (cancelRipple) {
      this.returnRippleElapsedSeconds = RETURN_RIPPLE_DURATION_SECONDS;
      if (this.returnRippleMesh) {
        this.returnRippleMesh.visible = false;
      }
    }
  }

  private setFocusAtmosphereIntensity(intensity: number): void {
    if (this.focusAtmosphereMaterial) {
      this.focusAtmosphereMaterial.uniforms.intensity.value = intensity;
    }
  }

  getWorldPosition(target: Vector3): Vector3 {
    return this.root.getWorldPosition(target);
  }

  getMaxWorldScale(target: Vector3): number {
    this.root.getWorldScale(target);

    return Math.max(Math.abs(target.x), Math.abs(target.y), Math.abs(target.z));
  }

  dispose(): void {
    this.disposed = true;
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private addBodyMesh(): void {
    const profile = getFocusPlanetProfile(
      this.definition.id as InteractiveCelestialBodyId,
    );

    const geometry = new SphereGeometry(
      this.definition.radius,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const materialBundle = createUnlitPlaceholderBodyMaterial(this.definition, {
      includeRotationMarker: false,
    });
    materialBundle.material.transparent = true;
    materialBundle.material.opacity = 1;
    materialBundle.material.depthTest = false;
    materialBundle.material.depthWrite = false;

    const mesh = new Mesh(geometry, materialBundle.material);
    mesh.name = `focus-${this.definition.id}-placeholder-sphere`;
    mesh.renderOrder = FOCUS_RENDER_ORDER;
    this.spinGroup.add(mesh);
    this.focusBodyGeometry = geometry;
    this.focusBodyMaterial = materialBundle.material;
    this.geometries.push(geometry);
    this.materials.push(materialBundle.material);
    this.textures.push(...materialBundle.textures);
    this.applyFocusAlbedoTexture(profile, materialBundle.material);
    this.addFocusProfileLayers(profile);
  }

  private applyFocusAlbedoTexture(
    profile: FocusPlanetProfile,
    material: MeshBasicMaterial,
  ): void {
    const texturePath = getTextureAssetPath(profile.albedo);
    if (!texturePath) {
      return;
    }

    this.applyLoadedTexture(texturePath, (texture) => {
      material.map = texture;
      material.needsUpdate = true;
      this.returnAfterimages.forEach(({ material: afterimageMaterial }) => {
        afterimageMaterial.map = texture;
        afterimageMaterial.needsUpdate = true;
      });
    });
  }

  private addFocusProfileLayers(profile: FocusPlanetProfile): void {
    if (profile.shadow) {
      this.addFocusShadowLayer(profile.shadow);
    }

    profile.overlays.forEach((overlay) => {
      switch (overlay.kind) {
        case 'luminanceTexture':
          this.addLuminanceTextureOverlay(overlay);
          break;
        case 'nightLights':
          this.addNightLightsOverlay(overlay);
          break;
        case 'haze':
        case 'bands':
        case 'dust':
        case 'winds':
          this.addProceduralOverlay(overlay);
          break;
      }
    });

    if (profile.atmosphere) {
      this.addFocusAtmosphereLayer(profile.atmosphere);
    }
  }

  private addNightLightsOverlay(
    overlay: FocusNightLightsOverlayProfile,
  ): void {
    const geometry = new SphereGeometry(
      this.definition.radius * overlay.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      blending: AdditiveBlending,
      uniforms: {
        lightDirection: { value: FOCUS_LIGHT_DIRECTION },
        nightMap: { value: null },
        opacity: { value: overlay.opacity },
      },
      vertexShader: EARTH_LIGHTING_VERTEX_SHADER,
      fragmentShader: EARTH_NIGHT_LIGHT_FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-night-lights-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 3;
    mesh.visible = false;
    this.spinGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
    this.applyOverlayTexture(overlay.texture, (texture) => {
      material.uniforms.nightMap.value = texture;
      material.needsUpdate = true;
      mesh.visible = true;
    });
  }

  private addFocusShadowLayer(profile: FocusShadowProfile): void {
    const geometry = new SphereGeometry(
      this.definition.radius * profile.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        lightDirection: { value: FOCUS_LIGHT_DIRECTION },
        shadowColor: { value: new Color(profile.color) },
        opacity: { value: profile.opacity },
      },
      vertexShader: EARTH_LIGHTING_VERTEX_SHADER,
      fragmentShader: EARTH_SHADOW_FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name =
      this.definition.id === 'earth'
        ? 'focus-earth-terminator-shadow-shell'
        : `focus-${this.definition.id}-shadow-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 1;
    this.spinGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addLuminanceTextureOverlay(
    overlay: FocusLuminanceTextureOverlayProfile,
  ): void {
    const overlayGroup = this.addOverlaySpinGroup(overlay.id, overlay.speedScale);

    const geometry = new SphereGeometry(
      this.definition.radius * overlay.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        overlayMap: { value: null },
        lightDirection: { value: FOCUS_LIGHT_DIRECTION },
        colorA: { value: new Color(overlay.colorA) },
        colorB: { value: new Color(overlay.colorB) },
        opacity: { value: overlay.opacity },
        alphaLow: { value: overlay.alphaLow },
        alphaHigh: { value: overlay.alphaHigh },
      },
      vertexShader: EARTH_LIGHTING_VERTEX_SHADER,
      fragmentShader: EARTH_CLOUD_FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-${overlay.id}-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 2;
    mesh.visible = false;
    overlayGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
    this.applyOverlayTexture(overlay.texture, (texture) => {
      material.uniforms.overlayMap.value = texture;
      material.needsUpdate = true;
      mesh.visible = true;
    });
  }

  private addProceduralOverlay(
    overlay: FocusProceduralOverlayProfile,
  ): void {
    const overlayGroup = this.addOverlaySpinGroup(overlay.id, overlay.speedScale);
    const geometry = new SphereGeometry(
      this.definition.radius * overlay.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        overlayColor: { value: new Color(overlay.color) },
        opacity: { value: overlay.opacity },
        bandFrequency: { value: overlay.bandFrequency ?? 12 },
        bandStrength: { value: overlay.bandStrength ?? 0.18 },
        noiseStrength: { value: overlay.noiseStrength ?? 0.16 },
      },
      vertexShader: FOCUS_SHELL_VERTEX_SHADER,
      fragmentShader: FOCUS_PROCEDURAL_OVERLAY_FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-${overlay.id}-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 2;
    overlayGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addFocusAtmosphereLayer(profile: FocusAtmosphereProfile): void {
    const geometry = new SphereGeometry(
      this.definition.radius * profile.radiusScale,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        glowColor: { value: new Color(profile.color) },
        opacity: { value: profile.opacity },
        rimPower: { value: profile.rimPower },
        intensity: { value: 1 },
      },
      vertexShader: EARTH_ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: EARTH_ATMOSPHERE_FRAGMENT_SHADER,
      blending: AdditiveBlending,
      side: BackSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-atmosphere-shell`;
    mesh.renderOrder = FOCUS_RENDER_ORDER + 4;
    this.spinGroup.add(mesh);
    this.focusAtmosphereMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addTransitionStreaks(): void {
    const size = this.definition.radius * 7;
    const geometry = new PlaneGeometry(size, size);
    const material = new ShaderMaterial({
      uniforms: {
        progress: { value: 0 },
        opacity: { value: 0 },
      },
      vertexShader: INTRO_STREAK_VERTEX_SHADER,
      fragmentShader: INTRO_STREAK_FRAGMENT_SHADER,
      blending: AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-transition-streaks`;
    // Behind the body along the camera axis; the root is camera-aligned.
    mesh.position.z = -this.definition.radius * 1.6;
    mesh.renderOrder = FOCUS_RENDER_ORDER - 1;
    mesh.visible = false;
    mesh.layers.enable(BLOOM_RENDER_LAYER);
    this.root.add(mesh);
    this.transitionStreakMesh = mesh;
    this.transitionStreakMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addReturnAfterimages(): void {
    if (!this.focusBodyGeometry || !this.focusBodyMaterial) {
      return;
    }

    for (let index = 0; index < RETURN_AFTERIMAGE_COUNT; index += 1) {
      const material = this.focusBodyMaterial.clone();
      material.blending = AdditiveBlending;
      material.transparent = true;
      material.opacity = 0;
      material.depthTest = false;
      material.depthWrite = false;
      const mesh = new Mesh(this.focusBodyGeometry, material);
      mesh.name = `focus-${this.definition.id}-return-afterimage-${index}`;
      mesh.renderOrder = RETURN_AFTERIMAGE_RENDER_ORDER - index;
      mesh.visible = false;
      mesh.layers.enable(BLOOM_RENDER_LAYER);
      this.transitionVfxRoot.add(mesh);
      this.returnAfterimages.push({ mesh, material });
      this.materials.push(material);
    }
  }

  private addReturnRipple(): void {
    const geometry = new RingGeometry(
      this.definition.radius * 1.08,
      this.definition.radius * 1.24,
      RING_SEGMENTS,
    );
    const material = new ShaderMaterial({
      uniforms: {
        color: { value: new Color(this.definition.markerColor) },
        opacity: { value: 0 },
        progress: { value: 0 },
      },
      vertexShader: RETURN_RIPPLE_VERTEX_SHADER,
      fragmentShader: RETURN_RIPPLE_FRAGMENT_SHADER,
      blending: AdditiveBlending,
      side: DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new Mesh(geometry, material);
    mesh.name = `focus-${this.definition.id}-return-capture-ripple`;
    mesh.renderOrder = RETURN_RIPPLE_RENDER_ORDER;
    mesh.visible = false;
    mesh.layers.enable(BLOOM_RENDER_LAYER);
    this.transitionVfxRoot.add(mesh);
    this.returnRippleMesh = mesh;
    this.returnRippleMaterial = material;
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addOverlaySpinGroup(id: string, speedScale: number): Group {
    const group = new Group();
    group.name = `focus-${this.definition.id}-${id}-spin`;
    this.tiltGroup.add(group);
    this.overlaySpinGroups.push({ group, speedScale });

    return group;
  }

  private applyOverlayTexture(
    asset: TextureAsset,
    apply: (texture: Texture) => void,
  ): void {
    const texturePath = getTextureAssetPath(asset);
    if (!texturePath) {
      return;
    }

    this.applyLoadedTexture(texturePath, apply);
  }

  private applyLoadedTexture(
    path: string,
    apply: (texture: Texture) => void,
  ): void {
    void loadTexture(path).then((texture) => {
      if (!texture || this.disposed) {
        return;
      }

      this.textures.push(texture);
      apply(texture);
    });
  }

  private addPlanetRing(): void {
    if (!this.definition.ring) {
      return;
    }

    const profile = getFocusPlanetProfile(
      this.definition.id as InteractiveCelestialBodyId,
    );

    // With the camera on +Z and a positive local X opening rotation, the
    // 0..PI half has +Z depth (near side) and PI..2PI has -Z depth (far side).
    // Splitting on the local X axis keeps both seams on the projected ellipse's
    // node line, where the two painter-order halves meet cleanly.
    const frontGeometry = new RingGeometry(
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
      RING_HALF_SEGMENTS,
      1,
      0,
      Math.PI,
    );
    const backGeometry = new RingGeometry(
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
      RING_HALF_SEGMENTS,
      1,
      Math.PI,
      Math.PI,
    );
    applyRadialRingTextureUvs(
      frontGeometry,
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
    );
    applyRadialRingTextureUvs(
      backGeometry,
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
    );
    const material = createSaturnRingMaterial(
      this.definition.ring.color,
      Math.min(0.88, this.definition.ring.opacity + 0.18),
    );
    material.depthTest = false;
    material.depthWrite = false;

    const ring = new Group();
    ring.name = `focus-${this.definition.id}-ring`;
    ring.rotation.x = FOCUS_RING_OPEN_ANGLE;

    const backHalf = new Mesh(backGeometry, material);
    backHalf.name = `focus-${this.definition.id}-ring-back`;
    backHalf.renderOrder = FOCUS_RING_BACK_RENDER_ORDER;

    const frontHalf = new Mesh(frontGeometry, material);
    frontHalf.name = `focus-${this.definition.id}-ring-front`;
    frontHalf.renderOrder = FOCUS_RING_FRONT_RENDER_ORDER;

    ring.add(backHalf, frontHalf);
    // Share the body's axial-tilt coordinates without inheriting self-rotation.
    // transitionVisualGroup remains an ancestor, so intro/return transforms
    // continue to move and stretch both ring halves with the focused body.
    this.tiltGroup.add(ring);
    this.geometries.push(backGeometry, frontGeometry);
    this.materials.push(material);
    this.applyFocusRingTexture(profile.ring, material);
  }

  private applyFocusRingTexture(
    profile: FocusRingProfile | undefined,
    material: MeshBasicMaterial,
  ): void {
    if (!profile) {
      return;
    }

    const texturePaths = profile.textureCandidates
      .map((asset) => getTextureAssetPath(asset))
      .filter((path): path is string => Boolean(path));

    void this.loadFirstAvailableTexture(texturePaths).then((texture) => {
      if (!texture || this.disposed) {
        return;
      }

      this.textures.push(texture);
      material.map = texture;
      material.color.set(0xffffff);
      material.opacity = Math.min(1, material.opacity + profile.opacityBoost);
      material.transparent = true;
      material.depthWrite = false;
      material.needsUpdate = true;
    });
  }

  private async loadFirstAvailableTexture(
    paths: readonly string[],
  ): Promise<Texture | null> {
    for (const path of paths) {
      if (this.disposed) {
        return null;
      }

      const texture = await loadTexture(path);
      if (texture) {
        return texture;
      }
    }

    return null;
  }
}

export function getFocusedBodyScreenHeightFraction(
  definition: CelestialBodyDefinition,
): number {
  return lerp(
    FOCUS_BODY_MIN_SCREEN_HEIGHT_FRACTION,
    FOCUS_BODY_MAX_SCREEN_HEIGHT_FRACTION,
    inverseLerp(
      FOCUS_MIN_REFERENCE_RADIUS,
      FOCUS_MAX_REFERENCE_RADIUS,
      definition.radius,
    ),
  );
}

export function getFocusedBodyWorldScale(
  definition: CelestialBodyDefinition,
): number {
  const targetDiameter =
    FOCUS_VIEWPORT_HEIGHT * getFocusedBodyScreenHeightFraction(definition);

  return targetDiameter / Math.max(definition.radius * 2, 0.0001);
}

export function getFocusedBodyReturnThrowStrength(
  peakSpeed: number | null,
): number {
  const normalizedSpeed =
    peakSpeed !== null && Number.isFinite(peakSpeed)
      ? clamp01(peakSpeed / RETURN_THROW_PEAK_SPEED_REFERENCE)
      : 0.5;

  return lerp(
    RETURN_THROW_MIN_STRENGTH,
    RETURN_THROW_MAX_STRENGTH,
    normalizedSpeed,
  );
}

function getReturnPathProgress(progress: number): number {
  if (progress < RETURN_LAUNCH_END) {
    const phase =
      (progress - RETURN_ANTICIPATION_END) /
      (RETURN_LAUNCH_END - RETURN_ANTICIPATION_END);
    return lerp(0, RETURN_LAUNCH_PATH_END, easeOutExpo(phase));
  }

  if (progress < RETURN_CAPTURE_END) {
    const phase =
      (progress - RETURN_LAUNCH_END) /
      (RETURN_CAPTURE_END - RETURN_LAUNCH_END);
    return lerp(
      RETURN_LAUNCH_PATH_END,
      RETURN_CAPTURE_PATH_END,
      easeInOutCubic(phase),
    );
  }

  const phase =
    (progress - RETURN_CAPTURE_END) / (1 - RETURN_CAPTURE_END);
  return lerp(
    RETURN_CAPTURE_PATH_END,
    1,
    easeOutBack(phase),
  );
}

function getReturnSpinMultiplier(
  transitionKind: 'intro' | 'return' | null,
  progress: number,
): number {
  if (
    transitionKind !== 'return' ||
    progress < RETURN_ANTICIPATION_END ||
    progress >= RETURN_CAPTURE_END
  ) {
    return 1;
  }

  if (progress < RETURN_LAUNCH_END) {
    const launchPhase =
      (progress - RETURN_ANTICIPATION_END) /
      (RETURN_LAUNCH_END - RETURN_ANTICIPATION_END);
    return lerp(1, RETURN_MAX_SPIN_MULTIPLIER, easeOutExpo(launchPhase));
  }

  const capturePhase =
    (progress - RETURN_LAUNCH_END) /
    (RETURN_CAPTURE_END - RETURN_LAUNCH_END);
  return lerp(
    RETURN_MAX_SPIN_MULTIPLIER,
    1,
    easeInOutCubic(capturePhase),
  );
}

function setCubicBezierPoint(
  target: Vector3,
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  progress: number,
): void {
  const inverse = 1 - progress;
  const p0Weight = inverse ** 3;
  const p1Weight = 3 * inverse ** 2 * progress;
  const p2Weight = 3 * inverse * progress ** 2;
  const p3Weight = progress ** 3;

  target.set(
    p0.x * p0Weight + p1.x * p1Weight + p2.x * p2Weight + p3.x * p3Weight,
    p0.y * p0Weight + p1.y * p1Weight + p2.y * p2Weight + p3.y * p3Weight,
    p0.z * p0Weight + p1.z * p1Weight + p2.z * p2Weight + p3.z * p3Weight,
  );
}

function setCubicBezierDerivative(
  target: Vector3,
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  progress: number,
): void {
  const inverse = 1 - progress;

  target.set(
    3 * inverse ** 2 * (p1.x - p0.x) +
      6 * inverse * progress * (p2.x - p1.x) +
      3 * progress ** 2 * (p3.x - p2.x),
    3 * inverse ** 2 * (p1.y - p0.y) +
      6 * inverse * progress * (p2.y - p1.y) +
      3 * progress ** 2 * (p3.y - p2.y),
    3 * inverse ** 2 * (p1.z - p0.z) +
      6 * inverse * progress * (p2.z - p1.z) +
      3 * progress ** 2 * (p3.z - p2.z),
  );
}

function clampReturnControlPoint(point: Vector3): void {
  const extent = FOCUS_VIEWPORT_HEIGHT * RETURN_CONTROL_POINT_VIEW_FRACTION;
  point.x = clamp(point.x, -extent, extent);
  point.y = clamp(point.y, -extent, extent);
}

function getMaxAbsScale(scale: Vector3): number {
  return Math.max(
    Math.abs(scale.x),
    Math.abs(scale.y),
    Math.abs(scale.z),
    0.0001,
  );
}

function isFiniteVector(vector: Vector3): boolean {
  return (
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z)
  );
}

const EARTH_LIGHTING_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vViewNormal;

  void main() {
    vUv = uv;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_SHADOW_FRAGMENT_SHADER = `
  uniform vec3 lightDirection;
  uniform vec3 shadowColor;
  uniform float opacity;
  varying vec3 vViewNormal;

  void main() {
    float lightAmount = dot(normalize(vViewNormal), normalize(lightDirection));
    // A broad neutral falloff avoids drawing a visible colored band across the
    // surface while leaving enough overlap for city lights to emerge naturally.
    float darkness = 1.0 - smoothstep(-0.28, 0.58, lightAmount);
    gl_FragColor = vec4(shadowColor, darkness * opacity);
  }
`;

const INTRO_STREAK_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Radial hyperspace star-streaks rushing outward during the focus intro.
const INTRO_STREAK_FRAGMENT_SHADER = `
  uniform float progress;
  uniform float opacity;
  varying vec2 vUv;

  float hash(float value) {
    return fract(sin(value * 127.1) * 43758.5453);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered) * 2.0;
    float angle = atan(centered.y, centered.x);
    float lane = (angle + 3.14159265) * 10.5;
    float laneIndex = floor(lane);
    float laneNoise = hash(laneIndex);
    float lanePosition = fract(lane);
    float lineCore = pow(max(1.0 - abs(lanePosition - 0.5) * 2.0, 0.0), 5.0);
    float travel = fract(dist * 1.35 - progress * 2.4 - laneNoise);
    float streak = smoothstep(0.5, 1.0, travel);
    float radialMask = smoothstep(0.24, 0.52, dist) * (1.0 - smoothstep(0.7, 1.0, dist));
    float alpha = lineCore * streak * radialMask * opacity;
    vec3 color = mix(vec3(0.6, 0.84, 1.0), vec3(1.0), laneNoise * 0.6);

    gl_FragColor = vec4(color * alpha, alpha);
    #include <colorspace_fragment>
  }
`;

const EARTH_NIGHT_LIGHT_FRAGMENT_SHADER = `
  uniform sampler2D nightMap;
  uniform vec3 lightDirection;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vViewNormal;

  void main() {
    vec3 sampleColor = texture2D(nightMap, vUv).rgb;
    float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
    float lightAmount = dot(normalize(vViewNormal), normalize(lightDirection));
    float darkness = 1.0 - smoothstep(-0.2, 0.18, lightAmount);
    float cityBase = smoothstep(0.035, 0.24, luminance);
    float cityCore = smoothstep(0.18, 0.64, luminance);
    float alpha = (cityBase * 0.52 + cityCore * 0.48) * darkness * opacity;

    if (alpha < 0.01) {
      discard;
    }

    vec3 cityColor = mix(vec3(1.0, 0.48, 0.12), vec3(1.0, 0.86, 0.42), cityCore);
    cityColor *= 0.72 + cityCore * 0.88;
    gl_FragColor = vec4(cityColor, alpha);
  }
`;

const EARTH_CLOUD_FRAGMENT_SHADER = `
  uniform sampler2D overlayMap;
  uniform vec3 lightDirection;
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform float opacity;
  uniform float alphaLow;
  uniform float alphaHigh;
  varying vec2 vUv;
  varying vec3 vViewNormal;

  void main() {
    vec3 sampleColor = texture2D(overlayMap, vUv).rgb;
    float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
    float lightAmount = dot(normalize(vViewNormal), normalize(lightDirection));
    float dayAmount = smoothstep(-0.14, 0.42, lightAmount);
    float alpha = smoothstep(alphaLow, alphaHigh, luminance) * mix(opacity * 0.28, opacity, dayAmount);

    if (alpha < 0.01) {
      discard;
    }

    vec3 dayCloud = mix(colorA, colorB, clamp(luminance * 1.55, 0.0, 1.0));
    vec3 nightCloud = colorA * 0.16;
    vec3 cloudColor = mix(nightCloud, dayCloud, dayAmount);
    gl_FragColor = vec4(cloudColor, alpha);
  }
`;

const FOCUS_SHELL_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const FOCUS_PROCEDURAL_OVERLAY_FRAGMENT_SHADER = `
  uniform vec3 overlayColor;
  uniform float opacity;
  uniform float bandFrequency;
  uniform float bandStrength;
  uniform float noiseStrength;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  float hash(vec2 value) {
    return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));
    float bands = 0.5 + 0.5 * sin(vUv.y * bandFrequency * 6.283185 + sin(vUv.x * 6.283185) * 0.85);
    float grain = hash(vUv * vec2(23.0, 41.0));
    float procedural = mix(1.0, bands, bandStrength);
    procedural *= 1.0 + (grain - 0.5) * noiseStrength;
    float alpha = opacity * (0.42 + rim * 0.58) * procedural;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(overlayColor, alpha);
  }
`;

const EARTH_ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const EARTH_ATMOSPHERE_FRAGMENT_SHADER = `
  uniform vec3 glowColor;
  uniform float opacity;
  uniform float rimPower;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float rim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewDirection)));
    float alpha = smoothstep(0.28, 0.98, pow(rim, rimPower)) * opacity * intensity;
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

const RETURN_RIPPLE_VERTEX_SHADER = `
  varying vec2 vLocalPosition;

  void main() {
    vLocalPosition = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RETURN_RIPPLE_FRAGMENT_SHADER = `
  uniform vec3 color;
  uniform float opacity;
  uniform float progress;
  varying vec2 vLocalPosition;

  void main() {
    float angle = atan(vLocalPosition.y, vLocalPosition.x);
    float shimmer = 0.82 + 0.18 * sin(angle * 8.0 - progress * 18.0);
    float alpha = opacity * shimmer;
    gl_FragColor = vec4(color * (1.0 + (1.0 - progress) * 0.7), alpha);
    #include <colorspace_fragment>
  }
`;

const TEMP_PARENT_SCALE = new Vector3();
const TEMP_PARENT_QUATERNION = new Quaternion();
const TEMP_FOCUS_WORLD_POSITION = new Vector3();
const TEMP_FOCUS_LOCAL_POSITION = new Vector3();
const TEMP_CURRENT_WORLD_POSITION = new Vector3();
const TEMP_CURRENT_WORLD_SCALE = new Vector3();
const TEMP_CONTROL_POINT_DELTA = new Vector3();
const TEMP_STREAK_DIRECTION = new Vector3();
const TEMP_AFTERIMAGE_WORLD_POSITION = new Vector3();
const TEMP_AFTERIMAGE_LOCAL_POSITION = new Vector3();
const TEMP_RIPPLE_LOCAL_POSITION = new Vector3();
