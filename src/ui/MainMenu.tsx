import { Info } from 'lucide-react';

interface MainMenuProps {
  onNewGame: () => void;
  onResume: () => void;
  onLoad: () => void;
  onAbout: () => void;
  canResume: boolean;
}

export function MainMenu({ onNewGame, onResume, onLoad, onAbout, canResume }: MainMenuProps) {
  return (
    <main className="menu-shell">
      <section className="menu-hero">
        <div>
          <p className="eyebrow">3D browser city builder</p>
          <h1>Simple City Builder</h1>
          <p className="intro">
            Shape a small region, bridge the water, connect homes to work, and let the city economy start breathing.
          </p>
        </div>
        <div className="menu-actions">
          <button type="button" onClick={onNewGame}>New Game</button>
          <button type="button" onClick={onResume} disabled={!canResume}>Resume</button>
          <button type="button" onClick={onLoad}>Load Game</button>
          <button type="button" className="secondary-action" onClick={onAbout}>
            <Info size={18} />
            About
          </button>
        </div>
      </section>
    </main>
  );
}
