import React from 'react';

export interface ProgressProps {
  value: number; // 0 - 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'indigo' | 'emerald' | 'violet';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'indigo',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const gradientStyles = {
    indigo: 'bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    violet: 'bg-gradient-to-r from-violet-600 to-fuchsia-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
          {label && <span>{label}</span>}
          {showPercentage && <span className="text-slate-300 font-semibold">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 ${heightStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${gradientStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
