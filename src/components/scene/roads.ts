import { MeshBuilder, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import { posKey } from '../../game/grid';
import type { GameState } from '../../game/types';
import { toWorld } from './coordinates';
import type { GroundMaterials } from './materials';
import { addBox } from './meshPrimitives';

const connectorsFor = (road: GameState['roads'][number]) => [
  { key: posKey({ x: road.x + 1, z: road.z }), x: 0.52, z: 0, width: 1.0, depth: 0.56 },
  { key: posKey({ x: road.x - 1, z: road.z }), x: -0.52, z: 0, width: 1.0, depth: 0.56 },
  { key: posKey({ x: road.x, z: road.z + 1 }), x: 0, z: 0.52, width: 0.56, depth: 1.0 },
  { key: posKey({ x: road.x, z: road.z - 1 }), x: 0, z: -0.52, width: 0.56, depth: 1.0 },
];

export const createRoadMesh = (
  scene: Scene,
  game: GameState,
  root: TransformNode,
  road: GameState['roads'][number],
  roadKeys: Set<string>,
  materials: GroundMaterials,
): void => {
  const world = toWorld(game, road);
  const y = road.bridge ? 0.21 : 0.13;
  const deckMaterial = road.bridge ? materials.bridge : materials.road;
  addBox(scene, root, `road-center-${road.id}`, new Vector3(world.x, y, world.z), {
    width: 1.02,
    depth: 1.02,
    height: road.bridge ? 0.18 : 0.1,
  }, deckMaterial, road);

  for (const connector of connectorsFor(road)) {
    if (roadKeys.has(connector.key)) {
      addBox(scene, root, `road-link-${road.id}-${connector.key}`, new Vector3(world.x + connector.x, y, world.z + connector.z), {
        width: connector.width,
        depth: connector.depth,
        height: road.bridge ? 0.18 : 0.1,
      }, deckMaterial, road);
    }
  }

  if (road.bridge) {
    addBox(scene, root, `bridge-rail-a-${road.id}`, new Vector3(world.x - 0.72, 0.43, world.z), {
      width: 0.08,
      depth: 1.48,
      height: 0.24,
    }, materials.rail, road);
    addBox(scene, root, `bridge-rail-b-${road.id}`, new Vector3(world.x + 0.72, 0.43, world.z), {
      width: 0.08,
      depth: 1.48,
      height: 0.24,
    }, materials.rail, road);
  }
};

export const createConnectionMarker = (scene: Scene, game: GameState, root: TransformNode, materials: GroundMaterials): void => {
  const connection = MeshBuilder.CreateCylinder('map-connection', { diameter: 1.7, height: 0.22, tessellation: 6 }, scene);
  const world = toWorld(game, game.map.connection);
  connection.position = new Vector3(world.x, 0.34, world.z);
  connection.material = materials.connection;
  connection.metadata = { tile: game.map.connection };
  connection.parent = root;
};
