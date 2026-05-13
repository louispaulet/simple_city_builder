import { createMap } from './terrain';
import type { GameState } from './types';

const emptyTick = () => ({
  rentIncome: 0,
  wagesPaid: 0,
  payrollTaxIncome: 0,
  restaurantSpending: 0,
  foodTaxIncome: 0,
  barSpending: 0,
  barTaxIncome: 0,
  interestPaid: 0,
});

export const createNewGame = (seed = Math.floor(Math.random() * 100_000), name = 'New City'): GameState => {
  const now = Date.now();
  const map = createMap(seed);
  return {
    id: `city-${seed}-${now}`,
    name,
    map,
    buildings: [],
    roads: [
      {
        id: 'regional-connection-road',
        x: map.connection.x,
        z: map.connection.z,
        bridge: false,
      },
    ],
    citizens: [],
    money: 1800,
    lastTick: emptyTick(),
    loanBalance: 0,
    accruedInterest: 0,
    tick: 0,
    createdAt: now,
    updatedAt: now,
  };
};
