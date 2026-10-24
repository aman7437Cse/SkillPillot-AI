import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  action,
  className = '',
}) => {
  const configs = {
    info: {
      border: 'border-blue-500/30 bg-blue-950/20 text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
    },
    success: {
      border: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    },
    warning: {
      border: 'border-amber-500/30 bg-amber-950/20 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    error: {
      border: 'border-rose-500/30 bg-rose-950/20 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
  };

  const config = configs[type];

  return (
    <div className={`p-4 rounded-xl border ${config.border} flex items-start gap-3 text-sm ${className}`}>
      {config.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-slate-100 mb-0.5">{title}</h5>}
        <div className="text-slate-300 leading-relaxed text-xs sm:text-sm">{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
