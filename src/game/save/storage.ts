import type { GameState, SaveSlot } from '../types';
import { deserializeGame, serializeGame, type AnySerializedGame } from './codec';

export const SAVE_PREFIX = 'simple-city-builder:v3:save:';
export const ACTIVE_SAVE_KEY = 'simple-city-builder:v3:active-save';
export const LEGACY_SAVE_PREFIX = 'simple-city-builder:v2:save:';
export const LEGACY_ACTIVE_SAVE_KEY = 'simple-city-builder:v2:active-save';

const isStorageAvailable = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.localStorage);

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
  const raw = window.localStorage.getItem(`${SAVE_PREFIX}${id}`) ?? window.localStorage.getItem(`${LEGACY_SAVE_PREFIX}${id}`);
  return raw ? deserializeGame(JSON.parse(raw) as AnySerializedGame) : undefined;
};

export const loadActiveGame = (): GameState | undefined => {
  if (!isStorageAvailable()) {
    return undefined;
  }
  const id = window.localStorage.getItem(ACTIVE_SAVE_KEY) ?? window.localStorage.getItem(LEGACY_ACTIVE_SAVE_KEY);
  return id ? loadGame(id) : undefined;
};

export const listSaves = (): SaveSlot[] => {
  if (!isStorageAvailable()) {
    return [];
  }
  const saves = new Map<string, SaveSlot>();
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(SAVE_PREFIX) && !key?.startsWith(LEGACY_SAVE_PREFIX)) {
      continue;
    }
    const state = deserializeGame(JSON.parse(window.localStorage.getItem(key) ?? '{}') as AnySerializedGame);
    const slot = { id: state.id, name: state.name, savedAt: state.updatedAt, population: state.citizens.length, money: state.money };
    const current = saves.get(slot.id);
    if (!current || slot.savedAt > current.savedAt) {
      saves.set(slot.id, slot);
    }
  }
  return [...saves.values()].sort((a, b) => b.savedAt - a.savedAt);
};
