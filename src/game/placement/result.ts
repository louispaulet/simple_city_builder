import type { GameState } from '../types';

export interface PlacementResult {
  state: GameState;
  ok: boolean;
  message: string;
}

export const nextId = (prefix: string, state: GameState): string =>
  `${prefix}-${state.tick}-${state.buildings.length}-${state.roads.length}-${Date.now()}`;
