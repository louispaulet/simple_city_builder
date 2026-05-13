import { describe, expect, it } from 'vitest';
import { borrowMoney, repayDebt } from './bank';
import { createNewGame } from './createGame';
import { neighbors } from './grid';
import { findRoadPath } from './pathfinding';
import { canPlaceBuilding, placeBuilding, placeRoad, placeRoadLine } from './placement';
import { deserializeGame, serializeGame } from './save';
import { getStats, simulateTick } from './simulation';
import { getTile } from './terrain';
import { BUILDING_RULES, type GameState, type Position, type Tile } from './types';

const firstTile = (state: GameState, predicate: (tile: Tile) => boolean): Position => {
  const tile = state.map.tiles.find(predicate);
  if (!tile) {
    throw new Error('No matching tile found');
  }
  return { x: tile.x, z: tile.z };
};

const firstLand = (state: GameState): Position =>
  firstTile(
    state,
    (tile) =>
      tile.kind === 'land' &&
      !(tile.x === state.map.connection.x && tile.z === state.map.connection.z) &&
      !state.buildings.some((building) => building.x === tile.x && building.z === tile.z) &&
      !state.roads.some((road) => road.x === tile.x && road.z === tile.z),
  );

const firstWater = (state: GameState): Position => firstTile(state, (tile) => tile.kind === 'water');

const withMoney = (state: GameState): GameState => ({ ...state, money: 10_000 });

const buildRoadLine = (state: GameState, to: Position): GameState => {
  let next = withMoney(state);
  const step = next.map.connection.z <= to.z ? 1 : -1;
  for (let z = next.map.connection.z; z !== to.z; z += step) {
    next = placeRoad(next, { x: next.map.connection.x, z }).state;
  }
  const xStep = next.map.connection.x <= to.x ? 1 : -1;
  for (let x = next.map.connection.x; x !== to.x + xStep; x += xStep) {
    const result = placeRoad(next, { x, z: to.z });
    next = result.ok ? result.state : next;
  }
  return withMoney(next);
};

const buildMainStreet = (state: GameState): GameState => buildRoadLine(state, { x: state.map.width - 2, z: state.map.connection.z });

const landNextToRoad = (state: GameState, minX = 1): Position => {
  const roadKeys = new Set(state.roads.map((road) => `${road.x},${road.z}`));
  return firstTile(
    state,
    (tile) =>
      tile.kind === 'land' &&
      tile.x >= minX &&
      !state.buildings.some((building) => building.x === tile.x && building.z === tile.z) &&
      !roadKeys.has(`${tile.x},${tile.z}`) &&
      neighbors(tile).some((neighbor) => roadKeys.has(`${neighbor.x},${neighbor.z}`)),
  );
};

describe('city placement rules', () => {
  it('places buildings on land', () => {
    const state = withMoney(createNewGame(44));
    const result = placeBuilding(state, 'house', firstLand(state));

    expect(result.ok).toBe(true);
    expect(result.state.buildings).toHaveLength(1);
    expect(result.state.buildings[0].kind).toBe('house');
    expect(result.state.buildings[0].variant).toBeGreaterThanOrEqual(0);
  });

  it('places bars and parks on land', () => {
    let state = withMoney(createNewGame(44));
    const bar = firstLand(state);
    const barResult = placeBuilding(state, 'bar', bar);
    state = barResult.state;
    const parkResult = placeBuilding(state, 'park', firstLand(state));

    expect(barResult.ok).toBe(true);
    expect(parkResult.ok).toBe(true);
    expect(parkResult.state.buildings.map((building) => building.kind)).toEqual(['bar', 'park']);
  });

  it('blocks buildings on water', () => {
    const state = withMoney(createNewGame(44));
    const water = firstWater(state);
    const result = canPlaceBuilding(state, 'workplace', water);

    expect(getTile(state.map, water)?.kind).toBe('water');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/dry land/i);
  });

  it('places water roads as bridges', () => {
    const state = withMoney(createNewGame(44));
    const water = firstWater(state);
    const result = placeRoad(state, water);

    expect(result.ok).toBe(true);
    expect(result.state.roads.at(-1)).toMatchObject({ bridge: true, ...water });
  });
});

describe('save format', () => {
  it('keeps the city name in new games and saves', () => {
    const state = createNewGame(91, 'Harbor Loop');
    const serialized = serializeGame(state);

    expect(state.name).toBe('Harbor Loop');
    expect(deserializeGame(serialized).name).toBe('Harbor Loop');
  });

  it('round trips serialized game state', () => {
    const state = withMoney(createNewGame(91));
    const built = placeBuilding(state, 'restaurant', firstLand(state)).state;

    expect(deserializeGame(serializeGame(built))).toMatchObject({
      id: built.id,
      map: { seed: 91 },
      buildings: built.buildings,
      roads: built.roads,
    });
  });

  it('migrates version 2 saves with defaults for new fields', () => {
    const state = withMoney(createNewGame(91));
    const built = placeBuilding(state, 'house', firstLand(state)).state;
    const legacy = {
      version: 2 as const,
      state: {
        ...built,
        buildings: built.buildings.map(({ variant: _variant, ...building }) => building),
        citizens: [{ id: 'legacy-citizen', homeId: built.buildings[0].id, mode: 'foot' as const, money: 42 }],
      },
    };

    const migrated = deserializeGame(legacy);

    expect(migrated.loanBalance).toBe(0);
    expect(migrated.accruedInterest).toBe(0);
    expect(migrated.buildings[0].variant).toBeGreaterThanOrEqual(0);
    expect(migrated.citizens[0]).toMatchObject({ happiness: 60, fitness: 55 });
  });
});

describe('simulation and connectivity', () => {
  it('requires road connectivity for immigration', () => {
    const state = withMoney(createNewGame(44));
    const house = firstLand(state);
    const unconnected = placeBuilding(state, 'house', house).state;

    expect(simulateTick(unconnected).citizens).toHaveLength(0);

    const connectedRoads = buildMainStreet(state);
    const connectedHouse = placeBuilding(connectedRoads, 'house', landNextToRoad(connectedRoads)).state;
    const ticked = simulateTick(connectedHouse);

    expect(ticked.citizens.length).toBeGreaterThan(0);
    expect(getStats(ticked).connectedToRegion).toBe(true);
  });

  it('assigns workplaces only when commute paths exist', () => {
    let state = withMoney(createNewGame(44));
    state = buildMainStreet(state);
    const house = landNextToRoad(state, 1);
    const workplace = landNextToRoad(state, house.x + 3);
    state = placeBuilding(state, 'house', house).state;
    state = placeBuilding(state, 'workplace', workplace).state;

    const ticked = simulateTick(state);

    expect(ticked.citizens.some((citizen) => citizen.workplaceId)).toBe(true);
    expect(getStats(ticked).employed).toBeGreaterThan(0);
    expect(findRoadPath(ticked, house, workplace)).not.toBeNull();
  });

  it('taxes workplace wages instead of paying them from city funds', () => {
    let state = withMoney(createNewGame(44));
    state = buildMainStreet(state);
    const house = landNextToRoad(state, 1);
    const workplace = landNextToRoad(state, house.x + 3);
    state = placeBuilding(state, 'house', house).state;
    state = placeBuilding(state, 'workplace', workplace).state;

    const ticked = simulateTick(state);
    const stats = getStats(ticked);

    expect(stats.wagesPaid).toBe(stats.employed * BUILDING_RULES.workplace.wage);
    expect(stats.wagesPaid).toBeGreaterThan(0);
    expect(stats.payrollTaxIncome).toBe(stats.employed * BUILDING_RULES.workplace.payrollTax);
    expect(ticked.money).toBe(state.money + stats.rentIncome + stats.payrollTaxIncome + stats.foodTaxIncome);
    expect(ticked.citizens.every((citizen) => citizen.money >= 0)).toBe(true);
  });

  it('tracks restaurant spending when homes can reach restaurants', () => {
    let state = withMoney(createNewGame(44));
    state = buildMainStreet(state);
    const house = landNextToRoad(state, 1);
    const restaurant = landNextToRoad(state, house.x + 2);
    state = placeBuilding(state, 'house', house).state;
    state = placeBuilding(state, 'restaurant', restaurant).state;

    const ticked = simulateTick(state);
    const stats = getStats(ticked);

    expect(stats.restaurantSpending).toBeGreaterThan(0);
    expect(stats.foodTaxIncome).toBe((stats.restaurantSpending / BUILDING_RULES.restaurant.spend) * BUILDING_RULES.restaurant.foodTax);
    expect(ticked.money).toBeGreaterThan(state.money);
  });

  it('tracks bar happiness, park fitness, and bar tax when reachable', () => {
    let state = withMoney(createNewGame(44));
    state = buildMainStreet(state);
    const house = landNextToRoad(state, 1);
    const bar = landNextToRoad(state, house.x + 2);
    const park = landNextToRoad(state, bar.x + 2);
    state = placeBuilding(state, 'house', house).state;
    state = placeBuilding(state, 'bar', bar).state;
    state = placeBuilding(state, 'park', park).state;

    const ticked = simulateTick(state);
    const stats = getStats(ticked);

    expect(ticked.citizens.some((citizen) => citizen.barId && citizen.parkId)).toBe(true);
    expect(stats.barSpending).toBeGreaterThan(0);
    expect(stats.barTaxIncome).toBe((stats.barSpending / BUILDING_RULES.bar.spend) * BUILDING_RULES.bar.barTax);
    expect(stats.happiness).toBeGreaterThan(60);
    expect(stats.fitness).toBeGreaterThan(55);
  });

  it('pays loan interest from city funds and reports expenses', () => {
    let state = withMoney(createNewGame(44));
    state = borrowMoney(state, 1000).state;

    const ticked = simulateTick(state);
    const stats = getStats(ticked);

    expect(stats.loanBalance).toBe(1000);
    expect(stats.interestPaid).toBeGreaterThan(0);
    expect(stats.totalExpenses).toBe(stats.interestPaid);
    expect(ticked.money).toBe(state.money - stats.interestPaid);
  });
});

describe('banking and road line placement', () => {
  it('borrows money and repays interest before principal', () => {
    let state = { ...createNewGame(44), money: 100, loanBalance: 1000, accruedInterest: 40 };

    state = borrowMoney(state, 500).state;
    expect(state.money).toBe(600);
    expect(state.loanBalance).toBe(1500);

    state = repayDebt(state, 70).state;
    expect(state.money).toBe(530);
    expect(state.accruedInterest).toBe(0);
    expect(state.loanBalance).toBe(1470);
  });

  it('places straight road lines, skips existing roads, and creates bridges over water', () => {
    const state = withMoney(createNewGame(44));
    const water = firstWater(state);
    const start = { x: Math.max(0, water.x - 1), z: water.z };
    const end = { x: Math.min(state.map.width - 1, water.x + 1), z: water.z };

    const result = placeRoadLine(state, start, end);

    expect(result.ok).toBe(true);
    expect(result.state.roads.length).toBeGreaterThan(state.roads.length);
    expect(result.state.roads.some((road) => road.bridge)).toBe(true);
    expect(result.state.money).toBeLessThan(state.money);
  });

  it('stops road lines at blockers but keeps placed tiles', () => {
    let state = withMoney(createNewGame(44));
    const start = firstLand(state);
    state = placeBuilding(state, 'house', { x: start.x + 1, z: start.z }).ok
      ? placeBuilding(state, 'house', { x: start.x + 1, z: start.z }).state
      : placeBuilding(state, 'house', firstLand(state)).state;
    const result = placeRoadLine(state, start, { x: start.x + 3, z: start.z });

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/stopped/i);
  });
});
