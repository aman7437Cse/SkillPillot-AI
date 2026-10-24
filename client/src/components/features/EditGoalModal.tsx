import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Roadmap, GenerateRoadmapPayload, ExperienceLevel, LearningStyle } from '../../types';

export interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: Roadmap;
  onRegenerate: (payload: GenerateRoadmapPayload) => Promise<void>;
  isLoading: boolean;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  roadmap,
  onRegenerate,
  isLoading,
}) => {
  const [skill, setSkill] = useState(roadmap.skillCategory);
  const [targetGoal, setTargetGoal] = useState(roadmap.targetGoal);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(roadmap.experienceLevel);
  const [hoursPerDay, setHoursPerDay] = useState(roadmap.hoursPerDay);
  const [targetWeeks, setTargetWeeks] = useState(roadmap.targetWeeks);
  const [learningStyle, setLearningStyle] = useState<LearningStyle>(roadmap.learningStyle || 'hands_on');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegenerate({
      skill: skill.trim(),
      targetGoal: targetGoal.trim(),
      experienceLevel,
      hoursPerDay,
      targetWeeks,
      learningStyle,
      paceMode: roadmap.paceMode,
      existingKnowledge: roadmap.existingKnowledge,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Goal & Regenerate Roadmap"
      description="Update your target skill, deadline, or learning style. SkillPilot AI will re-synthesize your curriculum."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Warning Alert */}
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            Regenerating will replace existing task steps with a new structured curriculum. Your total XP ({roadmap.totalXp} XP) and daily streak ({roadmap.streakDays} days) will be preserved!
          </div>
        </div>

        {/* Skill Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Skill / Technology
          </label>
          <input
            type="text"
            required
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Target Goal */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Target Goal / Milestone
          </label>
          <input
            type="text"
            required
            value={targetGoal}
            onChange={(e) => setTargetGoal(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Level & Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Learning Style
            </label>
            <select
              value={learningStyle}
              onChange={(e) => setLearningStyle(e.target.value as LearningStyle)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 capitalize"
            >
              <option value="hands_on">Hands-on Projects</option>
              <option value="problem_solving">Problem Solving</option>
              <option value="visual">Visual Diagrams</option>
              <option value="reading">Documentation / RFCs</option>
              <option value="video">Video Walkthroughs</option>
            </select>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Daily Study Hours
            </label>
            <select
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={0.5}>0.5 hrs / day (30 mins)</option>
              <option value={1}>1.0 hr / day</option>
              <option value={1.5}>1.5 hrs / day</option>
              <option value={2}>2.0 hrs / day</option>
              <option value={3}>3.0 hrs / day</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              Target Duration
            </label>
            <select
              value={targetWeeks}
              onChange={(e) => setTargetWeeks(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            >
              <option value={2}>2 Weeks</option>
              <option value={4}>4 Weeks</option>
              <option value={6}>6 Weeks</option>
              <option value={8}>8 Weeks</option>
              <option value={12}>12 Weeks</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            size="md"
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Confirm & Regenerate
          </Button>
        </div>
      </form>
    </Modal>
  );
};
