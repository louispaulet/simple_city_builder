import { samePosition } from '../grid';
import { BUILDING_RULES } from '../rules';
import { getTile } from '../terrain';
import type { BuildingKind, BuildingVariant, GameState, Position } from '../types';
import { occupiedByBuilding, occupiedByRoad } from './occupancy';
import { nextId, type PlacementResult } from './result';

export const buildingVariantFor = (state: GameState, kind: BuildingKind, position: Position): BuildingVariant => {
  const value = Math.sin(state.map.seed * 17.17 + position.x * 41.31 + position.z * 73.73 + kind.length * 11.11) * 10000;
  return Math.abs(Math.floor(value)) % 4 as BuildingVariant;
};

export const canPlaceBuilding = (
  state: GameState,
  kind: BuildingKind,
  position: Position,
): { ok: boolean; message: string } => {
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

  return {
    ok: true,
    message: `${BUILDING_RULES[kind].label} placed.`,
    state: {
      ...state,
      buildings: [...state.buildings, { id: nextId(kind, state), kind, variant: buildingVariantFor(state, kind, position), ...position }],
      money: state.money - BUILDING_RULES[kind].cost,
      updatedAt: Date.now(),
    },
  };
};
