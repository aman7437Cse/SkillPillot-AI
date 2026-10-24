import React from 'react';
import { Compass, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Learning Roadmap Found',
  description = 'You have not created a skill roadmap yet. Let our AI design a personalized, bite-sized curriculum tailored to your schedule.',
  actionText = 'Generate Your First Roadmap',
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-glow-sm">
        {icon || <Compass className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {onAction && (
        <Button
          variant="accent"
          size="md"
          onClick={onAction}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};
