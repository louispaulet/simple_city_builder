import { describe, expect, it } from 'vitest';
import { borrowMoney, repayDebt } from './bank';
import { createNewGame } from './createGame';
import { getStats, simulateTick } from './simulation';
import { newRichGame } from '../test/gameFixtures';

describe('banking', () => {
  it('pays loan interest from city funds and reports expenses', () => {
    let state = newRichGame();
    state = borrowMoney(state, 1000).state;

    const ticked = simulateTick(state);
    const stats = getStats(ticked);

    expect(stats.loanBalance).toBe(1000);
    expect(stats.interestPaid).toBeGreaterThan(0);
    expect(stats.totalExpenses).toBe(stats.interestPaid);
    expect(ticked.money).toBe(state.money - stats.interestPaid);
  });

  it('borrows money and repays interest before principal', () => {
    let state = { ...createNewGame(44), money: 100, loanBalance: 1000, accruedInterest: 40 };

    state = borrowMoney(state, 500).state;
    expect(state.money).toBe(600);
    expect(state.loanBalance).toBe(1500);

    state = repayDebt(state, 70).state;
    expect(state.money).toBe(530);
    expect(state.accruedInterest).toBe(0);
    expect(state.loanBalance).toBe(1470);
  });
});
