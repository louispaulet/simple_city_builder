import { samePosition } from './grid';
import { getTile } from './terrain';
import { BUILDING_RULES, ROAD_COST, type BuildingKind, type GameState, type Position } from './types';

export interface PlacementResult {
  state: GameState;
  ok: boolean;
  message: string;
}

const nextId = (prefix: string, state: GameState): string => `${prefix}-${state.tick}-${state.buildings.length}-${state.roads.length}-${Date.now()}`;

const occupiedByBuilding = (state: GameState, position: Position): boolean =>
  state.buildings.some((building) => samePosition(building, position));

const occupiedByRoad = (state: GameState, position: Position): boolean => state.roads.some((road) => samePosition(road, position));

export const canPlaceBuilding = (state: GameState, kind: BuildingKind, position: Position): { ok: boolean; message: string } => {
  const tile = getTile(state.map, position);
  if (!tile) {
    return { ok: false, message: 'Outside the city limits.' };
  }
  if (tile.kind === 'water') {
    return { ok: false, message: 'Buildings need dry land.' };
  }
  if (samePosition(position, state.map.connection)) {
    return { ok: false, message: 'Keep the regional connection clear.' };
  }
  if (occupiedByBuilding(state, position) || occupiedByRoad(state, position)) {
    return { ok: false, message: 'That tile is already occupied.' };
  }
  if (state.money < BUILDING_RULES[kind].cost) {
    return { ok: false, message: 'Not enough city funds.' };
  }
  return { ok: true, message: 'Ready to build.' };
};

export const placeBuilding = (state: GameState, kind: BuildingKind, position: Position): PlacementResult => {
  const result = canPlaceBuilding(state, kind, position);
  if (!result.ok) {
    return { state, ok: false, message: result.message };
  }

  const now = Date.now();
  return {
    ok: true,
    message: `${BUILDING_RULES[kind].label} placed.`,
    state: {
      ...state,
      buildings: [...state.buildings, { id: nextId(kind, state), kind, ...position }],
      money: state.money - BUILDING_RULES[kind].cost,
      updatedAt: now,
    },
  };
};

export const canPlaceRoad = (state: GameState, position: Position): { ok: boolean; message: string } => {
  const tile = getTile(state.map, position);
  if (!tile) {
    return { ok: false, message: 'Outside the city limits.' };
  }
  if (occupiedByBuilding(state, position) || occupiedByRoad(state, position)) {
    return { ok: false, message: 'That tile is already occupied.' };
  }
  if (state.money < ROAD_COST) {
    return { ok: false, message: 'Not enough city funds.' };
  }
  return { ok: true, message: tile.kind === 'water' ? 'Bridge ready.' : 'Road ready.' };
};

export const placeRoad = (state: GameState, position: Position): PlacementResult => {
  const result = canPlaceRoad(state, position);
  if (!result.ok) {
    return { state, ok: false, message: result.message };
  }

  const tile = getTile(state.map, position)!;
  const now = Date.now();
  return {
    ok: true,
    message: tile.kind === 'water' ? 'Bridge placed.' : 'Road placed.',
    state: {
      ...state,
      roads: [...state.roads, { id: nextId('road', state), bridge: tile.kind === 'water', ...position }],
      money: state.money - ROAD_COST,
      updatedAt: now,
    },
  };
};

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
