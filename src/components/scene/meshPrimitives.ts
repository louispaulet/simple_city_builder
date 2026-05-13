import { MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import type { Position } from '../../game/types';

export const parentTile = (
  mesh: ReturnType<typeof MeshBuilder.CreateBox>,
  root: TransformNode,
  position: Position,
): void => {
  mesh.metadata = { tile: { x: position.x, z: position.z } };
  mesh.parent = root;
};

export const addBox = (
  scene: Scene,
  root: TransformNode,
  name: string,
  position: Vector3,
  size: { width: number; depth: number; height: number },
  material: StandardMaterial,
  tile?: Position,
) => {
  const mesh = MeshBuilder.CreateBox(name, size, scene);
  mesh.position = position;
  mesh.material = material;
  mesh.parent = root;
  if (tile) {
    mesh.metadata = { tile };
  }
  return mesh;
};

export const addRoof = (
  scene: Scene,
  root: TransformNode,
  name: string,
  position: Vector3,
  width: number,
  material: StandardMaterial,
  tile: Position,
): void => {
  const roof = MeshBuilder.CreateCylinder(
    name,
    { diameterTop: 0, diameterBottom: width, height: 0.68, tessellation: 4 },
    scene,
  );
  roof.rotation.y = Math.PI / 4;
  roof.position = position;
  roof.material = material;
  roof.metadata = { tile };
  roof.parent = root;
};
