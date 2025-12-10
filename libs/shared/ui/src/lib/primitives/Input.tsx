import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={[
              'w-full bg-void-950/50 border rounded-xl py-3 px-4 text-white placeholder-slate-600',
              'focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-void-950',
              'transition-all shadow-inner outline-none',
              leftIcon ? 'pl-12' : '',
              rightIcon ? 'pr-12' : '',
              error ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-700/50',
              className
            ].join(' ')}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
              {rightIcon}
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

Input.displayName = 'Input';
export default Input;
