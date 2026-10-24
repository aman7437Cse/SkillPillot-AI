import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { fireCelebrationConfetti } from '../../lib/confetti';
import { api } from '../../lib/api';
import type {
  QuizDifficulty,
  QuizQuestionType,
  SanitizedQuizQuestion,
  QuizAttempt,
  Roadmap
} from '../../types';

export interface AdaptiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap?: Roadmap | null;
  initialTopic?: string;
  onOpenDoubtSolver?: (questionText: string, topic: string) => void;
  onQuizCompleted?: (attempt: QuizAttempt) => void;
}

export const AdaptiveQuizModal: React.FC<AdaptiveQuizModalProps> = ({
  isOpen,
  onClose,
  roadmap,
  initialTopic = '',
  onOpenDoubtSolver,
  onQuizCompleted,
}) => {
  // Step in quiz lifecycle: 'configure' | 'taking' | 'results'
  const [step, setStep] = useState<'configure' | 'taking' | 'results'>('configure');

  // Configuration options
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<QuizQuestionType[]>([
    'multiple_choice',
    'true_false',
    'short_answer',
  ]);

  // Quiz execution state
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<SanitizedQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [shortAnswerInput, setShortAnswerInput] = useState<string>('');

  // Results state
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);

  // Loading & error states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter for incorrect answers on result screen
  const [showOnlyIncorrect, setShowOnlyIncorrect] = useState<boolean>(false);

  // Available topics from roadmap
  const roadmapTopics = roadmap?.phases.flatMap((p) => p.tasks.map((t) => t.title)) || [];

  useEffect(() => {
    if (isOpen) {
      if (initialTopic) {
        setSelectedTopic(initialTopic);
        // Start directly with generation if topic was explicitly launched from skill gap
        handleGenerateQuiz(initialTopic);
      } else {
        setStep('configure');
        setSelectedTopic(roadmapTopics[0] || 'Software Engineering');
        setError(null);
      }
    } else {
      resetModal();
    }
  }, [isOpen, initialTopic]);

  const resetModal = () => {
    setStep('configure');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setShortAnswerInput('');
    setAttemptResult(null);
    setError(null);
    setIsGenerating(false);
    setIsSubmitting(false);
    setShowOnlyIncorrect(false);
  };

  const handleToggleType = (type: QuizQuestionType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleGenerateQuiz = async (topicOverride?: string) => {
    const finalTopic = (topicOverride || (selectedTopic === 'custom' ? customTopic : selectedTopic) || 'Programming Foundations').trim();
    if (!finalTopic) {
      setError('Please choose or enter a valid topic for the quiz.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.generateAdaptiveQuiz({
        topic: finalTopic,
        roadmapId: roadmap?.id,
        skillCategory: roadmap?.skillCategory,
        difficulty,
        questionCount,
        questionTypes: selectedTypes,
      });

      setSessionId(response.sessionId);
      setQuestions(response.questions);
      setCurrentIndex(0);
      setAnswers({});
      setShortAnswerInput('');
      setStep('taking');
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleShortAnswerChange = (val: string) => {
    if (!currentQ) return;
    setShortAnswerInput(val);
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: val,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQ = questions[nextIdx];
      if (nextQ && nextQ.type === 'short_answer') {
        setShortAnswerInput((answers[nextQ.id] as string) || '');
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevQ = questions[prevIdx];
      if (prevQ && prevQ.type === 'short_answer') {
        setShortAnswerInput((answers[prevQ.id] as string) || '');
      }
    }
  };

  const handleSubmitQuiz = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await api.submitQuizAnswers(sessionId, { answers });
      setAttemptResult(result);
      setStep('results');

      if (result.scorePercentage >= 75) {
        fireCelebrationConfetti();
      }

      onQuizCompleted?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'configure'
          ? 'Adaptive Topic Quiz Generator'
          : step === 'taking'
          ? `Quiz: ${currentQ?.topic || selectedTopic}`
          : `Quiz Results: ${attemptResult?.topic || selectedTopic}`
      }
      description={
        step === 'configure'
          ? 'Customize difficulty, format, and depth to test practical understanding.'
          : step === 'taking'
          ? 'Answer step-by-step. Progress is tracked and evaluated server-side.'
          : 'Detailed concept analysis, score breakdown, and targeted revision.'
      }
      maxWidth={step === 'results' ? '2xl' : 'xl'}
    >
      <div className="space-y-5 pt-1">
        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* STEP 1: CONFIGURE */}
        {step === 'configure' && (
          <div className="space-y-5 animate-fade-in">
            {/* Topic Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Curriculum Topic:
              </label>
              <div className="space-y-2">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {roadmapTopics.map((topic, idx) => (
                    <option key={idx} value={topic}>
                      {topic}
                    </option>
                  ))}
                  <option value="custom">✏️ Custom Topic...</option>
                </select>

                {selectedTopic === 'custom' && (
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter custom topic (e.g. Redux Toolkit, Dijkstra's Algorithm, SQL Joins)..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Difficulty:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['beginner', 'intermediate', 'advanced', 'adaptive'] as QuizDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border capitalize transition-all ${
                      difficulty === diff
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 shadow-glow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Number of Questions:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 3, label: '3 Questions', desc: 'Fast Check (~3 mins)' },
                  { count: 5, label: '5 Questions', desc: 'Standard Drill (~6 mins)' },
                  { count: 10, label: '10 Questions', desc: 'Mastery Sprint (~12 mins)' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setQuestionCount(item.count)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      questionCount === item.count
                        ? 'border-indigo-500 bg-indigo-500/20 shadow-glow-sm'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Types Multi-Select */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Question Formats:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { type: 'multiple_choice' as QuizQuestionType, label: 'Multiple Choice (4 options)' },
                  { type: 'true_false' as QuizQuestionType, label: 'True / False' },
                  { type: 'short_answer' as QuizQuestionType, label: 'Short Answer' },
                ].map((item) => {
                  const isChecked = selectedTypes.includes(item.type);
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleToggleType(item.type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                        isChecked ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-slate-700'
                      }`}>
                        {isChecked ? '✓' : ''}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <Button variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="accent"
                size="md"
                onClick={() => handleGenerateQuiz()}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate Adaptive Quiz
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: TAKING THE QUIZ */}
        {step === 'taking' && currentQ && (
          <div className="space-y-5 animate-fade-in">
            {/* Progress Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-slate-400">
                  {Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete
                </span>
              </div>
              <Progress value={((currentIndex + 1) / questions.length) * 100} size="sm" variant="indigo" />
            </div>

            {/* Question Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="indigo" size="sm">
                  {currentQ.type.replace('_', ' ').toUpperCase()}
                </Badge>
                <span className="text-[11px] text-slate-400 font-medium">{currentQ.topic}</span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                {currentQ.question}
              </h4>

              {/* Format 1: Multiple Choice */}
              {currentQ.type === 'multiple_choice' && currentQ.options && (
                <div className="space-y-2 pt-1">
                  {currentQ.options.map((option, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full p-3 sm:p-3.5 text-xs sm:text-sm text-left rounded-xl border transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-100 font-medium shadow-glow-sm'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 border ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-600 text-white'
                              : 'border-slate-700 bg-slate-950 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Format 2: True / False */}
              {currentQ.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {['True', 'False'].map((label, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-100 font-bold shadow-glow-sm'
                            : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-base">{optIdx === 0 ? '✓' : '✗'}</span>
                        <span className="text-sm font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Format 3: Short Answer */}
              {currentQ.type === 'short_answer' && (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={shortAnswerInput}
                    onChange={(e) => handleShortAnswerChange(e.target.value)}
                    placeholder="Type your answer here (e.g. O(n), useState, Encapsulation)..."
                    className="w-full p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    💡 Provide the specific term, notation, or phrase. Minor casing is normalized automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                size="md"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="accent"
                  size="md"
                  onClick={handleSubmitQuiz}
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Submit & Score Quiz
                </Button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: RESULTS & ANALYTICS */}
        {step === 'results' && attemptResult && (
          <div className="space-y-5 animate-fade-in">
            {/* Score Showcase Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-indigo-950/60 via-slate-950 to-slate-900 border border-indigo-500/20 text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-glow-sm">
                <Award className="w-8 h-8" />
              </div>

              <h4 className="text-3xl font-black text-white">
                {attemptResult.scorePercentage}%
              </h4>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                {attemptResult.scorePercentage >= 80
                  ? '🎉 Outstanding mastery! This topic is solidified on your roadmap.'
                  : attemptResult.scorePercentage >= 50
                  ? 'Great progress! Review the explanations below to resolve remaining bottlenecks.'
                  : 'Needs targeted revision. Use the AI Doubt Solver to build intuition on missed questions.'}
              </p>

              {/* Badges Strip */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <Badge variant={attemptResult.masteryStatus === 'mastered' ? 'emerald' : 'amber'} size="sm">
                  Status: {attemptResult.masteryStatus.toUpperCase().replace('_', ' ')}
                </Badge>
                {attemptResult.earnedXp > 0 && (
                  <Badge variant="indigo" size="sm">
                    ⚡ +{attemptResult.earnedXp} XP Awarded
                  </Badge>
                )}
                <Badge variant="slate" size="sm">
                  {attemptResult.correctCount} of {attemptResult.totalQuestions} Correct
                </Badge>
              </div>
            </div>

            {/* Targeted Revision Filter Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Question Breakdown & Explanations:
              </span>
              <button
                type="button"
                onClick={() => setShowOnlyIncorrect(!showOnlyIncorrect)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  showOnlyIncorrect
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {showOnlyIncorrect ? 'Showing Missed Questions Only' : 'Show All Questions'}
              </button>
            </div>

            {/* Questions Detailed Review List */}
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {attemptResult.questionResults
                .filter((r) => (!showOnlyIncorrect ? true : !r.isCorrect))
                .map((res, idx) => (
                  <div
                    key={res.questionId}
                    className={`p-4 rounded-xl border text-xs space-y-2.5 transition-all ${
                      res.isCorrect
                        ? 'border-emerald-500/20 bg-emerald-950/10'
                        : 'border-rose-500/20 bg-rose-950/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-200 text-sm">
                          {idx + 1}. {res.question}
                        </span>
                      </div>
                      {res.isCorrect ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correct</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-400 font-semibold shrink-0">
                          <XCircle className="w-4 h-4" />
                          <span>Incorrect</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 font-semibold">Your Answer: </span>
                        <span className={res.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                          {String(res.userAnswer)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Correct Answer: </span>
                        <span className="text-emerald-300 font-medium">
                          {String(res.correctAnswer)}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      <strong className="text-indigo-300">Explanation: </strong>
                      {res.explanation}
                    </p>

                    {/* Targeted Revision Action: Ask Doubt Solver about this question */}
                    {!res.isCorrect && onOpenDoubtSolver && (
                      <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onClose();
                            onOpenDoubtSolver(
                              `I missed this quiz question on "${attemptResult.topic}": "${res.question}". Why is "${res.correctAnswer}" correct instead of "${res.userAnswer}"?`,
                              attemptResult.topic
                            );
                          }}
                          leftIcon={<HelpCircle className="w-3.5 h-3.5 text-amber-400" />}
                          className="text-amber-300 hover:text-amber-200"
                        >
                          Revise with AI Doubt Solver
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setStep('configure');
                }}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retry or Adjust Quiz
              </Button>

              <Button variant="primary" size="md" onClick={onClose}>
                Close & Return
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
