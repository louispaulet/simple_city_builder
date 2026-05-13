import { Dumbbell, Smile } from 'lucide-react';
import type { GameStats } from '../game/types';

export function StatusBars({ stats }: { stats?: GameStats }) {
  return (
    <div className="status-bars" aria-label="Citizen wellbeing">
      <div>
        <span>
          <Smile size={15} />
          Happiness
        </span>
        <strong>{stats?.happiness ?? 0}</strong>
        <meter min={0} max={100} value={stats?.happiness ?? 0} />
      </div>
      <div>
        <span>
          <Dumbbell size={15} />
          Fitness
        </span>
        <strong>{stats?.fitness ?? 0}</strong>
        <meter min={0} max={100} value={stats?.fitness ?? 0} />
      </div>
    </div>
  );
}
