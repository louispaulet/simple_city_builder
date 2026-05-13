import { Color3, Scene, StandardMaterial } from '@babylonjs/core';

export const makeMaterial = (scene: Scene, name: string, color: Color3, alpha = 1): StandardMaterial => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = new Color3(0.08, 0.08, 0.08);
  material.alpha = alpha;
  return material;
};

export const createCityMaterials = (scene: Scene) => ({
  house: makeMaterial(scene, 'house-material', new Color3(0.86, 0.37, 0.24)),
  workplace: makeMaterial(scene, 'workplace-material', new Color3(0.26, 0.43, 0.72)),
  restaurant: makeMaterial(scene, 'restaurant-material', new Color3(0.85, 0.6, 0.17)),
  bar: makeMaterial(scene, 'bar-material', new Color3(0.66, 0.17, 0.32)),
  park: makeMaterial(scene, 'park-material', new Color3(0.18, 0.52, 0.26)),
  roof: makeMaterial(scene, 'roof-material', new Color3(0.34, 0.16, 0.12)),
  darkRoof: makeMaterial(scene, 'dark-roof-material', new Color3(0.12, 0.13, 0.14)),
  window: makeMaterial(scene, 'window-material', new Color3(0.83, 0.94, 0.98)),
  awning: makeMaterial(scene, 'awning-material', new Color3(0.96, 0.9, 0.72)),
  neon: makeMaterial(scene, 'neon-material', new Color3(1, 0.62, 0.84)),
  wood: makeMaterial(scene, 'wood-material', new Color3(0.44, 0.28, 0.16)),
  path: makeMaterial(scene, 'path-material', new Color3(0.76, 0.68, 0.52)),
});

export type CityMaterials = ReturnType<typeof createCityMaterials>;

export const createGroundMaterials = (scene: Scene) => ({
  land: makeMaterial(scene, 'land-material', new Color3(0.34, 0.56, 0.31)),
  water: makeMaterial(scene, 'water-material', new Color3(0.18, 0.48, 0.71), 0.86),
  road: makeMaterial(scene, 'road-material', new Color3(0.14, 0.15, 0.15)),
  bridge: makeMaterial(scene, 'bridge-material', new Color3(0.55, 0.47, 0.35)),
  rail: makeMaterial(scene, 'bridge-rail-material', new Color3(0.31, 0.25, 0.18)),
  connection: makeMaterial(scene, 'connection-material', new Color3(0.93, 0.91, 0.72)),
});

export type GroundMaterials = ReturnType<typeof createGroundMaterials>;
