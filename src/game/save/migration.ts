import { buildingVariantFor } from '../placement';
import type { Building, Citizen, GameState, SerializedGame } from '../types';

export type LegacySerializedGame = {
  version: 2;
  state: Omit<GameState, 'loanBalance' | 'accruedInterest' | 'buildings' | 'citizens' | 'lastTick'> & {
    buildings: Array<Omit<GameState['buildings'][number], 'variant'> & { variant?: GameState['buildings'][number]['variant'] }>;
    citizens: Array<Omit<GameState['citizens'][number], 'happiness' | 'fitness'> & { happiness?: number; fitness?: number }>;
    lastTick: Partial<GameState['lastTick']>;
  };
};

export const withCompleteTick = (tick: Partial<GameState['lastTick']>): GameState['lastTick'] => ({
  rentIncome: tick.rentIncome ?? 0,
  wagesPaid: tick.wagesPaid ?? 0,
  payrollTaxIncome: tick.payrollTaxIncome ?? 0,
  restaurantSpending: tick.restaurantSpending ?? 0,
  foodTaxIncome: tick.foodTaxIncome ?? 0,
  barSpending: tick.barSpending ?? 0,
  barTaxIncome: tick.barTaxIncome ?? 0,
  interestPaid: tick.interestPaid ?? 0,
});

const completeBuildings = (state: GameState, buildings: LegacySerializedGame['state']['buildings']): Building[] =>
  buildings.map((building): Building => ({
    ...building,
    variant: building.variant ?? buildingVariantFor(state, building.kind, building),
  }));

const completeCitizens = (citizens: LegacySerializedGame['state']['citizens'] | GameState['citizens']): Citizen[] =>
  citizens.map((citizen): Citizen => ({
    ...citizen,
    happiness: citizen.happiness ?? 60,
    fitness: citizen.fitness ?? 55,
  }));

export const migrateLegacyGame = (serialized: LegacySerializedGame): GameState => {
  const legacy = serialized.state;
  const state = { ...legacy, loanBalance: 0, accruedInterest: 0, lastTick: withCompleteTick(legacy.lastTick) } as GameState;
  return { ...state, buildings: completeBuildings(state, legacy.buildings), citizens: completeCitizens(legacy.citizens) };
};

export const normalizeCurrentGame = (serialized: SerializedGame): GameState => {
  const state = {
    ...serialized.state,
    lastTick: withCompleteTick(serialized.state.lastTick),
    loanBalance: serialized.state.loanBalance ?? 0,
    accruedInterest: serialized.state.accruedInterest ?? 0,
  };
  return {
    ...state,
    buildings: state.buildings.map((building): Building => ({
      ...building,
      variant: building.variant ?? buildingVariantFor(state, building.kind, building),
    })),
    citizens: completeCitizens(state.citizens),
  };
};
