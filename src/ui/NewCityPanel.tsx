import { Sparkles } from 'lucide-react';
import { cleanCityName } from './format';

interface NewCityPanelProps {
  cityName: string;
  onCityNameChange: (name: string) => void;
  onCreate: () => void;
  onClose: () => void;
}

export function NewCityPanel({ cityName, onCityNameChange, onCreate, onClose }: NewCityPanelProps) {
  const isReady = cleanCityName(cityName).length > 0;
  return (
    <div className="overlay-panel" role="dialog" aria-modal="true" aria-labelledby="new-city-title">
      <form
        className="dialog city-name-dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (isReady) {
            onCreate();
          }
        }}
      >
        <div className="dialog-header">
          <h2 id="new-city-title">Name Your City</h2>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <label className="city-name-field">
          <span>City name</span>
          <input
            autoFocus
            maxLength={48}
            value={cityName}
            onChange={(event) => onCityNameChange(event.target.value)}
            placeholder="Riverbend"
          />
        </label>
        <div className="dialog-actions">
          <button type="submit" disabled={!isReady}>
            <Sparkles size={18} />
            Create City
          </button>
        </div>
      </form>
    </div>
  );
}
