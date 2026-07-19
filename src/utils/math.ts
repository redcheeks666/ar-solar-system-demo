import type { NormalizedPoint } from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

export function inverseLerp(from: number, to: number, value: number): number {
  if (from === to) {
    return value >= to ? 1 : 0;
  }

  return clamp01((value - from) / (to - from));
}

export function smoothstep(value: number): number {
  const clamped = clamp01(value);

  return clamped * clamped * (3 - 2 * clamped);
}

export function easeOutExpo(value: number): number {
  const clamped = clamp01(value);

  return clamped === 1 ? 1 : 1 - 2 ** (-10 * clamped);
}

export function easeInOutCubic(value: number): number {
  const clamped = clamp01(value);

  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - ((-2 * clamped + 2) ** 3) / 2;
}

export function easeOutBack(value: number): number {
  const clamped = clamp01(value);
  const overshoot = 1.70158;
  const shifted = clamped - 1;

  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
}

export function average(a: number, b: number): number {
  return (a + b) / 2;
}

export function averageNullable(a: number | null, b: number | null): number {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return b ?? 0;
  }

  if (b === null) {
    return a;
  }

  return (a + b) / 2;
}

export function averagePoints(points: readonly NormalizedPoint[]): NormalizedPoint {
  const total = points.reduce(
    (sum, point) => {
      sum.x += point.x;
      sum.y += point.y;
      sum.z += point.z;
      return sum;
    },
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: total.z / points.length,
  };
}

export function distance2d(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distance3d(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function subtract(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

export function cross(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalize(point: NormalizedPoint): NormalizedPoint | null {
  const length = Math.hypot(point.x, point.y, point.z);

  if (length <= 0.00001) {
    return null;
  }

  return {
    x: point.x / length,
    y: point.y / length,
    z: point.z / length,
  };
}

/** Cosine similarity clamped to [0, 1]; used for finger straightness scoring. */
export function cosineSimilarity(a: NormalizedPoint, b: NormalizedPoint): number {
  const aLength = Math.hypot(a.x, a.y, a.z);
  const bLength = Math.hypot(b.x, b.y, b.z);

  if (aLength <= 0.00001 || bLength <= 0.00001) {
    return 0;
  }

  return clamp01((a.x * b.x + a.y * b.y + a.z * b.z) / (aLength * bLength));
}

export function unwrapAngle(angle: number): number {
  if (angle > Math.PI) {
    return angle - Math.PI * 2;
  }

  if (angle < -Math.PI) {
    return angle + Math.PI * 2;
  }

  return angle;
}
