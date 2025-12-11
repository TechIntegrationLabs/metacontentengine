import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ValidationResult } from '@content-engine/types';

interface ValidationSummaryBadgeProps {
  result: ValidationResult;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export default function ValidationSummaryBadge({
  result,
  size = 'md',
  showDetails = false,
  className = '',
}: ValidationSummaryBadgeProps) {
  const totalChecks = result.checks.length;
  const passPercentage = Math.round((result.passCount / totalChecks) * 100);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs';
      case 'md':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3.5 h-3.5';
      case 'md':
        return 'w-4 h-4';
      case 'lg':
        return 'w-5 h-5';
    }
  };

  const getStatusConfig = () => {
    if (!result.canPublish) {
      return {
        icon: ShieldAlert,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        label: 'Cannot Publish',
      };
    }

    if (result.warningCount > 0) {
      return {
        icon: AlertTriangle,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        label: 'Ready with Warnings',
      };
    }

    return {
      icon: ShieldCheck,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      label: 'Ready to Publish',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!showDetails) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-2 rounded-full border ${config.bg} ${config.border} ${getSizeClasses()} ${className}`}
      >
        <Icon className={`${getIconSize()} ${config.color}`} />
        <span className={`font-medium ${config.color}`}>{config.label}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${config.bg} ${config.border} p-4 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
          <p className="text-xs text-void-400 mt-0.5">
            {result.passCount} of {totalChecks} checks passed ({passPercentage}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2 bg-void-900/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400">Passed</span>
          </div>
          <p className="text-lg font-bold text-void-100">{result.passCount}</p>
        </div>

        <div className="p-2 bg-void-900/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-red-400">Failed</span>
          </div>
          <p className="text-lg font-bold text-void-100">{result.failCount}</p>
        </div>

        <div className="p-2 bg-void-900/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Warnings</span>
          </div>
          <p className="text-lg font-bold text-void-100">{result.warningCount}</p>
        </div>

        <div className="p-2 bg-void-900/30 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div className="w-3.5 h-3.5 rounded-full bg-void-600" />
            <span className="text-xs font-medium text-void-400">Skipped</span>
          </div>
          <p className="text-lg font-bold text-void-100">{result.skippedCount}</p>
        </div>
      </div>

      {result.blockers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-void-700/30">
          <p className="text-xs font-medium text-red-400 mb-2">
            {result.blockers.length} blocking issue(s) must be resolved
          </p>
          <ul className="space-y-1">
            {result.blockers.slice(0, 3).map((blocker) => (
              <li key={blocker.id} className="text-xs text-void-400 flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>{blocker.name}</span>
              </li>
            ))}
            {result.blockers.length > 3 && (
              <li className="text-xs text-void-500 italic">
                +{result.blockers.length - 3} more...
              </li>
            )}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
