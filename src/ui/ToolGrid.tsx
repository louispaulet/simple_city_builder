import type { ToolKind } from '../game/types';
import { tools } from './format';

interface ToolGridProps {
  selectedTool: ToolKind;
  onSelect: (tool: ToolKind) => void;
}

export function ToolGrid({ selectedTool, onSelect }: ToolGridProps) {
  return (
    <div className="tool-grid" aria-label="Build tools">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            type="button"
            key={tool.id}
            className={selectedTool === tool.id ? 'selected' : ''}
            onClick={() => onSelect(tool.id)}
            title={tool.label}
            aria-label={tool.label}
          >
            <Icon size={19} />
            <span>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}
