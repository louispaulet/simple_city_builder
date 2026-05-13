import type { Building, Citizen, GameState, SaveSlot, SerializedGame } from './types';
import { buildingVariantFor } from './placement';

export const SAVE_PREFIX = 'simple-city-builder:v3:save:';
export const ACTIVE_SAVE_KEY = 'simple-city-builder:v3:active-save';
const LEGACY_SAVE_PREFIX = 'simple-city-builder:v2:save:';
const LEGACY_ACTIVE_SAVE_KEY = 'simple-city-builder:v2:active-save';

const isStorageAvailable = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

export const serializeGame = (state: GameState): SerializedGame => ({
  version: 3,
  state: {
    ...state,
    updatedAt: Date.now(),
  },
});

type LegacySerializedGame = {
  version: 2;
  state: Omit<GameState, 'loanBalance' | 'accruedInterest' | 'buildings' | 'citizens' | 'lastTick'> & {
    buildings: Array<Omit<GameState['buildings'][number], 'variant'> & { variant?: GameState['buildings'][number]['variant'] }>;
    citizens: Array<Omit<GameState['citizens'][number], 'happiness' | 'fitness'> & { happiness?: number; fitness?: number }>;
    lastTick: Partial<GameState['lastTick']>;
  };
};

const withCompleteTick = (tick: Partial<GameState['lastTick']>): GameState['lastTick'] => ({
  rentIncome: tick.rentIncome ?? 0,
  wagesPaid: tick.wagesPaid ?? 0,
  payrollTaxIncome: tick.payrollTaxIncome ?? 0,
  restaurantSpending: tick.restaurantSpending ?? 0,
  foodTaxIncome: tick.foodTaxIncome ?? 0,
  barSpending: tick.barSpending ?? 0,
  barTaxIncome: tick.barTaxIncome ?? 0,
  interestPaid: tick.interestPaid ?? 0,
});

export const deserializeGame = (serialized: SerializedGame | LegacySerializedGame): GameState => {
  if (serialized.version === 2) {
    const legacy = serialized.state;
    const stateForVariants = { ...legacy, loanBalance: 0, accruedInterest: 0, lastTick: withCompleteTick(legacy.lastTick) };
    return {
      ...stateForVariants,
      buildings: legacy.buildings.map((building): Building => ({
        ...building,
        variant: building.variant ?? buildingVariantFor(stateForVariants as unknown as GameState, building.kind, building),
      })),
      citizens: legacy.citizens.map((citizen): Citizen => ({
        ...citizen,
        happiness: citizen.happiness ?? 60,
        fitness: citizen.fitness ?? 55,
      })),
    };
  }

  if (serialized.version === 3) {
    return {
      ...serialized.state,
      lastTick: withCompleteTick(serialized.state.lastTick),
      loanBalance: serialized.state.loanBalance ?? 0,
      accruedInterest: serialized.state.accruedInterest ?? 0,
      buildings: serialized.state.buildings.map((building): Building => ({
        ...building,
        variant: building.variant ?? buildingVariantFor(serialized.state, building.kind, building),
      })),
      citizens: serialized.state.citizens.map((citizen): Citizen => ({
        ...citizen,
        happiness: citizen.happiness ?? 60,
        fitness: citizen.fitness ?? 55,
      })),
    };
  }

  throw new Error(`Unsupported save version: ${(serialized as { version: number }).version}`);
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

  const raw = window.localStorage.getItem(`${SAVE_PREFIX}${id}`) ?? window.localStorage.getItem(`${LEGACY_SAVE_PREFIX}${id}`);
  if (!raw) {
    return undefined;
  }

  return deserializeGame(JSON.parse(raw) as SerializedGame);
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

    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}') as SerializedGame | LegacySerializedGame;
    const state = deserializeGame(parsed);
    const slot = {
      id: state.id,
      name: state.name,
      savedAt: state.updatedAt,
      population: state.citizens.length,
      money: state.money,
    };
    const current = saves.get(slot.id);
    if (!current || slot.savedAt > current.savedAt) {
      saves.set(slot.id, slot);
    }
  }

  return [...saves.values()].sort((a, b) => b.savedAt - a.savedAt);
};
