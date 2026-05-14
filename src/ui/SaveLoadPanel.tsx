import type { SaveSlot } from '../game/types';
import { formatMoney } from './format';

interface SaveLoadPanelProps {
  saves: SaveSlot[];
  onLoad: (id: string) => void;
  onClose: () => void;
}

export function SaveLoadPanel({ saves, onLoad, onClose }: SaveLoadPanelProps) {
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
              <button
                type="button"
                key={save.id}
                className="save-row"
                onClick={() => onLoad(save.id)}
              >
                <span>{save.name}</span>
                <small>
                  {save.population} people · {formatMoney(save.money)} · {new Date(save.savedAt).toLocaleString()}
                </small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
