import { describe, expect, it } from 'vitest';
import { findRoadPath } from './pathfinding';
import { placeBuilding } from './placement';
import { BUILDING_RULES } from './rules';
import { getStats, simulateTick } from './simulation';
import { buildMainStreet, landNextToRoad, newRichGame } from '../test/gameFixtures';

describe('simulation and connectivity', () => {
  it('requires road connectivity for immigration', () => {
    const state = newRichGame();
    const unconnected = placeBuilding(state, 'house', landNextToRoad(buildMainStreet(state))).state;

    expect(simulateTick(unconnected).citizens).toHaveLength(0);

    const connectedRoads = buildMainStreet(state);
    const connectedHouse = placeBuilding(connectedRoads, 'house', landNextToRoad(connectedRoads)).state;
    const ticked = simulateTick(connectedHouse);

    expect(ticked.citizens.length).toBeGreaterThan(0);
    expect(getStats(ticked).connectedToRegion).toBe(true);
  });

  it('assigns workplaces only when commute paths exist', () => {
    let state = buildMainStreet(newRichGame());
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
    let state = buildMainStreet(newRichGame());
    const house = landNextToRoad(state, 1);
    const workplace = landNextToRoad(state, house.x + 3);
    state = placeBuilding(state, 'house', house).state;
    state = placeBuilding(state, 'workplace', workplace).state;

    const ticked = simulateTick(state);
    const stats = getStats(ticked);

    expect(stats.wagesPaid).toBe(stats.employed * BUILDING_RULES.workplace.wage);
    expect(stats.payrollTaxIncome).toBe(stats.employed * BUILDING_RULES.workplace.payrollTax);
    expect(ticked.money).toBe(state.money + stats.rentIncome + stats.payrollTaxIncome + stats.foodTaxIncome + stats.barTaxIncome);
    expect(ticked.citizens.every((citizen) => citizen.money >= 0)).toBe(true);
  });
});
