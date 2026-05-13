export type TileKind = 'land' | 'water';
export type BuildingKind = 'house' | 'workplace' | 'restaurant' | 'bar' | 'park';
export type BuildingVariant = 0 | 1 | 2 | 3;
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
  variant: BuildingVariant;
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
  barId?: string;
  parkId?: string;
  mode: CommuteMode;
  money: number;
  happiness: number;
  fitness: number;
}

export interface EconomyTick {
  rentIncome: number;
  wagesPaid: number;
  payrollTaxIncome: number;
  restaurantSpending: number;
  foodTaxIncome: number;
  barSpending: number;
  barTaxIncome: number;
  interestPaid: number;
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
  loanBalance: number;
  accruedInterest: number;
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
  bars: number;
  parks: number;
  employed: number;
  connectedToRegion: boolean;
  happiness: number;
  fitness: number;
  rentIncome: number;
  wagesPaid: number;
  payrollTaxIncome: number;
  restaurantSpending: number;
  foodTaxIncome: number;
  barSpending: number;
  barTaxIncome: number;
  interestPaid: number;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  loanBalance: number;
  accruedInterest: number;
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
  version: 3;
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
    wage: 14,
    payrollTax: 3,
    cost: 280,
  },
  restaurant: {
    label: 'Restaurant',
    seats: 10,
    spend: 5,
    foodTax: 1,
    cost: 220,
  },
  bar: {
    label: 'Bar',
    seats: 12,
    spend: 6,
    barTax: 2,
    happinessGain: 8,
    cost: 260,
  },
  park: {
    label: 'Park',
    capacity: 18,
    fitnessGain: 7,
    cost: 160,
  },
} as const;

export const ROAD_COST = 35;
export const LOAN_INTEREST_RATE = 0.015;
