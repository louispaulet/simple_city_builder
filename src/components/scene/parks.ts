import { MeshBuilder, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import type { Building } from '../../game/types';
import type { CityMaterials } from './materials';
import { addBox } from './meshPrimitives';

export const createPark = (
  scene: Scene,
  root: TransformNode,
  building: Building,
  world: Vector3,
  materials: CityMaterials,
): void => {
  addBox(scene, root, `park-path-${building.id}`, new Vector3(world.x, 0.12, world.z), {
    width: 1.42,
    depth: 0.22,
    height: 0.08,
  }, materials.path, building);
  addBox(scene, root, `park-path-cross-${building.id}`, new Vector3(world.x, 0.13, world.z), {
    width: 0.22,
    depth: 1.42,
    height: 0.08,
  }, materials.path, building);

  const treeCount = building.variant === 3 ? 4 : 3;
  for (let index = 0; index < treeCount; index += 1) {
    const angle = (index / treeCount) * Math.PI * 2 + building.variant * 0.35;
    const x = world.x + Math.cos(angle) * 0.52;
    const z = world.z + Math.sin(angle) * 0.52;
    addBox(scene, root, `trunk-${building.id}-${index}`, new Vector3(x, 0.34, z), {
      width: 0.13,
      depth: 0.13,
      height: 0.42,
    }, materials.wood, building);
    const leaves = MeshBuilder.CreateSphere(`leaves-${building.id}-${index}`, {
      diameter: building.variant === 1 ? 0.52 : 0.44,
      segments: 8,
    }, scene);
    leaves.position = new Vector3(x, 0.78, z);
    leaves.material = materials.park;
    leaves.metadata = { tile: building };
    leaves.parent = root;
  }

  if (building.variant % 2 === 0) {
    addBox(scene, root, `bench-${building.id}`, new Vector3(world.x + 0.5, 0.28, world.z - 0.05), {
      width: 0.42,
      depth: 0.16,
      height: 0.12,
    }, materials.wood, building);
  }
};
