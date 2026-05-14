import { Scene, TransformNode, Vector3 } from '@babylonjs/core';
import type { Building } from '../../game/types';
import type { BuildingDimensions } from './buildingDimensions';
import type { CityMaterials } from './materials';
import { addBox, addRoof } from './meshPrimitives';

export const addWindows = (
  scene: Scene,
  root: TransformNode,
  building: Building,
  world: Vector3,
  count: number,
  materials: CityMaterials,
): void => {
  for (let index = 0; index < count; index += 1) {
    addBox(scene, root, `window-${building.id}-${index}`, new Vector3(world.x - 0.42 + (index % 3) * 0.42, 0.72 + Math.floor(index / 3) * 0.52, world.z - 0.63), {
      width: 0.18,
      depth: 0.035,
      height: 0.22,
    }, materials.window, building);
  }
};

export const detailHouse = (scene: Scene, root: TransformNode, building: Building, world: Vector3, dimensions: BuildingDimensions, materials: CityMaterials): void => {
  addRoof(scene, root, `roof-${building.id}`, new Vector3(world.x, dimensions.height + 0.44, world.z), Math.max(dimensions.width, dimensions.depth) + 0.35, materials.roof, building);
  addWindows(scene, root, building, world, building.variant === 1 ? 5 : 3, materials);
  if (building.variant === 3) {
    addBox(scene, root, `porch-${building.id}`, new Vector3(world.x, 0.26, world.z - 0.72), { width: 0.74, depth: 0.18, height: 0.18 }, materials.wood, building);
  }
};

export const detailWorkplace = (scene: Scene, root: TransformNode, building: Building, world: Vector3, dimensions: BuildingDimensions, materials: CityMaterials): void => {
  addWindows(scene, root, building, world, building.variant === 1 ? 12 : 9, materials);
  addBox(scene, root, `work-sign-${building.id}`, new Vector3(world.x, dimensions.height + 0.16, world.z), { width: dimensions.width + 0.12, depth: dimensions.depth + 0.12, height: 0.16 }, materials.darkRoof, building);
  if (building.variant === 2) {
    addBox(scene, root, `work-annex-${building.id}`, new Vector3(world.x + 0.42, 0.72, world.z + 0.36), { width: 0.62, depth: 0.54, height: 1.25 }, materials.workplace, building);
  }
};

export const detailRestaurant = (scene: Scene, root: TransformNode, building: Building, world: Vector3, dimensions: BuildingDimensions, materials: CityMaterials): void => {
  addBox(scene, root, `awning-${building.id}`, new Vector3(world.x, 0.95, world.z - 0.68), { width: 1.28, depth: 0.2, height: 0.16 }, materials.awning, building);
  addBox(scene, root, `restaurant-sign-${building.id}`, new Vector3(world.x, dimensions.height + 0.28, world.z - 0.24), { width: 0.7, depth: 0.08, height: 0.28 }, materials.awning, building);
  if (building.variant === 1 || building.variant === 3) {
    addBox(scene, root, `patio-${building.id}`, new Vector3(world.x + 0.54, 0.16, world.z + 0.54), { width: 0.42, depth: 0.42, height: 0.08 }, materials.wood, building);
  }
};

export const detailBar = (scene: Scene, root: TransformNode, building: Building, world: Vector3, dimensions: BuildingDimensions, materials: CityMaterials): void => {
  addBox(scene, root, `bar-roof-${building.id}`, new Vector3(world.x, dimensions.height + 0.16, world.z), { width: dimensions.width + 0.14, depth: dimensions.depth + 0.14, height: 0.22 }, materials.darkRoof, building);
  addBox(scene, root, `bar-sign-${building.id}`, new Vector3(world.x, 1.08, world.z - 0.7), { width: 0.88, depth: 0.08, height: 0.22 }, materials.neon, building);
  addWindows(scene, root, building, world, building.variant === 3 ? 4 : 2, materials);
};
