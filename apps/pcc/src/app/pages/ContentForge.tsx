import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Zap,
  FileText,
  Sparkles,
  Cpu,
  Shield,
  ArrowRight,
  Loader2,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Info,
  User,
  Palmtree
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useContributors, Contributor } from '@content-engine/hooks';

type GenerationStage = 'idle' | 'context' | 'drafting' | 'humanizing' | 'qa' | 'complete' | 'error';

interface StageInfo {
  id: GenerationStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const stages: StageInfo[] = [
  { id: 'context', label: 'Context', icon: Info, description: 'Building context from your brand DNA and topic' },
  { id: 'drafting', label: 'Draft', icon: FileText, description: 'AI generating initial content with your voice' },
  { id: 'humanizing', label: 'Humanize', icon: Sparkles, description: 'Adding natural flow and personality' },
  { id: 'qa', label: 'QA', icon: Shield, description: 'Quality assurance and fact checking' },
];

const ContentForge: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [wordCount, setWordCount] = useState(1500);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [showContributorDropdown, setShowContributorDropdown] = useState(false);

  const [currentStage, setCurrentStage] = useState<GenerationStage>('idle');
  const [stageProgress, setStageProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const { contributors, isLoading: contributorsLoading } = useContributors({
    supabase,
    filters: { isActive: true }
  });

  // Set default contributor
  useEffect(() => {
    if (contributors.length > 0 && !selectedContributor) {
      const defaultContributor = contributors.find(c => c.is_default) || contributors[0];
      setSelectedContributor(defaultContributor);
    }
  }, [contributors, selectedContributor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowContributorDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const simulateGeneration = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent('');
    setQualityScore(null);

    const stageOrder: GenerationStage[] = ['context', 'drafting', 'humanizing', 'qa', 'complete'];

    for (const stage of stageOrder) {
      if (stage === 'complete') {
        setCurrentStage('complete');
        setQualityScore(Math.floor(Math.random() * 15) + 85); // 85-99
        break;
      }

      setCurrentStage(stage);
      setStageProgress(0);

      // Simulate progress
      for (let i = 0; i <= 100; i += 5) {
        if (isPaused) {
          await new Promise(resolve => {
            const checkPause = setInterval(() => {
              if (!isPaused) {
                clearInterval(checkPause);
                resolve(true);
              }
            }, 100);
          });
        }

        setStageProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }

      // Simulate some content being generated
      if (stage === 'drafting') {
        setGeneratedContent(`# ${topic}\n\nThis is a sample generated article about ${topic}. The AI is creating content based on your specifications and the selected contributor's voice profile.\n\n## Introduction\n\nPolynesian culture represents a rich tapestry of traditions, stories, and practices that have been preserved and shared across generations...`);
      }
    }

    setIsGenerating(false);
    setCurrentStage('complete');
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setCurrentStage('idle');
    setStageProgress(0);
    setIsGenerating(false);
    setIsPaused(false);
    setGeneratedContent('');
    setQualityScore(null);
    setError(null);
  };

  const getStageStatus = (stageId: GenerationStage): 'pending' | 'active' | 'complete' => {
    const stageOrder = ['context', 'drafting', 'humanizing', 'qa'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(stageId);

    if (currentStage === 'complete' || currentStage === 'error') {
      return 'complete';
    }
    if (stageIndex < currentIndex) return 'complete';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center space-x-3">
            <Palmtree className="w-8 h-8 text-pcc-teal" />
            <span>Content Forge</span>
          </h1>
          <p className="text-slate-500 mt-1">AI-powered content generation with your authentic voice</p>
        </div>
        {isGenerating && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePauseResume}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {/* Topic Input */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-pcc-teal uppercase tracking-wider mb-3">
              Article Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your article topic or title..."
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 h-24 resize-none transition-all"
              disabled={isGenerating}
            />
          </div>

          {/* Keywords Input */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Target Keywords (Optional)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="polynesian culture, hawaii, luau, cultural experience..."
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50 transition-all"
              disabled={isGenerating}
            />
          </div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-4">
          {/* Contributor Selection */}
          <div className="glass-card rounded-xl p-6" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Contributor Voice
            </label>
            <button
              onClick={() => setShowContributorDropdown(!showContributorDropdown)}
              disabled={isGenerating || contributorsLoading}
              className="w-full flex items-center justify-between bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-left hover:border-white/20 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                {selectedContributor ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pcc-teal to-pcc-gold flex items-center justify-center text-xs font-bold">
                      {selectedContributor.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{selectedContributor.display_name || selectedContributor.name}</p>
                      <p className="text-slate-500 text-xs">{selectedContributor.style_proxy || 'AI Contributor'}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 text-slate-500" />
                    <span className="text-slate-500">Select contributor...</span>
                  </>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showContributorDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showContributorDropdown && (
              <div className="absolute z-50 mt-2 w-full max-w-[280px] bg-void-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {contributors.map((contributor) => (
                    <button
                      key={contributor.id}
                      onClick={() => {
                        setSelectedContributor(contributor);
                        setShowContributorDropdown(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pcc-teal to-pcc-gold flex items-center justify-center text-xs font-bold">
                        {contributor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{contributor.display_name || contributor.name}</p>
                        <p className="text-slate-500 text-xs">{contributor.style_proxy || 'AI Contributor'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Word Count */}
          <div className="glass-card rounded-xl p-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Target Word Count: {wordCount.toLocaleString()}
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full accent-pcc-teal"
              disabled={isGenerating}
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>500</span>
              <span>5,000</span>
            </div>
          </div>

          {/* Generate Button - PCC coral */}
          <button
            onClick={simulateGeneration}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-gradient-to-r from-pcc-coral to-pcc-gold hover:from-pcc-coral/90 hover:to-pcc-gold/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-pcc-coral/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Generate Content</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline Visualization */}
      {(isGenerating || currentStage === 'complete') && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-pcc-teal" />
            <span>Generation Pipeline</span>
          </h3>

          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-pcc-teal to-pcc-gold transition-all duration-500"
                style={{
                  width: currentStage === 'complete' ? '100%' :
                         currentStage === 'qa' ? '75%' :
                         currentStage === 'humanizing' ? '50%' :
                         currentStage === 'drafting' ? '25%' :
                         currentStage === 'context' ? `${stageProgress * 0.25}%` : '0%'
                }}
              />
            </div>

            {stages.map((stage, index) => {
              const status = getStageStatus(stage.id);
              const Icon = stage.icon;

              return (
                <div key={stage.id} className="flex flex-col items-center relative z-10 w-1/4">
                  <div
                    className={[
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                      status === 'complete' ? 'bg-emerald-500 text-white' :
                      status === 'active' ? 'bg-pcc-teal text-white shadow-lg shadow-pcc-teal/30 animate-pulse' :
                      'bg-slate-800 text-slate-500'
                    ].join(' ')}
                  >
                    {status === 'complete' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : status === 'active' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <p className={[
                    'mt-3 text-sm font-medium',
                    status === 'active' ? 'text-pcc-teal' : status === 'complete' ? 'text-emerald-400' : 'text-slate-500'
                  ].join(' ')}>
                    {stage.label}
                  </p>
                  {status === 'active' && (
                    <p className="text-xs text-slate-500 mt-1 text-center max-w-[120px]">{stage.description}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress for current stage */}
          {currentStage !== 'idle' && currentStage !== 'complete' && (
            <div className="mt-6">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pcc-teal to-pcc-gold transition-all duration-300"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">{stageProgress}% complete</p>
            </div>
          )}
        </div>
      )}

      {/* Quality Score */}
      {qualityScore !== null && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Quality Assessment</h3>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30">
            <span className="text-4xl font-bold text-emerald-400">{qualityScore}</span>
          </div>
          <p className="text-slate-400 mt-4">Your content meets quality standards and is ready for review.</p>
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-pcc-gold" />
            <span>Generated Content Preview</span>
          </h3>
          <div className="bg-void-950/50 rounded-xl p-6 max-h-[400px] overflow-y-auto prose prose-invert prose-sm">
            <div className="whitespace-pre-wrap text-slate-300">{generatedContent}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentForge;
