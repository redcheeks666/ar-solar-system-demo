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
  private readonly endpointGeometries: BufferGeometry[] = [];
  private readonly endpointMaterials: Material[] = [];
  private readonly baseScale = new Vector3(DEFAULT_SCALE, DEFAULT_SCALE, DEFAULT_SCALE);
  private visibleRequested = false;
  private openingProgress = 0;

  constructor() {
    this.group.name = 'code-placeholder-solar-system';
    this.group.visible = false;
    this.group.rotation.set(PREVIEW_TILT_X, PREVIEW_TILT_Y, 0);
    this.addLights();
    this.createBodies();
    this.addControlEndpoints();
    this.applyVisibility();
  }

  update(deltaSeconds: number): void {
    if (!this.group.visible) {
      return;
    }

    this.bodies.forEach((body) => body.update(deltaSeconds));
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

  applyBodyInteractionState(input: {
    hoveredBody: InteractiveCelestialBodyId | null;
    activatedBody: InteractiveCelestialBodyId | null;
  }): void {
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
    this.endpointGeometries.push(ringGeometry, dotGeometry);
    this.endpointMaterials.push(ringMaterial, dotMaterial);

    return endpoint;
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
  }
}

const TEMP_WORLD_POSITION = new Vector3();
const TEMP_WORLD_SCALE = new Vector3();

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
