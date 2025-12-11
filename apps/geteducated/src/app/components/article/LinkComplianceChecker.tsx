import { useEffect, useState } from 'react';
import {
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Home,
  Shield,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import type { ComplianceResult, LinkViolation } from '@content-engine/generation';

interface LinkComplianceCheckerProps {
  content: string;
  onComplianceChange?: (isCompliant: boolean, result: ComplianceResult) => void;
  minInternalLinks?: number;
  minExternalLinks?: number;
}

/**
 * Link Compliance Checker Component
 * Analyzes internal and external links in content
 * Enforces tenant-specific linking rules:
 * - No .edu links (configurable)
 * - No competitor links (tenant-specific)
 * - External links validated against whitelist
 */
export default function LinkComplianceChecker({
  content,
  onComplianceChange,
  minInternalLinks = 3,
  minExternalLinks = 1,
}: LinkComplianceCheckerProps) {
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [showBlockingDetails, setShowBlockingDetails] = useState(false);
  const [showWarningDetails, setShowWarningDetails] = useState(false);
  const [showLinkDetails, setShowLinkDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!content) {
      const emptyResult: ComplianceResult = {
        isCompliant: false,
        violations: [],
        allowedLinks: [],
        blockedCount: 0,
        warningCount: 0,
        totalLinks: 0,
        internalLinks: 0,
        externalLinks: 0,
        anchorLinks: 0,
      };
      setComplianceResult(emptyResult);
      onComplianceChange?.(false, emptyResult);
      return;
    }

    // In a real implementation, this would call the LinkComplianceService
    // For now, we'll use a placeholder
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      // TODO: Replace with actual service call
      // const service = createLinkComplianceService(supabaseUrl, supabaseKey, tenantId);
      // const result = await service.checkCompliance(content);

      const result: ComplianceResult = {
        isCompliant: true,
        violations: [],
        allowedLinks: [],
        blockedCount: 0,
        warningCount: 0,
        totalLinks: 0,
        internalLinks: 0,
        externalLinks: 0,
        anchorLinks: 0,
      };

      setComplianceResult(result);
      setIsLoading(false);
      onComplianceChange?.(result.isCompliant, result);
    }, 500);
  }, [content, onComplianceChange]);

  if (!complianceResult) return null;

  const {
    isCompliant,
    violations,
    totalLinks,
    internalLinks,
    externalLinks,
    blockedCount,
    warningCount,
  } = complianceResult;

  const blockingViolations = violations.filter((v) => v.severity === 'error');
  const warningViolations = violations.filter((v) => v.severity === 'warning');

  const meetsInternalMin = internalLinks >= minInternalLinks;
  const meetsExternalMin = externalLinks >= minExternalLinks;
  const hasBlockingIssues = blockedCount > 0;
  const hasWarnings = warningCount > 0;

  const isFullyCompliant = isCompliant && meetsInternalMin && meetsExternalMin;

  return (
    <div className="border-none shadow-lg rounded-lg bg-white">
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5 text-forge-orange" />
            Link Compliance
          </h3>
          {hasBlockingIssues ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-medium">
              <XCircle className="w-3 h-3" />
              Blocked
            </span>
          ) : isFullyCompliant ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Compliant
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              Review
            </span>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Blocking Issues Alert */}
        {hasBlockingIssues && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {blockedCount} Blocking Issue{blockedCount !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setShowBlockingDetails(!showBlockingDetails)}
                className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-100"
              >
                {showBlockingDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-red-600 mt-1">
              These links must be removed before publishing
            </p>
            {showBlockingDetails && (
              <div className="mt-2 space-y-2">
                {blockingViolations.map((violation, index) => (
                  <ViolationCard key={index} violation={violation} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Internal Links */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg border ${
            meetsInternalMin
              ? 'bg-blue-50 border-blue-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Home
              className={`w-4 h-4 ${meetsInternalMin ? 'text-blue-600' : 'text-yellow-600'}`}
            />
            <span className="text-sm font-medium text-gray-900">Internal Links</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                meetsInternalMin
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}
            >
              {internalLinks}/{minInternalLinks}
            </span>
            {meetsInternalMin ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        {/* External Links */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg border ${
            meetsExternalMin
              ? 'bg-purple-50 border-purple-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Globe
              className={`w-4 h-4 ${meetsExternalMin ? 'text-purple-600' : 'text-yellow-600'}`}
            />
            <span className="text-sm font-medium text-gray-900">External Citations</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                meetsExternalMin
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}
            >
              {externalLinks}/{minExternalLinks}
            </span>
            {meetsExternalMin ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>

        {/* Warnings */}
        {hasWarnings && !hasBlockingIssues && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {warningCount} Warning{warningCount !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => setShowWarningDetails(!showWarningDetails)}
                className="text-yellow-600 hover:text-yellow-700 p-1 rounded hover:bg-yellow-100"
              >
                {showWarningDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            {showWarningDetails && (
              <div className="mt-2 space-y-2">
                {warningViolations.map((violation, index) => (
                  <ViolationCard key={index} violation={violation} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance Status */}
        {isFullyCompliant && !hasBlockingIssues && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-800 font-medium">All link requirements met!</p>
            </div>
          </div>
        )}

        {/* Link Rules Reference */}
        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">Link Compliance Rules</span>
          </div>
          <ul className="text-[10px] text-gray-600 space-y-0.5 ml-4">
            <li>• No .edu links (use internal pages instead)</li>
            <li>• No competitor or blocked domains</li>
            <li>• External links: Government, BLS, nonprofit only</li>
            <li>• Minimum {minInternalLinks} internal links</li>
            <li>• Minimum {minExternalLinks} external citations</li>
          </ul>
        </div>

        {/* Total Links Summary */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-600">Total Links Found</span>
          <button
            onClick={() => setShowLinkDetails(!showLinkDetails)}
            className="text-xs text-forge-orange hover:text-forge-orange-dark font-medium flex items-center gap-1"
          >
            {totalLinks} links
            {showLinkDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Violation Card Component
 */
function ViolationCard({ violation }: { violation: LinkViolation }) {
  const { severity, domain, url, anchorText, message, suggestion } = violation;

  return (
    <div
      className={`p-2 rounded text-xs ${
        severity === 'error'
          ? 'bg-red-100 border border-red-200'
          : 'bg-yellow-100 border border-yellow-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium truncate ${
              severity === 'error' ? 'text-red-800' : 'text-yellow-800'
            }`}
          >
            {anchorText || 'No anchor text'}
          </p>
          <p
            className={`truncate mt-1 ${severity === 'error' ? 'text-red-600' : 'text-yellow-600'}`}
          >
            {url}
          </p>
          <p
            className={`mt-1 ${severity === 'error' ? 'text-red-700' : 'text-yellow-700'}`}
          >
            {message}
          </p>
          {suggestion && (
            <p
              className={`text-[10px] mt-1 italic ${
                severity === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}
            >
              Suggestion: {suggestion}
            </p>
          )}
        </div>
        <button
          className={`p-1 rounded hover:bg-opacity-50 ${
            severity === 'error'
              ? 'text-red-600 hover:bg-red-200'
              : 'text-yellow-600 hover:bg-yellow-200'
          }`}
          title="Remove this link"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
