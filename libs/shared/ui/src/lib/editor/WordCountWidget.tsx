import { useMemo } from 'react';
import { FileText, Clock, Type } from 'lucide-react';

export interface WordCountWidgetProps {
  wordCount: number;
  targetMin?: number;
  targetMax?: number;
  characterCount?: number;
  className?: string;
}

export const WordCountWidget = ({
  wordCount,
  targetMin = 800,
  targetMax = 1200,
  characterCount,
  className = ''
}: WordCountWidgetProps) => {
  const readingTime = useMemo(() => {
    // Average reading speed: 200-250 words per minute
    const minutes = Math.ceil(wordCount / 225);
    return minutes;
  }, [wordCount]);

  const progress = useMemo(() => {
    if (wordCount < targetMin) {
      return (wordCount / targetMin) * 100;
    } else if (wordCount <= targetMax) {
      return 100;
    } else {
      return 100 + ((wordCount - targetMax) / targetMax) * 50;
    }
  }, [wordCount, targetMin, targetMax]);

  const status = useMemo(() => {
    if (wordCount < targetMin) return { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Below target' };
    if (wordCount <= targetMax) return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'On target' };
    return { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Above target' };
  }, [wordCount, targetMin, targetMax]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Word Count Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-forge-accent" />
          <span className="text-2xl font-bold text-white">{wordCount.toLocaleString()}</span>
          <span className="text-sm text-slate-400">words</span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{targetMin.toLocaleString()}</span>
          <span>{targetMax.toLocaleString()}</span>
        </div>
        <div className="relative h-2 bg-void-800/50 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full transition-all duration-300 ${
              wordCount <= targetMax ? 'bg-gradient-to-r from-forge-accent to-orange-500' : 'bg-gradient-to-r from-purple-600 to-purple-400'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Reading Time */}
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/5">
          <Clock className="w-4 h-4 text-indigo-400" />
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">Reading time</span>
            <span className="text-sm font-semibold text-white">{readingTime} min</span>
          </div>
        </div>

        {/* Character Count */}
        {characterCount !== undefined && (
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/5">
            <Type className="w-4 h-4 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Characters</span>
              <span className="text-sm font-semibold text-white">{characterCount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordCountWidget;
