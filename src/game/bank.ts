import type { GameState } from './types';

export interface BankResult {
  state: GameState;
  ok: boolean;
  message: string;
}

export const borrowMoney = (state: GameState, amount: number): BankResult => {
  if (amount <= 0) {
    return { state, ok: false, message: 'Choose a loan amount first.' };
  }

  return {
    ok: true,
    message: `Borrowed ${amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}.`,
    state: {
      ...state,
      money: state.money + amount,
      loanBalance: state.loanBalance + amount,
      updatedAt: Date.now(),
    },
  };
};

export const repayDebt = (state: GameState, amount: number): BankResult => {
  const owed = state.loanBalance + state.accruedInterest;
  const payment = Math.min(Math.max(0, amount), state.money, owed);
  if (payment <= 0) {
    return { state, ok: false, message: owed <= 0 ? 'The city has no debt.' : 'Not enough funds to repay.' };
  }

  const interestPayment = Math.min(payment, state.accruedInterest);
  const principalPayment = payment - interestPayment;

  return {
    ok: true,
    message: `Repaid ${payment.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}.`,
    state: {
      ...state,
      money: state.money - payment,
      accruedInterest: state.accruedInterest - interestPayment,
      loanBalance: state.loanBalance - principalPayment,
      updatedAt: Date.now(),
    },
  };
};
