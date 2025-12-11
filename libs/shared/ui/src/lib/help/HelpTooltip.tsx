import { useState, useRef, useEffect } from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTrigger = 'hover' | 'click';

export interface HelpTooltipProps {
  content: string; // Supports markdown
  title?: string;
  learnMoreUrl?: string;
  learnMoreText?: string;
  position?: TooltipPosition;
  trigger?: TooltipTrigger;
  maxWidth?: number;
  children?: React.ReactNode;
  iconClassName?: string;
  showIcon?: boolean;
}

export function HelpTooltip({
  content,
  title,
  learnMoreUrl,
  learnMoreText = 'Learn more',
  position = 'top',
  trigger = 'hover',
  maxWidth = 320,
  children,
  iconClassName = '',
  showIcon = true,
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Adjust position if tooltip goes off screen
  useEffect(() => {
    if (isOpen && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPosition = position;

      // Check horizontal overflow
      if (position === 'right' && tooltipRect.right > viewportWidth) {
        newPosition = 'left';
      } else if (position === 'left' && tooltipRect.left < 0) {
        newPosition = 'right';
      }

      // Check vertical overflow
      if (position === 'top' && tooltipRect.top < 0) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltipRect.bottom > viewportHeight) {
        newPosition = 'top';
      }

      setAdjustedPosition(newPosition);
    }
  }, [isOpen, position]);

  // Close on click outside
  useEffect(() => {
    if (trigger !== 'click' || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, trigger]);

  const handleTriggerClick = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsOpen(false);
    }
  };

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50';
    switch (adjustedPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 ml-2`;
      default:
        return baseClasses;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-void-800 border-glass-200 rotate-45';
    switch (adjustedPosition) {
      case 'top':
        return `${baseClasses} bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r`;
      case 'bottom':
        return `${baseClasses} top-[-4px] left-1/2 -translate-x-1/2 border-t border-l`;
      case 'left':
        return `${baseClasses} right-[-4px] top-1/2 -translate-y-1/2 border-r border-t`;
      case 'right':
        return `${baseClasses} left-[-4px] top-1/2 -translate-y-1/2 border-l border-b`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center gap-1 ${
          trigger === 'click' ? 'cursor-pointer' : ''
        }`}
      >
        {children}
        {showIcon && (
          <HelpCircle
            className={`w-4 h-4 text-glass-400 hover:text-forge-orange transition-colors ${iconClassName}`}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={getPositionClasses()}
            style={{ maxWidth }}
          >
            {/* Arrow */}
            <div className={getArrowClasses()} />

            {/* Tooltip Content */}
            <div className="bg-void-800 border border-glass-200 rounded-lg shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden">
              {title && (
                <div className="px-4 py-3 border-b border-glass-200 bg-glass-200/30">
                  <h4 className="text-sm font-semibold text-white">{title}</h4>
                </div>
              )}

              <div className="px-4 py-3">
                <div className="prose prose-sm prose-invert prose-glass max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="text-glass-300 text-sm leading-relaxed mb-0">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-white font-semibold">{children}</strong>
                      ),
                      code: ({ children }) => (
                        <code className="px-1.5 py-0.5 bg-glass-200/50 rounded text-forge-orange text-xs font-mono">
                          {children}
                        </code>
                      ),
                      ul: ({ children }) => (
                        <ul className="text-glass-300 text-sm space-y-1 my-2 ml-4">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-glass-300">{children}</li>
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>

                {learnMoreUrl && (
                  <a
                    href={learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-sm text-forge-orange hover:text-forge-orange/80 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{learnMoreText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
