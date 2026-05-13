import { distance } from './grid';
import { findRoadPath, isConnectedToMap } from './pathfinding';
import { BUILDING_RULES, type Building, type Citizen, type GameState, type GameStats } from './types';

export const housingCapacity = (state: GameState): number =>
  state.buildings.filter((building) => building.kind === 'house').length * BUILDING_RULES.house.capacity;

export const jobCapacity = (state: GameState): number =>
  state.buildings.filter((building) => building.kind === 'workplace').length * BUILDING_RULES.workplace.jobs;

const buildingsByKind = (state: GameState, kind: Building['kind']): Building[] =>
  state.buildings.filter((building) => building.kind === kind);

const nearestReachable = (state: GameState, from: Building, candidates: Building[]): Building | undefined =>
  candidates
    .filter((candidate) => findRoadPath(state, from, candidate) !== null)
    .sort((a, b) => distance(from, a) - distance(from, b))[0];

const assignCitizen = (state: GameState, citizen: Citizen): Citizen => {
  const home = state.buildings.find((building) => building.id === citizen.homeId);
  if (!home) {
    return citizen;
  }

  const workplace = nearestReachable(state, home, buildingsByKind(state, 'workplace'));
  const restaurant = nearestReachable(state, home, buildingsByKind(state, 'restaurant'));
  return {
    ...citizen,
    workplaceId: workplace?.id,
    restaurantId: restaurant?.id,
    mode: workplace && distance(home, workplace) > 6 ? 'car' : 'foot',
  };
};

const createCitizen = (state: GameState, index: number): Citizen | undefined => {
  const homes = buildingsByKind(state, 'house').filter((home) => isConnectedToMap(state, home));
  if (homes.length === 0) {
    return undefined;
  }

  const homeOccupancy = new Map<string, number>();
  for (const citizen of state.citizens) {
    homeOccupancy.set(citizen.homeId, (homeOccupancy.get(citizen.homeId) ?? 0) + 1);
  }

  const home = homes.find((candidate) => (homeOccupancy.get(candidate.id) ?? 0) < BUILDING_RULES.house.capacity);
  if (!home) {
    return undefined;
  }

  return assignCitizen(state, {
    id: `citizen-${state.tick}-${index}-${Date.now()}`,
    homeId: home.id,
    mode: 'foot',
    money: 60,
  });
};

export const simulateTick = (state: GameState): GameState => {
  const connectedToRegion = state.buildings.some((building) => building.kind === 'house' && isConnectedToMap(state, building));
  let citizens = state.citizens.map((citizen) => assignCitizen(state, citizen));
  const freeHomes = housingCapacity(state) - citizens.length;
  const immigrants = connectedToRegion ? Math.min(3, Math.max(0, freeHomes)) : 0;

  for (let index = 0; index < immigrants; index += 1) {
    const citizen = createCitizen({ ...state, citizens }, index);
    if (citizen) {
      citizens = [...citizens, citizen];
    }
  }

  citizens = citizens.map((citizen) => assignCitizen({ ...state, citizens }, citizen));

  const rentIncome = citizens.length * BUILDING_RULES.house.rent;
  const employed = citizens.filter((citizen) => citizen.workplaceId).length;
  const wagesPaid = employed * BUILDING_RULES.workplace.wage;
  const diners = citizens.filter((citizen) => citizen.restaurantId).length;
  const restaurantSpending = diners * BUILDING_RULES.restaurant.spend;
  const money = state.money + rentIncome + restaurantSpending - wagesPaid;

  return {
    ...state,
    citizens,
    money,
    lastTick: { rentIncome, wagesPaid, restaurantSpending },
    tick: state.tick + 1,
    updatedAt: Date.now(),
  };
};

export const getStats = (state: GameState): GameStats => {
  const connectedToRegion = state.buildings.some((building) => building.kind === 'house' && isConnectedToMap(state, building));
  return {
    population: state.citizens.length,
    housingCapacity: housingCapacity(state),
    jobs: jobCapacity(state),
    restaurants: buildingsByKind(state, 'restaurant').length,
    employed: state.citizens.filter((citizen) => citizen.workplaceId).length,
    connectedToRegion,
    rentIncome: state.lastTick.rentIncome,
    wagesPaid: state.lastTick.wagesPaid,
    restaurantSpending: state.lastTick.restaurantSpending,
    money: state.money,
  };
};
