import { describe, expect, it } from 'vitest';
import { placeBuilding } from './placement';
import { BUILDING_RULES } from './rules';
import { getStats, simulateTick } from './simulation';
import { buildMainStreet, landNextToRoad, newRichGame } from '../test/gameFixtures';

describe('service simulation', () => {
  it('tracks restaurant spending when homes can reach restaurants', () => {
    let state = buildMainStreet(newRichGame());
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
    let state = buildMainStreet(newRichGame());
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
});
