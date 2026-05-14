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
export const ASSIGNMENTS_PER_TICK = 24;
