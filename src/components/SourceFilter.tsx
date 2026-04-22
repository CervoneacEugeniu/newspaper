import type { Source } from '../types';

interface Props {
  sources: Source[];
  selected: string | null;
  onChange: (source: string | null) => void;
}

export const SourceFilter = ({ sources, selected, onChange }: Props) => {
  return (
    <div className="source-filter">
      <button
        className={`filter-btn${selected === null ? ' active' : ''}`}
        onClick={() => onChange(null)}
      >
        All Sources
      </button>
      {sources.map((s) => (
        <button
          key={s.id}
          className={`filter-btn${selected === s.name ? ' active' : ''}`}
          onClick={() => onChange(s.name)}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
};

