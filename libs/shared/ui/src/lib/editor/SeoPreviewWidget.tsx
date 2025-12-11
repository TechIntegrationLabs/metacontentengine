import { useMemo } from 'react';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

export interface SeoPreviewWidgetProps {
  title?: string;
  description?: string;
  url?: string;
  keywords?: string[];
  content?: string;
  className?: string;
}

export const SeoPreviewWidget = ({
  title = 'Untitled Article',
  description = '',
  url = 'example.com/article',
  keywords = [],
  content = '',
  className = ''
}: SeoPreviewWidgetProps) => {
  const titleLength = title.length;
  const descriptionLength = description.length;

  const titleStatus = useMemo(() => {
    if (titleLength === 0) return { icon: AlertCircle, color: 'text-slate-500', label: 'Missing' };
    if (titleLength < 30) return { icon: AlertCircle, color: 'text-orange-400', label: 'Too short' };
    if (titleLength > 60) return { icon: AlertCircle, color: 'text-orange-400', label: 'Too long' };
    return { icon: CheckCircle, color: 'text-emerald-400', label: 'Good' };
  }, [titleLength]);

  const descriptionStatus = useMemo(() => {
    if (descriptionLength === 0) return { icon: AlertCircle, color: 'text-slate-500', label: 'Missing' };
    if (descriptionLength < 120) return { icon: AlertCircle, color: 'text-orange-400', label: 'Too short' };
    if (descriptionLength > 160) return { icon: AlertCircle, color: 'text-orange-400', label: 'Too long' };
    return { icon: CheckCircle, color: 'text-emerald-400', label: 'Good' };
  }, [descriptionLength]);

  const keywordDensity = useMemo(() => {
    if (!content || keywords.length === 0) return [];

    const wordCount = content.split(/\s+/).length;

    return keywords.map(keyword => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
      const matches = (content.match(regex) || []).length;
      const density = wordCount > 0 ? (matches / wordCount) * 100 : 0;

      return {
        keyword,
        count: matches,
        density: density.toFixed(2),
        status: density >= 0.5 && density <= 2.5 ? 'good' : density < 0.5 ? 'low' : 'high'
      };
    });
  }, [content, keywords]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Google Search Preview */}
      <div className="p-4 bg-void-800/50 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-400">Google Preview</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{url}</span>
          </div>
          <h3 className="text-indigo-400 text-lg font-normal hover:underline cursor-pointer line-clamp-2">
            {title}
          </h3>
          <p className="text-slate-400 text-sm line-clamp-2">
            {description || 'No meta description provided...'}
          </p>
        </div>
      </div>

      {/* Meta Length Indicators */}
      <div className="space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Meta Title</span>
            <div className="flex items-center gap-1">
              <titleStatus.icon className={`w-3 h-3 ${titleStatus.color}`} />
              <span className={`text-xs ${titleStatus.color}`}>{titleStatus.label}</span>
              <span className="text-xs text-slate-500">({titleLength}/60)</span>
            </div>
          </div>
          <div className="relative h-1.5 bg-void-800/50 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                titleLength >= 30 && titleLength <= 60
                  ? 'bg-emerald-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min((titleLength / 60) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Meta Description</span>
            <div className="flex items-center gap-1">
              <descriptionStatus.icon className={`w-3 h-3 ${descriptionStatus.color}`} />
              <span className={`text-xs ${descriptionStatus.color}`}>{descriptionStatus.label}</span>
              <span className="text-xs text-slate-500">({descriptionLength}/160)</span>
            </div>
          </div>
          <div className="relative h-1.5 bg-void-800/50 rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                descriptionLength >= 120 && descriptionLength <= 160
                  ? 'bg-emerald-500'
                  : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min((descriptionLength / 160) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Keyword Density */}
      {keywordDensity.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-slate-400">Keyword Density</h4>
          <div className="space-y-2">
            {keywordDensity.map((kw, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-sm text-white">{kw.keyword}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{kw.count}x</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    kw.status === 'good'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : kw.status === 'low'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {kw.density}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoPreviewWidget;
