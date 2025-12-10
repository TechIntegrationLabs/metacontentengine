import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Loader2, Sparkles, Copy, Check, AlertCircle, CheckCircle2, FileText, User, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useContributors, useTenant, Contributor } from '@content-engine/hooks';
import { useNavigate } from 'react-router-dom';

type ContentType = 'blog_post' | 'how_to_guide' | 'listicle' | 'comparison' | 'review' | 'pillar_content';

interface PipelineRun {
  id: string;
  stage: string;
  progress: number;
  error?: string;
  article_id?: string;
}

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: 'blog_post', label: 'Blog Post', description: 'Standard informative article' },
  { value: 'how_to_guide', label: 'How-To Guide', description: 'Step-by-step instructions' },
  { value: 'listicle', label: 'Listicle', description: 'List-based content' },
  { value: 'comparison', label: 'Comparison', description: 'Compare options or products' },
  { value: 'review', label: 'Review', description: 'In-depth product or service review' },
  { value: 'pillar_content', label: 'Pillar Content', description: 'Comprehensive topic coverage' },
];

const STAGE_LABELS: Record<string, string> = {
  'INITIALIZING': 'Initializing pipeline...',
  'GATHERING_CONTEXT': 'Gathering context...',
  'SELECTING_CONTRIBUTOR': 'Selecting contributor...',
  'GENERATING_OUTLINE': 'Generating outline...',
  'DRAFTING': 'Drafting content...',
  'HUMANIZING': 'Humanizing content...',
  'QUALITY_CHECK': 'Running quality checks...',
  'FINALIZING': 'Finalizing article...',
  'COMPLETE': 'Complete!',
  'ERROR': 'Error occurred',
};

export function ContentForge() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { contributors, isLoading: contributorsLoading } = useContributors({
    supabase,
    filters: { isActive: true }
  });

  const [topic, setTopic] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [contentType, setContentType] = useState<ContentType>('blog_post');
  const [selectedContributorId, setSelectedContributorId] = useState<string | null>(null);
  const [targetWordCount, setTargetWordCount] = useState(2000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineRun, setPipelineRun] = useState<PipelineRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ articleId: string; qualityScore: number; wordCount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // Set default contributor when loaded
  useEffect(() => {
    if (contributors.length > 0 && !selectedContributorId) {
      const defaultContributor = contributors.find(c => c.is_default) || contributors[0];
      setSelectedContributorId(defaultContributor.id);
    }
  }, [contributors, selectedContributorId]);

  // Poll for pipeline updates
  useEffect(() => {
    if (!pipelineRun || pipelineRun.stage === 'COMPLETE' || pipelineRun.stage === 'ERROR') {
      return;
    }

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('id, stage, progress, error, article_id')
        .eq('id', pipelineRun.id)
        .single();

      if (error) {
        console.error('Error polling pipeline:', error);
        return;
      }

      if (data) {
        setPipelineRun(data);

        if (data.stage === 'COMPLETE' && data.article_id) {
          setIsGenerating(false);
          // Get the article to show success
          const { data: article } = await supabase
            .from('articles')
            .select('quality_score, word_count')
            .eq('id', data.article_id)
            .single();

          if (article) {
            setSuccess({
              articleId: data.article_id,
              qualityScore: article.quality_score || 0,
              wordCount: article.word_count || 0,
            });
          }
        } else if (data.stage === 'ERROR') {
          setIsGenerating(false);
          setError(data.error || 'An error occurred during generation');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pipelineRun]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setPipelineRun(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-article', {
        body: {
          topic: topic.trim(),
          primaryKeyword: primaryKeyword.trim() || topic.trim(),
          contentType,
          contributorId: selectedContributorId,
          targetWordCount,
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to start generation');
      }

      if (data?.pipelineRunId) {
        setPipelineRun({
          id: data.pipelineRunId,
          stage: 'INITIALIZING',
          progress: 0,
        });

        // If generation completed synchronously (which it does in current implementation)
        if (data.success && data.articleId) {
          setSuccess({
            articleId: data.articleId,
            qualityScore: data.qualityScore || 0,
            wordCount: data.wordCount || 0,
          });
          setIsGenerating(false);
          setPipelineRun({
            id: data.pipelineRunId,
            stage: 'COMPLETE',
            progress: 100,
            article_id: data.articleId,
          });
        }
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate article');
      setIsGenerating(false);
    }
  };

  const handleViewArticle = () => {
    if (success?.articleId) {
      navigate(`/articles/${success.articleId}`);
    }
  };

  const handleReset = () => {
    setTopic('');
    setPrimaryKeyword('');
    setContentType('blog_post');
    setTargetWordCount(2000);
    setError(null);
    setSuccess(null);
    setPipelineRun(null);
  };

  const selectedContributor = useMemo(() => {
    return contributors.find(c => c.id === selectedContributorId);
  }, [contributors, selectedContributorId]);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-slide-up">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          Content<span className="text-forge-accent">Forge</span>
        </h1>
        <p className="text-slate-400">AI-powered content generation with your contributor personas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contributor Selection */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Contributor Persona</span>
            </label>

            {contributorsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : contributors.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No contributors found.</p>
                <button
                  onClick={() => navigate('/contributors')}
                  className="text-indigo-400 text-sm mt-2 hover:text-indigo-300"
                >
                  Create a contributor
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {contributors.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedContributorId(c.id)}
                    className={[
                      'p-3 rounded-xl border cursor-pointer flex items-center space-x-3 transition-all',
                      selectedContributorId === c.id
                        ? 'bg-indigo-500/10 border-indigo-500/50'
                        : 'border-white/5 hover:border-white/10'
                    ].join(' ')}
                  >
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{c.display_name || c.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {c.expertise_areas?.slice(0, 2).join(', ') || 'General writer'}
                      </p>
                    </div>
                    {c.is_default && (
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content Configuration */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">
                Topic / Title
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="What should the article be about?"
                disabled={isGenerating}
                className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl p-4 text-white placeholder-slate-600 h-24 resize-none outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">
                Primary Keyword (SEO)
              </label>
              <input
                type="text"
                value={primaryKeyword}
                onChange={e => setPrimaryKeyword(e.target.value)}
                placeholder="Target keyword (optional)"
                disabled={isGenerating}
                className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl p-4 text-white placeholder-slate-600 outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">
                Content Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map(ct => (
                  <button
                    key={ct.value}
                    onClick={() => setContentType(ct.value)}
                    disabled={isGenerating}
                    className={[
                      'p-3 rounded-xl border text-left transition-all disabled:opacity-50',
                      contentType === ct.value
                        ? 'bg-indigo-500/10 border-indigo-500/50'
                        : 'border-white/5 hover:border-white/10'
                    ].join(' ')}
                  >
                    <p className="text-white text-sm font-medium">{ct.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ct.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">
                Target Word Count: {targetWordCount.toLocaleString()}
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={targetWordCount}
                onChange={e => setTargetWordCount(parseInt(e.target.value))}
                disabled={isGenerating}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>500</span>
                <span>2,500</span>
                <span>5,000</span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating || contributors.length === 0}
              className="w-full bg-gradient-to-r from-forge-accent to-orange-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 flex items-center justify-center space-x-2 transition-all hover:from-orange-500 hover:to-orange-500"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Forging...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>FORGE CONTENT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Output */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-2xl border border-white/5 min-h-[700px] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-mono text-slate-500">
                  {success ? 'Article Generated' : isGenerating ? 'Generating...' : 'Output Preview'}
                </span>
              </div>
              {success && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">
                    {success.wordCount.toLocaleString()} words
                  </span>
                  <span className={[
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    success.qualityScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                    success.qualityScore >= 60 ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  ].join(' ')}>
                    Quality: {success.qualityScore}
                  </span>
                  <button
                    onClick={handleViewArticle}
                    className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    View Article
                  </button>
                  <button
                    onClick={handleReset}
                    className="bg-white/5 text-slate-400 text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    New
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-8">
              {/* Error State */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Generation Failed</p>
                    <p className="text-red-400/70 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success State */}
              {success && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">
                    Article Generated Successfully!
                  </h3>
                  <p className="text-slate-400 text-center max-w-md mb-6">
                    Your article has been created with a quality score of {success.qualityScore}
                    {selectedContributor && (
                      <> using {selectedContributor.display_name || selectedContributor.name}'s voice</>
                    )}.
                  </p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleViewArticle}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition-all"
                    >
                      View & Edit Article
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-white/5 text-slate-400 font-medium rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Generate Another
                    </button>
                  </div>
                </div>
              )}

              {/* Pipeline Progress */}
              {isGenerating && pipelineRun && !success && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {STAGE_LABELS[pipelineRun.stage] || pipelineRun.stage}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Progress: {pipelineRun.progress}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-forge-accent rounded-full transition-all duration-500"
                        style={{ width: `${pipelineRun.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stage Indicators */}
                  <div className="grid grid-cols-3 gap-4 mt-8">
                    {['GATHERING_CONTEXT', 'DRAFTING', 'HUMANIZING', 'QUALITY_CHECK', 'FINALIZING'].map((stage, i) => {
                      const currentIndex = ['INITIALIZING', 'GATHERING_CONTEXT', 'SELECTING_CONTRIBUTOR', 'GENERATING_OUTLINE', 'DRAFTING', 'HUMANIZING', 'QUALITY_CHECK', 'FINALIZING', 'COMPLETE'].indexOf(pipelineRun.stage);
                      const stageIndex = ['INITIALIZING', 'GATHERING_CONTEXT', 'SELECTING_CONTRIBUTOR', 'GENERATING_OUTLINE', 'DRAFTING', 'HUMANIZING', 'QUALITY_CHECK', 'FINALIZING', 'COMPLETE'].indexOf(stage);
                      const isComplete = stageIndex < currentIndex;
                      const isCurrent = stage === pipelineRun.stage;

                      return (
                        <div
                          key={stage}
                          className={[
                            'p-4 rounded-xl border transition-all',
                            isComplete ? 'bg-emerald-500/10 border-emerald-500/30' :
                            isCurrent ? 'bg-indigo-500/10 border-indigo-500/30 animate-pulse' :
                            'bg-white/5 border-white/5'
                          ].join(' ')}
                        >
                          <div className="flex items-center space-x-2">
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-600" />
                            )}
                            <span className={[
                              'text-sm font-medium',
                              isComplete ? 'text-emerald-400' :
                              isCurrent ? 'text-indigo-400' :
                              'text-slate-500'
                            ].join(' ')}>
                              {STAGE_LABELS[stage]?.replace('...', '') || stage}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Contributor Preview */}
                  {selectedContributor && (
                    <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center space-x-3">
                        {selectedContributor.avatar_url ? (
                          <img src={selectedContributor.avatar_url} alt={selectedContributor.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                            {selectedContributor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">
                            Writing as {selectedContributor.display_name || selectedContributor.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {selectedContributor.voice_profile?.description || 'Custom voice profile'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Initial State */}
              {!isGenerating && !success && !error && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <Sparkles className="w-12 h-12 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-400 mb-2">Ready to Forge</h3>
                  <p className="text-sm text-center max-w-md">
                    Select a contributor, enter your topic, and click "Forge Content" to generate
                    an AI-powered article with your chosen persona's voice.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentForge;
