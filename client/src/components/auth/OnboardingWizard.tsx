import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Clock,
  ArrowRight,
  Check,
  Award,
  Code,
  Terminal,
  BrainCircuit,
  Eye,
  FileText,
  PlayCircle,
  Puzzle,
  Calendar,
  AlertCircle,
  RefreshCw,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { fireCelebrationConfetti } from '../../lib/confetti';
import type { ExperienceLevel, PaceMode, LearningStyle } from '../../types';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80'
];

const POPULAR_GOALS = [
  { id: 'C++', label: 'C++', desc: 'Memory safety, pointers, RAII, STL & concurrency', icon: <Terminal className="w-4 h-4 text-cyan-400" /> },
  { id: 'DSA', label: 'Data Structures & Algorithms', desc: 'Big-O, trees, graphs, dynamic programming & interviews', icon: <BrainCircuit className="w-4 h-4 text-violet-400" /> },
  { id: 'Web Development', label: 'Web Development', desc: 'React, TypeScript, Express, PostgreSQL & full-stack apps', icon: <Code className="w-4 h-4 text-indigo-400" /> },
  { id: 'Python', label: 'Python', desc: 'Modern syntax, OOP, scripting, packages & automation', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
  { id: 'AI/ML', label: 'AI & Machine Learning', desc: 'Neural nets, PyTorch, LLMs, prompting & RAG systems', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  { id: 'Data Analytics', label: 'Data Analytics', desc: 'Pandas, SQL queries, Tableau, statistics & visualization', icon: <Award className="w-4 h-4 text-rose-400" /> }
];

const LEARNING_STYLES: Array<{ id: LearningStyle; title: string; desc: string; icon: React.ReactNode }> = [
  { id: 'hands_on', title: 'Hands-on Projects & Coding', desc: 'Learn by writing code, breaking things, and building tangible apps', icon: <Code className="w-5 h-5 text-indigo-400" /> },
  { id: 'problem_solving', title: 'Problem Solving & Challenges', desc: 'Gamified puzzle drills, LeetCode style problems, and edge cases', icon: <Puzzle className="w-5 h-5 text-violet-400" /> },
  { id: 'visual', title: 'Visual & Interactive Diagrams', desc: 'Memory maps, architecture diagrams, and visual flowcharts', icon: <Eye className="w-5 h-5 text-cyan-400" /> },
  { id: 'reading', title: 'Deep Documentation & RFCs', desc: 'Clean written explanations, specifications, and reference guides', icon: <FileText className="w-5 h-5 text-emerald-400" /> },
  { id: 'video', title: 'Guided Video Walkthroughs', desc: 'Curated video breakdowns and concept demonstrations', icon: <PlayCircle className="w-5 h-5 text-amber-400" /> }
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { user, completeOnboarding } = useAuth();

  // Multi-step state: 1 = Profile, 2 = Skill Goal, 3 = Experience & Knowledge, 4 = Schedule & Style, 5 = AI Generation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [name, setName] = useState(user?.fullName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedGoal, setSelectedGoal] = useState('Web Development');
  const [customGoal, setCustomGoal] = useState('');
  const [targetGoalText, setTargetGoalText] = useState('Build portfolio-ready projects and crack software engineering interviews');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [existingKnowledgeInput, setExistingKnowledgeInput] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(1.5);
  const [targetWeeks, setTargetWeeks] = useState(6);
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('hands_on');

  // Generation status
  const [generationStepText, setGenerationStepText] = useState('Connecting to SkillPilot AI Engine...');
  const [generationError, setGenerationError] = useState<string | null>(null);

  const activeSkill = selectedGoal === 'custom' ? customGoal : selectedGoal;

  const handleStartGeneration = async () => {
    setStep(5);
    setGenerationError(null);

    const stages = [
      'Analyzing skill prerequisites and curriculum requirements...',
      'Mapping bite-sized 30-minute daily missions...',
      'Synthesizing practical coding challenges and verified resources...',
      'Assembling milestones and production capstone project...'
    ];

    let stageIdx = 0;
    const interval = setInterval(() => {
      if (stageIdx < stages.length) {
        setGenerationStepText(stages[stageIdx]);
        stageIdx++;
      }
    }, 900);

    try {
      const existingList = existingKnowledgeInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      await api.generateRoadmap({
        skill: activeSkill.trim() || 'Software Development',
        targetGoal: targetGoalText.trim() || `Master ${activeSkill.trim()}`,
        experienceLevel,
        hoursPerDay,
        targetWeeks,
        paceMode: 'balanced' as PaceMode,
        learningStyle,
        existingKnowledge: existingList,
        avatarUrl: selectedAvatar,
      });

      clearInterval(interval);
      setGenerationStepText('Roadmap ready! Loading your personal dashboard...');

      // Mark onboarding as complete in context & localStorage
      await completeOnboarding({
        role: 'student',
        primarySkill: activeSkill,
        hoursPerDay,
        fullName: name.trim(),
        avatarUrl: selectedAvatar,
      });

      fireCelebrationConfetti();
      setTimeout(() => {
        onComplete();
      }, 700);
    } catch (err: any) {
      clearInterval(interval);
      setGenerationError(err.message || 'Failed to generate roadmap. Please retry.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="w-full max-w-2xl glass-card bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl animate-slide-up relative overflow-hidden">
        {/* Glow Ambient Lights */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Stepper Progress Indicator */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Compass className="w-4 h-4" />
                Step {step} of 4
              </span>
              <span>
                {step === 1 && 'Profile & Identity'}
                {step === 2 && 'Learning Goal'}
                {step === 3 && 'Skill Level & Prior Knowledge'}
                {step === 4 && 'Pace & Learning Style'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= s ? 'bg-indigo-500 shadow-glow-sm' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Name & Avatar */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to SkillPilot AI
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Let's set up your student profile so we can personalize your learning companion.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Your Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Choose a Profile Avatar
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative rounded-2xl overflow-hidden p-0.5 border-2 transition-all ${
                        selectedAvatar === url
                          ? 'border-indigo-500 scale-105 shadow-glow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar option ${idx + 1}`} className="w-12 h-12 rounded-xl object-cover" />
                      {selectedAvatar === url && (
                        <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5 text-white">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button
                variant="accent"
                size="md"
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Choose Learning Goal
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Skill Goal */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                What skill do you want to master?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Select from popular in-demand skills or define a custom domain.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {POPULAR_GOALS.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => {
                    setSelectedGoal(goal.id);
                    setCustomGoal('');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    selectedGoal === goal.id
                      ? 'border-indigo-500 bg-indigo-500/15 shadow-glow-sm'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {goal.icon}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{goal.label}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{goal.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Or Enter a Custom Goal
              </label>
              <input
                type="text"
                placeholder="e.g. Rust Systems Programming, Flutter, Cybersecurity, DevOps..."
                value={customGoal}
                onChange={(e) => {
                  setCustomGoal(e.target.value);
                  setSelectedGoal('custom');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
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
                Set Experience Level
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Experience & Prior Knowledge */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Current Level & Prior Knowledge
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                SkillPilot AI avoids duplicate topics by skipping concepts you have already mastered.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Your Current Knowledge in {activeSkill}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'beginner', title: 'Beginner', desc: 'Starting from square one' },
                    { id: 'intermediate', title: 'Intermediate', desc: 'Know basics & syntax' },
                    { id: 'advanced', title: 'Advanced', desc: 'Polishing production skills' }
                  ].map((lvl) => (
                    <div
                      key={lvl.id}
                      onClick={() => setExperienceLevel(lvl.id as ExperienceLevel)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        experienceLevel === lvl.id
                          ? 'border-violet-500 bg-violet-500/15 shadow-glow-violet'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-white">{lvl.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{lvl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Topics You Already Completed (Optional — Comma-separated)
                </label>
                <textarea
                  value={existingKnowledgeInput}
                  onChange={(e) => setExistingKnowledgeInput(e.target.value)}
                  placeholder="e.g. Basic Variables, HTML/CSS, Git & GitHub, Loops..."
                  className="w-full h-20 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  We will fast-track your curriculum past these topics to save your valuable time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Specific Learning Goal / Role Target
                </label>
                <input
                  type="text"
                  value={targetGoalText}
                  onChange={(e) => setTargetGoalText(e.target.value)}
                  placeholder="e.g. Build 2 portfolio applications and crack junior interviews"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="accent"
                size="md"
                onClick={() => setStep(4)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Pace & Learning Style
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Schedule & Learning Style */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Pace & Preferred Learning Style
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Calibrate daily duration and choose how you absorb concepts best.
              </p>
            </div>

            <div className="space-y-4">
              {/* Daily Hours & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Daily Time Commitment
                  </label>
                  <select
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0.5}>30 Minutes / day (Bite-sized)</option>
                    <option value={1}>1.0 Hour / day (Gentle)</option>
                    <option value={1.5}>1.5 Hours / day (Recommended)</option>
                    <option value={2}>2.0 Hours / day (Focused)</option>
                    <option value={3}>3.0+ Hours / day (Intensive)</option>
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    <option value={2}>2 Weeks (Crash Sprint)</option>
                    <option value={4}>4 Weeks (Accelerated)</option>
                    <option value={6}>6 Weeks (Standard)</option>
                    <option value={8}>8 Weeks (Deep Dive)</option>
                    <option value={12}>12 Weeks (Comprehensive)</option>
                  </select>
                </div>
              </div>

              {/* Learning Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Preferred Learning Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LEARNING_STYLES.map((style) => (
                    <div
                      key={style.id}
                      onClick={() => setLearningStyle(style.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        learningStyle === style.id
                          ? 'border-indigo-500 bg-indigo-500/15 shadow-glow-sm'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                        {style.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{style.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{style.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="accent"
                size="md"
                onClick={handleStartGeneration}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate My Personalized Roadmap
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: AI Generation Progress & Fallback Handling */}
        {step === 5 && (
          <div className="py-10 text-center space-y-6 animate-fade-in">
            {generationError ? (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Generation Issue</h3>
                <p className="text-xs text-rose-300/90 leading-relaxed">{generationError}</p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep(4)}>
                    Adjust Inputs
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleStartGeneration} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                    Retry Generation
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1px] shadow-glow-md">
                  <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-indigo-400">
                    <BrainCircuit className="w-8 h-8 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white">Synthesizing Your Skill Roadmap</h3>
                <p className="text-xs text-indigo-300 font-mono tracking-wide animate-pulse">
                  {generationStepText}
                </p>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Target: {activeSkill} ({targetWeeks} weeks @ {hoursPerDay}h/day)
                  </div>
                  <div>• Learning Style: <span className="text-indigo-300 capitalize">{learningStyle.replace('_', ' ')}</span></div>
                  <div>• Anti-Overwhelm Check: Micro-tasks calibrated to 30 mins each</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
