import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Wand2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import QualityScoreGauge from './QualityScoreGauge';
import QualityMetricCard, { MetricType } from './QualityMetricCard';
import QualityIssuesList, { QualityIssue, AutoFixSuggestion } from './QualityIssuesList';
import RiskAssessmentBadge, { RiskAssessmentDetail, RiskLevel, RiskFactors, BlockingIssue } from './RiskAssessmentBadge';

interface QualityScore {
  overall: number;
  readability: { score: number; details: Record<string, number> };
  seo: { score: number; details: Record<string, number | string> };
  humanness: { score: number; details: Record<string, number> };
  structure: { score: number; details: Record<string, number | boolean> };
  voice: { score: number; details: Record<string, number | string> };
}

interface RiskAssessment {
  level: RiskLevel;
  score: number;
  factors: RiskFactors;
  blockingIssues: BlockingIssue[];
  autoPublishEligible: boolean;
}

interface QualityPanelProps {
  content: string;
  onAnalyze?: (content: string) => Promise<{
    quality: QualityScore;
    issues: QualityIssue[];
    suggestions: AutoFixSuggestion[];
    risk: RiskAssessment;
  }>;
  onApplyFix?: (fix: AutoFixSuggestion) => void;
  onApplyAllFixes?: (fixes: AutoFixSuggestion[]) => void;
  isAnalyzing?: boolean;
  initialScore?: QualityScore;
  initialIssues?: QualityIssue[];
  initialSuggestions?: AutoFixSuggestion[];
  initialRisk?: RiskAssessment;
}

const QualityPanel: React.FC<QualityPanelProps> = ({
  content,
  onAnalyze,
  onApplyFix,
  onApplyAllFixes,
  isAnalyzing = false,
  initialScore,
  initialIssues = [],
  initialSuggestions = [],
  initialRisk,
}) => {
  const [quality, setQuality] = useState<QualityScore | null>(initialScore || null);
  const [issues, setIssues] = useState<QualityIssue[]>(initialIssues);
  const [suggestions, setSuggestions] = useState<AutoFixSuggestion[]>(initialSuggestions);
  const [risk, setRisk] = useState<RiskAssessment | null>(initialRisk || null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<MetricType | null>(null);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const [showIssues, setShowIssues] = useState(true);

  // Auto-analyze when content changes (debounced)
  useEffect(() => {
    if (!onAnalyze || !content || content.length < 100) return;

    const timer = setTimeout(() => {
      handleAnalyze();
    }, 2000);

    return () => clearTimeout(timer);
  }, [content]);

  const handleAnalyze = async () => {
    if (!onAnalyze || !content) return;

    setIsLoading(true);
    try {
      const result = await onAnalyze(content);
      setQuality(result.quality);
      setIssues(result.issues);
      setSuggestions(result.suggestions);
      setRisk(result.risk);
    } catch (error) {
      console.error('Quality analysis failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFix = (fix: AutoFixSuggestion) => {
    if (onApplyFix) {
      onApplyFix(fix);
      // Remove the applied fix from suggestions
      setSuggestions((prev) => prev.filter((s) => s.issueId !== fix.issueId));
      // Remove the corresponding issue
      setIssues((prev) => prev.filter((i) => i.id !== fix.issueId));
    }
  };

  const handleApplyAllFixes = () => {
    const highConfidenceFixes = suggestions.filter((s) => s.confidence >= 70);
    if (onApplyAllFixes && highConfidenceFixes.length > 0) {
      onApplyAllFixes(highConfidenceFixes);
      // Remove applied fixes
      const fixedIssueIds = new Set(highConfidenceFixes.map((f) => f.issueId));
      setSuggestions((prev) => prev.filter((s) => !fixedIssueIds.has(s.issueId)));
      setIssues((prev) => prev.filter((i) => !fixedIssueIds.has(i.id)));
    }
  };

  const handleDismissIssue = (issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    setSuggestions((prev) => prev.filter((s) => s.issueId !== issueId));
  };

  const autoFixCount = suggestions.filter((s) => s.confidence >= 70).length;

  if (!quality && !isLoading && !isAnalyzing) {
    return (
      <div className="bg-void-900/50 rounded-xl border border-white/5 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No quality analysis available</p>
        <p className="text-sm text-slate-500 mt-1">
          {content.length < 100 ? 'Add more content to analyze' : 'Click analyze to check quality'}
        </p>
        {content.length >= 100 && onAnalyze && (
          <button
            onClick={handleAnalyze}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm flex items-center space-x-2 mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Analyze Content</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with score and actions */}
      <div className="bg-void-900/50 rounded-xl border border-white/5 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            {/* Main score gauge */}
            {quality && (
              <QualityScoreGauge score={quality.overall} size="md" />
            )}

            {/* Risk badge */}
            {risk && (
              <div>
                <RiskAssessmentBadge
                  level={risk.level}
                  score={risk.score}
                  onClick={() => setShowRiskDetails(!showRiskDetails)}
                />
                <p className="text-xs text-slate-500 mt-2">
                  {risk.autoPublishEligible ? 'Ready for auto-publish' : 'Manual review required'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {autoFixCount > 0 && onApplyAllFixes && (
              <button
                onClick={handleApplyAllFixes}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-sm flex items-center space-x-2 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                <span>Apply {autoFixCount} Fixes</span>
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={isLoading || isAnalyzing}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
            >
              {isLoading || isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Re-analyze</span>
            </button>
          </div>
        </div>

        {/* Risk details (expanded) */}
        {showRiskDetails && risk && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <RiskAssessmentDetail
              level={risk.level}
              score={risk.score}
              factors={risk.factors}
              blockingIssues={risk.blockingIssues}
              autoPublishEligible={risk.autoPublishEligible}
            />
          </div>
        )}
      </div>

      {/* Metric cards */}
      {quality && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {(['readability', 'seo', 'humanness', 'structure', 'voice'] as MetricType[]).map((metric) => (
            <QualityMetricCard
              key={metric}
              type={metric}
              score={quality[metric].score}
              details={quality[metric].details as Record<string, string | number>}
              isExpanded={expandedMetric === metric}
              onToggle={() => setExpandedMetric(expandedMetric === metric ? null : metric)}
            />
          ))}
        </div>
      )}

      {/* Issues section */}
      <div className="bg-void-900/50 rounded-xl border border-white/5 overflow-hidden">
        <button
          onClick={() => setShowIssues(!showIssues)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="font-medium text-white">Issues & Suggestions</span>
            {issues.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">
                {issues.length} issues
              </span>
            )}
          </div>
          {showIssues ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showIssues && (
          <div className="p-4 pt-0">
            <QualityIssuesList
              issues={issues}
              autoFixes={suggestions}
              onApplyFix={handleApplyFix}
              onDismissIssue={handleDismissIssue}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityPanel;
