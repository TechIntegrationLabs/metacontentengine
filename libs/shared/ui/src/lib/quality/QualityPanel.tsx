import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import QualityScoreGauge from './QualityScoreGauge';
import QualityMetricCard, { MetricType } from './QualityMetricCard';
import QualityIssuesList, { QualityIssue } from './QualityIssuesList';
import RiskAssessmentBadge, { RiskLevel, RiskFactors, BlockingIssue } from './RiskAssessmentBadge';

interface MetricData {
  type: MetricType;
  score: number;
  label: string;
  description?: string;
  details?: Array<{
    label: string;
    value: string | number;
    status?: 'good' | 'warning' | 'error';
  }>;
  icon?: React.ComponentType<{ className?: string }>;
}

interface QualityPanelProps {
  overallScore: number;
  previousScore?: number;
  metrics: MetricData[];
  issues?: QualityIssue[];
  riskLevel: RiskLevel;
  riskFactors?: RiskFactors;
  blockingIssues?: BlockingIssue[];
  onFixIssue?: (issueId: string) => void;
  onDismissIssue?: (issueId: string) => void;
  isAnalyzing?: boolean;
  className?: string;
}

export default function QualityPanel({
  overallScore,
  previousScore,
  metrics,
  issues = [],
  riskLevel,
  riskFactors,
  blockingIssues = [],
  onFixIssue,
  onDismissIssue,
  isAnalyzing = false,
  className = '',
}: QualityPanelProps) {
  const errorCount = issues.filter((i) => !i.isFixed && i.severity === 'error').length;
  const warningCount = issues.filter((i) => !i.isFixed && i.severity === 'warning').length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-forge-purple/10">
            <Sparkles className="w-6 h-6 text-forge-purple" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-void-100">Quality Analysis</h2>
            <p className="text-sm text-void-400 mt-0.5">
              Comprehensive content quality assessment
            </p>
          </div>
        </div>

        {isAnalyzing ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-void-700 border-t-forge-purple mb-4" />
              <p className="text-void-300">Analyzing content quality...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overall score */}
            <div className="flex flex-col items-center justify-center">
              <QualityScoreGauge
                score={overallScore}
                previousScore={previousScore}
                size="lg"
                showTrend={true}
              />
              <p className="text-sm text-void-400 mt-4">Overall Quality Score</p>
            </div>

            {/* Stats */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <div className="p-4 bg-void-900/30 rounded-lg border border-void-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-void-400">Strengths</span>
                </div>
                <p className="text-2xl font-bold text-void-100">
                  {metrics.filter((m) => m.score >= 80).length}
                </p>
                <p className="text-xs text-void-500 mt-1">
                  High-performing metrics
                </p>
              </div>

              <div className="p-4 bg-void-900/30 rounded-lg border border-void-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-void-400">Issues</span>
                </div>
                <p className="text-2xl font-bold text-void-100">
                  {errorCount + warningCount}
                </p>
                <p className="text-xs text-void-500 mt-1">
                  {errorCount} errors, {warningCount} warnings
                </p>
              </div>

              <div className="col-span-2">
                <RiskAssessmentBadge
                  riskLevel={riskLevel}
                  riskFactors={riskFactors}
                  blockingIssues={blockingIssues}
                  showDetails={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      {!isAnalyzing && (
        <>
          <div>
            <h3 className="text-lg font-semibold text-void-100 mb-4">
              Quality Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <QualityMetricCard
                  key={metric.type}
                  type={metric.type}
                  score={metric.score}
                  label={metric.label}
                  description={metric.description}
                  details={metric.details}
                  icon={metric.icon}
                />
              ))}
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-void-100 mb-4">
                Issues & Suggestions
              </h3>
              <QualityIssuesList
                issues={issues}
                onFixIssue={onFixIssue}
                onDismissIssue={onDismissIssue}
                showFilters={true}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
