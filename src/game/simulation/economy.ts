import { BUILDING_RULES, LOAN_INTEREST_RATE } from '../rules';
import type { Citizen, EconomyTick, GameState } from '../types';
import { clampStatus } from './status';

interface EconomyResult {
  citizens: Citizen[];
  money: number;
  accruedInterest: number;
  lastTick: EconomyTick;
}

const emptyTick = (): EconomyTick => ({
  rentIncome: 0,
  wagesPaid: 0,
  payrollTaxIncome: 0,
  restaurantSpending: 0,
  foodTaxIncome: 0,
  barSpending: 0,
  barTaxIncome: 0,
  interestPaid: 0,
});

const visitServices = (citizen: Citizen, tick: EconomyTick): Citizen => {
  let money = citizen.money;
  let happiness = citizen.happiness;
  let fitness = citizen.fitness;
  if (citizen.workplaceId) {
    money += BUILDING_RULES.workplace.wage;
    tick.wagesPaid += BUILDING_RULES.workplace.wage;
    tick.payrollTaxIncome += BUILDING_RULES.workplace.payrollTax;
  }
  const rent = Math.min(money, BUILDING_RULES.house.rent);
  money -= rent;
  tick.rentIncome += rent;
  if (citizen.restaurantId && money >= BUILDING_RULES.restaurant.spend) {
    money -= BUILDING_RULES.restaurant.spend;
    tick.restaurantSpending += BUILDING_RULES.restaurant.spend;
    tick.foodTaxIncome += BUILDING_RULES.restaurant.foodTax;
  }
  if (citizen.barId && money >= BUILDING_RULES.bar.spend) {
    money -= BUILDING_RULES.bar.spend;
    happiness += BUILDING_RULES.bar.happinessGain;
    tick.barSpending += BUILDING_RULES.bar.spend;
    tick.barTaxIncome += BUILDING_RULES.bar.barTax;
  } else {
    happiness -= 2;
  }
  fitness += citizen.parkId ? BUILDING_RULES.park.fitnessGain : -1;
  return { ...citizen, money, happiness: clampStatus(happiness), fitness: clampStatus(fitness) };
};

export const runEconomy = (state: GameState, citizens: Citizen[]): EconomyResult => {
  const lastTick = emptyTick();
  const nextCitizens = citizens.map((citizen) => visitServices(citizen, lastTick));
  const newInterest = state.loanBalance > 0 ? Math.ceil(state.loanBalance * LOAN_INTEREST_RATE) : 0;
  const available = state.money + lastTick.rentIncome + lastTick.payrollTaxIncome + lastTick.foodTaxIncome + lastTick.barTaxIncome;
  const interestDue = state.accruedInterest + newInterest;
  lastTick.interestPaid = Math.min(available, interestDue);

  return {
    citizens: nextCitizens,
    money: available - lastTick.interestPaid,
    accruedInterest: interestDue - lastTick.interestPaid,
    lastTick,
  };
};
