import React, { useState, useEffect } from 'react';
import { Sparkles, Globe, ArrowRight, CheckCircle2, Search, Cpu, BarChart2, Layers, Zap, Target, Briefcase } from 'lucide-react';

export interface BrandProfile {
  name: string;
  url: string;
  industry: string;
  tone: number;
  audience: string;
  keywords: string[];
  description: string;
}

interface Props {
  onComplete: (profile: BrandProfile) => void;
}

const MagicSetup: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<Partial<BrandProfile> | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 95));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);

    const startTime = Date.now();

    try {
      // Simulate brand analysis - in production this would call our AI service
      const mockResult: Partial<BrandProfile> = {
        industry: 'Education Technology',
        tone: 7,
        audience: 'Students, educators, and lifelong learners seeking quality educational resources',
        keywords: ['Education', 'Learning', 'Online Degrees', 'Career Growth', 'Certification'],
        description: 'A trusted platform helping students find the right educational path'
      };

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2500 - elapsed);

      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setAnalysisResult(mockResult);
          setIsAnalyzing(false);
          setStep(2);
        }, 500);
      }, remaining);

    } catch (e) {
      setIsAnalyzing(false);
    }
  };

  const finalize = () => {
    if (analysisResult) {
      try {
        const hostname = new URL(url).hostname.replace('www.', '').split('.')[0];
        onComplete({
          name: hostname.charAt(0).toUpperCase() + hostname.slice(1),
          url: url,
          industry: analysisResult.industry || 'General',
          tone: analysisResult.tone || 5,
          audience: analysisResult.audience || 'General Audience',
          keywords: analysisResult.keywords || [],
          description: analysisResult.description || ''
        });
      } catch {
        onComplete({
          name: 'My Brand',
          url: url,
          industry: analysisResult.industry || 'General',
          tone: analysisResult.tone || 5,
          audience: analysisResult.audience || 'General Audience',
          keywords: analysisResult.keywords || [],
          description: analysisResult.description || ''
        });
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 relative min-h-[calc(100vh-200px)] flex items-center justify-center">
      {/* Decorative blurred backdrops */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-forge-accent/10 blur-[100px] rounded-full"></div>

      <div className="glass-card rounded-2xl p-1 relative overflow-hidden shadow-2xl w-full animate-scale-in">
        <div className="bg-void-900/80 rounded-xl p-8 min-h-[500px] flex flex-col justify-center relative overflow-hidden">

          {/* Header */}
          <div className="relative z-10 mb-10 text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-900/20 border border-indigo-500/20 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">
              {step === 1 ? 'Initialize Brand Forge' : 'DNA Extracted'}
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">
              {step === 1
                ? 'Connect your digital presence. The AI will extract your brand voice, audience, and style automatically.'
                : 'Review your brand profile below. We have configured the generation engine to match your voice.'}
            </p>
          </div>

          {step === 1 && !isAnalyzing && (
            <div className="space-y-6 max-w-lg mx-auto w-full relative z-10 animate-slide-up">
              <div className="group">
                <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 ml-1">Website Endpoint</label>
                <div className="relative transition-all duration-300 transform group-focus-within:scale-[1.02]">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Globe className="w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourbrand.com"
                    className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-void-950 transition-all shadow-inner outline-none"
                  />
                  {url && (
                    <div className="absolute right-4 top-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Context (Optional)</label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Additional context about your brand mission..."
                  className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-void-950 outline-none h-20 resize-none transition-all shadow-inner"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!url}
                className="w-full group relative overflow-hidden bg-white text-void-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></div>
                <span className="relative flex items-center justify-center space-x-2">
                  <span>Begin Analysis</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="max-w-lg mx-auto w-full relative z-10 flex flex-col items-center justify-center py-8">
              {/* Radar Scanner Visual */}
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 rounded-full border border-indigo-500/30"></div>
                <div className="absolute inset-4 rounded-full border border-indigo-500/50 border-dashed animate-spin" style={{ animationDuration: '10s' }}></div>
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 opacity-50 animate-spin" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
              </div>

              <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="space-y-1 text-center">
                <p className="text-white font-medium animate-pulse">Extracting Brand DNA...</p>
                <p className="text-xs text-slate-500 font-mono">Scanning: {url}</p>
                <div className="flex justify-center space-x-4 mt-4 text-xs text-indigo-300 font-mono">
                  <span className={progress > 30 ? "opacity-100" : "opacity-30"}>[TONE_ANALYSIS]</span>
                  <span className={progress > 60 ? "opacity-100" : "opacity-30"}>[AUDIENCE_MAP]</span>
                  <span className={progress > 80 ? "opacity-100" : "opacity-30"}>[STYLE_VECTOR]</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && analysisResult && (
            <div className="max-w-xl mx-auto w-full relative z-10 animate-slide-up space-y-6">

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-void-950/40 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                  <div className="flex items-center space-x-2 mb-2">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Industry</span>
                  </div>
                  <p className="text-lg font-display font-semibold text-white group-hover:text-indigo-200 transition-colors">{analysisResult.industry}</p>
                </div>

                <div className="p-4 bg-void-950/40 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Voice Tone</span>
                  </div>
                  <div className="flex items-end space-x-2">
                    <span className="text-lg font-display font-semibold text-white">{analysisResult.tone}/10</span>
                    <div className="flex-1 pb-2 flex space-x-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (analysisResult.tone || 5) ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 p-4 bg-void-950/40 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Target Audience</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{analysisResult.audience}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {analysisResult.keywords?.map((k, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-950/30 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/20 shadow-sm">
                    #{k}
                  </span>
                ))}
              </div>

              <button
                onClick={finalize}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01]"
              >
                <Zap className="w-5 h-5" />
                <span>Initialize Workspace</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MagicSetup;
