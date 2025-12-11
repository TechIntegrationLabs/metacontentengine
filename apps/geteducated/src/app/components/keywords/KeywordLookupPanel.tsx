import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Upload,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react';

interface KeywordLookupPanelProps {
  onLookup: (keywords: string[]) => Promise<void>;
  onGetSuggestions: (seedKeyword: string) => Promise<void>;
  onImportCSV: (file: File) => Promise<void>;
  onExportCSV: () => void;
  isLoading: boolean;
  hasDataForSEO: boolean;
}

const KeywordLookupPanel: React.FC<KeywordLookupPanelProps> = ({
  onLookup,
  onGetSuggestions,
  onImportCSV,
  onExportCSV,
  isLoading,
  hasDataForSEO,
}) => {
  const [mode, setMode] = useState<'lookup' | 'suggestions'>('lookup');
  const [keywords, setKeywords] = useState('');
  const [seedKeyword, setSeedKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!keywords.trim()) {
      setError('Please enter at least one keyword');
      return;
    }

    setError(null);
    const keywordList = keywords
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    try {
      await onLookup(keywordList);
      setKeywords('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    }
  };

  const handleSuggestions = async () => {
    if (!seedKeyword.trim()) {
      setError('Please enter a seed keyword');
      return;
    }

    setError(null);
    try {
      await onGetSuggestions(seedKeyword.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get suggestions');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setError(null);
    try {
      await onImportCSV(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
    e.target.value = '';
  };

  return (
    <div className="bg-void-900/50 rounded-xl border border-white/5 p-6 space-y-4">
      {/* Mode Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/5 pb-4">
        <button
          onClick={() => setMode('lookup')}
          className={[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            mode === 'lookup'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-white/5',
          ].join(' ')}
        >
          <span className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Keyword Lookup</span>
          </span>
        </button>
        <button
          onClick={() => setMode('suggestions')}
          className={[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            mode === 'suggestions'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-white/5',
          ].join(' ')}
        >
          <span className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Get Suggestions</span>
          </span>
        </button>
      </div>

      {/* DataForSEO Status */}
      {!hasDataForSEO && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-200">DataForSEO not configured</p>
            <p className="text-xs text-amber-400/70 mt-1">
              Add your DataForSEO API credentials in Settings to enable keyword data lookup.
              You can still add keywords manually or import from CSV.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-200">{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Lookup Mode */}
      {mode === 'lookup' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Keywords (one per line)
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="online degree programs&#10;best online colleges&#10;accredited online universities"
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-32 resize-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter up to 100 keywords to look up their search volume, difficulty, and CPC.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLookup}
              disabled={isLoading || !keywords.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Lookup Keywords</span>
            </button>

            <span className="text-slate-500">or</span>

            <button
              onClick={() => {
                const keywordList = keywords
                  .split('\n')
                  .map((k) => k.trim())
                  .filter((k) => k.length > 0);
                if (keywordList.length > 0) {
                  onLookup(keywordList);
                }
              }}
              disabled={isLoading || !keywords.trim()}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Without Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Suggestions Mode */}
      {mode === 'suggestions' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Seed Keyword
            </label>
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="e.g., online education"
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter a seed keyword to discover related keywords and their metrics.
            </p>
          </div>

          <button
            onClick={handleSuggestions}
            disabled={isLoading || !seedKeyword.trim() || !hasDataForSEO}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Get Suggestions</span>
          </button>
        </div>
      )}

      {/* Import/Export */}
      <div className="pt-4 border-t border-white/5 flex items-center space-x-3">
        <label className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center space-x-2 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          <span>Import CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={onExportCSV}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center space-x-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
};

export default KeywordLookupPanel;
