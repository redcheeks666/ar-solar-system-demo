import { UNIVERSE_RIFT_WIDTH } from './solarVisualConfig';

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
  nameZh: string;
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
    nameZh: '太阳',
    label: 'Sun',
    radius: 0.7,
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
    focusDefault: { scale: 1.2, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 0, orbitPhase: 0 },
    parentId: null,
  },
  {
    id: 'mercury',
    name: 'Mercury',
    nameZh: '水星',
    label: 'Mercury',
    radius: 0.15,
    orbitRadius: 0.74,
    orbitSpeed: 1.2,
    orbitPhase: 0.38,
    rotationSpeed: 1.8,
    axialTilt: 0.03,
    baseColor: '#9c8f84',
    accentColor: '#d4c5b1',
    markerColor: '#f2eadb',
    pattern: 'rocky',
    activationHitRadius: 0.21,
    focusDefault: { scale: 4.8, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 0.74, orbitPhase: 0.38 },
    parentId: null,
  },
  {
    id: 'venus',
    name: 'Venus',
    nameZh: '金星',
    label: 'Venus',
    radius: 0.22,
    orbitRadius: 1.12,
    orbitSpeed: 0.9,
    orbitPhase: 2.14,
    rotationSpeed: -0.62,
    axialTilt: 0.08,
    baseColor: '#c89252',
    accentColor: '#f1d6a6',
    markerColor: '#fff0c2',
    pattern: 'cloudy',
    activationHitRadius: 0.28,
    focusDefault: { scale: 3.8, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 1.12, orbitPhase: 2.14 },
    parentId: null,
  },
  {
    id: 'earth',
    name: 'Earth',
    nameZh: '地球',
    label: 'Earth',
    radius: 0.23,
    orbitRadius: 1.48,
    orbitSpeed: 0.72,
    orbitPhase: 2.78,
    rotationSpeed: 2.15,
    axialTilt: 0.41,
    baseColor: '#2c77b8',
    accentColor: '#46b37f',
    markerColor: '#eef7ff',
    pattern: 'ocean',
    activationHitRadius: 0.3,
    focusDefault: { scale: 3.5, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 1.48, orbitPhase: 2.78 },
    parentId: null,
  },
  {
    id: 'moon',
    name: 'Moon',
    nameZh: '月球',
    label: 'Moon',
    radius: 0.095,
    orbitRadius: 0.38,
    orbitSpeed: 2.4,
    orbitPhase: 0.74,
    rotationSpeed: 0.55,
    axialTilt: 0.1,
    baseColor: '#b9b9b4',
    accentColor: '#777772',
    markerColor: '#eeeeea',
    pattern: 'moon',
    activationHitRadius: 0.18,
    focusDefault: { scale: 6.4, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: 'earth', orbitRadius: 0.38, orbitPhase: 0.74 },
    parentId: 'earth',
  },
  {
    id: 'mars',
    name: 'Mars',
    nameZh: '火星',
    label: 'Mars',
    radius: 0.19,
    orbitRadius: 1.88,
    orbitSpeed: 0.56,
    orbitPhase: 3.34,
    rotationSpeed: 1.9,
    axialTilt: 0.44,
    baseColor: '#b9573d',
    accentColor: '#e6a06d',
    markerColor: '#ffd2a6',
    pattern: 'dust',
    activationHitRadius: 0.25,
    focusDefault: { scale: 4.1, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 1.88, orbitPhase: 3.34 },
    parentId: null,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    nameZh: '木星',
    label: 'Jupiter',
    radius: 0.43,
    orbitRadius: 2.05,
    orbitSpeed: 0.34,
    orbitPhase: 0.92,
    rotationSpeed: 2.65,
    axialTilt: 0.05,
    baseColor: '#d7a46f',
    accentColor: '#8e5b38',
    markerColor: '#f6dfbb',
    pattern: 'gasBands',
    activationHitRadius: 0.52,
    focusDefault: { scale: 1.9, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 2.05, orbitPhase: 0.92 },
    parentId: null,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    nameZh: '土星',
    label: 'Saturn',
    radius: 0.39,
    orbitRadius: 2.58,
    orbitSpeed: 0.26,
    orbitPhase: 0.28,
    rotationSpeed: 2.35,
    axialTilt: 0.47,
    baseColor: '#d9c48d',
    accentColor: '#9d8052',
    markerColor: '#fff0bf',
    pattern: 'gasBands',
    activationHitRadius: 0.58,
    focusDefault: { scale: 2.0, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 2.58, orbitPhase: 0.28 },
    parentId: null,
    ring: {
      innerRadius: 0.5,
      outerRadius: 0.84,
      color: '#e8d8a7',
      opacity: 0.58,
    },
  },
  {
    id: 'uranus',
    name: 'Uranus',
    nameZh: '天王星',
    label: 'Uranus',
    radius: 0.3,
    orbitRadius: 2.98,
    orbitSpeed: 0.19,
    orbitPhase: 5.72,
    rotationSpeed: 1.52,
    axialTilt: 1.71,
    baseColor: '#73c8d3',
    accentColor: '#d2f8fb',
    markerColor: '#ffffff',
    pattern: 'iceBands',
    activationHitRadius: 0.38,
    focusDefault: { scale: 2.7, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 2.98, orbitPhase: 5.72 },
    parentId: null,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    nameZh: '海王星',
    label: 'Neptune',
    radius: 0.29,
    orbitRadius: 3.34,
    orbitSpeed: 0.15,
    orbitPhase: 6.08,
    rotationSpeed: 1.72,
    axialTilt: 0.49,
    baseColor: '#3d72d8',
    accentColor: '#8fb4ff',
    markerColor: '#e2ecff',
    pattern: 'iceBands',
    activationHitRadius: 0.37,
    focusDefault: { scale: 2.8, position: { x: 0, y: 0, z: 0 } },
    returnTarget: { parentId: null, orbitRadius: 3.34, orbitPhase: 6.08 },
    parentId: null,
  },
];

// Control endpoints sit on the universe-rift backdrop's widest left/right points
// (its horizontal radius) so the visible handles align with the elliptical rift
// edge instead of inside it. The outermost body extent (~3.6) stays well inside
// this, so planets still render within the rift.
export const SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X = UNIVERSE_RIFT_WIDTH / 2;

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
  id: string,
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

export function getCelestialBodyDisplayName(id: CelestialBodyId): string {
  const definition = getCelestialBodyDefinition(id);

  return `${definition.nameZh}（${definition.name}）`;
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
