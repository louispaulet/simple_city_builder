import { Home, Save, X } from 'lucide-react';
import type { GameState } from '../game/types';

interface MainMenuConfirmPanelProps {
  game: GameState;
  onSaveAndReturn: () => void;
  onReturnWithoutSaving: () => void;
  onCancel: () => void;
}

export function MainMenuConfirmPanel({ game, onSaveAndReturn, onReturnWithoutSaving, onCancel }: MainMenuConfirmPanelProps) {
  return (
    <div className="overlay-panel" role="dialog" aria-modal="true" aria-labelledby="main-menu-confirm-title">
      <div className="dialog confirm-dialog">
        <div className="dialog-header">
          <h2 id="main-menu-confirm-title">Return to Main Menu?</h2>
          <button type="button" onClick={onCancel}>Close</button>
        </div>
        <p className="confirm-copy">
          Save {game.name} before heading back to the main menu?
        </p>
        <div className="confirm-actions">
          <button type="button" className="primary-action" onClick={onSaveAndReturn}>
            <Save size={18} />
            Save and Return
          </button>
          <button type="button" onClick={onReturnWithoutSaving}>
            <Home size={18} />
            Return Without Saving
          </button>
          <button type="button" onClick={onCancel}>
            <X size={18} />
            Stay Here
          </button>
        </div>
      </div>
    </div>
  );
}
