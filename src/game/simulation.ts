import { distance } from './grid';
import { findRoadPath, isConnectedToMap } from './pathfinding';
import { BUILDING_RULES, LOAN_INTEREST_RATE, type Building, type Citizen, type GameState, type GameStats } from './types';

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
  const bar = nearestReachable(state, home, buildingsByKind(state, 'bar'));
  const park = nearestReachable(state, home, buildingsByKind(state, 'park'));
  return {
    ...citizen,
    workplaceId: workplace?.id,
    restaurantId: restaurant?.id,
    barId: bar?.id,
    parkId: park?.id,
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
    happiness: 62,
    fitness: 58,
  });
};

const clampStatus = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

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

  let rentIncome = 0;
  let wagesPaid = 0;
  let payrollTaxIncome = 0;
  let restaurantSpending = 0;
  let foodTaxIncome = 0;
  let barSpending = 0;
  let barTaxIncome = 0;

  citizens = citizens.map((citizen) => {
    let citizenMoney = citizen.money;
    let happiness = citizen.happiness;
    let fitness = citizen.fitness;

    if (citizen.workplaceId) {
      citizenMoney += BUILDING_RULES.workplace.wage;
      wagesPaid += BUILDING_RULES.workplace.wage;
      payrollTaxIncome += BUILDING_RULES.workplace.payrollTax;
    }

    const rentPayment = Math.min(citizenMoney, BUILDING_RULES.house.rent);
    citizenMoney -= rentPayment;
    rentIncome += rentPayment;

    if (citizen.restaurantId && citizenMoney >= BUILDING_RULES.restaurant.spend) {
      citizenMoney -= BUILDING_RULES.restaurant.spend;
      restaurantSpending += BUILDING_RULES.restaurant.spend;
      foodTaxIncome += BUILDING_RULES.restaurant.foodTax;
    }

    if (citizen.barId && citizenMoney >= BUILDING_RULES.bar.spend) {
      citizenMoney -= BUILDING_RULES.bar.spend;
      happiness += BUILDING_RULES.bar.happinessGain;
      barSpending += BUILDING_RULES.bar.spend;
      barTaxIncome += BUILDING_RULES.bar.barTax;
    } else {
      happiness -= 2;
    }

    if (citizen.parkId) {
      fitness += BUILDING_RULES.park.fitnessGain;
    } else {
      fitness -= 1;
    }

    return {
      ...citizen,
      money: citizenMoney,
      happiness: clampStatus(happiness),
      fitness: clampStatus(fitness),
    };
  });

  const newInterest = state.loanBalance > 0 ? Math.ceil(state.loanBalance * LOAN_INTEREST_RATE) : 0;
  const availableForInterest = state.money + rentIncome + payrollTaxIncome + foodTaxIncome + barTaxIncome;
  const interestDue = state.accruedInterest + newInterest;
  const interestPaid = Math.min(availableForInterest, interestDue);
  const money = availableForInterest - interestPaid;

  return {
    ...state,
    citizens,
    money,
    accruedInterest: interestDue - interestPaid,
    lastTick: { rentIncome, wagesPaid, payrollTaxIncome, restaurantSpending, foodTaxIncome, barSpending, barTaxIncome, interestPaid },
    tick: state.tick + 1,
    updatedAt: Date.now(),
  };
};

export const getStats = (state: GameState): GameStats => {
  const connectedToRegion = state.buildings.some((building) => building.kind === 'house' && isConnectedToMap(state, building));
  const average = (values: number[]): number => values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const totalIncome = state.lastTick.rentIncome + state.lastTick.payrollTaxIncome + state.lastTick.foodTaxIncome + state.lastTick.barTaxIncome;
  const totalExpenses = state.lastTick.interestPaid;
  return {
    population: state.citizens.length,
    housingCapacity: housingCapacity(state),
    jobs: jobCapacity(state),
    restaurants: buildingsByKind(state, 'restaurant').length,
    bars: buildingsByKind(state, 'bar').length,
    parks: buildingsByKind(state, 'park').length,
    employed: state.citizens.filter((citizen) => citizen.workplaceId).length,
    connectedToRegion,
    happiness: average(state.citizens.map((citizen) => citizen.happiness)),
    fitness: average(state.citizens.map((citizen) => citizen.fitness)),
    rentIncome: state.lastTick.rentIncome,
    wagesPaid: state.lastTick.wagesPaid,
    payrollTaxIncome: state.lastTick.payrollTaxIncome,
    restaurantSpending: state.lastTick.restaurantSpending,
    foodTaxIncome: state.lastTick.foodTaxIncome,
    barSpending: state.lastTick.barSpending,
    barTaxIncome: state.lastTick.barTaxIncome,
    interestPaid: state.lastTick.interestPaid,
    totalIncome,
    totalExpenses,
    netChange: totalIncome - totalExpenses,
    loanBalance: state.loanBalance,
    accruedInterest: state.accruedInterest,
    money: state.money,
  };
};
