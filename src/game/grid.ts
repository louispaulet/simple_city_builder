import type { Position } from './types';

export const posKey = (position: Position): string => `${position.x},${position.z}`;

export const samePosition = (a: Position, b: Position): boolean => a.x === b.x && a.z === b.z;

export const neighbors = (position: Position): Position[] => [
  { x: position.x + 1, z: position.z },
  { x: position.x - 1, z: position.z },
  { x: position.x, z: position.z + 1 },
  { x: position.x, z: position.z - 1 },
];

export const inBounds = (position: Position, width: number, height: number): boolean =>
  position.x >= 0 && position.z >= 0 && position.x < width && position.z < height;

export const distance = (a: Position, b: Position): number => Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
