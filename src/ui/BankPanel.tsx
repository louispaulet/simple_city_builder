import { Landmark } from 'lucide-react';
import type { GameStats } from '../game/types';
import { formatMoney, loanAmounts } from './format';

interface BankPanelProps {
  stats?: GameStats;
  open: boolean;
  onToggle: () => void;
  onBorrow: (amount: number) => void;
  onRepay: (amount: number) => void;
}

export function BankPanel({ stats, open, onToggle, onBorrow, onRepay }: BankPanelProps) {
  const debt = (stats?.loanBalance ?? 0) + (stats?.accruedInterest ?? 0);
  return (
    <section className="collapsible-panel">
      <button type="button" className="panel-toggle" onClick={onToggle} aria-expanded={open}>
        <Landmark size={17} />
        Bank
        <strong>{formatMoney(debt)}</strong>
      </button>
      {open && (
        <div className="panel-body">
          <div className="mini-grid">
            <span>Principal <strong>{formatMoney(stats?.loanBalance ?? 0)}</strong></span>
            <span>Interest <strong>{formatMoney(stats?.accruedInterest ?? 0)}</strong></span>
          </div>
          <div className="bank-actions">
            {loanAmounts.map((amount) => (
              <button type="button" key={amount} onClick={() => onBorrow(amount)}>
                Borrow {formatMoney(amount)}
              </button>
            ))}
            <button type="button" disabled={debt <= 0} onClick={() => onRepay(500)}>
              Repay {formatMoney(500)}
            </button>
            <button type="button" disabled={debt <= 0} onClick={() => onRepay(Number.POSITIVE_INFINITY)}>
              Repay Max
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
