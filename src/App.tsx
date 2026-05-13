import { useCallback, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Car, CircleDollarSign, Home, MapPin, Save, Soup, Trash2 } from 'lucide-react';
import { CityScene } from './components/CityScene';
import { createNewGame } from './game/createGame';
import { deleteAt, placeBuilding, placeRoad } from './game/placement';
import { listSaves, loadActiveGame, loadGame, saveGame } from './game/save';
import { getStats, simulateTick } from './game/simulation';
import type { GameState, Position, SaveSlot, ToolKind } from './game/types';

const tools: Array<{ id: ToolKind; label: string; icon: typeof Home }> = [
  { id: 'house', label: 'House', icon: Home },
  { id: 'workplace', label: 'Workplace', icon: BriefcaseBusiness },
  { id: 'road', label: 'Road', icon: Car },
  { id: 'restaurant', label: 'Restaurant', icon: Soup },
  { id: 'delete', label: 'Delete', icon: Trash2 },
];

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

function MainMenu({
  onNewGame,
  onResume,
  onLoad,
  canResume,
}: {
  onNewGame: () => void;
  onResume: () => void;
  onLoad: () => void;
  canResume: boolean;
}) {
  return (
    <main className="menu-shell">
      <section className="menu-hero">
        <div>
          <p className="eyebrow">3D browser city builder</p>
          <h1>Simple City Builder</h1>
          <p className="intro">Shape a small region, bridge the water, connect homes to work, and let the city economy start breathing.</p>
        </div>
        <div className="menu-actions">
          <button type="button" onClick={onNewGame}>New Game</button>
          <button type="button" onClick={onResume} disabled={!canResume}>Resume</button>
          <button type="button" onClick={onLoad}>Load Game</button>
        </div>
      </section>
    </main>
  );
}

function SaveLoadPanel({
  saves,
  onLoad,
  onClose,
}: {
  saves: SaveSlot[];
  onLoad: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="overlay-panel" role="dialog" aria-modal="true">
      <div className="dialog">
        <div className="dialog-header">
          <h2>Saved Cities</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        {saves.length === 0 ? (
          <p className="empty">No saves yet.</p>
        ) : (
          <div className="save-list">
            {saves.map((save) => (
              <button type="button" key={save.id} className="save-row" onClick={() => onLoad(save.id)}>
                <span>{save.name}</span>
                <small>{save.population} people · {formatMoney(save.money)} · {new Date(save.savedAt).toLocaleString()}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState | undefined>(() => loadActiveGame());
  const [selectedTool, setSelectedTool] = useState<ToolKind>('road');
  const [message, setMessage] = useState('Connect homes to the regional marker with roads to attract people.');
  const [showSaves, setShowSaves] = useState(false);
  const [saves, setSaves] = useState<SaveSlot[]>(() => listSaves());
  const stats = useMemo(() => (game ? getStats(game) : undefined), [game]);

  useEffect(() => {
    if (!game) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setGame((current) => (current ? simulateTick(current) : current));
    }, 2400);

    return () => window.clearInterval(interval);
  }, [game?.id]);

  useEffect(() => {
    if (!game) {
      return;
    }

    saveGame(game);
    setSaves(listSaves());
  }, [game]);

  const startNewGame = () => {
    const next = createNewGame();
    setGame(next);
    setSelectedTool('road');
    setMessage('Start by extending a road from the regional marker, then place houses nearby.');
    saveGame(next);
    setSaves(listSaves());
  };

  const resume = () => {
    const active = loadActiveGame();
    if (active) {
      setGame(active);
      setShowSaves(false);
    }
  };

  const openSaves = () => {
    setSaves(listSaves());
    setShowSaves(true);
  };

  const loadSave = (id: string) => {
    const loaded = loadGame(id);
    if (loaded) {
      setGame(loaded);
      setShowSaves(false);
      setMessage('City loaded.');
    }
  };

  const handleTileSelected = useCallback(
    (position: Position) => {
      if (!game) {
        return;
      }

      const result =
        selectedTool === 'road'
          ? placeRoad(game, position)
          : selectedTool === 'delete'
            ? deleteAt(game, position)
            : selectedTool === 'inspect'
              ? { state: game, ok: true, message: `Tile ${position.x}, ${position.z}` }
              : placeBuilding(game, selectedTool, position);

      setMessage(result.message);
      if (result.ok) {
        setGame(result.state);
      }
    },
    [game, selectedTool],
  );

  if (!game) {
    return (
      <>
        <MainMenu onNewGame={startNewGame} onResume={resume} onLoad={openSaves} canResume={saves.length > 0} />
        {showSaves && <SaveLoadPanel saves={saves} onLoad={loadSave} onClose={() => setShowSaves(false)} />}
      </>
    );
  }

  return (
    <main className="game-shell">
      <CityScene game={game} onTileSelected={handleTileSelected} />
      <aside className="hud">
        <div className="hud-title">
          <div>
            <p className="eyebrow">Mayor desk</p>
            <h1>{game.name}</h1>
          </div>
          <button type="button" className="icon-button" onClick={() => saveGame(game)} aria-label="Save game" title="Save game">
            <Save size={18} />
          </button>
        </div>

        <div className="stats-grid">
          <span>People <strong>{stats?.population}/{stats?.housingCapacity}</strong></span>
          <span>Jobs <strong>{stats?.employed}/{stats?.jobs}</strong></span>
          <span>Food <strong>{stats?.restaurants}</strong></span>
          <span>Funds <strong>{formatMoney(stats?.money ?? 0)}</strong></span>
        </div>

        <div className="economy-line">
          <CircleDollarSign size={16} />
          <span>Rent +{formatMoney(stats?.rentIncome ?? 0)}</span>
          <span>Food +{formatMoney(stats?.restaurantSpending ?? 0)}</span>
          <span>Wages -{formatMoney(stats?.wagesPaid ?? 0)}</span>
        </div>

        <div className={`connection ${stats?.connectedToRegion ? 'connected' : ''}`}>
          <MapPin size={16} />
          {stats?.connectedToRegion ? 'Homes connected to the region' : 'Connect houses to the regional marker'}
        </div>

        <div className="tool-grid" aria-label="Build tools">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                type="button"
                key={tool.id}
                className={selectedTool === tool.id ? 'selected' : ''}
                onClick={() => setSelectedTool(tool.id)}
                title={tool.label}
                aria-label={tool.label}
              >
                <Icon size={19} />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        <p className="status">{message}</p>

        <div className="footer-actions">
          <button type="button" onClick={openSaves}>Load</button>
          <button type="button" onClick={() => setGame(undefined)}>Menu</button>
        </div>
      </aside>

      {showSaves && <SaveLoadPanel saves={saves} onLoad={loadSave} onClose={() => setShowSaves(false)} />}
    </main>
  );
}
