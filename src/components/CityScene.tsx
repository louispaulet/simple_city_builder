import { useEffect, useRef } from 'react';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import type { GameState, Position } from '../game/types';

interface CitySceneProps {
  game: GameState;
  onTileSelected: (position: Position) => void;
}

const TILE_SIZE = 2;

const toWorld = (game: GameState, position: Position): Vector3 =>
  new Vector3((position.x - game.map.width / 2) * TILE_SIZE, 0, (position.z - game.map.height / 2) * TILE_SIZE);

const makeMaterial = (scene: Scene, name: string, color: Color3, alpha = 1): StandardMaterial => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = new Color3(0.08, 0.08, 0.08);
  material.alpha = alpha;
  return material;
};

const createBuildingMesh = (scene: Scene, game: GameState, root: TransformNode): void => {
  const materials = {
    house: makeMaterial(scene, 'house-material', new Color3(0.86, 0.37, 0.24)),
    workplace: makeMaterial(scene, 'workplace-material', new Color3(0.26, 0.43, 0.72)),
    restaurant: makeMaterial(scene, 'restaurant-material', new Color3(0.85, 0.6, 0.17)),
  };

  for (const building of game.buildings) {
    const height = building.kind === 'workplace' ? 2.4 : building.kind === 'restaurant' ? 1.3 : 1.1;
    const mesh = MeshBuilder.CreateBox(
      `building-${building.id}`,
      { width: 1.25, depth: 1.25, height },
      scene,
    );
    const world = toWorld(game, building);
    mesh.position = new Vector3(world.x, height / 2 + 0.06, world.z);
    mesh.material = materials[building.kind];
    mesh.parent = root;

    if (building.kind === 'house') {
      const roof = MeshBuilder.CreateCylinder(`roof-${building.id}`, { diameterTop: 0, diameterBottom: 1.55, height: 0.75, tessellation: 4 }, scene);
      roof.rotation.y = Math.PI / 4;
      roof.position = new Vector3(world.x, height + 0.5, world.z);
      roof.material = makeMaterial(scene, `roof-material-${building.id}`, new Color3(0.34, 0.16, 0.12));
      roof.parent = root;
    }
  }
};

const createPeopleAndCars = (scene: Scene, game: GameState, root: TransformNode): void => {
  const personMaterial = makeMaterial(scene, 'person-material', new Color3(0.95, 0.92, 0.76));
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
    mesh.position = new Vector3(world.x + offset.x, citizen.mode === 'car' ? 0.28 : 0.32, world.z + offset.z);
    mesh.material = citizen.mode === 'car' ? carMaterial : personMaterial;
    mesh.parent = root;
  });
};

const getLayoutSignature = (game: GameState): string =>
  JSON.stringify({
    seed: game.map.seed,
    connection: game.map.connection,
    buildings: game.buildings,
    roads: game.roads,
  });

const getPopulationSignature = (game: GameState): string =>
  JSON.stringify(
    game.citizens
      .slice(0, 42)
      .map((citizen) => [citizen.id, citizen.homeId, citizen.mode]),
  );

const createLayoutContent = (scene: Scene, game: GameState): TransformNode => {
  const content = new TransformNode('city-layout-content', scene);
  content.setEnabled(false);

  const landMaterial = makeMaterial(scene, 'land-material', new Color3(0.34, 0.56, 0.31));
  const waterMaterial = makeMaterial(scene, 'water-material', new Color3(0.18, 0.48, 0.71), 0.86);
  const roadMaterial = makeMaterial(scene, 'road-material', new Color3(0.14, 0.15, 0.15));
  const bridgeMaterial = makeMaterial(scene, 'bridge-material', new Color3(0.56, 0.45, 0.34));
  const connectionMaterial = makeMaterial(scene, 'connection-material', new Color3(0.93, 0.91, 0.72));

  for (const tile of game.map.tiles) {
    const ground = MeshBuilder.CreateBox(`tile-${tile.x}-${tile.z}`, { width: 1.96, depth: 1.96, height: 0.08 }, scene);
    const world = toWorld(game, tile);
    ground.position = new Vector3(world.x, tile.kind === 'water' ? -0.09 : 0, world.z);
    ground.material = tile.kind === 'water' ? waterMaterial : landMaterial;
    ground.metadata = { tile: { x: tile.x, z: tile.z } };
    ground.parent = content;
  }

  for (const road of game.roads) {
    const mesh = MeshBuilder.CreateBox(`road-${road.id}`, { width: 1.62, depth: 1.62, height: road.bridge ? 0.2 : 0.12 }, scene);
    const world = toWorld(game, road);
    mesh.position = new Vector3(world.x, road.bridge ? 0.16 : 0.12, world.z);
    mesh.material = road.bridge ? bridgeMaterial : roadMaterial;
    mesh.metadata = { tile: { x: road.x, z: road.z } };
    mesh.parent = content;
  }

  const connection = MeshBuilder.CreateCylinder('map-connection', { diameter: 1.7, height: 0.22, tessellation: 6 }, scene);
  const connectionWorld = toWorld(game, game.map.connection);
  connection.position = new Vector3(connectionWorld.x, 0.28, connectionWorld.z);
  connection.material = connectionMaterial;
  connection.metadata = { tile: game.map.connection };
  connection.parent = content;

  createBuildingMesh(scene, game, content);

  return content;
};

const createPopulationContent = (scene: Scene, game: GameState): TransformNode => {
  const content = new TransformNode('city-population-content', scene);
  content.setEnabled(false);
  createPeopleAndCars(scene, game, content);

  return content;
};

export function CityScene({ game, onTileSelected }: CitySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const layoutRef = useRef<TransformNode | null>(null);
  const populationRef = useRef<TransformNode | null>(null);
  const onTileSelectedRef = useRef(onTileSelected);
  const layoutSignature = getLayoutSignature(game);
  const populationSignature = getPopulationSignature(game);

  useEffect(() => {
    onTileSelectedRef.current = onTileSelected;
  }, [onTileSelected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const engine = new Engine(canvas, true, { stencil: true }, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.64, 0.78, 0.88, 1);
    sceneRef.current = scene;

    const camera = new ArcRotateCamera('camera', -Math.PI / 3, Math.PI / 3.2, 34, Vector3.Zero(), scene);
    camera.lowerBetaLimit = 0.45;
    camera.upperBetaLimit = 1.35;
    camera.lowerRadiusLimit = 16;
    camera.upperRadiusLimit = 48;
    camera.attachControl(canvas, true);

    const light = new HemisphericLight('sun', new Vector3(0.3, 1, 0.2), scene);
    light.intensity = 0.92;

    layoutRef.current = new TransformNode('city-layout-placeholder', scene);
    populationRef.current = new TransformNode('city-population-placeholder', scene);

    scene.onPointerObservable.add((event) => {
      if (event.type !== PointerEventTypes.POINTERPICK || !event.pickInfo?.hit || !event.pickInfo.pickedMesh) {
        return;
      }
      const metadata = event.pickInfo.pickedMesh.metadata as { tile?: Position } | undefined;
      if (metadata?.tile) {
        onTileSelectedRef.current(metadata.tile);
      }
    });

    engine.runRenderLoop(() => scene.render());
    const resize = () => engine.resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      engine.dispose();
      sceneRef.current = null;
      layoutRef.current = null;
      populationRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const oldLayout = layoutRef.current;
    if (!scene || !oldLayout) {
      return;
    }

    const nextLayout = createLayoutContent(scene, game);
    nextLayout.setEnabled(true);
    layoutRef.current = nextLayout;
    oldLayout.dispose(false, true);
  }, [layoutSignature]);

  useEffect(() => {
    const scene = sceneRef.current;
    const oldPopulation = populationRef.current;
    if (!scene || !oldPopulation) {
      return;
    }

    const nextPopulation = createPopulationContent(scene, game);
    nextPopulation.setEnabled(true);
    populationRef.current = nextPopulation;
    oldPopulation.dispose(false, true);
  }, [layoutSignature, populationSignature]);

  return <canvas ref={canvasRef} className="h-full w-full touch-none" aria-label="3D city map" />;
}
