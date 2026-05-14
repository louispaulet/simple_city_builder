import type { Building, Citizen, GameState } from '../types';

export const clampStatus = (value: number): number =>
  Math.min(100, Math.max(0, Math.round(value)));

export const buildingsByKind = (state: GameState, kind: Building['kind']): Building[] =>
  state.buildings.filter((building) => building.kind === kind);

export const average = (values: number[]): number =>
  values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

export const initialCitizen = (state: GameState, home: Building, index: number): Citizen => ({
  id: `citizen-${state.tick}-${index}-${Date.now()}`,
  homeId: home.id,
  mode: 'foot',
  money: 60,
  happiness: 62,
  fitness: 58,
});
