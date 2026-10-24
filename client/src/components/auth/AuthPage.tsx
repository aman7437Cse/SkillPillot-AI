import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

type AuthMode = 'login' | 'signup' | 'forgot';

export const AuthPage: React.FC = () => {
  const { login, signup, loginWithGoogle, resetPassword, quickDemoLogin, isConfiguredWithSupabase } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  // Accessible Video Background & Reduced Motion
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion && videoRef.current) {
      videoRef.current.pause();
    }
  }, [prefersReducedMotion, videoLoaded]);

  // Clear messages on mode switch
  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleNotice(null);
  }, [mode]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleNotice(null);

    // Basic Validations
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      const res = await resetPassword(email);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage(res.message || 'Password reset email sent!');
      } else {
        setErrorMessage(res.error || 'Failed to send recovery instructions.');
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }

      setIsSubmitting(true);
      const res = await signup(name, email, password);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed. Please check your details.');
      }
    } else {
      // Login
      setIsSubmitting(true);
      const res = await login(email, password, rememberMe);
      setIsSubmitting(false);

      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials. Please verify and try again.');
      }
    }
  };

  // Google OAuth button handler
  const handleGoogleClick = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleNotice(null);

    if (!isConfiguredWithSupabase) {
      setGoogleNotice(
        'Google OAuth requires cloud provider integration. Set VITE_SUPABASE_URL and configure Google Provider in your Supabase Auth dashboard to enable 1-click Google login.'
      );
      return;
    }

    const res = await loginWithGoogle();
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  // Password strength helper
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: '' };
    if (password.length < 6) return { label: 'Too short', color: 'text-rose-400 bg-rose-500' };
    if (password.length < 8) return { label: 'Fair', color: 'text-amber-400 bg-amber-500' };
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    if (hasNumbers && hasSpecial) return { label: 'Strong', color: 'text-emerald-400 bg-emerald-500' };
    return { label: 'Good', color: 'text-indigo-400 bg-indigo-500' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#090d16] font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Video with Graceful Fallback & Poster */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Video Player */}
        {!prefersReducedMotion && (
          <video
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              videoLoaded && !videoFailed ? 'opacity-40' : 'opacity-0'
            }`}
            autoPlay
            muted
            loop
            playsInline
            poster="/videos/login-background-fallback.jpg"
            onCanPlay={() => setVideoLoaded(true)}
            onError={() => {
              setVideoFailed(true);
              setVideoLoaded(false);
            }}
          >
            <source src="/videos/login-background.mp4" type="video/mp4" />
          </video>
        )}

        {/* Static Artwork Fallback Poster */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            prefersReducedMotion || videoFailed || !videoLoaded ? 'opacity-35' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('/videos/login-background-fallback.jpg')` }}
        />

        {/* Ambient Dark Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#090d16]/90 via-[#090d16]/80 to-[#090d16]" />
        <div className="absolute inset-0 bg-radial-glow opacity-80" />

        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-subtle-grid opacity-30" />
      </div>

      {/* Main Glassmorphic Auth Container */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Floating Brand Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl glass-card border border-indigo-500/30 shadow-glow-sm bg-slate-900/80 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
              SkillPilot <span className="text-gradient-accent">AI</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Student Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {mode === 'login' && 'Master any skill without the overwhelm. Pick up where you left off.'}
            {mode === 'signup' && 'Personalized roadmaps, bite-sized daily tasks, and smart pace recovery.'}
            {mode === 'forgot' && 'Enter your email address to receive secure reset instructions.'}
          </p>
        </div>

        {/* Interactive Glass Card */}
        <div className="glass-card bg-slate-900/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Corner Glow Accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Notification Messages */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{successMessage}</div>
            </div>
          )}

          {googleNotice && (
            <div className="mb-4 p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/40 text-xs text-blue-200 flex items-start gap-2.5 animate-fade-in">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{googleNotice}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-medium text-slate-300">
                  Full Name
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
                    placeholder="e.g. Alex Vance"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Password (Login and Signup) */}
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator on Signup */}
                {mode === 'signup' && password.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{
                          width:
                            strength.label === 'Too short'
                              ? '25%'
                              : strength.label === 'Fair'
                              ? '50%'
                              : strength.label === 'Good'
                              ? '75%'
                              : '100%',
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${strength.color}`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-xs font-medium text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Remember Me Checkbox (Login only) */}
            {mode === 'login' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <label htmlFor="remember-me" className="text-xs text-slate-400 cursor-pointer select-none">
                  Keep me signed in on this device
                </label>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="accent"
              size="lg"
              isLoading={isSubmitting}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {mode === 'login' && 'Sign In to SkillPilot'}
              {mode === 'signup' && 'Create Free Account'}
              {mode === 'forgot' && 'Send Recovery Instructions'}
            </Button>

            {/* Back to Login from Forgot Password */}
            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </form>

          {/* Social & Demo Logins */}
          {mode !== 'forgot' && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* 1-Click Instant Demo Login */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={quickDemoLogin}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-950/60 to-violet-950/60 hover:from-indigo-900/60 hover:to-violet-900/60 border border-indigo-500/30 text-xs font-semibold text-indigo-300 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                  <span>Instant Demo Student Access (1-Click)</span>
                </button>
              </div>
            </div>
          )}

          {/* Backend / Security Indicator */}
          <div className="mt-5 pt-3 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConfiguredWithSupabase ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
              {isConfiguredWithSupabase ? 'Supabase Auth (Live)' : 'Local Auth (Dev Mode)'}
            </span>
            <span>256-bit Session Security</span>
          </div>
        </div>

        {/* Motivational Student Footer */}
        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Learn 1% better every day without the cognitive overload.</span>
        </p>
      </div>
    </div>
  );
};
