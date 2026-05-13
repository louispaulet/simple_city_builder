import { useEffect, useRef } from 'react';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { posKey } from '../game/grid';
import type { Building, GameState, Position } from '../game/types';

interface CitySceneProps {
  game: GameState;
  isRoadTool: boolean;
  onTileSelected: (position: Position) => void;
  onRoadLineSelected: (start: Position, end: Position) => void;
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

const parentTile = (mesh: ReturnType<typeof MeshBuilder.CreateBox>, root: TransformNode, position: Position): void => {
  mesh.metadata = { tile: { x: position.x, z: position.z } };
  mesh.parent = root;
};

const addBox = (
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

const addRoof = (scene: Scene, root: TransformNode, name: string, position: Vector3, width: number, material: StandardMaterial, tile: Position): void => {
  const roof = MeshBuilder.CreateCylinder(name, { diameterTop: 0, diameterBottom: width, height: 0.68, tessellation: 4 }, scene);
  roof.rotation.y = Math.PI / 4;
  roof.position = position;
  roof.material = material;
  roof.metadata = { tile };
  roof.parent = root;
};

const addWindows = (scene: Scene, root: TransformNode, building: Building, world: Vector3, count: number, material: StandardMaterial): void => {
  for (let index = 0; index < count; index += 1) {
    const x = world.x - 0.42 + (index % 3) * 0.42;
    const z = world.z - 0.63;
    const y = 0.72 + Math.floor(index / 3) * 0.52;
    addBox(scene, root, `window-${building.id}-${index}`, new Vector3(x, y, z), { width: 0.18, depth: 0.035, height: 0.22 }, material, building);
  }
};

const createPark = (scene: Scene, root: TransformNode, building: Building, world: Vector3, materials: Record<string, StandardMaterial>): void => {
  addBox(scene, root, `park-path-${building.id}`, new Vector3(world.x, 0.12, world.z), { width: 1.42, depth: 0.22, height: 0.08 }, materials.path, building);
  addBox(scene, root, `park-path-cross-${building.id}`, new Vector3(world.x, 0.13, world.z), { width: 0.22, depth: 1.42, height: 0.08 }, materials.path, building);
  const treeCount = building.variant === 3 ? 4 : 3;
  for (let index = 0; index < treeCount; index += 1) {
    const angle = (index / treeCount) * Math.PI * 2 + building.variant * 0.35;
    const x = world.x + Math.cos(angle) * 0.52;
    const z = world.z + Math.sin(angle) * 0.52;
    addBox(scene, root, `trunk-${building.id}-${index}`, new Vector3(x, 0.34, z), { width: 0.13, depth: 0.13, height: 0.42 }, materials.wood, building);
    const leaves = MeshBuilder.CreateSphere(`leaves-${building.id}-${index}`, { diameter: building.variant === 1 ? 0.52 : 0.44, segments: 8 }, scene);
    leaves.position = new Vector3(x, 0.78, z);
    leaves.material = materials.park;
    leaves.metadata = { tile: building };
    leaves.parent = root;
  }
  if (building.variant % 2 === 0) {
    addBox(scene, root, `bench-${building.id}`, new Vector3(world.x + 0.5, 0.28, world.z - 0.05), { width: 0.42, depth: 0.16, height: 0.12 }, materials.wood, building);
  }
};

const createBuildingMesh = (scene: Scene, game: GameState, root: TransformNode): void => {
  const materials = {
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
  };

  for (const building of game.buildings) {
    const world = toWorld(game, building);
    if (building.kind === 'park') {
      createPark(scene, root, building, world, materials);
      continue;
    }

    const variant = building.variant ?? 0;
    const dimensions = {
      house: [
        { width: 1.2, depth: 1.05, height: 1.0 },
        { width: 1.34, depth: 0.92, height: 1.25 },
        { width: 0.96, depth: 1.34, height: 1.1 },
        { width: 1.42, depth: 1.12, height: 1.0 },
      ],
      workplace: [
        { width: 1.22, depth: 1.22, height: 2.3 },
        { width: 1.36, depth: 1.05, height: 2.7 },
        { width: 1.1, depth: 1.34, height: 2.05 },
        { width: 1.46, depth: 1.18, height: 1.85 },
      ],
      restaurant: [
        { width: 1.32, depth: 1.08, height: 1.12 },
        { width: 1.12, depth: 1.34, height: 1.24 },
        { width: 1.48, depth: 1.0, height: 1.0 },
        { width: 1.22, depth: 1.22, height: 1.38 },
      ],
      bar: [
        { width: 1.24, depth: 1.18, height: 1.18 },
        { width: 1.42, depth: 1.0, height: 1.04 },
        { width: 1.04, depth: 1.42, height: 1.34 },
        { width: 1.34, depth: 1.16, height: 1.48 },
      ],
      park: [{ width: 1, depth: 1, height: 1 }],
    }[building.kind][variant];

    const main = addBox(
      scene,
      root,
      `building-${building.id}`,
      new Vector3(world.x, dimensions.height / 2 + 0.06, world.z),
      dimensions,
      materials[building.kind],
      building,
    );
    main.rotation.y = variant === 2 ? Math.PI / 2 : 0;

    if (building.kind === 'house') {
      addRoof(scene, root, `roof-${building.id}`, new Vector3(world.x, dimensions.height + 0.44, world.z), Math.max(dimensions.width, dimensions.depth) + 0.35, materials.roof, building);
      addWindows(scene, root, building, world, variant === 1 ? 5 : 3, materials.window);
      if (variant === 3) {
        addBox(scene, root, `porch-${building.id}`, new Vector3(world.x, 0.26, world.z - 0.72), { width: 0.74, depth: 0.18, height: 0.18 }, materials.wood, building);
      }
    }

    if (building.kind === 'workplace') {
      addWindows(scene, root, building, world, variant === 1 ? 12 : 9, materials.window);
      addBox(scene, root, `work-sign-${building.id}`, new Vector3(world.x, dimensions.height + 0.16, world.z), { width: dimensions.width + 0.12, depth: dimensions.depth + 0.12, height: 0.16 }, materials.darkRoof, building);
      if (variant === 2) {
        addBox(scene, root, `work-annex-${building.id}`, new Vector3(world.x + 0.42, 0.72, world.z + 0.36), { width: 0.62, depth: 0.54, height: 1.25 }, materials.workplace, building);
      }
    }

    if (building.kind === 'restaurant') {
      addBox(scene, root, `awning-${building.id}`, new Vector3(world.x, 0.95, world.z - 0.68), { width: 1.28, depth: 0.2, height: 0.16 }, materials.awning, building);
      addBox(scene, root, `restaurant-sign-${building.id}`, new Vector3(world.x, dimensions.height + 0.28, world.z - 0.24), { width: 0.7, depth: 0.08, height: 0.28 }, materials.awning, building);
      if (variant === 1 || variant === 3) {
        addBox(scene, root, `patio-${building.id}`, new Vector3(world.x + 0.54, 0.16, world.z + 0.54), { width: 0.42, depth: 0.42, height: 0.08 }, materials.wood, building);
      }
    }

    if (building.kind === 'bar') {
      addBox(scene, root, `bar-roof-${building.id}`, new Vector3(world.x, dimensions.height + 0.16, world.z), { width: dimensions.width + 0.14, depth: dimensions.depth + 0.14, height: 0.22 }, materials.darkRoof, building);
      addBox(scene, root, `bar-sign-${building.id}`, new Vector3(world.x, 1.08, world.z - 0.7), { width: 0.88, depth: 0.08, height: 0.22 }, materials.neon, building);
      addWindows(scene, root, building, world, variant === 3 ? 4 : 2, materials.window);
    }
  }
};

const createPeopleAndCars = (scene: Scene, game: GameState, root: TransformNode): void => {
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
    mesh.position = new Vector3(world.x + offset.x, citizen.mode === 'car' ? 0.28 : 0.32, world.z + offset.z);
    mesh.material = citizen.mode === 'car' ? carMaterial : citizen.happiness > 72 ? happyMaterial : personMaterial;
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
      .map((citizen) => [citizen.id, citizen.homeId, citizen.mode, citizen.happiness]),
  );

const createRoadMesh = (
  scene: Scene,
  game: GameState,
  root: TransformNode,
  road: GameState['roads'][number],
  roadKeys: Set<string>,
  material: StandardMaterial,
  bridgeMaterial: StandardMaterial,
  railMaterial: StandardMaterial,
): void => {
  const world = toWorld(game, road);
  const y = road.bridge ? 0.21 : 0.13;
  const deckMaterial = road.bridge ? bridgeMaterial : material;
  addBox(scene, root, `road-center-${road.id}`, new Vector3(world.x, y, world.z), { width: 1.02, depth: 1.02, height: road.bridge ? 0.18 : 0.1 }, deckMaterial, road);

  const connectors = [
    { key: posKey({ x: road.x + 1, z: road.z }), x: 0.52, z: 0, width: 1.0, depth: 0.56 },
    { key: posKey({ x: road.x - 1, z: road.z }), x: -0.52, z: 0, width: 1.0, depth: 0.56 },
    { key: posKey({ x: road.x, z: road.z + 1 }), x: 0, z: 0.52, width: 0.56, depth: 1.0 },
    { key: posKey({ x: road.x, z: road.z - 1 }), x: 0, z: -0.52, width: 0.56, depth: 1.0 },
  ];

  for (const connector of connectors) {
    if (roadKeys.has(connector.key)) {
      addBox(scene, root, `road-link-${road.id}-${connector.key}`, new Vector3(world.x + connector.x, y, world.z + connector.z), { width: connector.width, depth: connector.depth, height: road.bridge ? 0.18 : 0.1 }, deckMaterial, road);
    }
  }

  if (road.bridge) {
    addBox(scene, root, `bridge-rail-a-${road.id}`, new Vector3(world.x - 0.72, 0.43, world.z), { width: 0.08, depth: 1.48, height: 0.24 }, railMaterial, road);
    addBox(scene, root, `bridge-rail-b-${road.id}`, new Vector3(world.x + 0.72, 0.43, world.z), { width: 0.08, depth: 1.48, height: 0.24 }, railMaterial, road);
  }
};

const createLayoutContent = (scene: Scene, game: GameState): TransformNode => {
  const content = new TransformNode('city-layout-content', scene);
  content.setEnabled(false);

  const landMaterial = makeMaterial(scene, 'land-material', new Color3(0.34, 0.56, 0.31));
  const waterMaterial = makeMaterial(scene, 'water-material', new Color3(0.18, 0.48, 0.71), 0.86);
  const roadMaterial = makeMaterial(scene, 'road-material', new Color3(0.14, 0.15, 0.15));
  const bridgeMaterial = makeMaterial(scene, 'bridge-material', new Color3(0.55, 0.47, 0.35));
  const railMaterial = makeMaterial(scene, 'bridge-rail-material', new Color3(0.31, 0.25, 0.18));
  const connectionMaterial = makeMaterial(scene, 'connection-material', new Color3(0.93, 0.91, 0.72));
  const roadKeys = new Set(game.roads.map(posKey));

  for (const tile of game.map.tiles) {
    const ground = MeshBuilder.CreateBox(`tile-${tile.x}-${tile.z}`, { width: 1.96, depth: 1.96, height: 0.08 }, scene);
    const world = toWorld(game, tile);
    ground.position = new Vector3(world.x, tile.kind === 'water' ? -0.09 : 0, world.z);
    ground.material = tile.kind === 'water' ? waterMaterial : landMaterial;
    parentTile(ground, content, tile);
  }

  for (const road of game.roads) {
    createRoadMesh(scene, game, content, road, roadKeys, roadMaterial, bridgeMaterial, railMaterial);
  }

  const connection = MeshBuilder.CreateCylinder('map-connection', { diameter: 1.7, height: 0.22, tessellation: 6 }, scene);
  const connectionWorld = toWorld(game, game.map.connection);
  connection.position = new Vector3(connectionWorld.x, 0.34, connectionWorld.z);
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

export function CityScene({ game, isRoadTool, onTileSelected, onRoadLineSelected }: CitySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const layoutRef = useRef<TransformNode | null>(null);
  const populationRef = useRef<TransformNode | null>(null);
  const onTileSelectedRef = useRef(onTileSelected);
  const onRoadLineSelectedRef = useRef(onRoadLineSelected);
  const isRoadToolRef = useRef(isRoadTool);
  const roadDragStartRef = useRef<Position | null>(null);
  const layoutSignature = getLayoutSignature(game);
  const populationSignature = getPopulationSignature(game);

  useEffect(() => {
    onTileSelectedRef.current = onTileSelected;
    onRoadLineSelectedRef.current = onRoadLineSelected;
    isRoadToolRef.current = isRoadTool;
  }, [isRoadTool, onRoadLineSelected, onTileSelected]);

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

    const pickedTile = () => {
      const metadata = scene.pick(scene.pointerX, scene.pointerY)?.pickedMesh?.metadata as { tile?: Position } | undefined;
      return metadata?.tile;
    };

    scene.onPointerObservable.add((event) => {
      const tile = pickedTile();
      if (!tile) {
        return;
      }

      if (event.type === PointerEventTypes.POINTERDOWN && isRoadToolRef.current) {
        roadDragStartRef.current = tile;
        return;
      }

      if (event.type === PointerEventTypes.POINTERUP && isRoadToolRef.current && roadDragStartRef.current) {
        onRoadLineSelectedRef.current(roadDragStartRef.current, tile);
        roadDragStartRef.current = null;
        return;
      }

      if (event.type === PointerEventTypes.POINTERPICK && !isRoadToolRef.current) {
        onTileSelectedRef.current(tile);
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
