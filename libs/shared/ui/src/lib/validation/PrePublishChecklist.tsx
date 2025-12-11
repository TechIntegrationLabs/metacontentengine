import React, { useState } from 'react';
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Search,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ValidationResult, ValidationCategory } from '@content-engine/types';
import { getCategorySummary } from '@content-engine/quality';
import ValidationCheckItem from './ValidationCheckItem';
import ValidationSummaryBadge from './ValidationSummaryBadge';
import { Button } from '../primitives/Button';

interface PrePublishChecklistProps {
  result: ValidationResult;
  onAutoFix?: (checkId: string) => void;
  onRevalidate?: () => void;
  isValidating?: boolean;
  fixingCheckIds?: string[];
  className?: string;
}

interface CategorySection {
  category: ValidationCategory;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const CATEGORIES: CategorySection[] = [
  {
    category: 'content',
    icon: FileText,
    label: 'Content Requirements',
    description: 'Word count, title, meta description, and media',
  },
  {
    category: 'quality',
    icon: Sparkles,
    label: 'Quality Standards',
    description: 'Quality score, AI detection, and critical issues',
  },
  {
    category: 'seo',
    icon: Search,
    label: 'SEO Optimization',
    description: 'Keywords, headings, links, and image optimization',
  },
  {
    category: 'compliance',
    icon: Shield,
    label: 'Compliance Checks',
    description: 'Banned phrases, domain validation, and content policies',
  },
];

export default function PrePublishChecklist({
  result,
  onAutoFix,
  onRevalidate,
  isValidating = false,
  fixingCheckIds = [],
  className = '',
}: PrePublishChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<ValidationCategory>>(
    new Set(['content', 'quality'])
  );

  const categorySummary = getCategorySummary(result);

  const toggleCategory = (category: ValidationCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(['content', 'quality', 'seo', 'compliance']));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-forge-purple/10">
              <ClipboardCheck className="w-6 h-6 text-forge-purple" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-void-100">Pre-Publish Validation</h2>
              <p className="text-sm text-void-400 mt-0.5">
                Comprehensive checks before publishing
              </p>
            </div>
          </div>

          {onRevalidate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRevalidate}
              isLoading={isValidating}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Re-validate
            </Button>
          )}
        </div>

        <ValidationSummaryBadge result={result} showDetails={true} />
      </div>

      {/* Category Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-void-100">Validation Checks</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-void-400 hover:text-void-200 transition-colors"
          >
            Expand All
          </button>
          <span className="text-void-700">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-void-400 hover:text-void-200 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {CATEGORIES.map((categorySection) => {
          const summary = categorySummary.find(
            (s) => s.category === categorySection.category
          );
          if (!summary || summary.total === 0) return null;

          const checks = result.checks.filter(
            (c) => c.category === categorySection.category
          );
          const isExpanded = expandedCategories.has(categorySection.category);
          const Icon = categorySection.icon;

          const getCategoryColor = () => {
            if (summary.failed > 0) return 'border-red-500/30 bg-red-500/5';
            if (summary.warnings > 0) return 'border-yellow-500/30 bg-yellow-500/5';
            return 'border-green-500/30 bg-green-500/5';
          };

          const getProgressColor = () => {
            if (summary.failed > 0) return 'bg-red-500';
            if (summary.warnings > 0) return 'bg-yellow-500';
            return 'bg-green-500';
          };

          return (
            <motion.div
              key={categorySection.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-xl overflow-hidden transition-all ${getCategoryColor()}`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categorySection.category)}
                className="w-full p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="p-2 rounded-lg bg-void-900/50">
                  <Icon className="w-5 h-5 text-void-300" />
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-sm font-semibold text-void-100">
                      {categorySection.label}
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-void-900/50 text-void-300">
                      {summary.passed}/{summary.total}
                    </span>
                  </div>
                  <p className="text-xs text-void-400">{categorySection.description}</p>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-void-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${summary.percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full ${getProgressColor()}`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {summary.failed > 0 && (
                    <div className="text-xs text-red-400 font-medium">
                      {summary.failed} failed
                    </div>
                  )}
                  {summary.warnings > 0 && (
                    <div className="text-xs text-yellow-400 font-medium">
                      {summary.warnings} warnings
                    </div>
                  )}

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-void-400" />
                  </motion.div>
                </div>
              </button>

              {/* Category Checks */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-3">
                      {checks.map((check) => (
                        <ValidationCheckItem
                          key={check.id}
                          check={check}
                          onAutoFix={onAutoFix}
                          isFixing={fixingCheckIds.includes(check.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Auto-fix summary */}
      {onAutoFix && result.checks.some((c) => c.autoFixAvailable && c.status !== 'pass') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border border-forge-purple/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-forge-purple/10">
                <Sparkles className="w-5 h-5 text-forge-purple" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-void-100">
                  Auto-fix Available
                </h4>
                <p className="text-xs text-void-400 mt-0.5">
                  {result.checks.filter((c) => c.autoFixAvailable && c.status !== 'pass').length}{' '}
                  issues can be automatically fixed
                </p>
              </div>
            </div>

            <Button
              variant="forge"
              size="sm"
              onClick={() => {
                result.checks
                  .filter((c) => c.autoFixAvailable && c.status !== 'pass')
                  .forEach((c) => onAutoFix(c.id));
              }}
              disabled={fixingCheckIds.length > 0}
            >
              Fix All
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
