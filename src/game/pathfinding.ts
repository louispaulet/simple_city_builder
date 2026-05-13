import { inBounds, neighbors, posKey, samePosition } from './grid';
import type { GameState, Position, Road } from './types';

const roadPositions = (roads: Road[]): Set<string> => new Set(roads.map(posKey));

export const hasRoadAt = (state: Pick<GameState, 'roads'>, position: Position): boolean =>
  state.roads.some((road) => samePosition(road, position));

export const adjacentRoads = (state: GameState, position: Position): Position[] => {
  const roadKeys = roadPositions(state.roads);
  return neighbors(position).filter((neighbor) => roadKeys.has(posKey(neighbor)));
};

export const findRoadPath = (state: GameState, from: Position, to: Position): Position[] | null => {
  const roadKeys = roadPositions(state.roads);
  const starts = roadKeys.has(posKey(from)) ? [from] : adjacentRoads(state, from);
  const goals = roadKeys.has(posKey(to)) ? new Set([posKey(to)]) : new Set(adjacentRoads(state, to).map(posKey));

  if (starts.length === 0 || goals.size === 0) {
    return null;
  }

  const queue: Position[] = [...starts];
  const cameFrom = new Map<string, string | null>();

  for (const start of starts) {
    cameFrom.set(posKey(start), null);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = posKey(current);

    if (goals.has(currentKey)) {
      const path: Position[] = [];
      let cursor: string | null = currentKey;
      while (cursor) {
        const [x, z] = cursor.split(',').map(Number);
        path.unshift({ x, z });
        cursor = cameFrom.get(cursor) ?? null;
      }
      return path;
    }

    for (const next of neighbors(current)) {
      const nextKey = posKey(next);
      if (!inBounds(next, state.map.width, state.map.height) || !roadKeys.has(nextKey) || cameFrom.has(nextKey)) {
        continue;
      }
      cameFrom.set(nextKey, currentKey);
      queue.push(next);
    }
  }

  return null;
};

export const isConnectedToMap = (state: GameState, position: Position): boolean =>
  findRoadPath(state, state.map.connection, position) !== null;
