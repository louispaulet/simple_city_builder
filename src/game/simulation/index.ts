import type { GameState } from '../types';
import { updateAssignments } from './assignment';
import { runEconomy } from './economy';

export { getStats } from './stats';
export { housingCapacity, jobCapacity } from './indexes';

export const simulateTick = (state: GameState): GameState => {
  const citizens = updateAssignments(state);
  const economy = runEconomy(state, citizens);

  return {
    ...state,
    citizens: economy.citizens,
    money: economy.money,
    accruedInterest: economy.accruedInterest,
    lastTick: economy.lastTick,
    tick: state.tick + 1,
    updatedAt: Date.now(),
  };
};
