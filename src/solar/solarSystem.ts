import {
  AmbientLight,
  BufferGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type Camera,
} from 'three';
import { clamp01 } from '../utils/math';
import {
  CelestialBody,
  type CelestialBodyRenderState,
  type CelestialBodyInteractionVisualState,
} from './celestialBody';
import {
  type PreviewLayout,
  estimateWorldRadiusInStagePixels,
  mapWorldToStagePixel,
} from '../interaction/coordinateMapping';
import {
  CELESTIAL_BODY_DEFINITIONS,
  INTERACTIVE_CELESTIAL_BODY_DEFINITIONS,
  SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
  getCelestialBodyDefinition,
  getOriginalOrbitTransform,
  type CelestialBodyDefinition,
  type CelestialBodyId,
  type CelestialOriginalOrbitTransform,
  type InteractiveCelestialBodyId,
} from './solarSystemData';
import { FocusedCelestialBody } from './focusedCelestialBody';

export interface CelestialBodyScreenTarget {
  id: InteractiveCelestialBodyId;
  label: string;
  screenPosition: {
    x: number;
    y: number;
  };
  visible: boolean;
  hitRadiusPx: number;
  originalOrbit: CelestialOriginalOrbitTransform;
}

export interface FocusedCelestialBodyScreenTarget {
  id: InteractiveCelestialBodyId;
  screenPosition: {
    x: number;
    y: number;
  };
  visible: boolean;
  bodyRadiusPx: number;
  hitRadiusPx: number;
  layout: PreviewLayout;
}

export interface SolarSystemTransform {
  position?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
  quaternion?: Quaternion;
  scale?: number;
}

const PREVIEW_TILT_X = -0.58;
const PREVIEW_TILT_Y = 0.12;
const DEFAULT_SCALE = 1;
const MIN_OPEN_SCALE = 0.08;
const CONTROL_ENDPOINT_RING_INNER_RADIUS = 0.075;
const CONTROL_ENDPOINT_RING_OUTER_RADIUS = 0.11;
const CONTROL_ENDPOINT_DOT_RADIUS = 0.025;
const CONTROL_ENDPOINT_SEGMENTS = 40;
const CONTROL_ENDPOINT_Z_OFFSET = 0.035;
const CONTROL_ENDPOINT_RENDER_ORDER = 40;
const LEFT_ENDPOINT_COLOR = 0x7dd3fc;
const RIGHT_ENDPOINT_COLOR = 0xf6c177;
const MIN_BODY_HIT_RADIUS_PX = 44;
const SMALL_BODY_EXTRA_HIT_RADIUS_PX = 22;

export class CodePlaceholderSolarSystem {
  readonly group = new Group();

  private readonly bodies = new Map<CelestialBodyId, CelestialBody>();
  private readonly focusedBodies = new Map<InteractiveCelestialBodyId, FocusedCelestialBody>();
  private readonly controlEndpoints: Group[] = [];
  private readonly endpointGeometries: BufferGeometry[] = [];
  private readonly endpointMaterials: Material[] = [];
  private readonly baseScale = new Vector3(DEFAULT_SCALE, DEFAULT_SCALE, DEFAULT_SCALE);
  private visibleRequested = false;
  private openingProgress = 0;
  private focusedBody: InteractiveCelestialBodyId | null = null;

  constructor() {
    this.group.name = 'code-placeholder-solar-system';
    this.group.visible = false;
    this.group.rotation.set(PREVIEW_TILT_X, PREVIEW_TILT_Y, 0);
    this.addLights();
    this.createBodies();
    this.addControlEndpoints();
    this.addFocusViewBodies();
    this.applyVisibility();
  }

  update(deltaSeconds: number): void {
    if (!this.group.visible) {
      return;
    }

    this.bodies.forEach((body) => body.update(deltaSeconds));
    if (this.focusedBody) {
      this.focusedBodies.get(this.focusedBody)?.update(deltaSeconds, this.group);
    }
  }

  setVisible(visible: boolean): void {
    this.visibleRequested = visible;
    this.applyVisibility();
  }

  setOpeningProgress(progress: number): void {
    this.openingProgress = clamp01(progress);
    this.applyVisibility();
  }

  setTransform(transform: SolarSystemTransform): void {
    if (transform.position) {
      this.group.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z,
      );
    }

    if (transform.quaternion) {
      this.group.quaternion.copy(transform.quaternion);
    } else if (transform.rotation) {
      this.group.rotation.set(
        transform.rotation.x,
        transform.rotation.y,
        transform.rotation.z,
      );
    }

    if (transform.scale !== undefined) {
      this.baseScale.setScalar(transform.scale);
      this.applyVisibility();
    }

    this.updateFocusedBodyLayout();
  }

  getInteractiveBodyDefinitions(): readonly CelestialBodyDefinition[] {
    return INTERACTIVE_CELESTIAL_BODY_DEFINITIONS;
  }

  getBodyDefinition(id: CelestialBodyId): CelestialBodyDefinition {
    return getCelestialBodyDefinition(id);
  }

  getBodyOriginalOrbitTransform(
    id: InteractiveCelestialBodyId,
  ): CelestialOriginalOrbitTransform {
    return getOriginalOrbitTransform(id);
  }

  setBodyLabelVisible(id: InteractiveCelestialBodyId, visible: boolean): void {
    this.getBodyById(id).setLabelVisible(visible);
  }

  getBodyWorldPosition(
    id: InteractiveCelestialBodyId,
    target: Vector3,
  ): Vector3 {
    return this.getBodyById(id).getWorldPosition(target);
  }

  getBodyRenderOpacity(id: CelestialBodyId): number | null {
    return this.getBodyById(id).getBodyOpacity();
  }

  getBodyRenderState(id: CelestialBodyId): CelestialBodyRenderState | null {
    return this.getBodyById(id).getBodyRenderState();
  }

  getInteractiveBodyScreenTargets(
    camera: Camera,
    layout: PreviewLayout,
  ): CelestialBodyScreenTarget[] {
    return INTERACTIVE_CELESTIAL_BODY_DEFINITIONS.flatMap((definition) => {
      const body = this.getBodyById(definition.id as InteractiveCelestialBodyId);
      const worldPosition = body.getWorldPosition(TEMP_WORLD_POSITION);
      const projected = mapWorldToStagePixel(worldPosition, layout, camera);

      if (!projected) {
        return [];
      }

      const worldScale = body.getMaxWorldScale(TEMP_WORLD_SCALE);
      const projectedRadius =
        estimateWorldRadiusInStagePixels(
          worldPosition,
          definition.activationHitRadius * worldScale,
          layout,
          camera,
        ) ?? 0;
      const smallBodyPadding =
        definition.id === 'mercury' || definition.id === 'moon'
          ? SMALL_BODY_EXTRA_HIT_RADIUS_PX
          : 0;

      return [
        {
          id: definition.id as InteractiveCelestialBodyId,
          label: definition.label,
          screenPosition: {
            x: projected.x,
            y: projected.y,
          },
          visible: projected.visible,
          hitRadiusPx:
            Math.max(MIN_BODY_HIT_RADIUS_PX, projectedRadius) +
            smallBodyPadding,
          originalOrbit: getOriginalOrbitTransform(
            definition.id as InteractiveCelestialBodyId,
          ),
        },
      ];
    });
  }

  getFocusedBodyScreenTarget(
    id: InteractiveCelestialBodyId,
    camera: Camera,
    layout: PreviewLayout,
  ): FocusedCelestialBodyScreenTarget | null {
    const focusedBody = this.focusedBodies.get(id);

    if (!focusedBody || !focusedBody.root.visible) {
      return null;
    }

    const definition = getCelestialBodyDefinition(id);
    const worldPosition = focusedBody.getWorldPosition(TEMP_FOCUS_WORLD_POSITION);
    const projected = mapWorldToStagePixel(worldPosition, layout, camera);

    if (!projected) {
      return null;
    }

    const worldScale = focusedBody.getMaxWorldScale(TEMP_FOCUS_WORLD_SCALE);
    const bodyRadiusPx =
      estimateWorldRadiusInStagePixels(
        worldPosition,
        definition.radius * worldScale,
        layout,
        camera,
      ) ?? MIN_BODY_HIT_RADIUS_PX;

    return {
      id,
      screenPosition: {
        x: projected.x,
        y: projected.y,
      },
      visible: projected.visible,
      bodyRadiusPx,
      hitRadiusPx: Math.max(bodyRadiusPx + 36, MIN_BODY_HIT_RADIUS_PX * 1.4),
      layout,
    };
  }

  setFocusedBodyPlacement(input: {
    focusedBody: InteractiveCelestialBodyId;
    worldPosition: {
      x: number;
      y: number;
      z: number;
    };
    scaleMultiplier: number;
  }): void {
    this.focusedBodies.get(input.focusedBody)?.setWorldPlacement(
      this.group,
      TEMP_FOCUS_CONTROL_POSITION.set(
        input.worldPosition.x,
        input.worldPosition.y,
        input.worldPosition.z,
      ),
      input.scaleMultiplier,
    );
  }

  applyBodyInteractionState(input: {
    hoveredBody: InteractiveCelestialBodyId | null;
    activatedBody: InteractiveCelestialBodyId | null;
    focusedBody?: InteractiveCelestialBodyId | null;
  }): void {
    const nextFocusedBody = input.focusedBody ?? null;
    const focusEntered =
      nextFocusedBody !== null && nextFocusedBody !== this.focusedBody;
    this.focusedBody = nextFocusedBody;
    const focusActive = Boolean(this.focusedBody);
    this.controlEndpoints.forEach((endpoint) => {
      endpoint.visible = !focusActive;
    });
    this.focusedBodies.forEach((body, id) => {
      body.setVisible(this.focusedBody === id);
    });
    if (focusEntered && this.focusedBody) {
      this.startFocusedBodyIntro(this.focusedBody);
    } else {
      this.updateFocusedBodyLayout();
    }
    this.bodies.forEach((body) => body.setFocusBackgroundDimmed(focusActive));

    INTERACTIVE_CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = this.getBodyById(definition.id as InteractiveCelestialBodyId);
      const state = getBodyVisualState(definition.id as InteractiveCelestialBodyId, input);
      body.setInteractionVisualState(state);
      body.setOrbitPaused(
        shouldPauseBodyOrbit(
          definition.id as InteractiveCelestialBodyId,
          input.activatedBody,
        ),
      );
    });
  }

  dispose(): void {
    this.bodies.forEach((body) => body.dispose());
    this.bodies.clear();
    this.focusedBodies.forEach((body) => body.dispose());
    this.focusedBodies.clear();
    this.endpointGeometries.forEach((geometry) => geometry.dispose());
    this.endpointMaterials.forEach((material) => material.dispose());
    this.endpointGeometries.length = 0;
    this.endpointMaterials.length = 0;
  }

  private addLights(): void {
    const ambient = new AmbientLight(0xb8c7ff, 0.68);
    const sunLight = new PointLight(0xffd48a, 5.5, 12, 1.4);
    ambient.name = 'placeholder-solar-ambient-light';
    sunLight.name = 'placeholder-solar-sun-light';
    sunLight.position.set(0, 0, 1.2);
    this.group.add(ambient, sunLight);
  }

  private createBodies(): void {
    CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = new CelestialBody(definition);
      this.bodies.set(definition.id, body);
    });

    CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = this.getBodyById(definition.id);

      if (definition.parentId) {
        const parent = this.bodies.get(definition.parentId);
        parent?.satelliteRoot.add(body.orbitPivot);
        return;
      }

      this.group.add(body.orbitPivot);
    });
  }

  private addControlEndpoints(): void {
    this.group.add(
      this.createControlEndpoint(
        'visual-left-control-endpoint',
        -SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
        LEFT_ENDPOINT_COLOR,
      ),
      this.createControlEndpoint(
        'visual-right-control-endpoint',
        SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X,
        RIGHT_ENDPOINT_COLOR,
      ),
    );
  }

  private createControlEndpoint(
    name: string,
    x: number,
    color: number,
  ): Group {
    const endpoint = new Group();
    endpoint.name = name;
    endpoint.position.set(x, 0, CONTROL_ENDPOINT_Z_OFFSET);

    const ringGeometry = new RingGeometry(
      CONTROL_ENDPOINT_RING_INNER_RADIUS,
      CONTROL_ENDPOINT_RING_OUTER_RADIUS,
      CONTROL_ENDPOINT_SEGMENTS,
    );
    const ringMaterial = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const ring = new Mesh(ringGeometry, ringMaterial);
    ring.name = `${name}-ring`;
    ring.renderOrder = CONTROL_ENDPOINT_RENDER_ORDER;

    const dotGeometry = new SphereGeometry(
      CONTROL_ENDPOINT_DOT_RADIUS,
      18,
      12,
    );
    const dotMaterial = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    });
    const dot = new Mesh(dotGeometry, dotMaterial);
    dot.name = `${name}-dot`;
    dot.renderOrder = CONTROL_ENDPOINT_RENDER_ORDER + 1;

    endpoint.add(ring, dot);
    this.controlEndpoints.push(endpoint);
    this.endpointGeometries.push(ringGeometry, dotGeometry);
    this.endpointMaterials.push(ringMaterial, dotMaterial);

    return endpoint;
  }

  private addFocusViewBodies(): void {
    INTERACTIVE_CELESTIAL_BODY_DEFINITIONS.forEach((definition) => {
      const body = new FocusedCelestialBody(definition);
      this.focusedBodies.set(definition.id as InteractiveCelestialBodyId, body);
      this.group.add(body.root);
    });
  }

  private getBodyById(id: CelestialBodyId): CelestialBody {
    const body = this.bodies.get(id);

    if (!body) {
      throw new Error(`Missing placeholder body for ${id}.`);
    }

    return body;
  }

  private applyVisibility(): void {
    const easedProgress = this.openingProgress * this.openingProgress;
    const openScale = MIN_OPEN_SCALE + (1 - MIN_OPEN_SCALE) * easedProgress;
    this.group.scale.copy(this.baseScale).multiplyScalar(openScale);
    this.group.visible = this.visibleRequested && this.openingProgress > 0.001;
    this.updateFocusedBodyLayout();
  }

  private updateFocusedBodyLayout(): void {
    if (!this.focusedBody) {
      return;
    }

    this.focusedBodies.get(this.focusedBody)?.applyScreenCenteredLayout(this.group);
  }

  private startFocusedBodyIntro(id: InteractiveCelestialBodyId): void {
    const sourceBody = this.getBodyById(id);
    const sourceWorldPosition = sourceBody.getWorldPosition(TEMP_FOCUS_SOURCE_POSITION);
    const sourceWorldScale = sourceBody.getMaxWorldScale(TEMP_FOCUS_SOURCE_SCALE);

    this.focusedBodies
      .get(id)
      ?.startIntroTransition(this.group, sourceWorldPosition, sourceWorldScale);
  }
}

const TEMP_WORLD_POSITION = new Vector3();
const TEMP_WORLD_SCALE = new Vector3();
const TEMP_FOCUS_SOURCE_POSITION = new Vector3();
const TEMP_FOCUS_SOURCE_SCALE = new Vector3();
const TEMP_FOCUS_WORLD_POSITION = new Vector3();
const TEMP_FOCUS_WORLD_SCALE = new Vector3();
const TEMP_FOCUS_CONTROL_POSITION = new Vector3();

function getBodyVisualState(
  id: InteractiveCelestialBodyId,
  input: {
    hoveredBody: InteractiveCelestialBodyId | null;
    activatedBody: InteractiveCelestialBodyId | null;
  },
): CelestialBodyInteractionVisualState {
  if (input.activatedBody === id) {
    return 'activated';
  }

  if (input.hoveredBody === id) {
    return 'hovered';
  }

  return 'idle';
}

function shouldPauseBodyOrbit(
  id: InteractiveCelestialBodyId,
  activatedBody: InteractiveCelestialBodyId | null,
): boolean {
  if (!activatedBody) {
    return false;
  }

  if (activatedBody === id) {
    return true;
  }

  return activatedBody === 'moon' && id === 'earth';
}
