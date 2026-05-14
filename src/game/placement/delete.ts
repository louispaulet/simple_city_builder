import { samePosition } from '../grid';
import type { GameState, Position } from '../types';
import type { PlacementResult } from './result';

export const deleteAt = (state: GameState, position: Position): PlacementResult => {
  const buildings = state.buildings.filter((building) => !samePosition(building, position));
  const roads = state.roads.filter((road) => !samePosition(road, position));
  if (buildings.length === state.buildings.length && roads.length === state.roads.length) {
    return { state, ok: false, message: 'Nothing to remove here.' };
  }

  return {
    ok: true,
    message: 'Removed.',
    state: {
      ...state,
      buildings,
      roads,
      updatedAt: Date.now(),
    },
  };
};
