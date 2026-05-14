import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoadLine } from './placement';
import { firstLand, firstWater, newRichGame } from '../test/gameFixtures';

describe('road line placement', () => {
  it('places straight road lines and creates bridges over water', () => {
    const state = newRichGame();
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
    let state = newRichGame();
    const start = firstLand(state);
    const blocked = { x: start.x + 1, z: start.z };
    const blockResult = placeBuilding(state, 'house', blocked);
    state = blockResult.ok ? blockResult.state : placeBuilding(state, 'house', firstLand(state)).state;

    const result = placeRoadLine(state, start, { x: start.x + 3, z: start.z });

    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/stopped/i);
  });
});
