import React from 'react';
import {
  Folder,
  TrendingUp,
  Target,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react';

export interface KeywordCluster {
  id: string;
  name: string;
  description?: string;
  totalVolume: number;
  avgDifficulty: number;
  keywordCount: number;
  color?: string;
  isActive: boolean;
}

interface KeywordClusterCardProps {
  cluster: KeywordCluster;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewKeywords: (id: string) => void;
}

const KeywordClusterCard: React.FC<KeywordClusterCardProps> = ({
  cluster,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewKeywords,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-emerald-400';
    if (difficulty < 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <div
      className={[
        'bg-void-900/50 rounded-xl border p-4 cursor-pointer transition-all hover:border-white/10',
        isSelected ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-white/5',
      ].join(' ')}
      onClick={() => onSelect(cluster.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: cluster.color ? `${cluster.color}20` : 'rgba(99, 102, 241, 0.1)' }}
          >
            <Folder
              className="w-5 h-5"
              style={{ color: cluster.color || '#6366f1' }}
            />
          </div>
          <div>
            <h3 className="font-medium text-white">{cluster.name}</h3>
            {cluster.description && (
              <p className="text-xs text-slate-500 line-clamp-1">{cluster.description}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 bg-void-800 rounded-lg border border-white/10 shadow-xl z-20 py-1 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(cluster.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(cluster.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Keywords</p>
          <p className="text-lg font-semibold text-white">{cluster.keywordCount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Total Volume</p>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <p className="text-lg font-semibold text-white">{formatVolume(cluster.totalVolume)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Avg. Difficulty</p>
          <div className="flex items-center space-x-1">
            <Target className={['w-4 h-4', getDifficultyColor(cluster.avgDifficulty)].join(' ')} />
            <p className={['text-lg font-semibold', getDifficultyColor(cluster.avgDifficulty)].join(' ')}>
              {cluster.avgDifficulty}
            </p>
          </div>
        </div>
      </div>

      {/* View Keywords Link */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewKeywords(cluster.id);
        }}
        className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <span>View Keywords</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default KeywordClusterCard;
