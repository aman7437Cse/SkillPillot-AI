import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: 'indigo' | 'violet' | 'cyan' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  glow = 'none',
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const glowStyles = {
    indigo: 'shadow-glow-sm border-indigo-500/30',
    violet: 'shadow-glow-violet border-violet-500/30',
    cyan: 'shadow-glow-cyan border-cyan-500/30',
    none: '',
  };

  return (
    <div
      className={`glass-card rounded-2xl border border-slate-800/80 bg-slate-900/60 transition-all duration-300 ${
        hoverable ? 'glass-card-hover cursor-pointer' : ''
      } ${paddingStyles[padding]} ${glowStyles[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
