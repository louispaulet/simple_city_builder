import { posKey } from '../grid';
import { ROAD_COST } from '../rules';
import { getTile } from '../terrain';
import type { GameState, Position } from '../types';
import { occupiedByBuilding, occupiedByRoad } from './occupancy';
import { nextId, type PlacementResult } from './result';

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
  return {
    ok: true,
    message: tile.kind === 'water' ? 'Bridge placed.' : 'Road placed.',
    state: {
      ...state,
      roads: [...state.roads, { id: nextId('road', state), bridge: tile.kind === 'water', ...position }],
      money: state.money - ROAD_COST,
      updatedAt: Date.now(),
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
    if (seen.has(posKey(position)) || occupiedByRoad(next, position)) {
      continue;
    }
    seen.add(posKey(position));
    const result = placeRoad(next, position);
    if (!result.ok) {
      stopMessage = result.message;
      break;
    }
    placed += 1;
    bridges += result.state.roads.at(-1)?.bridge ? 1 : 0;
    next = result.state;
  }
  return roadLineResult(state, next, placed, bridges, stopMessage);
};

const roadLineResult = (state: GameState, next: GameState, placed: number, bridges: number, stopMessage: string): PlacementResult => {
  if (placed === 0) {
    return { state, ok: false, message: stopMessage || 'No new road tiles placed.' };
  }
  const roadLabel = placed === 1 ? 'tile' : 'tiles';
  const bridgeLabel = bridges > 0 ? ` including ${bridges} bridge ${bridges === 1 ? 'tile' : 'tiles'}` : '';
  return { state: next, ok: true, message: `Placed ${placed} road ${roadLabel}${bridgeLabel}.${stopMessage ? ` Stopped: ${stopMessage}` : ''}` };
};
