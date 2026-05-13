import { describe, expect, it } from 'vitest';
import { createNewGame } from './createGame';
import { neighbors } from './grid';
import { findRoadPath } from './pathfinding';
import { canPlaceBuilding, placeBuilding, placeRoad } from './placement';
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
});
