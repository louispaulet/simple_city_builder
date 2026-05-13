import { posKey } from '../grid';
import { BUILDING_RULES } from '../rules';
import type { Building, GameState } from '../types';

export interface SimulationIndex {
  signature: string;
  buildingsByKind: Map<Building['kind'], Building[]>;
  buildingsById: Map<string, Building>;
  homeOccupancy: Map<string, number>;
  roadKeys: Set<string>;
  reachableCache: Map<string, boolean>;
}

let cachedIndex: SimulationIndex | undefined;

const layoutSignature = (state: GameState): string =>
  JSON.stringify({
    buildings: state.buildings.map((building) => [building.id, building.kind, building.x, building.z]),
    roads: state.roads.map((road) => [road.x, road.z]),
  });

const buildIndex = (state: GameState, signature: string): SimulationIndex => {
  const buildingsByKind = new Map<Building['kind'], Building[]>();
  const buildingsById = new Map<string, Building>();
  const homeOccupancy = new Map<string, number>();

  for (const building of state.buildings) {
    buildingsById.set(building.id, building);
    buildingsByKind.set(building.kind, [...(buildingsByKind.get(building.kind) ?? []), building]);
  }
  for (const citizen of state.citizens) {
    homeOccupancy.set(citizen.homeId, (homeOccupancy.get(citizen.homeId) ?? 0) + 1);
  }

  return {
    signature,
    buildingsByKind,
    buildingsById,
    homeOccupancy,
    roadKeys: new Set(state.roads.map(posKey)),
    reachableCache: cachedIndex?.signature === signature ? cachedIndex.reachableCache : new Map(),
  };
};

export const getSimulationIndex = (state: GameState): SimulationIndex => {
  const signature = layoutSignature(state);
  if (!cachedIndex || cachedIndex.signature !== signature) {
    cachedIndex = buildIndex(state, signature);
  } else {
    cachedIndex = buildIndex(state, signature);
  }
  return cachedIndex;
};

export const housingCapacity = (state: GameState): number =>
  (getSimulationIndex(state).buildingsByKind.get('house')?.length ?? 0) * BUILDING_RULES.house.capacity;

export const jobCapacity = (state: GameState): number =>
  (getSimulationIndex(state).buildingsByKind.get('workplace')?.length ?? 0) * BUILDING_RULES.workplace.jobs;
