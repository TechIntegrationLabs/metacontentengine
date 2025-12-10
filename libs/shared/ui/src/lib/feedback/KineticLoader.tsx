import React from 'react';
import { motion } from 'framer-motion';

interface KineticLoaderProps {
  progress: number;
  color?: string;
  showPercentage?: boolean;
  isStruggling?: boolean;
  className?: string;
}

export function KineticLoader({ 
  progress, 
  color = '#6366f1', 
  showPercentage = false,
  isStruggling = false,
  className = '' 
}: KineticLoaderProps) {
  const glowSize = Math.max(5, progress * 0.2);
  
  return (
    <div className={['w-full', className].join(' ')}>
      <div className="relative h-1.5 bg-void-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, ' + color + ', ' + color + 'cc)',
            boxShadow: '0 0 ' + glowSize + 'px ' + color,
          }}
          animate={{ 
            width: progress + '%',
            x: isStruggling ? [0, 2, -2, 2, 0] : 0,
          }}
          transition={{
            width: { duration: 0.3, ease: 'easeOut' },
            x: isStruggling ? { repeat: Infinity, duration: 0.1 } : undefined,
          }}
        />
      </div>
      
      {showPercentage && (
        <div className="mt-2 text-right">
          <span className="text-xs font-mono text-slate-500">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

export default KineticLoader;
