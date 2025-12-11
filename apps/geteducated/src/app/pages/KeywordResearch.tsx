import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Star,
  Trash2,
  FolderPlus,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Folder,
  TrendingUp,
  Target,
  DollarSign,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { KeywordRow, KeywordClusterCard, KeywordLookupPanel } from '@content-engine/ui';
import type { KeywordData, KeywordCluster } from '@content-engine/ui';

// Mock data for demonstration
const mockKeywords: KeywordData[] = [
  {
    id: '1',
    keyword: 'online degree programs',
    searchVolume: 22000,
    keywordDifficulty: 65,
    cpc: 12.50,
    competition: 'high',
    trendData: [18000, 19000, 20000, 21000, 22000, 22000],
    isStarred: true,
    clusterId: 'cluster-1',
    clusterName: 'Online Education',
    source: 'dataforseo',
    status: 'active',
  },
  {
    id: '2',
    keyword: 'best online colleges',
    searchVolume: 14800,
    keywordDifficulty: 58,
    cpc: 8.75,
    competition: 'medium',
    trendData: [12000, 13000, 13500, 14000, 14500, 14800],
    isStarred: true,
    clusterId: 'cluster-1',
    clusterName: 'Online Education',
    source: 'dataforseo',
    status: 'active',
  },
  {
    id: '3',
    keyword: 'accredited online universities',
    searchVolume: 8900,
    keywordDifficulty: 52,
    cpc: 10.25,
    competition: 'medium',
    isStarred: false,
    clusterId: 'cluster-1',
    clusterName: 'Online Education',
    source: 'dataforseo',
    status: 'active',
  },
  {
    id: '4',
    keyword: 'nursing degree online',
    searchVolume: 12500,
    keywordDifficulty: 45,
    cpc: 15.00,
    competition: 'medium',
    trendData: [10000, 11000, 11500, 12000, 12200, 12500],
    isStarred: false,
    clusterId: 'cluster-2',
    clusterName: 'Healthcare Programs',
    source: 'manual',
    status: 'active',
  },
  {
    id: '5',
    keyword: 'MBA programs online',
    searchVolume: 18200,
    keywordDifficulty: 72,
    cpc: 22.50,
    competition: 'high',
    isStarred: true,
    source: 'dataforseo',
    status: 'active',
  },
];

const mockClusters: KeywordCluster[] = [
  {
    id: 'cluster-1',
    name: 'Online Education',
    description: 'General online education and degree keywords',
    totalVolume: 45700,
    avgDifficulty: 58,
    keywordCount: 3,
    color: '#6366f1',
    isActive: true,
  },
  {
    id: 'cluster-2',
    name: 'Healthcare Programs',
    description: 'Nursing, medical, and healthcare degree programs',
    totalVolume: 12500,
    avgDifficulty: 45,
    keywordCount: 1,
    color: '#10b981',
    isActive: true,
  },
];

type SortField = 'keyword' | 'searchVolume' | 'keywordDifficulty' | 'cpc' | 'competition';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'clusters';

const KeywordResearch: React.FC = () => {
  const [keywords, setKeywords] = useState<KeywordData[]>(mockKeywords);
  const [clusters, setClusters] = useState<KeywordCluster[]>(mockClusters);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('searchVolume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showLookupPanel, setShowLookupPanel] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = [...keywords];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((k) => k.keyword.toLowerCase().includes(query));
    }

    // Filter by starred
    if (showStarredOnly) {
      filtered = filtered.filter((k) => k.isStarred);
    }

    // Filter by cluster
    if (selectedCluster) {
      filtered = filtered.filter((k) => k.clusterId === selectedCluster);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number | null;
      let bVal: string | number | null;

      switch (sortField) {
        case 'keyword':
          aVal = a.keyword.toLowerCase();
          bVal = b.keyword.toLowerCase();
          break;
        case 'searchVolume':
          aVal = a.searchVolume;
          bVal = b.searchVolume;
          break;
        case 'keywordDifficulty':
          aVal = a.keywordDifficulty;
          bVal = b.keywordDifficulty;
          break;
        case 'cpc':
          aVal = a.cpc;
          bVal = b.cpc;
          break;
        case 'competition':
          const compOrder = { low: 1, medium: 2, high: 3 };
          aVal = a.competition ? compOrder[a.competition] : 0;
          bVal = b.competition ? compOrder[b.competition] : 0;
          break;
        default:
          return 0;
      }

      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [keywords, searchQuery, showStarredOnly, selectedCluster, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const active = keywords.filter((k) => k.status === 'active');
    return {
      totalKeywords: active.length,
      totalVolume: active.reduce((sum, k) => sum + (k.searchVolume || 0), 0),
      avgDifficulty: Math.round(
        active.reduce((sum, k) => sum + (k.keywordDifficulty || 0), 0) / active.length
      ),
      starredCount: active.filter((k) => k.isStarred).length,
    };
  }, [keywords]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectKeyword = (id: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedKeywords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedKeywords.size === filteredKeywords.length) {
      setSelectedKeywords(new Set());
    } else {
      setSelectedKeywords(new Set(filteredKeywords.map((k) => k.id)));
    }
  };

  const handleToggleStar = (id: string) => {
    setKeywords(keywords.map((k) => (k.id === id ? { ...k, isStarred: !k.isStarred } : k)));
  };

  const handleDeleteKeyword = (id: string) => {
    if (confirm('Are you sure you want to delete this keyword?')) {
      setKeywords(keywords.filter((k) => k.id !== id));
      setSuccess('Keyword deleted');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleBulkDelete = () => {
    if (selectedKeywords.size === 0) return;
    if (confirm(`Delete ${selectedKeywords.size} keywords?`)) {
      setKeywords(keywords.filter((k) => !selectedKeywords.has(k.id)));
      setSelectedKeywords(new Set());
      setSuccess(`${selectedKeywords.size} keywords deleted`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleLookup = async (keywordList: string[]) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newKeywords: KeywordData[] = keywordList.map((kw, i) => ({
        id: `new-${Date.now()}-${i}`,
        keyword: kw,
        searchVolume: Math.floor(Math.random() * 10000),
        keywordDifficulty: Math.floor(Math.random() * 100),
        cpc: Math.random() * 20,
        competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        isStarred: false,
        source: 'dataforseo',
        status: 'active' as const,
      }));

      setKeywords([...keywords, ...newKeywords]);
      setSuccess(`Added ${newKeywords.length} keywords`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestions = async (seedKeyword: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccess('Suggestions feature requires DataForSEO API');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCSV = async (file: File) => {
    setIsLoading(true);
    try {
      const content = await file.text();
      const lines = content.split('\n').slice(1); // Skip header
      const newKeywords: KeywordData[] = lines
        .filter((line) => line.trim())
        .map((line, i) => {
          const [keyword, volume, difficulty, cpc, competition] = line.split(',');
          return {
            id: `import-${Date.now()}-${i}`,
            keyword: keyword?.trim() || '',
            searchVolume: parseInt(volume) || null,
            keywordDifficulty: parseInt(difficulty) || null,
            cpc: parseFloat(cpc) || null,
            competition: (competition?.trim()?.toLowerCase() as 'low' | 'medium' | 'high') || null,
            isStarred: false,
            source: 'import',
            status: 'active' as const,
          };
        })
        .filter((k) => k.keyword);

      setKeywords([...keywords, ...newKeywords]);
      setSuccess(`Imported ${newKeywords.length} keywords from CSV`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const header = 'keyword,search_volume,difficulty,cpc,competition,cluster,starred\n';
    const rows = keywords
      .map(
        (k) =>
          `"${k.keyword}",${k.searchVolume || ''},${k.keywordDifficulty || ''},${k.cpc?.toFixed(2) || ''},${k.competition || ''},${k.clusterName || ''},${k.isStarred}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Keyword Research</h1>
          <p className="text-slate-500 mt-1">Research and organize keywords with DataForSEO integration</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'clusters' : 'list')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title={viewMode === 'list' ? 'View clusters' : 'View list'}
          >
            {viewMode === 'list' ? <LayoutGrid className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowLookupPanel(!showLookupPanel)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Keywords</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-200">{success}</span>
        </div>
      )}

      {/* Lookup Panel */}
      {showLookupPanel && (
        <KeywordLookupPanel
          onLookup={handleLookup}
          onGetSuggestions={handleGetSuggestions}
          onImportCSV={handleImportCSV}
          onExportCSV={handleExportCSV}
          isLoading={isLoading}
          hasDataForSEO={false}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalKeywords}</p>
              <p className="text-sm text-slate-500">Total Keywords</p>
            </div>
          </div>
        </div>
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.totalVolume >= 1000
                  ? `${(stats.totalVolume / 1000).toFixed(1)}K`
                  : stats.totalVolume}
              </p>
              <p className="text-sm text-slate-500">Total Volume</p>
            </div>
          </div>
        </div>
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.avgDifficulty}</p>
              <p className="text-sm text-slate-500">Avg. Difficulty</p>
            </div>
          </div>
        </div>
        <div className="bg-void-900/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.starredCount}</p>
              <p className="text-sm text-slate-500">Starred</p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'clusters' ? (
        /* Clusters View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Keyword Clusters</h2>
            <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm flex items-center space-x-2 transition-colors">
              <FolderPlus className="w-4 h-4" />
              <span>New Cluster</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {clusters.map((cluster) => (
              <KeywordClusterCard
                key={cluster.id}
                cluster={cluster}
                isSelected={selectedCluster === cluster.id}
                onSelect={setSelectedCluster}
                onEdit={(id) => console.log('Edit cluster', id)}
                onDelete={(id) => {
                  if (confirm('Delete this cluster? Keywords will be unassigned.')) {
                    setClusters(clusters.filter((c) => c.id !== id));
                  }
                }}
                onViewKeywords={(id) => {
                  setSelectedCluster(id);
                  setViewMode('list');
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-void-900/50 rounded-xl border border-white/5 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keywords..."
                  className="pl-10 pr-4 py-2 bg-void-950/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64"
                />
              </div>

              {/* Starred filter */}
              <button
                onClick={() => setShowStarredOnly(!showStarredOnly)}
                className={[
                  'px-3 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors',
                  showStarredOnly
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/5 text-slate-400 hover:text-white',
                ].join(' ')}
              >
                <Star className={['w-4 h-4', showStarredOnly ? 'fill-amber-400' : ''].join(' ')} />
                <span>Starred</span>
              </button>

              {/* Cluster filter */}
              {selectedCluster && (
                <button
                  onClick={() => setSelectedCluster(null)}
                  className="px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm flex items-center space-x-2"
                >
                  <Folder className="w-4 h-4" />
                  <span>{clusters.find((c) => c.id === selectedCluster)?.name}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Bulk actions */}
            {selectedKeywords.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400">{selectedKeywords.size} selected</span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm flex items-center space-x-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedKeywords.size === filteredKeywords.length && filteredKeywords.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-void-950 text-indigo-500 focus:ring-indigo-500/50"
                    />
                  </th>
                  <th className="px-2 py-3 w-10"></th>
                  <th
                    className="px-4 py-3 text-sm font-medium text-slate-400 cursor-pointer hover:text-white"
                    onClick={() => handleSort('keyword')}
                  >
                    <span className="flex items-center space-x-1">
                      <span>Keyword</span>
                      <SortIcon field="keyword" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-sm font-medium text-slate-400 text-right cursor-pointer hover:text-white"
                    onClick={() => handleSort('searchVolume')}
                  >
                    <span className="flex items-center justify-end space-x-1">
                      <span>Volume</span>
                      <SortIcon field="searchVolume" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-sm font-medium text-slate-400 text-center cursor-pointer hover:text-white"
                    onClick={() => handleSort('keywordDifficulty')}
                  >
                    <span className="flex items-center justify-center space-x-1">
                      <span>KD</span>
                      <SortIcon field="keywordDifficulty" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-sm font-medium text-slate-400 text-right cursor-pointer hover:text-white"
                    onClick={() => handleSort('cpc')}
                  >
                    <span className="flex items-center justify-end space-x-1">
                      <span>CPC</span>
                      <SortIcon field="cpc" />
                    </span>
                  </th>
                  <th
                    className="px-4 py-3 text-sm font-medium text-slate-400 text-center cursor-pointer hover:text-white"
                    onClick={() => handleSort('competition')}
                  >
                    <span className="flex items-center justify-center space-x-1">
                      <span>Comp.</span>
                      <SortIcon field="competition" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-400">Source</th>
                  <th className="px-4 py-3 text-sm font-medium text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map((keyword) => (
                  <KeywordRow
                    key={keyword.id}
                    keyword={keyword}
                    isSelected={selectedKeywords.has(keyword.id)}
                    onSelect={handleSelectKeyword}
                    onToggleStar={handleToggleStar}
                    onDelete={handleDeleteKeyword}
                    onAddToCluster={(id) => console.log('Add to cluster', id)}
                    onViewSerp={(kw) => window.open(`https://www.google.com/search?q=${encodeURIComponent(kw)}`, '_blank')}
                  />
                ))}
              </tbody>
            </table>

            {filteredKeywords.length === 0 && (
              <div className="py-12 text-center">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No keywords found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Add keywords to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordResearch;
