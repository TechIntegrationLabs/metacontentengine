import { useState } from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  FolderPlus,
  Trash2
} from 'lucide-react';

export interface KeywordData {
  id: string;
  keyword: string;
  cluster_name?: string;
  search_volume: number;
  keyword_difficulty: number;
  cpc: number;
  competition: 'low' | 'medium' | 'high';
  trend?: 'up' | 'down' | 'stable';
  source?: string;
  starred?: boolean;
}

interface KeywordRowProps {
  keyword: KeywordData;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onStarToggle?: (id: string) => void;
  onViewSerp?: (keyword: string) => void;
  onAddToCluster?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const KeywordRow = ({
  keyword,
  selected = false,
  onSelect,
  onStarToggle,
  onViewSerp,
  onAddToCluster,
  onDelete,
}: KeywordRowProps) => {
  const [isStarred, setIsStarred] = useState(keyword.starred || false);

  const handleStarClick = () => {
    setIsStarred(!isStarred);
    onStarToggle?.(keyword.id);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (difficulty < 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low':
        return 'text-green-400 bg-green-500/10';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10';
      case 'high':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  const getTrendIcon = () => {
    switch (keyword.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <tr className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors ${selected ? 'bg-indigo-500/10' : ''}`}>
      {/* Checkbox */}
      <td className="px-4 py-3 w-12">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect?.(keyword.id)}
          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
        />
      </td>

      {/* Star */}
      <td className="px-4 py-3 w-12">
        <button
          onClick={handleStarClick}
          className="text-gray-400 hover:text-amber-400 transition-colors"
          aria-label={isStarred ? 'Unstar keyword' : 'Star keyword'}
        >
          {isStarred ? (
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          ) : (
            <Star className="w-5 h-5" />
          )}
        </button>
      </td>

      {/* Keyword & Cluster */}
      <td className="px-4 py-3 min-w-[250px]">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-100">{keyword.keyword}</span>
          {keyword.cluster_name && (
            <span className="text-xs text-gray-400">{keyword.cluster_name}</span>
          )}
        </div>
      </td>

      {/* Search Volume */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-gray-100">{formatVolume(keyword.search_volume)}</span>
          {getTrendIcon()}
        </div>
      </td>

      {/* Keyword Difficulty */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(keyword.keyword_difficulty)}`}
        >
          {keyword.keyword_difficulty}
        </span>
      </td>

      {/* CPC */}
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-gray-100">${keyword.cpc.toFixed(2)}</span>
      </td>

      {/* Competition */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getCompetitionColor(keyword.competition)}`}
        >
          {keyword.competition}
        </span>
      </td>

      {/* Source */}
      <td className="px-4 py-3">
        {keyword.source && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">
            {keyword.source}
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewSerp?.(keyword.keyword)}
            className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
            title="View SERP"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAddToCluster?.(keyword.id)}
            className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
            title="Add to Cluster"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(keyword.id)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
