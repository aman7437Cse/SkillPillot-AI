import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  isOnboarded: boolean;
  createdAt: string;
}

export interface OnboardingData {
  role: string;
  primarySkill: string;
  hoursPerDay: number;
  fullName?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isConfiguredWithSupabase: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  quickDemoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'skillpilot_auth_session';
const LOCAL_STORAGE_USERS_KEY = 'skillpilot_registered_users';
const LOCAL_STORAGE_ONBOARDED_PREFIX = 'skillpilot_onboarded_';

// Default demo user for instant frictionless testing
const DEFAULT_DEMO_USER: AuthUser = {
  id: 'user-demo-alex',
  email: 'alex@skillpilot.ai',
  fullName: 'Alex Vance',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  isOnboarded: true,
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          // Live Supabase Auth
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          }
          if (data.session && isMounted) {
            setSession(data.session);
            mapSupabaseUserToAuthUser(data.session.user);
          }

          // Listen to live auth changes
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
              if (!isMounted) return;
              setSession(newSession);
              if (newSession?.user) {
                mapSupabaseUserToAuthUser(newSession.user);
              } else {
                setUser(null);
              }
            }
          );

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Local simulated Auth fallback
          const cachedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
          if (cachedSession && isMounted) {
            try {
              const parsedUser: AuthUser = JSON.parse(cachedSession);
              const isOnboarded = localStorage.getItem(LOCAL_STORAGE_ONBOARDED_PREFIX + parsedUser.id) === 'true';
              setUser({ ...parsedUser, isOnboarded });
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const mapSupabaseUserToAuthUser = (sbUser: SupabaseUser) => {
    const isOnboarded =
      sbUser.user_metadata?.has_completed_onboarding === true ||
      localStorage.getItem(LOCAL_STORAGE_ONBOARDED_PREFIX + sbUser.id) === 'true';

    setUser({
      id: sbUser.id,
      email: sbUser.email || '',
      fullName: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Student',
      avatarUrl: sbUser.user_metadata?.avatar_url,
      isOnboarded,
      createdAt: sbUser.created_at,
    });
  };

  // Login handler
  const login = async (
    email: string,
    password: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          mapSupabaseUserToAuthUser(data.user);
          return { success: true };
        }
      } else {
        // Local fallback authentication
        await new Promise((res) => setTimeout(res, 400)); // simulate brief realistic network latency

        // Check if demo user
        if (email.trim().toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase()) {
          const isOnboarded = localStorage.getItem(LOCAL_STORAGE_ONBOARDED_PREFIX + DEFAULT_DEMO_USER.id) !== 'false';
          const authUser = { ...DEFAULT_DEMO_USER, isOnboarded };
          setUser(authUser);
          if (rememberMe) {
            localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
          }
          return { success: true };
        }

        // Check registered mock users
        const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        const usersList: Array<AuthUser & { passwordHash: string }> = rawUsers ? JSON.parse(rawUsers) : [];
        const existing = usersList.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

        if (!existing) {
          return { success: false, error: 'No account found with this email. Please sign up first.' };
        }

        if (existing.passwordHash !== password) {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }

        const isOnboarded = localStorage.getItem(LOCAL_STORAGE_ONBOARDED_PREFIX + existing.id) === 'true';
        const loggedInUser: AuthUser = {
          id: existing.id,
          email: existing.email,
          fullName: existing.fullName,
          avatarUrl: existing.avatarUrl,
          isOnboarded,
          createdAt: existing.createdAt,
        };

        setUser(loggedInUser);
        if (rememberMe) {
          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(loggedInUser));
        }
        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during sign in.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up handler
  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              has_completed_onboarding: false,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          mapSupabaseUserToAuthUser(data.user);
          return { success: true };
        }
      } else {
        // Local fallback registration
        await new Promise((res) => setTimeout(res, 500));

        const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
        const usersList: Array<AuthUser & { passwordHash: string }> = rawUsers ? JSON.parse(rawUsers) : [];

        if (usersList.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
          return { success: false, error: 'An account with this email address already exists.' };
        }

        const newId = `user-${Date.now()}`;
        const newUserRecord = {
          id: newId,
          email: email.trim(),
          fullName: name.trim() || 'New Student',
          passwordHash: password, // Note: local development fallback
          isOnboarded: false,
          createdAt: new Date().toISOString(),
        };

        usersList.push(newUserRecord);
        localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersList));
        localStorage.setItem(LOCAL_STORAGE_ONBOARDED_PREFIX + newId, 'false');

        const authUser: AuthUser = {
          id: newUserRecord.id,
          email: newUserRecord.email,
          fullName: newUserRecord.fullName,
          isOnboarded: false,
          createdAt: newUserRecord.createdAt,
        };

        setUser(authUser);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(authUser));
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during sign up.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth handler
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } else {
      return {
        success: false,
        error:
          'Google OAuth is not configured. To activate Google Sign-In, provide VITE_SUPABASE_URL and configure Google Provider in your Supabase Auth settings.',
      };
    }
  };

  // Reset Password handler
  const resetPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!email.trim() || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: 'Password recovery email sent! Please check your inbox for instructions.',
      };
    } else {
      // Local simulation
      await new Promise((res) => setTimeout(res, 500));
      return {
        success: true,
        message: `Recovery simulated: A password reset link has been dispatched to ${email}. (In local dev mode, you can sign in directly or register a new account).`,
      };
    }
  };

  // Complete Onboarding
  const completeOnboarding = async (data: OnboardingData) => {
    if (!user) return;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            has_completed_onboarding: true,
            full_name: data.fullName || user.fullName,
            avatar_url: data.avatarUrl || user.avatarUrl,
          },
        });
      } catch (err) {
        console.warn('Could not update onboarding flag in Supabase:', err);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_ONBOARDED_PREFIX + user.id, 'true');
    const updatedUser: AuthUser = {
      ...user,
      fullName: data.fullName || user.fullName,
      avatarUrl: data.avatarUrl || user.avatarUrl,
      isOnboarded: true,
    };
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(updatedUser));

    // Also update registered mock users list if present
    try {
      const rawUsers = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      if (rawUsers) {
        const usersList: any[] = JSON.parse(rawUsers);
        const idx = usersList.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          usersList[idx].fullName = updatedUser.fullName;
          usersList[idx].avatarUrl = updatedUser.avatarUrl;
          usersList[idx].isOnboarded = true;
          localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(usersList));
        }
      }
    } catch {
      // Ignore error
    }

    setUser(updatedUser);
  };

  // Quick Demo Login for instant 1-click evaluation
  const quickDemoLogin = async () => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 300));
    const demoUser = { ...DEFAULT_DEMO_USER, isOnboarded: true };
    localStorage.setItem(LOCAL_STORAGE_ONBOARDED_PREFIX + demoUser.id, 'true');
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsLoading(false);
  };

  // Sign out handler
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfiguredWithSupabase: isSupabaseConfigured,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        logout,
        completeOnboarding,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
