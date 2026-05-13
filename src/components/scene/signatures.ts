import type { GameState } from '../../game/types';

export const getLayoutSignature = (game: GameState): string =>
  JSON.stringify({
    seed: game.map.seed,
    connection: game.map.connection,
    buildings: game.buildings,
    roads: game.roads,
  });

export const getPopulationSignature = (game: GameState): string =>
  JSON.stringify(
    game.citizens
      .slice(0, 42)
      .map((citizen) => [citizen.id, citizen.homeId, citizen.mode, citizen.happiness]),
  );
