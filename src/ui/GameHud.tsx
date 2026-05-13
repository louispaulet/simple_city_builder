import { Home, MapPin, Save } from 'lucide-react';
import type { GameState, GameStats, ToolKind } from '../game/types';
import { BankPanel } from './BankPanel';
import { formatMoney } from './format';
import { StatsPanel } from './StatsPanel';
import { StatusBars } from './StatusBars';
import { ToolGrid } from './ToolGrid';

interface GameHudProps {
  game: GameState;
  stats?: GameStats;
  selectedTool: ToolKind;
  message: string;
  statsOpen: boolean;
  bankOpen: boolean;
  onSave: () => void;
  onLoad: () => void;
  onMenu: () => void;
  onSelectTool: (tool: ToolKind) => void;
  onToggleStats: () => void;
  onToggleBank: () => void;
  onBorrow: (amount: number) => void;
  onRepay: (amount: number) => void;
}

export function GameHud(props: GameHudProps) {
  const { game, stats, selectedTool, message } = props;
  return (
    <aside className="hud">
      <div className="hud-title">
        <div>
          <p className="eyebrow">Mayor desk</p>
          <h1>{game.name}</h1>
        </div>
        <div className="hud-title-actions">
          <button type="button" className="icon-button" onClick={props.onSave} aria-label={`Save ${game.name}`} title={`Save ${game.name}`}>
            <Save size={18} />
          </button>
          <button type="button" className="icon-button" onClick={props.onMenu} aria-label="Return to main menu" title="Return to main menu">
            <Home size={18} />
          </button>
        </div>
      </div>
      <div className="stats-grid">
        <span>People <strong>{stats?.population}/{stats?.housingCapacity}</strong></span>
        <span>Jobs <strong>{stats?.employed}/{stats?.jobs}</strong></span>
        <span>Food <strong>{stats?.restaurants}</strong></span>
        <span>Funds <strong>{formatMoney(stats?.money ?? 0)}</strong></span>
      </div>
      <StatusBars stats={stats} />
      <div className={`connection ${stats?.connectedToRegion ? 'connected' : ''}`}>
        <MapPin size={16} />
        {stats?.connectedToRegion ? 'Homes connected to the region' : 'Connect houses to the regional marker'}
      </div>
      <StatsPanel stats={stats} open={props.statsOpen} onToggle={props.onToggleStats} />
      <BankPanel stats={stats} open={props.bankOpen} onToggle={props.onToggleBank} onBorrow={props.onBorrow} onRepay={props.onRepay} />
      <ToolGrid selectedTool={selectedTool} onSelect={props.onSelectTool} />
      <p className="status">{message}</p>
      <div className="footer-actions">
        <button type="button" onClick={props.onLoad}>Load</button>
        <button type="button" onClick={props.onMenu}>Main Menu</button>
      </div>
    </aside>
  );
}
