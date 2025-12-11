import { useState, useEffect } from 'react';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FeatureHighlightProps {
  featureId: string;
  title: string;
  description: string;
  badgeText?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  showIndicator?: boolean;
  indicatorPosition?: { top?: string; left?: string; right?: string; bottom?: string };
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  autoShow?: boolean;
  storageKey?: string;
  delayMs?: number;
}

export function FeatureHighlight({
  featureId,
  title,
  description,
  badgeText = "What's New",
  position = 'top-right',
  showIndicator = true,
  indicatorPosition,
  actionLabel,
  onAction,
  onDismiss,
  autoShow = true,
  storageKey,
  delayMs = 1000,
}: FeatureHighlightProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const effectiveStorageKey = storageKey || `feature-highlight-dismissed-${featureId}`;

  // Check if feature has been dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(effectiveStorageKey);

    if (!dismissed && autoShow) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [effectiveStorageKey, autoShow, delayMs]);

  const handleDismiss = () => {
    localStorage.setItem(effectiveStorageKey, 'true');
    setIsVisible(false);
    setIsExpanded(false);
    onDismiss?.();
  };

  const handleAction = () => {
    onAction?.();
    handleDismiss();
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-6 right-6';
    }
  };

  const getDefaultIndicatorPosition = () => {
    if (indicatorPosition) return indicatorPosition;

    switch (position) {
      case 'top-left':
        return { top: '-8px', left: '-8px' };
      case 'top-right':
        return { top: '-8px', right: '-8px' };
      case 'bottom-left':
        return { bottom: '-8px', left: '-8px' };
      case 'bottom-right':
        return { bottom: '-8px', right: '-8px' };
      default:
        return { top: '-8px', right: '-8px' };
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: position.includes('top') ? -20 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`fixed z-50 ${getPositionClasses()}`}
      >
        <div className="relative">
          {/* Pulsing indicator */}
          {showIndicator && !isExpanded && (
            <motion.div
              className="absolute w-4 h-4"
              style={getDefaultIndicatorPosition()}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="w-full h-full rounded-full bg-forge-orange shadow-lg shadow-forge-orange/50" />
            </motion.div>
          )}

          {/* Compact Badge */}
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.button
                key="badge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleToggleExpand}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-forge-orange to-forge-purple rounded-full shadow-lg shadow-forge-orange/25 hover:shadow-xl hover:shadow-forge-orange/40 transition-all group"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span className="text-white font-medium text-sm">{badgeText}</span>
                <ChevronRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              </motion.button>
            ) : (
              // Expanded Card
              <motion.div
                key="card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-80 bg-void-900/95 backdrop-blur-xl border border-glass-200 rounded-xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="relative p-4 bg-gradient-to-r from-forge-orange/20 to-forge-purple/20 border-b border-glass-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forge-orange to-forge-purple flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 bg-forge-orange/20 border border-forge-orange/30 rounded-full text-forge-orange text-xs font-semibold uppercase tracking-wide">
                            {badgeText}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{title}</h3>
                      </div>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="p-1.5 rounded-lg hover:bg-glass-200/50 transition-colors text-glass-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-glass-300 text-sm leading-relaxed mb-4">
                    {description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {actionLabel && onAction && (
                      <button
                        onClick={handleAction}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-forge-orange to-forge-purple text-white font-medium rounded-lg hover:shadow-lg hover:shadow-forge-orange/25 transition-all"
                      >
                        {actionLabel}
                      </button>
                    )}
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 text-glass-400 hover:text-white transition-colors text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                {/* Decorative gradient border */}
                <div className="absolute inset-0 rounded-xl border border-transparent bg-gradient-to-r from-forge-orange/20 to-forge-purple/20 pointer-events-none" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing multiple feature highlights
export function useFeatureHighlights() {
  const [activeFeatures, setActiveFeatures] = useState<string[]>([]);

  const showFeature = (featureId: string) => {
    setActiveFeatures((prev) => [...prev, featureId]);
  };

  const hideFeature = (featureId: string) => {
    setActiveFeatures((prev) => prev.filter((id) => id !== featureId));
  };

  const isFeatureActive = (featureId: string) => {
    return activeFeatures.includes(featureId);
  };

  const clearAllFeatures = () => {
    setActiveFeatures([]);
  };

  return {
    activeFeatures,
    showFeature,
    hideFeature,
    isFeatureActive,
    clearAllFeatures,
  };
}
