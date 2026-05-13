import { Color3, MeshBuilder, Scene, TransformNode, Vector3 } from '@babylonjs/core';
import type { GameState } from '../../game/types';
import { toWorld } from './coordinates';
import { makeMaterial } from './materials';

export const createPeopleAndCars = (scene: Scene, game: GameState, root: TransformNode): void => {
  const personMaterial = makeMaterial(scene, 'person-material', new Color3(0.95, 0.92, 0.76));
  const happyMaterial = makeMaterial(scene, 'happy-person-material', new Color3(1, 0.78, 0.42));
  const carMaterial = makeMaterial(scene, 'car-material', new Color3(0.12, 0.12, 0.14));

  game.citizens.slice(0, 42).forEach((citizen, index) => {
    const home = game.buildings.find((building) => building.id === citizen.homeId);
    if (!home) {
      return;
    }

    const angle = (index % 6) * (Math.PI / 3);
    const world = toWorld(game, home);
    const offset = new Vector3(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
    const mesh =
      citizen.mode === 'car'
        ? MeshBuilder.CreateBox(`car-${citizen.id}`, { width: 0.7, depth: 0.35, height: 0.28 }, scene)
        : MeshBuilder.CreateSphere(`person-${citizen.id}`, { diameter: 0.24, segments: 8 }, scene);
    mesh.position = new Vector3(
      world.x + offset.x,
      citizen.mode === 'car' ? 0.28 : 0.32,
      world.z + offset.z,
    );
    mesh.material = citizen.mode === 'car' ? carMaterial : citizen.happiness > 72 ? happyMaterial : personMaterial;
    mesh.parent = root;
  });
};

export const createPopulationContent = (scene: Scene, game: GameState): TransformNode => {
  const content = new TransformNode('city-population-content', scene);
  content.setEnabled(false);
  createPeopleAndCars(scene, game, content);
  return content;
};
