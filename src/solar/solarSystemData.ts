export type InteractiveCelestialBodyId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export type CelestialBodyId = 'sun' | InteractiveCelestialBodyId;

export type PlaceholderPattern =
  | 'solar'
  | 'rocky'
  | 'cloudy'
  | 'ocean'
  | 'dust'
  | 'gasBands'
  | 'iceBands'
  | 'moon';

export interface Vector3Data {
  x: number;
  y: number;
  z: number;
}

export interface CelestialFocusDefault {
  scale: number;
  position: Vector3Data;
}

export interface CelestialReturnTarget {
  parentId: CelestialBodyId | null;
  orbitRadius: number;
  orbitPhase: number;
}

export interface CelestialOriginalOrbitTransform {
  parentId: CelestialBodyId | null;
  orbitRadius: number;
  orbitPhase: number;
  localPosition: Vector3Data;
}

export interface CelestialRingDefinition {
  innerRadius: number;
  outerRadius: number;
  color: string;
  opacity: number;
}

export interface CelestialBodyDefinition {
  id: CelestialBodyId;
  name: string;
  label: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  rotationSpeed: number;
  axialTilt: number;
  baseColor: string;
  accentColor: string;
  markerColor: string;
  pattern: PlaceholderPattern;
  activationHitRadius: number;
  focusDefault: CelestialFocusDefault;
  returnTarget: CelestialReturnTarget;
  parentId: CelestialBodyId | null;
  ring?: CelestialRingDefinition;
}

export const INTERACTIVE_CELESTIAL_BODY_IDS: readonly InteractiveCelestialBodyId[] = [
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];

export const CELESTIAL_BODY_DEFINITIONS: readonly CelestialBodyDefinition[] = [
  {
    id: 'sun',
    name: 'Sun',
    label: 'Sun',
    radius: 0.24,
    orbitRadius: 0,
    orbitSpeed: 0,
    orbitPhase: 0,
    rotationSpeed: 0.32,
    axialTilt: 0,
    baseColor: '#ffb340',
    accentColor: '#ffdd7a',
    markerColor: '#fff2b8',
    pattern: 'solar',
    activationHitRadius: 0,
    focusDefault: { scale: 1.8, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 0, orbitPhase: 0 },
    parentId: null,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    label: 'Mercury',
    radius: 0.045,
    orbitRadius: 0.5,
    orbitSpeed: 1.2,
    orbitPhase: 0.3,
    rotationSpeed: 1.8,
    axialTilt: 0.03,
    baseColor: '#9c8f84',
    accentColor: '#d4c5b1',
    markerColor: '#f2eadb',
    pattern: 'rocky',
    activationHitRadius: 0.11,
    focusDefault: { scale: 5.8, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 0.5, orbitPhase: 0.3 },
    parentId: null,
  },
  {
    id: 'venus',
    name: 'Venus',
    label: 'Venus',
    radius: 0.07,
    orbitRadius: 0.76,
    orbitSpeed: 0.9,
    orbitPhase: 1.25,
    rotationSpeed: -0.62,
    axialTilt: 0.08,
    baseColor: '#c89252',
    accentColor: '#f1d6a6',
    markerColor: '#fff0c2',
    pattern: 'cloudy',
    activationHitRadius: 0.13,
    focusDefault: { scale: 4.8, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 0.76, orbitPhase: 1.25 },
    parentId: null,
  },
  {
    id: 'earth',
    name: 'Earth',
    label: 'Earth',
    radius: 0.078,
    orbitRadius: 1.05,
    orbitSpeed: 0.72,
    orbitPhase: 2.1,
    rotationSpeed: 2.15,
    axialTilt: 0.41,
    baseColor: '#2c77b8',
    accentColor: '#46b37f',
    markerColor: '#eef7ff',
    pattern: 'ocean',
    activationHitRadius: 0.14,
    focusDefault: { scale: 4.5, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 1.05, orbitPhase: 2.1 },
    parentId: null,
  },
  {
    id: 'moon',
    name: 'Moon',
    label: 'Moon',
    radius: 0.026,
    orbitRadius: 0.18,
    orbitSpeed: 2.4,
    orbitPhase: 0.7,
    rotationSpeed: 0.55,
    axialTilt: 0.1,
    baseColor: '#b9b9b4',
    accentColor: '#777772',
    markerColor: '#eeeeea',
    pattern: 'moon',
    activationHitRadius: 0.08,
    focusDefault: { scale: 8.5, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: 'earth', orbitRadius: 0.18, orbitPhase: 0.7 },
    parentId: 'earth',
  },
  {
    id: 'mars',
    name: 'Mars',
    label: 'Mars',
    radius: 0.06,
    orbitRadius: 1.34,
    orbitSpeed: 0.56,
    orbitPhase: 2.9,
    rotationSpeed: 1.9,
    axialTilt: 0.44,
    baseColor: '#b9573d',
    accentColor: '#e6a06d',
    markerColor: '#ffd2a6',
    pattern: 'dust',
    activationHitRadius: 0.12,
    focusDefault: { scale: 5.1, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 1.34, orbitPhase: 2.9 },
    parentId: null,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    label: 'Jupiter',
    radius: 0.18,
    orbitRadius: 1.86,
    orbitSpeed: 0.34,
    orbitPhase: 3.6,
    rotationSpeed: 2.65,
    axialTilt: 0.05,
    baseColor: '#d7a46f',
    accentColor: '#8e5b38',
    markerColor: '#f6dfbb',
    pattern: 'gasBands',
    activationHitRadius: 0.22,
    focusDefault: { scale: 2.9, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 1.86, orbitPhase: 3.6 },
    parentId: null,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    label: 'Saturn',
    radius: 0.155,
    orbitRadius: 2.36,
    orbitSpeed: 0.26,
    orbitPhase: 4.25,
    rotationSpeed: 2.35,
    axialTilt: 0.47,
    baseColor: '#d9c48d',
    accentColor: '#9d8052',
    markerColor: '#fff0bf',
    pattern: 'gasBands',
    activationHitRadius: 0.24,
    focusDefault: { scale: 3.2, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 2.36, orbitPhase: 4.25 },
    parentId: null,
    ring: {
      innerRadius: 0.22,
      outerRadius: 0.36,
      color: '#e8d8a7',
      opacity: 0.58,
    },
  },
  {
    id: 'uranus',
    name: 'Uranus',
    label: 'Uranus',
    radius: 0.11,
    orbitRadius: 2.86,
    orbitSpeed: 0.19,
    orbitPhase: 5.1,
    rotationSpeed: 1.52,
    axialTilt: 1.71,
    baseColor: '#73c8d3',
    accentColor: '#d2f8fb',
    markerColor: '#ffffff',
    pattern: 'iceBands',
    activationHitRadius: 0.17,
    focusDefault: { scale: 3.8, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 2.86, orbitPhase: 5.1 },
    parentId: null,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    label: 'Neptune',
    radius: 0.105,
    orbitRadius: 3.32,
    orbitSpeed: 0.15,
    orbitPhase: 5.8,
    rotationSpeed: 1.72,
    axialTilt: 0.49,
    baseColor: '#3d72d8',
    accentColor: '#8fb4ff',
    markerColor: '#e2ecff',
    pattern: 'iceBands',
    activationHitRadius: 0.17,
    focusDefault: { scale: 3.9, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 3.32, orbitPhase: 5.8 },
    parentId: null,
  },
];

const CONTROL_ENDPOINT_PADDING = 0.2;

export const SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X =
  Math.max(
    ...CELESTIAL_BODY_DEFINITIONS.map((body) =>
      body.parentId
        ? 0
        : body.orbitRadius + Math.max(body.radius, body.ring?.outerRadius ?? 0),
    ),
  ) + CONTROL_ENDPOINT_PADDING;

export const SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN =
  SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X * 2;

export const CELESTIAL_BODY_REGISTRY: ReadonlyMap<
  CelestialBodyId,
  CelestialBodyDefinition
> = new Map<CelestialBodyId, CelestialBodyDefinition>(
  CELESTIAL_BODY_DEFINITIONS.map((body) => [body.id, body]),
);

export const CELESTIAL_BODY_BY_ID = CELESTIAL_BODY_REGISTRY;

export const INTERACTIVE_CELESTIAL_BODY_DEFINITIONS: readonly CelestialBodyDefinition[] =
  INTERACTIVE_CELESTIAL_BODY_IDS.map((id) => getCelestialBodyDefinition(id));

export function isInteractiveCelestialBodyId(
  id: CelestialBodyId,
): id is InteractiveCelestialBodyId {
  return INTERACTIVE_CELESTIAL_BODY_IDS.includes(id as InteractiveCelestialBodyId);
}

export function getCelestialBodyDefinition(
  id: CelestialBodyId,
): CelestialBodyDefinition {
  const definition = CELESTIAL_BODY_REGISTRY.get(id);

  if (!definition) {
    throw new Error(`Unknown celestial body: ${id}`);
  }

  return definition;
}

export function getInteractiveCelestialBodyDefinition(
  id: InteractiveCelestialBodyId,
): CelestialBodyDefinition {
  return getCelestialBodyDefinition(id);
}

export function getOriginalOrbitTransform(
  id: InteractiveCelestialBodyId,
): CelestialOriginalOrbitTransform {
  const definition = getInteractiveCelestialBodyDefinition(id);
  const orbitPhase = definition.returnTarget.orbitPhase;
  const orbitRadius = definition.returnTarget.orbitRadius;

  return {
    parentId: definition.returnTarget.parentId,
    orbitRadius,
    orbitPhase,
    localPosition: {
      x: Math.cos(orbitPhase) * orbitRadius,
      y: Math.sin(orbitPhase) * orbitRadius,
      z: 0,
    },
  };
}
