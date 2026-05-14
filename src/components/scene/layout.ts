import { MeshBuilder, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { posKey } from '../../game/grid';
import type { GameState } from '../../game/types';
import { createBuildingMesh } from './buildings';
import { toWorld } from './coordinates';
import { createGroundMaterials } from './materials';
import { parentTile } from './meshPrimitives';
import { createConnectionMarker, createRoadMesh } from './roads';

export const createLayoutContent = (scene: Scene, game: GameState): TransformNode => {
  const content = new TransformNode('city-layout-content', scene);
  content.setEnabled(false);
  const materials = createGroundMaterials(scene);
  const roadKeys = new Set(game.roads.map(posKey));

  for (const tile of game.map.tiles) {
    const ground = MeshBuilder.CreateBox(`tile-${tile.x}-${tile.z}`, {
      width: 1.96,
      depth: 1.96,
      height: 0.08,
    }, scene);
    const world = toWorld(game, tile);
    ground.position = new Vector3(world.x, tile.kind === 'water' ? -0.09 : 0, world.z);
    ground.material = tile.kind === 'water' ? materials.water : materials.land;
    parentTile(ground, content, tile);
  }

  for (const road of game.roads) {
    createRoadMesh(scene, game, content, road, roadKeys, materials);
  }

  createConnectionMarker(scene, game, content, materials);
  createBuildingMesh(scene, game, content);
  return content;
};
