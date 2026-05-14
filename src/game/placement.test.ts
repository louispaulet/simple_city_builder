import { describe, expect, it } from 'vitest';
import { canPlaceBuilding, placeBuilding, placeRoad } from './placement';
import { getTile } from './terrain';
import { firstLand, firstWater, newRichGame } from '../test/gameFixtures';

describe('city placement rules', () => {
  it('places buildings on land', () => {
    const state = newRichGame();
    const result = placeBuilding(state, 'house', firstLand(state));

    expect(result.ok).toBe(true);
    expect(result.state.buildings).toHaveLength(1);
    expect(result.state.buildings[0].kind).toBe('house');
    expect(result.state.buildings[0].variant).toBeGreaterThanOrEqual(0);
  });

  it('places bars and parks on land', () => {
    let state = newRichGame();
    const barResult = placeBuilding(state, 'bar', firstLand(state));
    state = barResult.state;
    const parkResult = placeBuilding(state, 'park', firstLand(state));

    expect(barResult.ok).toBe(true);
    expect(parkResult.ok).toBe(true);
    expect(parkResult.state.buildings.map((building) => building.kind)).toEqual(['bar', 'park']);
  });

  it('blocks buildings on water', () => {
    const state = newRichGame();
    const water = firstWater(state);
    const result = canPlaceBuilding(state, 'workplace', water);

    expect(getTile(state.map, water)?.kind).toBe('water');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/dry land/i);
  });

  it('places water roads as bridges', () => {
    const state = newRichGame();
    const water = firstWater(state);
    const result = placeRoad(state, water);

    expect(result.ok).toBe(true);
    expect(result.state.roads.at(-1)).toMatchObject({ bridge: true, ...water });
  });
});
