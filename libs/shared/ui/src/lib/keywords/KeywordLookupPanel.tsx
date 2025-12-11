import { useState, useRef } from 'react';
import { Search, FileUp, Download, AlertCircle, X, Lightbulb } from 'lucide-react';

type TabType = 'lookup' | 'suggestions';

interface KeywordLookupPanelProps {
  isDataForSEOConfigured?: boolean;
  onLookupKeywords?: (keywords: string[]) => void;
  onAddWithoutData?: (keywords: string[]) => void;
  onGetSuggestions?: (seedKeyword: string) => void;
  onImportCSV?: (file: File) => void;
  onExportCSV?: () => void;
  isLoading?: boolean;
}

const KeywordLookupPanel = ({
  isDataForSEOConfigured = false,
  onLookupKeywords,
  onAddWithoutData,
  onGetSuggestions,
  onImportCSV,
  onExportCSV,
  isLoading = false,
}: KeywordLookupPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('lookup');
  const [keywords, setKeywords] = useState('');
  const [seedKeyword, setSeedKeyword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLookup = () => {
    const keywordList = keywords
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywordList.length === 0) {
      setError('Please enter at least one keyword');
      return;
    }

    setError(null);
    onLookupKeywords?.(keywordList);
  };

  const handleAddWithoutData = () => {
    const keywordList = keywords
      .split('\n')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (keywordList.length === 0) {
      setError('Please enter at least one keyword');
      return;
    }

    setError(null);
    onAddWithoutData?.(keywordList);
  };

  const handleGetSuggestions = () => {
    if (!seedKeyword.trim()) {
      setError('Please enter a seed keyword');
      return;
    }

    setError(null);
    onGetSuggestions?.(seedKeyword.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setError('Please select a valid CSV file');
        return;
      }
      setError(null);
      onImportCSV?.(file);
    }
  };

  return (
    <div className="glass-card p-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('lookup')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'lookup'
              ? 'text-indigo-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Keyword Lookup
          {activeTab === 'lookup' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'suggestions'
              ? 'text-indigo-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Get Suggestions
          {activeTab === 'suggestions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* DataForSEO Warning */}
      {!isDataForSEOConfigured && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-200">
              DataForSEO API is not configured. Keyword data lookup is unavailable.
            </p>
            <p className="text-xs text-amber-300/70 mt-1">
              You can still add keywords manually without search volume and difficulty data.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lookup Tab */}
      {activeTab === 'lookup' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enter Keywords (one per line)
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="seo tools&#10;keyword research&#10;content marketing"
              rows={8}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-2">
              {keywords.split('\n').filter((k) => k.trim()).length} keyword(s) entered
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLookup}
              disabled={isLoading || !isDataForSEOConfigured}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Looking up...' : 'Lookup Keywords'}
            </button>
            <button
              onClick={handleAddWithoutData}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-100 rounded-lg transition-colors font-medium"
            >
              Add Without Data
            </button>
          </div>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Seed Keyword
            </label>
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="Enter a topic or keyword..."
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-2">
              We'll find related keywords and questions based on this seed keyword
            </p>
          </div>

          <button
            onClick={handleGetSuggestions}
            disabled={isLoading || !isDataForSEOConfigured}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
          >
            <Lightbulb className="w-4 h-4" />
            {isLoading ? 'Getting suggestions...' : 'Get Suggestions'}
          </button>
        </div>
      )}

      {/* Import/Export Section */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Import / Export</h3>
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            <FileUp className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={onExportCSV}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-gray-100 rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default KeywordLookupPanel;
