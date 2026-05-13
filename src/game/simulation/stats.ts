import { isConnectedToMap } from '../pathfinding';
import type { GameState, GameStats } from '../types';
import { average } from './status';
import { getSimulationIndex, housingCapacity, jobCapacity } from './indexes';

export const getStats = (state: GameState): GameStats => {
  const index = getSimulationIndex(state);
  const totalIncome =
    state.lastTick.rentIncome +
    state.lastTick.payrollTaxIncome +
    state.lastTick.foodTaxIncome +
    state.lastTick.barTaxIncome;
  const totalExpenses = state.lastTick.interestPaid;
  return {
    population: state.citizens.length,
    housingCapacity: housingCapacity(state),
    jobs: jobCapacity(state),
    restaurants: index.buildingsByKind.get('restaurant')?.length ?? 0,
    bars: index.buildingsByKind.get('bar')?.length ?? 0,
    parks: index.buildingsByKind.get('park')?.length ?? 0,
    employed: state.citizens.filter((citizen) => citizen.workplaceId).length,
    connectedToRegion: (index.buildingsByKind.get('house') ?? []).some((home) => isConnectedToMap(state, home)),
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
