import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TourStep {
  id: string;
  target: string; // CSS selector or element ID
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightElement?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface OnboardingTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  storageKey?: string; // LocalStorage key to track completion
  showProgress?: boolean;
  allowSkip?: boolean;
}

export function OnboardingTour({
  steps,
  isActive,
  onComplete,
  onSkip,
  storageKey = 'onboarding-tour-completed',
  showProgress = true,
  allowSkip = true,
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Check if tour has been completed
  useEffect(() => {
    if (storageKey) {
      const completed = localStorage.getItem(storageKey);
      if (completed === 'true' && isActive) {
        onComplete();
      }
    }
  }, [storageKey, isActive, onComplete]);

  // Update target element and tooltip position
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(currentStep.target);
      if (!targetElement || !tooltipRef.current) return;

      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);

      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const placement = currentStep.placement || 'bottom';

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top - tooltipRect.height - 16;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.left - tooltipRect.width - 16;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2;
          left = rect.right + 16;
          break;
        case 'center':
          top = window.innerHeight / 2 - tooltipRect.height / 2;
          left = window.innerWidth / 2 - tooltipRect.width / 2;
          break;
      }

      // Keep tooltip within viewport
      const padding = 16;
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

      setTooltipPosition({ top, left });

      // Scroll element into view
      if (placement !== 'center') {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    };

    // Initial position
    setTimeout(updatePosition, 100);

    // Update on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    onComplete();
  };

  const handleSkip = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    onSkip();
  };

  const handleStepClick = (index: number) => {
    setCurrentStepIndex(index);
  };

  if (!isActive || !currentStep) return null;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Highlight cutout */}
        {currentStep.highlightElement !== false && targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            <div className="w-full h-full rounded-lg border-2 border-forge-orange shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] animate-pulse" />
          </motion.div>
        )}

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.15 }}
          className="absolute w-full max-w-md"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <div className="bg-void-900/95 backdrop-blur-xl border border-glass-200 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-glass-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forge-orange to-forge-purple flex items-center justify-center text-white text-sm font-bold">
                    {currentStepIndex + 1}
                  </div>
                  <h3 className="text-lg font-bold text-white">{currentStep.title}</h3>
                </div>
                <p className="text-glass-300 text-sm leading-relaxed">{currentStep.content}</p>
              </div>
              {allowSkip && (
                <button
                  onClick={handleSkip}
                  className="ml-4 p-2 rounded-lg hover:bg-glass-200/50 transition-colors text-glass-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Button (optional) */}
            {currentStep.action && (
              <div className="px-6 py-4 bg-glass-200/20">
                <button
                  onClick={currentStep.action.onClick}
                  className="w-full py-2 px-4 bg-gradient-to-r from-forge-orange to-forge-purple text-white font-medium rounded-lg hover:shadow-lg hover:shadow-forge-orange/25 transition-all"
                >
                  {currentStep.action.label}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between p-4 bg-glass-200/10">
              {/* Progress Dots */}
              {showProgress && (
                <div className="flex items-center gap-1.5">
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentStepIndex
                          ? 'bg-forge-orange w-6'
                          : index < currentStepIndex
                          ? 'bg-forge-orange/50'
                          : 'bg-glass-400'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="p-2 rounded-lg hover:bg-glass-200/50 transition-colors text-glass-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-forge-orange to-forge-purple text-white font-medium hover:shadow-lg hover:shadow-forge-orange/25 transition-all"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Complete</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
