import { distance } from '../grid';
import { findRoadPath, isConnectedToMap } from '../pathfinding';
import { ASSIGNMENTS_PER_TICK, BUILDING_RULES } from '../rules';
import type { Building, Citizen, GameState } from '../types';
import { getSimulationIndex, housingCapacity, type SimulationIndex } from './indexes';
import { initialCitizen } from './status';

const reachable = (state: GameState, index: SimulationIndex, from: Building, to: Building): boolean => {
  const key = `${from.id}:${to.id}`;
  if (!index.reachableCache.has(key)) {
    index.reachableCache.set(key, findRoadPath(state, from, to) !== null);
  }
  return index.reachableCache.get(key) ?? false;
};

const nearestReachable = (state: GameState, index: SimulationIndex, from: Building, kind: Building['kind']): Building | undefined =>
  (index.buildingsByKind.get(kind) ?? [])
    .filter((candidate) => reachable(state, index, from, candidate))
    .sort((a, b) => distance(from, a) - distance(from, b))[0];

export const assignCitizen = (state: GameState, index: SimulationIndex, citizen: Citizen): Citizen => {
  const home = index.buildingsById.get(citizen.homeId);
  if (!home) {
    return citizen;
  }

  const workplace = nearestReachable(state, index, home, 'workplace');
  return {
    ...citizen,
    workplaceId: workplace?.id,
    restaurantId: nearestReachable(state, index, home, 'restaurant')?.id,
    barId: nearestReachable(state, index, home, 'bar')?.id,
    parkId: nearestReachable(state, index, home, 'park')?.id,
    mode: workplace && distance(home, workplace) > 6 ? 'car' : 'foot',
  };
};

const createCitizen = (state: GameState, index: SimulationIndex, slot: number): Citizen | undefined => {
  const homes = (index.buildingsByKind.get('house') ?? []).filter((home) => isConnectedToMap(state, home));
  const home = homes.find((candidate) => (index.homeOccupancy.get(candidate.id) ?? 0) < BUILDING_RULES.house.capacity);
  if (!home) {
    return undefined;
  }
  index.homeOccupancy.set(home.id, (index.homeOccupancy.get(home.id) ?? 0) + 1);
  return assignCitizen(state, index, initialCitizen(state, home, slot));
};

const assignmentWindow = (citizens: Citizen[], tick: number): Set<number> => {
  const selected = new Set<number>();
  if (citizens.length === 0) {
    return selected;
  }
  const start = (tick * ASSIGNMENTS_PER_TICK) % citizens.length;
  const count = Math.min(citizens.length, ASSIGNMENTS_PER_TICK);
  for (let offset = 0; offset < count; offset += 1) {
    selected.add((start + offset) % citizens.length);
  }
  return selected;
};

export const updateAssignments = (state: GameState): Citizen[] => {
  const index = getSimulationIndex(state);
  const connectedToRegion = (index.buildingsByKind.get('house') ?? []).some((home) => isConnectedToMap(state, home));
  const refresh = assignmentWindow(state.citizens, state.tick);
  let citizens = state.citizens.map((citizen, citizenIndex) =>
    refresh.has(citizenIndex) ? assignCitizen(state, index, citizen) : citizen,
  );
  const immigrants = connectedToRegion ? Math.min(3, Math.max(0, housingCapacity(state) - citizens.length)) : 0;
  for (let slot = 0; slot < immigrants; slot += 1) {
    const citizen = createCitizen({ ...state, citizens }, index, slot);
    if (citizen) {
      citizens = [...citizens, citizen];
    }
  }
  return citizens;
};
