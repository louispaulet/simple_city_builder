import type { GameState, SaveSlot, SerializedGame } from './types';

export const SAVE_PREFIX = 'simple-city-builder:v2:save:';
export const ACTIVE_SAVE_KEY = 'simple-city-builder:v2:active-save';

const isStorageAvailable = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

export const serializeGame = (state: GameState): SerializedGame => ({
  version: 2,
  state: {
    ...state,
    updatedAt: Date.now(),
  },
});

export const deserializeGame = (serialized: SerializedGame): GameState => {
  if (serialized.version !== 2) {
    throw new Error(`Unsupported save version: ${serialized.version}`);
  }
  return serialized.state;
};

export const saveGame = (state: GameState): void => {
  if (!isStorageAvailable()) {
    return;
  }

  const payload = JSON.stringify(serializeGame(state));
  window.localStorage.setItem(`${SAVE_PREFIX}${state.id}`, payload);
  window.localStorage.setItem(ACTIVE_SAVE_KEY, state.id);
};

export const loadGame = (id: string): GameState | undefined => {
  if (!isStorageAvailable()) {
    return undefined;
  }

  const raw = window.localStorage.getItem(`${SAVE_PREFIX}${id}`);
  if (!raw) {
    return undefined;
  }

  return deserializeGame(JSON.parse(raw) as SerializedGame);
};

export const loadActiveGame = (): GameState | undefined => {
  if (!isStorageAvailable()) {
    return undefined;
  }

  const id = window.localStorage.getItem(ACTIVE_SAVE_KEY);
  return id ? loadGame(id) : undefined;
};

export const listSaves = (): SaveSlot[] => {
  if (!isStorageAvailable()) {
    return [];
  }

  const saves: SaveSlot[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(SAVE_PREFIX)) {
      continue;
    }

    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}') as SerializedGame;
    saves.push({
      id: parsed.state.id,
      name: parsed.state.name,
      savedAt: parsed.state.updatedAt,
      population: parsed.state.citizens.length,
      money: parsed.state.money,
    });
  }

  return saves.sort((a, b) => b.savedAt - a.savedAt);
};
