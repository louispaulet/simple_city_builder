import { posKey, samePosition } from './grid';
import { getTile } from './terrain';
import { BUILDING_RULES, ROAD_COST, type BuildingKind, type BuildingVariant, type GameState, type Position } from './types';

export interface PlacementResult {
  state: GameState;
  ok: boolean;
  message: string;
}

const nextId = (prefix: string, state: GameState): string => `${prefix}-${state.tick}-${state.buildings.length}-${state.roads.length}-${Date.now()}`;

const occupiedByBuilding = (state: GameState, position: Position): boolean =>
  state.buildings.some((building) => samePosition(building, position));

const occupiedByRoad = (state: GameState, position: Position): boolean => state.roads.some((road) => samePosition(road, position));

export const buildingVariantFor = (state: GameState, kind: BuildingKind, position: Position): BuildingVariant => {
  const value = Math.sin(state.map.seed * 17.17 + position.x * 41.31 + position.z * 73.73 + kind.length * 11.11) * 10000;
  return Math.abs(Math.floor(value)) % 4 as BuildingVariant;
};

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
      buildings: [...state.buildings, { id: nextId(kind, state), kind, variant: buildingVariantFor(state, kind, position), ...position }],
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

export const roadLinePositions = (start: Position, end: Position): Position[] => {
  const useX = Math.abs(end.x - start.x) >= Math.abs(end.z - start.z);
  const positions: Position[] = [];

  if (useX) {
    const step = start.x <= end.x ? 1 : -1;
    for (let x = start.x; x !== end.x + step; x += step) {
      positions.push({ x, z: start.z });
    }
    return positions;
  }

  const step = start.z <= end.z ? 1 : -1;
  for (let z = start.z; z !== end.z + step; z += step) {
    positions.push({ x: start.x, z });
  }
  return positions;
};

export const placeRoadLine = (state: GameState, start: Position, end: Position): PlacementResult => {
  let next = state;
  let placed = 0;
  let bridges = 0;
  let stopMessage = '';
  const seen = new Set<string>();

  for (const position of roadLinePositions(start, end)) {
    const key = posKey(position);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    if (occupiedByRoad(next, position)) {
      continue;
    }

    const result = placeRoad(next, position);
    if (!result.ok) {
      stopMessage = result.message;
      break;
    }

    const road = result.state.roads.at(-1);
    placed += 1;
    bridges += road?.bridge ? 1 : 0;
    next = result.state;
  }

  if (placed === 0) {
    return { state, ok: false, message: stopMessage || 'No new road tiles placed.' };
  }

  const roadLabel = placed === 1 ? 'tile' : 'tiles';
  const bridgeLabel = bridges > 0 ? ` including ${bridges} bridge ${bridges === 1 ? 'tile' : 'tiles'}` : '';
  return {
    state: next,
    ok: true,
    message: `Placed ${placed} road ${roadLabel}${bridgeLabel}.${stopMessage ? ` Stopped: ${stopMessage}` : ''}`,
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
