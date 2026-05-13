import { samePosition } from '../grid';
import type { GameState, Position } from '../types';

export const occupiedByBuilding = (state: GameState, position: Position): boolean =>
  state.buildings.some((building) => samePosition(building, position));

export const occupiedByRoad = (state: GameState, position: Position): boolean =>
  state.roads.some((road) => samePosition(road, position));
