import React from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Trash2,
  FolderPlus,
  MoreHorizontal,
} from 'lucide-react';

export interface KeywordData {
  id: string;
  keyword: string;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  competition: 'low' | 'medium' | 'high' | null;
  trendData?: number[];
  isStarred: boolean;
  clusterId?: string;
  clusterName?: string;
  source: string;
  status: 'active' | 'archived' | 'converted';
}

interface KeywordRowProps {
  keyword: KeywordData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onAddToCluster: (id: string) => void;
  onViewSerp?: (keyword: string) => void;
}

const KeywordRow: React.FC<KeywordRowProps> = ({
  keyword,
  isSelected,
  onSelect,
  onToggleStar,
  onDelete,
  onAddToCluster,
  onViewSerp,
}) => {
  const getDifficultyColor = (difficulty: number | null) => {
    if (difficulty === null) return 'bg-slate-500/20 text-slate-400';
    if (difficulty < 30) return 'bg-emerald-500/20 text-emerald-400';
    if (difficulty < 60) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  };

  const getCompetitionColor = (competition: string | null) => {
    switch (competition) {
      case 'low':
        return 'text-emerald-400';
      case 'medium':
        return 'text-amber-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getTrendIcon = (trendData?: number[]) => {
    if (!trendData || trendData.length < 2) return <Minus className="w-4 h-4 text-slate-400" />;

    const recent = trendData.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const first = trendData[0];

    if (avg > first * 1.1) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (avg < first * 0.9) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const formatVolume = (volume: number | null) => {
    if (volume === null) return '-';
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <tr className={[
      'border-b border-white/5 hover:bg-white/5 transition-colors',
      isSelected ? 'bg-indigo-500/10' : '',
    ].join(' ')}>
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(keyword.id)}
          className="w-4 h-4 rounded border-white/20 bg-void-950 text-indigo-500 focus:ring-indigo-500/50"
        />
      </td>

      {/* Star */}
      <td className="px-2 py-3">
        <button
          onClick={() => onToggleStar(keyword.id)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
        >
          <Star
            className={[
              'w-4 h-4',
              keyword.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-500',
            ].join(' ')}
          />
        </button>
      </td>

      {/* Keyword */}
      <td className="px-4 py-3">
        <div>
          <p className="text-white font-medium">{keyword.keyword}</p>
          {keyword.clusterName && (
            <span className="text-xs text-slate-500">{keyword.clusterName}</span>
          )}
        </div>
      </td>

      {/* Search Volume */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end space-x-2">
          <span className="text-white font-mono">{formatVolume(keyword.searchVolume)}</span>
          {getTrendIcon(keyword.trendData)}
        </div>
      </td>

      {/* Difficulty */}
      <td className="px-4 py-3 text-center">
        <span className={[
          'inline-block px-2 py-0.5 rounded-full text-xs font-medium min-w-[3rem]',
          getDifficultyColor(keyword.keywordDifficulty),
        ].join(' ')}>
          {keyword.keywordDifficulty ?? '-'}
        </span>
      </td>

      {/* CPC */}
      <td className="px-4 py-3 text-right">
        <span className="text-slate-300 font-mono">
          {keyword.cpc !== null ? `$${keyword.cpc.toFixed(2)}` : '-'}
        </span>
      </td>

      {/* Competition */}
      <td className="px-4 py-3 text-center">
        <span className={[
          'text-sm capitalize',
          getCompetitionColor(keyword.competition),
        ].join(' ')}>
          {keyword.competition ?? '-'}
        </span>
      </td>

      {/* Source */}
      <td className="px-4 py-3">
        <span className="text-xs text-slate-500 capitalize">{keyword.source}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end space-x-1">
          {onViewSerp && (
            <button
              onClick={() => onViewSerp(keyword.keyword)}
              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="View SERP"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onAddToCluster(keyword.id)}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Add to cluster"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(keyword.id)}
            className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default KeywordRow;
