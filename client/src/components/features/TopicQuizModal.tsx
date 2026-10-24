import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Award, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { fireCelebrationConfetti } from '../../lib/confetti';
import type { QuizQuestion, SkillGap } from '../../types';

export interface TopicQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  gap: SkillGap | null;
  skillName: string;
  onScoreSubmitted: (updatedGap: SkillGap) => void;
}

export const TopicQuizModal: React.FC<TopicQuizModalProps> = ({
  isOpen,
  onClose,
  gap,
  skillName,
  onScoreSubmitted,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && gap) {
      loadQuiz();
    } else {
      resetQuiz();
    }
  }, [isOpen, gap]);

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setIsSubmitted(false);
    setScore(0);
    setError(null);
  };

  const loadQuiz = async () => {
    if (!gap) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTopicQuiz(gap.topicName, skillName);
      setQuestions(data);
      setSelectedAnswers(new Array(data.length).fill(-1));
    } catch (err: any) {
      setError(err.message || 'Failed to generate diagnostic quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    const updated = [...selectedAnswers];
    updated[currentIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (!gap) return;
    setIsSubmitted(true);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setScore(calculatedScore);

    if (calculatedScore >= 75) {
      fireCelebrationConfetti();
    }

    setIsSaving(true);
    try {
      const updated = await api.submitQuizScore(gap.roadmapId, gap.id, calculatedScore);
      onScoreSubmitted(updated);
    } catch (err) {
      console.error('Failed to persist quiz score', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!gap) return null;

  const currentQ = questions[currentIndex];
  const allAnswered = questions.length > 0 && selectedAnswers.every((ans) => ans !== -1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Skill Gap Diagnostic: ${gap.topicName}`}
      description="Quick 3-question conceptual check to solidify your understanding and clear this bottleneck."
      maxWidth="lg"
    >
      <div className="pt-2">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <p className="text-sm text-slate-300 font-medium">Generating diagnostic questions...</p>
            <p className="text-xs text-slate-500 mt-1">Analyzing common misconceptions in {gap.topicName}</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-rose-400 mb-3">{error}</p>
            <Button variant="secondary" size="sm" onClick={loadQuiz}>
              Retry Quiz Generation
            </Button>
          </div>
        ) : isSubmitted ? (
          /* Results Summary */
          <div className="py-4 space-y-5 animate-fade-in">
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Award className="w-7 h-7" />
              </div>
              <h4 className="text-2xl font-black text-white">Score: {score}%</h4>
              <p className="text-xs text-slate-400 mt-1">
                {score >= 75
                  ? '🎉 Topic Mastered! Your skill gap has been resolved.'
                  : 'Great effort! Review the explanations below to strengthen this concept.'}
              </p>
            </div>

            {/* Questions Review */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctOptionIndex;
                return (
                  <div key={q.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-slate-200">
                        {idx + 1}. {q.question}
                      </span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      <strong className="text-indigo-300">Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="md" onClick={onClose} isLoading={isSaving}>
                Close & Update Dashboard
              </Button>
            </div>
          </div>
        ) : currentQ ? (
          /* Question View */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-medium text-indigo-400">Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
            </div>

            <h4 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
              {currentQ.question}
            </h4>

            {/* Options */}
            <div className="space-y-2 pt-1">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-3 text-xs sm:text-sm text-left rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-100 font-medium shadow-glow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNext}
                  disabled={selectedAnswers[currentIndex] === -1}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleFinish}
                  disabled={!allAnswered}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Submit & Score
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
