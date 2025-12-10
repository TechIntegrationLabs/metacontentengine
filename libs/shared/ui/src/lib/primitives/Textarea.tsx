import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, showCharCount = false, maxLength, value, className = '', ...props }, ref) => {
    const charCount = typeof value === 'string' ? value.length : 0;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={[
              'w-full bg-void-950/50 border rounded-xl py-3 px-4 text-white placeholder-slate-600',
              'focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-void-950',
              'transition-all shadow-inner outline-none resize-none',
              error ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-700/50',
              className
            ].join(' ')}
            {...props}
          />
          {showCharCount && (
            <div className="absolute bottom-3 right-3">
              <span className="text-[10px] text-slate-600 font-mono">
                {charCount}{maxLength ? `/${maxLength}` : ''} chars
              </span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400 ml-1">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
