import { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, CheckCircle2, BookOpen, Terminal, ExternalLink, Lightbulb } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { fireCelebrationConfetti } from '../../lib/confetti';
import type { Task } from '../../types';

export interface TaskFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onToggleComplete: (task: Task) => Promise<void>;
  isLoading: boolean;
}

export const TaskFocusModal: React.FC<TaskFocusModalProps> = ({
  isOpen,
  onClose,
  task,
  onToggleComplete,
  isLoading,
}) => {
  // Focus Pomodoro Timer (default 25 minutes)
  const initialSeconds = (task?.estimatedMinutes || 25) * 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseNotes, setExerciseNotes] = useState('');

  useEffect(() => {
    if (task) {
      setTimeLeft((task.estimatedMinutes || 25) * 60);
      setIsRunning(false);
      setExerciseNotes('');
    }
  }, [task]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      fireCelebrationConfetti();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  if (!task) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCompleteClick = async () => {
    if (!task.isCompleted) {
      fireCelebrationConfetti();
    }
    await onToggleComplete(task);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description={`Day ${task.dayNumber} • ${task.phaseTitle}`}
      maxWidth="xl"
    >
      <div className="space-y-5 pt-1">
        {/* Anti-Overwhelm Focus Timer Strip */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-slate-950 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 shadow-glow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                Anti-Overwhelm Focus Session
              </div>
              <div className="text-2xl font-mono font-bold text-white tracking-wider">
                {formattedTime}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRunning ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setIsRunning(!isRunning)}
              leftIcon={isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isRunning ? 'Pause' : 'Start Focus'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsRunning(false);
                setTimeLeft((task.estimatedMinutes || 25) * 60);
              }}
              aria-label="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Concept Summary */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            <Lightbulb className="w-3.5 h-3.5" />
            Bite-Sized Mental Model
          </h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {task.conceptSummary}
          </div>
        </div>

        {/* Practical Hands-on Exercise */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <Terminal className="w-3.5 h-3.5" />
            Today's Practical Mission
          </h4>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {task.practicalExercise}
          </div>
          <textarea
            value={exerciseNotes}
            onChange={(e) => setExerciseNotes(e.target.value)}
            placeholder="Jot down notes, code snippets, or key reflections from your practice..."
            className="w-full h-20 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Key Takeaways */}
        {task.keyTakeaways && task.keyTakeaways.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-300">
              Core Takeaways
            </h4>
            <ul className="space-y-1.5">
              {task.keyTakeaways.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Curated External Resources */}
        {task.resources && task.resources.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              Verified Resources
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 hover:text-indigo-300 hover:border-slate-700 transition-colors"
                >
                  <span>{res.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {task.isCompleted ? (
              <span className="text-emerald-400 font-medium">✓ Completed</span>
            ) : (
              <span>Estimated: ~{task.estimatedMinutes} mins</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Close
            </Button>
            <Button
              variant={task.isCompleted ? 'secondary' : 'accent'}
              size="md"
              onClick={handleCompleteClick}
              isLoading={isLoading}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {task.isCompleted ? 'Mark Incomplete' : 'Complete Daily Task (+50 XP)'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
