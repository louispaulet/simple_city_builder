import { createNewGame } from '../game/createGame';
import { neighbors } from '../game/grid';
import { placeRoad } from '../game/placement';
import type { GameState, Position, Tile } from '../game/types';

export const firstTile = (state: GameState, predicate: (tile: Tile) => boolean): Position => {
  const tile = state.map.tiles.find(predicate);
  if (!tile) {
    throw new Error('No matching tile found');
  }
  return { x: tile.x, z: tile.z };
};

export const firstLand = (state: GameState): Position =>
  firstTile(
    state,
    (tile) =>
      tile.kind === 'land' &&
      !(tile.x === state.map.connection.x && tile.z === state.map.connection.z) &&
      !state.buildings.some((building) => building.x === tile.x && building.z === tile.z) &&
      !state.roads.some((road) => road.x === tile.x && road.z === tile.z),
  );

export const firstWater = (state: GameState): Position =>
  firstTile(state, (tile) => tile.kind === 'water');

export const withMoney = (state: GameState): GameState => ({
  ...state,
  money: 10_000,
});

export const newRichGame = (seed = 44): GameState => withMoney(createNewGame(seed));

export const buildRoadLine = (state: GameState, to: Position): GameState => {
  let next = withMoney(state);
  const step = next.map.connection.z <= to.z ? 1 : -1;
  for (let z = next.map.connection.z; z !== to.z; z += step) {
    next = placeRoad(next, { x: next.map.connection.x, z }).state;
  }
  const xStep = next.map.connection.x <= to.x ? 1 : -1;
  for (let x = next.map.connection.x; x !== to.x + xStep; x += xStep) {
    const result = placeRoad(next, { x, z: to.z });
    next = result.ok ? result.state : next;
  }
  return withMoney(next);
};

export const buildMainStreet = (state: GameState): GameState =>
  buildRoadLine(state, { x: state.map.width - 2, z: state.map.connection.z });

export const landNextToRoad = (state: GameState, minX = 1): Position => {
  const roadKeys = new Set(state.roads.map((road) => `${road.x},${road.z}`));
  return firstTile(
    state,
    (tile) =>
      tile.kind === 'land' &&
      tile.x >= minX &&
      !state.buildings.some((building) => building.x === tile.x && building.z === tile.z) &&
      !roadKeys.has(`${tile.x},${tile.z}`) &&
      neighbors(tile).some((neighbor) => roadKeys.has(`${neighbor.x},${neighbor.z}`)),
  );
};
