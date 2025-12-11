import { useState } from 'react';
import { Folder, MoreVertical, Edit, Trash2 } from 'lucide-react';

export interface KeywordCluster {
  id: string;
  name: string;
  description?: string;
  color?: string;
  keyword_count: number;
  total_volume: number;
  avg_difficulty: number;
}

interface KeywordClusterCardProps {
  cluster: KeywordCluster;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewKeywords?: (id: string) => void;
}

const KeywordClusterCard = ({
  cluster,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onViewKeywords,
}: KeywordClusterCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toLocaleString();
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-green-400';
    if (difficulty < 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div
      className={`relative glass-card p-6 cursor-pointer transition-all hover:border-indigo-500/50 ${
        selected ? 'ring-2 ring-indigo-500' : ''
      }`}
      onClick={() => onSelect?.(cluster.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: cluster.color ? `${cluster.color}20` : '#4f46e520',
              color: cluster.color || '#6366f1',
            }}
          >
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">{cluster.name}</h3>
            {cluster.description && (
              <p className="text-sm text-gray-400 mt-0.5">{cluster.description}</p>
            )}
          </div>
        </div>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-48 glass-card py-1 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit?.(cluster.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Cluster
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete?.(cluster.id);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Cluster
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Keywords</div>
          <div className="text-lg font-semibold text-gray-100">
            {cluster.keyword_count.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Total Volume</div>
          <div className="text-lg font-semibold text-gray-100">
            {formatVolume(cluster.total_volume)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Avg Difficulty</div>
          <div className={`text-lg font-semibold ${getDifficultyColor(cluster.avg_difficulty)}`}>
            {cluster.avg_difficulty.toFixed(0)}
          </div>
        </div>
      </div>

      {/* View Keywords Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewKeywords?.(cluster.id);
        }}
        className="w-full px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors text-sm font-medium"
      >
        View Keywords
      </button>
    </div>
  );
};

export default KeywordClusterCard;
