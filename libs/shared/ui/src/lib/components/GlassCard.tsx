import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'panel' | 'elevated';
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', hover = true, glow = false, glowColor = 'indigo', className = '', children, ...props }, ref) => {
    const variants = {
      default: 'glass-card',
      panel: 'glass-panel',
      elevated: 'glass-card shadow-xl shadow-black/20',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
        className={[
          variants[variant],
          'rounded-2xl relative overflow-hidden',
          glow ? `shadow-glow-sm hover:shadow-glow-md` : '',
          className
        ].join(' ')}
        {...props}
      >
        {glow && (
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%)`
            }}
          />
        )}
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
