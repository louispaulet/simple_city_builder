import { Vector3 } from '@babylonjs/core';
import type { GameState, Position } from '../../game/types';

export const TILE_SIZE = 2;

export const toWorld = (game: GameState, position: Position): Vector3 =>
  new Vector3(
    (position.x - game.map.width / 2) * TILE_SIZE,
    0,
    (position.z - game.map.height / 2) * TILE_SIZE,
  );
