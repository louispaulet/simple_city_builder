import { inBounds } from './grid';
import type { GameMap, Position, Tile } from './types';

const randomFor = (seed: number, x: number, z: number): number => {
  const value = Math.sin(seed * 12.9898 + x * 78.233 + z * 37.719) * 43758.5453;
  return value - Math.floor(value);
};

const isWater = (seed: number, x: number, z: number, width: number, height: number): boolean => {
  const riverCenter = Math.floor(width * 0.42 + Math.sin((z + seed) * 0.45) * 2);
  const inRiver = Math.abs(x - riverCenter) <= 1 && z > 1 && z < height - 2;
  const pond = randomFor(seed, Math.floor(x / 3), Math.floor(z / 3)) > 0.82 && randomFor(seed, x, z) > 0.45;
  return inRiver || pond;
};

export const createMap = (seed = 1337, width = 18, height = 14): GameMap => {
  const connection: Position = { x: 0, z: Math.floor(height / 2) };
  const tiles: Tile[] = [];

  for (let z = 0; z < height; z += 1) {
    for (let x = 0; x < width; x += 1) {
      const kind = x === connection.x && z === connection.z ? 'land' : isWater(seed, x, z, width, height) ? 'water' : 'land';
      tiles.push({ x, z, kind });
    }
  }

  return { width, height, seed, tiles, connection };
};

export const getTile = (map: GameMap, position: Position): Tile | undefined => {
  if (!inBounds(position, map.width, map.height)) {
    return undefined;
  }

  return map.tiles[position.z * map.width + position.x];
};
