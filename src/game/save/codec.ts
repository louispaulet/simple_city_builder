import type { GameState, SerializedGame } from '../types';
import { migrateLegacyGame, normalizeCurrentGame, type LegacySerializedGame } from './migration';

export type AnySerializedGame = SerializedGame | LegacySerializedGame;

export const serializeGame = (state: GameState): SerializedGame => ({
  version: 3,
  state: {
    ...state,
    updatedAt: Date.now(),
  },
});

export const deserializeGame = (serialized: AnySerializedGame): GameState => {
  if (serialized.version === 2) {
    return migrateLegacyGame(serialized);
  }
  if (serialized.version === 3) {
    return normalizeCurrentGame(serialized);
  }
  throw new Error(`Unsupported save version: ${(serialized as { version: number }).version}`);
};
