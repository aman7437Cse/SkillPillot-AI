import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
    });
  } catch (err) {
    // Ignore in non-browser or test environments
  }
}
