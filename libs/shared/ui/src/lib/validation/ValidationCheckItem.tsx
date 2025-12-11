import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ValidationCheck } from '@content-engine/types';
import { Button } from '../primitives/Button';

interface ValidationCheckItemProps {
  check: ValidationCheck;
  onAutoFix?: (checkId: string) => void;
  isFixing?: boolean;
  className?: string;
}

export default function ValidationCheckItem({
  check,
  onAutoFix,
  isFixing = false,
  className = '',
}: ValidationCheckItemProps) {
  const getStatusIcon = () => {
    switch (check.status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'skipped':
        return <MinusCircle className="w-5 h-5 text-void-500" />;
    }
  };

  const getStatusColor = () => {
    switch (check.status) {
      case 'pass':
        return 'border-green-500/20 bg-green-500/5';
      case 'fail':
        return 'border-red-500/20 bg-red-500/5';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/5';
      case 'skipped':
        return 'border-void-700/20 bg-void-900/20';
    }
  };

  const getStatusText = () => {
    switch (check.status) {
      case 'pass':
        return 'text-green-400';
      case 'fail':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'skipped':
        return 'text-void-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 transition-all ${getStatusColor()} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-void-100 mb-1">
                {check.name}
                {check.isBlocking && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    Blocking
                  </span>
                )}
              </h4>
              <p className="text-xs text-void-400 mb-2">{check.description}</p>

              {check.message && (
                <p className={`text-sm font-medium ${getStatusText()}`}>
                  {check.message}
                </p>
              )}
            </div>

            {check.autoFixAvailable && check.status !== 'pass' && onAutoFix && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAutoFix(check.id)}
                isLoading={isFixing}
                leftIcon={<Zap className="w-3.5 h-3.5" />}
              >
                Auto-Fix
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
