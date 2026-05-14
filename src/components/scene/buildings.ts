import { Scene, TransformNode, Vector3 } from '@babylonjs/core';
import type { Building, GameState } from '../../game/types';
import { dimensionsFor } from './buildingDimensions';
import {
  detailBar,
  detailHouse,
  detailRestaurant,
  detailWorkplace,
} from './buildingDetails';
import { toWorld } from './coordinates';
import { createCityMaterials } from './materials';
import { addBox } from './meshPrimitives';
import { createPark } from './parks';

const addBuildingDetails = (
  scene: Scene,
  root: TransformNode,
  building: Building,
  world: Vector3,
  materials: ReturnType<typeof createCityMaterials>,
): void => {
  const dimensions = dimensionsFor(building.kind, building.variant ?? 0);
  if (building.kind === 'house') {
    detailHouse(scene, root, building, world, dimensions, materials);
  }
  if (building.kind === 'workplace') {
    detailWorkplace(scene, root, building, world, dimensions, materials);
  }
  if (building.kind === 'restaurant') {
    detailRestaurant(scene, root, building, world, dimensions, materials);
  }
  if (building.kind === 'bar') {
    detailBar(scene, root, building, world, dimensions, materials);
  }
};

export const createBuildingMesh = (scene: Scene, game: GameState, root: TransformNode): void => {
  const materials = createCityMaterials(scene);

  for (const building of game.buildings) {
    const world = toWorld(game, building);
    if (building.kind === 'park') {
      createPark(scene, root, building, world, materials);
      continue;
    }

    const dimensions = dimensionsFor(building.kind, building.variant ?? 0);
    const main = addBox(
      scene,
      root,
      `building-${building.id}`,
      new Vector3(world.x, dimensions.height / 2 + 0.06, world.z),
      dimensions,
      materials[building.kind],
      building,
    );
    main.rotation.y = building.variant === 2 ? Math.PI / 2 : 0;
    addBuildingDetails(scene, root, building, world, materials);
  }
};
