import { CircleDollarSign } from 'lucide-react';
import type { GameStats } from '../game/types';
import { formatMoney } from './format';

interface StatsPanelProps {
  stats?: GameStats;
  open: boolean;
  onToggle: () => void;
}

export function StatsPanel({ stats, open, onToggle }: StatsPanelProps) {
  return (
    <section className="collapsible-panel">
      <button type="button" className="panel-toggle" onClick={onToggle} aria-expanded={open}>
        <CircleDollarSign size={17} />
        Stats
        <strong>{formatMoney(stats?.netChange ?? 0)}/tick</strong>
      </button>
      {open && (
        <div className="panel-body">
          <div className="mini-grid">
            <span>Bars <strong>{stats?.bars}</strong></span>
            <span>Parks <strong>{stats?.parks}</strong></span>
            <span>Income <strong>{formatMoney(stats?.totalIncome ?? 0)}</strong></span>
            <span>Expense <strong>{formatMoney(stats?.totalExpenses ?? 0)}</strong></span>
          </div>
          <div className="ledger">
            <span>Rent <strong>+{formatMoney(stats?.rentIncome ?? 0)}</strong></span>
            <span>Payroll tax <strong>+{formatMoney(stats?.payrollTaxIncome ?? 0)}</strong></span>
            <span>Food tax <strong>+{formatMoney(stats?.foodTaxIncome ?? 0)}</strong></span>
            <span>Bar tax <strong>+{formatMoney(stats?.barTaxIncome ?? 0)}</strong></span>
            <span>Interest <strong>-{formatMoney(stats?.interestPaid ?? 0)}</strong></span>
          </div>
        </div>
      )}
    </section>
  );
}
