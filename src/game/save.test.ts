import { describe, expect, it } from 'vitest';
import { createNewGame } from './createGame';
import { placeBuilding } from './placement';
import { deserializeGame, serializeGame } from './save';
import { firstLand, newRichGame } from '../test/gameFixtures';

describe('save format', () => {
  it('keeps the city name in new games and saves', () => {
    const state = createNewGame(91, 'Harbor Loop');
    const serialized = serializeGame(state);

    expect(state.name).toBe('Harbor Loop');
    expect(deserializeGame(serialized).name).toBe('Harbor Loop');
  });

  it('round trips serialized game state', () => {
    const state = newRichGame(91);
    const built = placeBuilding(state, 'restaurant', firstLand(state)).state;

    expect(deserializeGame(serializeGame(built))).toMatchObject({
      id: built.id,
      map: { seed: 91 },
      buildings: built.buildings,
      roads: built.roads,
    });
  });

  it('migrates version 2 saves with defaults for new fields', () => {
    const state = newRichGame(91);
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
