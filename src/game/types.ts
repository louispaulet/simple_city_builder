export type TileKind = 'land' | 'water';
export type BuildingKind = 'house' | 'workplace' | 'restaurant';
export type ToolKind = BuildingKind | 'road' | 'inspect' | 'delete';
export type CommuteMode = 'foot' | 'car';

export interface Position {
  x: number;
  z: number;
}

export interface Tile extends Position {
  kind: TileKind;
}

export interface Building extends Position {
  id: string;
  kind: BuildingKind;
}

export interface Road extends Position {
  id: string;
  bridge: boolean;
}

export interface Citizen {
  id: string;
  homeId: string;
  workplaceId?: string;
  restaurantId?: string;
  mode: CommuteMode;
  money: number;
}

export interface EconomyTick {
  rentIncome: number;
  wagesPaid: number;
  restaurantSpending: number;
}

export interface GameMap {
  width: number;
  height: number;
  seed: number;
  tiles: Tile[];
  connection: Position;
}

export interface GameState {
  id: string;
  name: string;
  map: GameMap;
  buildings: Building[];
  roads: Road[];
  citizens: Citizen[];
  money: number;
  lastTick: EconomyTick;
  tick: number;
  createdAt: number;
  updatedAt: number;
}

export interface GameStats {
  population: number;
  housingCapacity: number;
  jobs: number;
  restaurants: number;
  employed: number;
  connectedToRegion: boolean;
  rentIncome: number;
  wagesPaid: number;
  restaurantSpending: number;
  money: number;
}

export interface SaveSlot {
  id: string;
  name: string;
  savedAt: number;
  population: number;
  money: number;
}

export interface SerializedGame {
  version: 1;
  state: GameState;
}

export const BUILDING_RULES = {
  house: {
    label: 'House',
    capacity: 6,
    rent: 7,
    cost: 120,
  },
  workplace: {
    label: 'Workplace',
    jobs: 8,
    wage: 10,
    cost: 280,
  },
  restaurant: {
    label: 'Restaurant',
    seats: 10,
    spend: 5,
    cost: 220,
  },
} as const;

export const ROAD_COST = 35;
