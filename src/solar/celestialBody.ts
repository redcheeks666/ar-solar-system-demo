import {
  BufferGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  RingGeometry,
  SphereGeometry,
  Texture,
} from 'three';
import { createPlaceholderBodyMaterial, createSaturnRingMaterial } from './proceduralMaterials';
import type { CelestialBodyDefinition } from './solarSystemData';

const SPHERE_WIDTH_SEGMENTS = 40;
const SPHERE_HEIGHT_SEGMENTS = 24;
const ORBIT_SEGMENTS = 160;
const ORBIT_THICKNESS = 0.004;

export class CelestialBody {
  readonly orbitPivot = new Group();
  readonly bodyAnchor = new Group();
  readonly satelliteRoot = new Group();

  private readonly spinGroup = new Group();
  private readonly tiltGroup = new Group();
  private readonly geometries: BufferGeometry[] = [];
  private readonly materials: Material[] = [];
  private readonly textures: Texture[] = [];
  private orbitAngle: number;

  constructor(readonly definition: CelestialBodyDefinition) {
    this.orbitAngle = definition.orbitPhase;
    this.orbitPivot.name = `${definition.id}-orbit-pivot`;
    this.bodyAnchor.name = `${definition.id}-anchor`;
    this.tiltGroup.name = `${definition.id}-tilt`;
    this.spinGroup.name = `${definition.id}-spin`;
    this.satelliteRoot.name = `${definition.id}-satellites`;

    this.bodyAnchor.position.x = definition.orbitRadius;
    this.orbitPivot.rotation.z = this.orbitAngle;
    this.tiltGroup.rotation.z = definition.axialTilt;

    this.orbitPivot.add(this.bodyAnchor);
    this.bodyAnchor.add(this.tiltGroup);
    this.tiltGroup.add(this.spinGroup);
    this.bodyAnchor.add(this.satelliteRoot);
    this.addOrbitRing();
    this.addBodyMesh();
    this.addPlanetRing();
  }

  update(deltaSeconds: number): void {
    this.orbitAngle += this.definition.orbitSpeed * deltaSeconds;
    this.orbitPivot.rotation.z = this.orbitAngle;
    this.spinGroup.rotation.y += this.definition.rotationSpeed * deltaSeconds;
  }

  dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }

  private addBodyMesh(): void {
    const geometry = new SphereGeometry(
      this.definition.radius,
      SPHERE_WIDTH_SEGMENTS,
      SPHERE_HEIGHT_SEGMENTS,
    );
    const materialBundle = createPlaceholderBodyMaterial(this.definition);
    const mesh = new Mesh(geometry, materialBundle.material);
    mesh.name = `${this.definition.id}-placeholder-sphere`;
    this.spinGroup.add(mesh);
    this.geometries.push(geometry);
    this.materials.push(materialBundle.material);
    this.textures.push(...materialBundle.textures);
  }

  private addOrbitRing(): void {
    if (this.definition.orbitRadius <= 0) {
      return;
    }

    const geometry = new RingGeometry(
      Math.max(0.001, this.definition.orbitRadius - ORBIT_THICKNESS),
      this.definition.orbitRadius + ORBIT_THICKNESS,
      ORBIT_SEGMENTS,
    );
    const material = createSaturnRingMaterial('#9fb3c9', 0.18);
    material.side = DoubleSide;
    const ring = new Mesh(geometry, material);
    ring.name = `${this.definition.id}-orbit-ring`;
    ring.renderOrder = -1;
    this.orbitPivot.add(ring);
    this.geometries.push(geometry);
    this.materials.push(material);
  }

  private addPlanetRing(): void {
    if (!this.definition.ring) {
      return;
    }

    const geometry = new RingGeometry(
      this.definition.ring.innerRadius,
      this.definition.ring.outerRadius,
      ORBIT_SEGMENTS,
    );
    const material = createSaturnRingMaterial(
      this.definition.ring.color,
      this.definition.ring.opacity,
    );
    const ring = new Mesh(geometry, material);
    ring.name = `${this.definition.id}-saturn-ring`;
    ring.rotation.x = Math.PI * 0.38;
    this.bodyAnchor.add(ring);
    this.geometries.push(geometry);
    this.materials.push(material);
  }
}
