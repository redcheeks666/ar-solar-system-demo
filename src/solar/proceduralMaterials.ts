import {
  CanvasTexture,
  Color,
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from 'three';
import type { CelestialBodyDefinition } from './solarSystemData';

const TEXTURE_WIDTH = 512;
const TEXTURE_HEIGHT = 256;

export interface PlaceholderMaterialBundle {
  material: MeshStandardMaterial;
  textures: Texture[];
}

export interface UnlitPlaceholderMaterialBundle {
  material: MeshBasicMaterial;
  textures: Texture[];
}

interface BodyTextureOptions {
  includeRotationMarker?: boolean;
}

export function createPlaceholderBodyMaterial(
  body: CelestialBodyDefinition,
): PlaceholderMaterialBundle {
  const texture = createBodyTexture(body);
  const material = new MeshStandardMaterial({
    map: texture,
    color: new Color('#ffffff'),
    roughness: body.id === 'sun' ? 0.65 : 0.82,
    metalness: 0,
    emissive: new Color(body.id === 'sun' ? body.baseColor : '#000000'),
    emissiveIntensity: body.id === 'sun' ? 1.05 : 0,
  });

  return {
    material,
    textures: [texture],
  };
}

export function createUnlitPlaceholderBodyMaterial(
  body: CelestialBodyDefinition,
  options: BodyTextureOptions = {},
): UnlitPlaceholderMaterialBundle {
  const texture = createBodyTexture(body, options);
  const material = new MeshBasicMaterial({
    map: texture,
    color: new Color('#ffffff'),
  });

  return {
    material,
    textures: [texture],
  };
}

export function createSaturnRingMaterial(
  color: string,
  opacity: number,
): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color,
    opacity,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
}

function createBodyTexture(
  body: CelestialBodyDefinition,
  options: BodyTextureOptions = {},
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Unable to create placeholder solar texture context.');
  }

  context.fillStyle = body.baseColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawBasePattern(context, body);
  if (options.includeRotationMarker ?? true) {
    drawRotationMarker(context, body);
  }
  drawLongitudeGuide(context, body);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;

  return texture;
}

function drawBasePattern(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
): void {
  switch (body.pattern) {
    case 'solar':
      drawSolarCells(context, body);
      break;
    case 'gasBands':
      drawBands(context, body, 18, 0.34);
      drawOvalStorm(context, body);
      break;
    case 'iceBands':
      drawBands(context, body, 10, 0.18);
      drawDiagonalWisps(context, body, 8);
      break;
    case 'cloudy':
      drawDiagonalWisps(context, body, 14);
      drawBands(context, body, 7, 0.14);
      break;
    case 'ocean':
      drawContinents(context, body);
      drawDiagonalWisps(context, body, 5);
      break;
    case 'dust':
      drawRockPatches(context, body, 18);
      drawBands(context, body, 8, 0.1);
      break;
    case 'moon':
      drawRockPatches(context, body, 26);
      break;
    case 'rocky':
      drawRockPatches(context, body, 22);
      break;
  }
}

function drawBands(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
  count: number,
  alpha: number,
): void {
  for (let index = 0; index < count; index += 1) {
    const y = (index / count) * TEXTURE_HEIGHT;
    const height = TEXTURE_HEIGHT / count;
    context.fillStyle = withAlpha(
      index % 2 === 0 ? body.accentColor : body.markerColor,
      alpha,
    );
    context.fillRect(0, y, TEXTURE_WIDTH, height * 0.72);
  }
}

function drawSolarCells(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
): void {
  const gradient = context.createRadialGradient(
    TEXTURE_WIDTH * 0.52,
    TEXTURE_HEIGHT * 0.5,
    12,
    TEXTURE_WIDTH * 0.5,
    TEXTURE_HEIGHT * 0.5,
    TEXTURE_WIDTH * 0.55,
  );
  gradient.addColorStop(0, withAlpha(body.markerColor, 0.9));
  gradient.addColorStop(0.45, body.baseColor);
  gradient.addColorStop(1, '#f27624');
  context.fillStyle = gradient;
  context.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

  for (let index = 0; index < 28; index += 1) {
    const x = pseudoRandom(index, 13) * TEXTURE_WIDTH;
    const y = pseudoRandom(index, 29) * TEXTURE_HEIGHT;
    const radius = 8 + pseudoRandom(index, 47) * 22;
    context.fillStyle = withAlpha(body.accentColor, 0.18);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawContinents(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
): void {
  for (let index = 0; index < 12; index += 1) {
    const x = pseudoRandom(index, 71) * TEXTURE_WIDTH;
    const y = pseudoRandom(index, 97) * TEXTURE_HEIGHT;
    const width = 34 + pseudoRandom(index, 19) * 72;
    const height = 16 + pseudoRandom(index, 31) * 42;
    context.fillStyle = withAlpha(body.accentColor, 0.78);
    context.beginPath();
    context.ellipse(x, y, width, height, pseudoRandom(index, 43) * Math.PI, 0, Math.PI * 2);
    context.fill();
  }
}

function drawRockPatches(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
  count: number,
): void {
  for (let index = 0; index < count; index += 1) {
    const x = pseudoRandom(index, 5) * TEXTURE_WIDTH;
    const y = pseudoRandom(index, 11) * TEXTURE_HEIGHT;
    const radius = 4 + pseudoRandom(index, 17) * 18;
    context.fillStyle = withAlpha(
      index % 3 === 0 ? body.markerColor : body.accentColor,
      index % 3 === 0 ? 0.28 : 0.38,
    );
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
}

function drawDiagonalWisps(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
  count: number,
): void {
  context.save();
  context.lineCap = 'round';
  for (let index = 0; index < count; index += 1) {
    const y = (index / count) * TEXTURE_HEIGHT + pseudoRandom(index, 61) * 22;
    context.strokeStyle = withAlpha(
      index % 2 === 0 ? body.markerColor : body.accentColor,
      0.28,
    );
    context.lineWidth = 4 + pseudoRandom(index, 73) * 12;
    context.beginPath();
    context.moveTo(-60, y + 28);
    context.bezierCurveTo(
      TEXTURE_WIDTH * 0.28,
      y - 48,
      TEXTURE_WIDTH * 0.72,
      y + 48,
      TEXTURE_WIDTH + 60,
      y - 28,
    );
    context.stroke();
  }
  context.restore();
}

function drawOvalStorm(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
): void {
  context.fillStyle = withAlpha(body.markerColor, 0.72);
  context.beginPath();
  context.ellipse(TEXTURE_WIDTH * 0.68, TEXTURE_HEIGHT * 0.58, 34, 16, -0.2, 0, Math.PI * 2);
  context.fill();
}

function drawRotationMarker(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
): void {
  const markerX = TEXTURE_WIDTH * 0.16;
  context.fillStyle = withAlpha(body.markerColor, body.id === 'sun' ? 0.62 : 0.82);
  context.beginPath();
  context.moveTo(markerX, TEXTURE_HEIGHT * 0.12);
  context.lineTo(markerX + 52, TEXTURE_HEIGHT * 0.5);
  context.lineTo(markerX + 8, TEXTURE_HEIGHT * 0.88);
  context.lineTo(markerX - 22, TEXTURE_HEIGHT * 0.52);
  context.closePath();
  context.fill();
}

function drawLongitudeGuide(
  context: CanvasRenderingContext2D,
  body: CelestialBodyDefinition,
): void {
  context.strokeStyle = withAlpha(body.markerColor, 0.34);
  context.lineWidth = 2;
  for (let index = 0; index < 4; index += 1) {
    const x = TEXTURE_WIDTH * (0.28 + index * 0.18);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 22 * Math.sin(index), TEXTURE_HEIGHT);
    context.stroke();
  }
}

function withAlpha(hexColor: string, alpha: number): string {
  const color = new Color(hexColor);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(
    color.b * 255,
  )}, ${alpha})`;
}

function pseudoRandom(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
