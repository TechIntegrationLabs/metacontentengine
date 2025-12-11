/**
 * Validation Demo Component
 *
 * Example usage of the pre-publish validation system.
 * This can be integrated into the article editor or publishing flow.
 */

import React, { useState } from 'react';
import { validateArticle, getAutoFixableChecks } from '@content-engine/quality';
import type { QualityScore } from '@content-engine/quality';
import type { Article, ValidationResult } from '@content-engine/types';
import PrePublishChecklist from './PrePublishChecklist';
import ValidationSummaryBadge from './ValidationSummaryBadge';
import { Button } from '../primitives/Button';
import { Send, FileCheck } from 'lucide-react';

interface ValidationDemoProps {
  article: Article;
  qualityScore?: QualityScore;
  onPublish?: (article: Article) => void;
  className?: string;
}

export default function ValidationDemo({
  article,
  qualityScore,
  onPublish,
  className = '',
}: ValidationDemoProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [fixingCheckIds, setFixingCheckIds] = useState<string[]>([]);

  const handleValidate = async () => {
    setIsValidating(true);

    // Simulate validation delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = validateArticle(article, qualityScore);
    setValidationResult(result);
    setIsValidating(false);
  };

  const handleAutoFix = async (checkId: string) => {
    setFixingCheckIds((prev) => [...prev, checkId]);

    // Simulate auto-fix operation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real implementation, you would:
    // 1. Apply the fix to the article
    // 2. Re-validate
    // 3. Update the validation result

    console.log(`Auto-fixing check: ${checkId}`);

    setFixingCheckIds((prev) => prev.filter((id) => id !== checkId));

    // Re-validate after fix
    handleValidate();
  };

  const handlePublish = () => {
    if (validationResult?.canPublish && onPublish) {
      onPublish(article);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {validationResult && (
            <ValidationSummaryBadge result={validationResult} size="md" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleValidate}
            isLoading={isValidating}
            leftIcon={<FileCheck className="w-4 h-4" />}
          >
            {validationResult ? 'Re-validate' : 'Validate Article'}
          </Button>

          {validationResult && (
            <Button
              variant="forge"
              size="md"
              onClick={handlePublish}
              disabled={!validationResult.canPublish || isValidating}
              leftIcon={<Send className="w-4 h-4" />}
            >
              {validationResult.canPublish ? 'Publish Now' : 'Cannot Publish'}
            </Button>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <PrePublishChecklist
          result={validationResult}
          onAutoFix={handleAutoFix}
          onRevalidate={handleValidate}
          isValidating={isValidating}
          fixingCheckIds={fixingCheckIds}
        />
      )}

      {/* Initial State */}
      {!validationResult && !isValidating && (
        <div className="glass-card p-12 text-center">
          <FileCheck className="w-16 h-16 text-void-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-void-100 mb-2">
            Ready to Validate
          </h3>
          <p className="text-void-400 mb-6 max-w-md mx-auto">
            Run pre-publish validation to check content requirements, quality standards,
            SEO optimization, and compliance before publishing.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleValidate}
            leftIcon={<FileCheck className="w-5 h-5" />}
          >
            Start Validation
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example:
 *
 * ```tsx
 * import { ValidationDemo } from '@content-engine/ui';
 *
 * function ArticleEditor() {
 *   const [article, setArticle] = useState<Article>(...);
 *   const [qualityScore, setQualityScore] = useState<QualityScore>();
 *
 *   const handlePublish = async (article: Article) => {
 *     // Publish to WordPress or other platforms
 *     await publishArticle(article);
 *   };
 *
 *   return (
 *     <ValidationDemo
 *       article={article}
 *       qualityScore={qualityScore}
 *       onPublish={handlePublish}
 *     />
 *   );
 * }
 * ```
 */
