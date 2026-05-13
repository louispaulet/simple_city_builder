import { useCallback, useMemo, useState } from 'react';
import { borrowMoney, repayDebt } from '../game/bank';
import { createNewGame } from '../game/createGame';
import { placeRoadLine } from '../game/placement';
import { listSaves, loadActiveGame, loadGame, saveGame } from '../game/save';
import { getStats } from '../game/simulation';
import type { GameState, Position, SaveSlot, ToolKind } from '../game/types';
import { cleanCityName } from './format';
import { placementResult } from './gameActions';
import { useGameEffects } from './useGameEffects';

export const useGameController = () => {
  const [game, setGame] = useState<GameState | undefined>(() => loadActiveGame());
  const [page, setPage] = useState<'menu' | 'about'>('menu');
  const [selectedTool, setSelectedTool] = useState<ToolKind>('road');
  const [message, setMessage] = useState('Connect homes to the regional marker with roads to attract people.');
  const [showSaves, setShowSaves] = useState(false);
  const [showNewCity, setShowNewCity] = useState(false);
  const [cityNameDraft, setCityNameDraft] = useState('');
  const [statsOpen, setStatsOpen] = useState(true);
  const [bankOpen, setBankOpen] = useState(false);
  const [saves, setSaves] = useState<SaveSlot[]>(() => listSaves());
  const stats = useMemo(() => (game ? getStats(game) : undefined), [game]);
  useGameEffects(game, setGame, setSaves);

  const applyResult = (result: { state: GameState; ok: boolean; message: string }) => {
    setMessage(result.message);
    if (result.ok) setGame(result.state);
  };

  const startNewGame = () => {
    const cityName = cleanCityName(cityNameDraft);
    if (!cityName) return;
    const next = createNewGame(undefined, cityName);
    setGame(next);
    setSelectedTool('road');
    setMessage('Start by extending a road from the regional marker, then place houses nearby.');
    setPage('menu');
    setShowNewCity(false);
    saveGame(next);
    setSaves(listSaves());
  };

  const resume = () => {
    const active = loadActiveGame();
    if (!active) return;
    setGame(active);
    setShowSaves(false);
    setPage('menu');
  };

  const openSaves = () => {
    setSaves(listSaves());
    setShowSaves(true);
  };

  const loadSave = (id: string) => {
    const loaded = loadGame(id);
    if (!loaded) return;
    setGame(loaded);
    setShowSaves(false);
    setPage('menu');
    setMessage('City loaded.');
  };

  const handleTileSelected = useCallback(
    (position: Position) => {
      if (game) applyResult(placementResult(game, selectedTool, position));
    },
    [game, selectedTool],
  );

  const handleRoadLineSelected = useCallback(
    (start: Position, end: Position) => {
      if (game) applyResult(placeRoadLine(game, start, end));
    },
    [game],
  );

  const handleSave = () => {
    if (!game) return;
    saveGame(game);
    setSaves(listSaves());
    setMessage(`${game.name} saved.`);
  };

  const askForNewCityName = () => {
    setCityNameDraft('');
    setShowNewCity(true);
  };

  return {
    game, page, selectedTool, message, showSaves, showNewCity, cityNameDraft, statsOpen, bankOpen, saves, stats,
    setPage, setSelectedTool, setShowSaves, setShowNewCity, setCityNameDraft,
    setStatsOpen, setBankOpen, setGame, startNewGame, resume, openSaves, loadSave,
    handleTileSelected, handleRoadLineSelected, handleSave, askForNewCityName,
    handleBorrow: (amount: number) => game && applyResult(borrowMoney(game, amount)),
    handleRepay: (amount: number) => game && applyResult(repayDebt(game, amount)),
  };
};
