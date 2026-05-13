import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { listSaves, saveGame } from '../game/save';
import { simulateTick } from '../game/simulation';
import type { GameState, SaveSlot } from '../game/types';

export const useGameEffects = (
  game: GameState | undefined,
  setGame: Dispatch<SetStateAction<GameState | undefined>>,
  setSaves: Dispatch<SetStateAction<SaveSlot[]>>,
): void => {
  useEffect(() => {
    if (!game) {
      return undefined;
    }
    const interval = window.setInterval(
      () => setGame((current) => (current ? simulateTick(current) : current)),
      2400,
    );
    return () => window.clearInterval(interval);
  }, [game?.id, setGame]);

  useEffect(() => {
    if (game) {
      saveGame(game);
      setSaves(listSaves());
    }
  }, [game, setSaves]);
};
