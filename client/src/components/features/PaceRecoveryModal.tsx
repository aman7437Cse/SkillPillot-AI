import React, { useState } from 'react';
import { CalendarClock, ShieldCheck, Zap, Sliders, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface PaceRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapTitle: string;
  onConfirm: (strategy: 'redistribute' | 'sprint' | 'core_essentials') => Promise<void>;
  isLoading: boolean;
}

export const PaceRecoveryModal: React.FC<PaceRecoveryModalProps> = ({
  isOpen,
  onClose,
  roadmapTitle,
  onConfirm,
  isLoading,
}) => {
  const [strategy, setStrategy] = useState<'redistribute' | 'sprint' | 'core_essentials'>('redistribute');

  const strategies = [
    {
      id: 'redistribute' as const,
      title: 'Gentle Redistribution (Zero Guilt)',
      badge: 'Recommended',
      description: 'Shifts overdue tasks smoothly into upcoming days. Your daily time commitment remains light and manageable.',
      icon: <CalendarClock className="w-5 h-5 text-indigo-400" />,
      benefit: 'Best for avoiding cognitive burnout and staying consistent.',
    },
    {
      id: 'sprint' as const,
      title: 'Micro-Sprint Catch-Up',
      badge: 'High Energy',
      description: 'Pairs minor conceptual subtasks together for the next 3 days so you hit your original target date.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      benefit: '+20 minutes per day for 3 days, then normal pace returns.',
    },
    {
      id: 'core_essentials' as const,
      title: 'Core Essentials Only',
      badge: 'Time-Saver',
      description: 'Automatically flags elective deep dives as optional reading, focusing 100% of your energy on milestone essentials.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      benefit: 'Reduces backlog by 35% without losing foundational skills.',
    },
  ];

  const handleApply = async () => {
    await onConfirm(strategy);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Pace Recovery"
      description={`Life happens! Don't let missed days derail your motivation in "${roadmapTitle}". Choose how you'd like to recalibrate your schedule.`}
      maxWidth="lg"
    >
      <div className="space-y-3 pt-2">
        {strategies.map((item) => (
          <div
            key={item.id}
            onClick={() => setStrategy(item.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              strategy === item.id
                ? 'border-indigo-500 bg-indigo-500/10 shadow-glow-sm'
                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-indigo-300/90 mt-2 font-medium flex items-center gap-1">
                    <span>✨ {item.benefit}</span>
                  </p>
                </div>
              </div>
              <div className="shrink-0 mt-1">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    strategy === item.id
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {strategy === item.id && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            isLoading={isLoading}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Recalibrate Schedule
          </Button>
        </div>
      </div>
    </Modal>
  );
};
