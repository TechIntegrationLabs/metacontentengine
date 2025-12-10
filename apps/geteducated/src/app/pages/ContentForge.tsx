import React, { useState } from 'react';
import { Zap, Loader2, Sparkles, Copy, Check } from 'lucide-react';

const CONTRIBUTORS = [
  { id: '1', name: 'Sarah Tech', role: 'Technical Writer' },
  { id: '2', name: 'Mark Growth', role: 'Marketing Lead' },
  { id: '3', name: 'Elena Story', role: 'Brand Journalist' },
];

export function ContentForge() {
  const [topic, setTopic] = useState('');
  const [selectedId, setSelectedId] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setContent('');
    await new Promise(r => setTimeout(r, 3000));
    setContent('# ' + topic + '\n\nGenerated article content here...');
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 animate-slide-up">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          Content<span className="text-forge-accent">Forge</span>
        </h1>
        <p className="text-slate-400">Generate content with AI.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">Persona</label>
              <div className="space-y-3">
                {CONTRIBUTORS.map(c => (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={[
                      'p-3 rounded-xl border cursor-pointer flex items-center space-x-3',
                      selectedId === c.id ? 'bg-indigo-500/10 border-indigo-500/50' : 'border-white/5'
                    ].join(' ')}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">Topic</label>
              <textarea 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Enter your topic..."
                className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl p-4 text-white placeholder-slate-600 h-32 resize-none outline-none focus:border-indigo-500"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!topic || isGenerating}
              className="w-full bg-gradient-to-r from-forge-accent to-orange-600 text-white font-bold py-4 rounded-xl disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              <span>{isGenerating ? 'Forging...' : 'FORGE'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="glass-card rounded-2xl border border-white/5 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <span className="text-xs font-mono text-slate-500">Draft.md</span>
              {content && (
                <div className="flex items-center space-x-2">
                  <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg">Publish</button>
                </div>
              )}
            </div>
            <div className="flex-1 p-8">
              {content ? (
                <div className="prose prose-invert max-w-none whitespace-pre-wrap">{content}</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <Sparkles className={isGenerating ? 'w-8 h-8 text-forge-accent animate-pulse' : 'w-8 h-8'} />
                  <p className="mt-4">{isGenerating ? 'Generating...' : 'Waiting for input...'}</p>
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
