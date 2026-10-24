import React, { useState } from 'react';
import { Compass, Sparkles, Clock, ArrowRight, Check, Award, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { fireCelebrationConfetti } from '../../lib/confetti';
import type { ExperienceLevel, PaceMode } from '../../types';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const ROLES = [
  { id: 'student', title: 'College / High School Student', desc: 'Preparing for exams, campus placements, and practical projects' },
  { id: 'switcher', title: 'Career Switcher', desc: 'Transitioning into software engineering or high-growth tech' },
  { id: 'developer', title: 'Upskilling Developer', desc: 'Mastering modern AI, systems programming, or architecture' },
  { id: 'hobbyist', title: 'Self-Taught Builder', desc: 'Learning to build real-world apps and launch products' },
];

const SKILL_SUGGESTIONS = [
  'Full-Stack React & Node.js',
  'AI / LLM Application Engineering',
  'Python Data Science & Machine Learning',
  'Rust Systems Programming',
  'Data Structures & Algorithms',
  'Modern UI/UX & Design Systems'
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { user, completeOnboarding } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState('student');
  const [selectedSkill, setSelectedSkill] = useState('Full-Stack React & Node.js');
  const [customSkill, setCustomSkill] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(1.5);
  const [targetWeeks] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeSkill = selectedSkill === 'custom' ? customSkill : selectedSkill;

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Generate their first starter roadmap
      await api.generateRoadmap({
        skill: activeSkill.trim() || 'Software Development',
        targetGoal: `Master ${activeSkill.trim()} as a ${selectedRole}`,
        experienceLevel: 'intermediate' as ExperienceLevel,
        hoursPerDay,
        targetWeeks,
        paceMode: 'balanced' as PaceMode,
      });

      // 2. Mark onboarding as complete in AuthContext & localStorage
      await completeOnboarding({
        role: selectedRole,
        primarySkill: activeSkill,
        hoursPerDay,
      });

      fireCelebrationConfetti();
      onComplete();
    } catch (err) {
      console.error('Failed to initialize onboarding roadmap:', err);
      // Still mark complete so user is not trapped
      await completeOnboarding({
        role: selectedRole,
        primarySkill: activeSkill,
        hoursPerDay,
      });
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl glass-card bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl animate-slide-up relative overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Welcome, {user?.fullName || 'Student'}!</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Let's Personalize Your Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            SkillPilot AI tailors daily bite-sized micro-tasks to match your exact schedule and goals.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-indigo-500' : step > s ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Persona */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              Which description best matches your current stage?
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {ROLES.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedRole === r.id
                      ? 'border-indigo-500 bg-indigo-500/15 shadow-glow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{r.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ml-3 ${
                      selectedRole === r.id
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {selectedRole === r.id && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="accent"
                size="md"
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Skill Selection
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Skill Choice */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-400" />
              What core skill would you like to master first?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SKILL_SUGGESTIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
                    setSelectedSkill(item);
                    setCustomSkill('');
                  }}
                  className={`p-3 text-xs text-left rounded-xl border transition-all ${
                    selectedSkill === item
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-100 font-semibold shadow-glow-sm'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Or type any custom topic (e.g. Next.js 15, Go, Cyber Security)..."
                value={customSkill}
                onChange={(e) => {
                  setCustomSkill(e.target.value);
                  setSelectedSkill('custom');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="accent"
                size="md"
                onClick={() => setStep(3)}
                disabled={!activeSkill.trim()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Set Daily Pace
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Time & Anti-Overwhelm Pledge */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              How much time can you realistically commit each day?
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { hrs: 1, title: '1.0 Hr / Day', desc: 'Gentle' },
                { hrs: 1.5, title: '1.5 Hrs / Day', desc: 'Optimal' },
                { hrs: 2.5, title: '2.5 Hrs / Day', desc: 'Intensive' },
              ].map((opt) => (
                <div
                  key={opt.hrs}
                  onClick={() => setHoursPerDay(opt.hrs)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    hoursPerDay === opt.hrs
                      ? 'border-indigo-500 bg-indigo-500/15 shadow-glow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-bold text-white">{opt.title}</div>
                  <div className="text-[10px] text-indigo-300 mt-0.5">{opt.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                The SkillPilot Anti-Overwhelm Guarantee:
              </div>
              <p>
                No infinite playlists or endless walls of video. Each day is a single, laser-focused mission taking only 30 minutes. If you miss days, Smart Pace Recovery recalculates your timeline with zero guilt.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="accent"
                size="md"
                isLoading={isSubmitting}
                onClick={handleFinish}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Launch My Learning Roadmap
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
