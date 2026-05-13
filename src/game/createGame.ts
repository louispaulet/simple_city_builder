import { createMap } from './terrain';
import type { GameState } from './types';

export const createNewGame = (seed = Math.floor(Math.random() * 100_000)): GameState => {
  const now = Date.now();
  const map = createMap(seed);
  return {
    id: `city-${seed}-${now}`,
    name: 'New City',
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
    lastTick: {
      rentIncome: 0,
      wagesPaid: 0,
      payrollTaxIncome: 0,
      restaurantSpending: 0,
      foodTaxIncome: 0,
    },
    tick: 0,
    createdAt: now,
    updatedAt: now,
  };
};
