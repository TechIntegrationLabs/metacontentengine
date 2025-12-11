import { useState, forwardRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface EditorPanelProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
  actions?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const EditorPanel = forwardRef<HTMLDivElement, EditorPanelProps>(
  ({ title, icon, children, defaultCollapsed = false, actions, isLoading = false, className = '' }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
      <div ref={ref} className={`glass-card rounded-xl overflow-hidden ${className}`}>
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors duration-200 border-b border-white/5"
        >
          <div className="flex items-center gap-2">
            {icon && <span className="text-forge-accent">{icon}</span>}
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-forge-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
          </div>
        </button>

        {/* Content */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EditorPanel.displayName = 'EditorPanel';
export default EditorPanel;
