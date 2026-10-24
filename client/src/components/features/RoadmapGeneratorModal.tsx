import React, { useState } from 'react';
import { Sparkles, Clock, Calendar, BrainCircuit } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { GenerateRoadmapPayload, ExperienceLevel, PaceMode } from '../../types';

export interface RoadmapGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: GenerateRoadmapPayload) => Promise<void>;
  isLoading: boolean;
}

const POPULAR_SKILLS = [
  'Full-Stack React & Node.js',
  'AI / LLM Application Engineering',
  'Python Data Science & Analytics',
  'Rust Systems Programming',
  'Modern UI/UX & Design Systems',
  'Data Structures & Algorithms'
];

export const RoadmapGeneratorModal: React.FC<RoadmapGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [skill, setSkill] = useState('Full-Stack React & Node.js');
  const [customSkill, setCustomSkill] = useState('');
  const [targetGoal, setTargetGoal] = useState('Build production apps and land a software engineer role');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [hoursPerDay, setHoursPerDay] = useState<number>(1.5);
  const [targetWeeks, setTargetWeeks] = useState<number>(6);
  const [paceMode, setPaceMode] = useState<PaceMode>('balanced');

  const selectedSkill = skill === 'custom' ? customSkill : skill;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill.trim()) return;

    await onSubmit({
      skill: selectedSkill.trim(),
      targetGoal: targetGoal.trim() || `Master ${selectedSkill.trim()}`,
      experienceLevel,
      hoursPerDay,
      targetWeeks,
      paceMode,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Design Your Anti-Overwhelm Roadmap"
      description="Tell us your target skill and schedule. SkillPilot AI will curate a structured, bite-sized curriculum to keep you moving without burnout."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Skill Choice */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            What skill do you want to master?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {POPULAR_SKILLS.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => {
                  setSkill(item);
                  setCustomSkill('');
                }}
                className={`p-2.5 text-xs text-left rounded-xl border transition-all ${
                  skill === item
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 font-semibold shadow-glow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-2">
            <input
              type="text"
              placeholder="Or type a custom skill (e.g. Flutter, DevOps, Cybersecurity)..."
              value={customSkill}
              onChange={(e) => {
                setCustomSkill(e.target.value);
                setSkill('custom');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Target Goal */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Your Target Milestone / Goal
          </label>
          <input
            type="text"
            required
            value={targetGoal}
            onChange={(e) => setTargetGoal(e.target.value)}
            placeholder="e.g. Build 2 portfolio projects and crack junior dev interviews"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Current Knowledge Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['beginner', 'intermediate', 'advanced'] as ExperienceLevel[]).map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setExperienceLevel(level)}
                className={`py-2 px-3 text-xs capitalize font-medium rounded-xl border transition-all ${
                  experienceLevel === level
                    ? 'border-violet-500 bg-violet-500/15 text-violet-200 shadow-glow-violet'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule & Pace Constraints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Daily Study Time
            </label>
            <select
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={1}>1.0 hour / day (Gentle)</option>
              <option value={1.5}>1.5 hours / day (Recommended)</option>
              <option value={2}>2.0 hours / day (Focused)</option>
              <option value={3}>3.0 hours / day (Intensive)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              Target Timeline
            </label>
            <select
              value={targetWeeks}
              onChange={(e) => setTargetWeeks(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value={4}>4 Weeks (Crash Course)</option>
              <option value={6}>6 Weeks (Standard)</option>
              <option value={8}>8 Weeks (Deep Dive)</option>
              <option value={12}>12 Weeks (Comprehensive)</option>
            </select>
          </div>
        </div>

        {/* Pace Strategy */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Pace Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['relaxed', 'balanced', 'intensive'] as PaceMode[]).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setPaceMode(mode)}
                className={`py-2 px-3 text-xs capitalize font-medium rounded-xl border transition-all ${
                  paceMode === mode
                    ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200 shadow-glow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Summary preview */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
            <span>Anti-Overwhelm Guarantee:</span>
          </div>
          <span className="text-cyan-300 font-medium">
            ~{Math.round(hoursPerDay * 7 * targetWeeks)} total hours • Bite-sized 30m tasks
          </span>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            size="md"
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generate AI Roadmap
          </Button>
        </div>
      </form>
    </Modal>
  );
};
