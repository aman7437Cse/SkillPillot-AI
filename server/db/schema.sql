-- ====================================================================
-- SkillPilot AI — Supabase / PostgreSQL Production Schema
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  streak_count INTEGER DEFAULT 0,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Roadmaps Table
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  target_goal TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  hours_per_day NUMERIC(3,1) NOT NULL DEFAULT 1.5,
  target_weeks INTEGER NOT NULL DEFAULT 6,
  pace_mode TEXT NOT NULL DEFAULT 'balanced' CHECK (pace_mode IN ('relaxed', 'balanced', 'intensive')),
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Phases Table
CREATE TABLE IF NOT EXISTS public.phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  estimated_weeks INTEGER NOT NULL DEFAULT 2,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  concept_summary TEXT NOT NULL,
  practical_exercise TEXT NOT NULL,
  key_takeaways JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_essential BOOLEAN NOT NULL DEFAULT true,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Skill Gaps Table
CREATE TABLE IF NOT EXISTS public.skill_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  proficiency_score INTEGER NOT NULL DEFAULT 50 CHECK (proficiency_score >= 0 AND proficiency_score <= 100),
  status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('critical_blocker', 'needs_review', 'mastered')),
  recommended_action TEXT,
  last_evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_roadmap_id ON public.tasks(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON public.tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_roadmap_id ON public.skill_gaps(roadmap_id);

-- 8. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;

-- 9. Basic RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own roadmaps" ON public.roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roadmaps" ON public.roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own roadmaps" ON public.roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own roadmaps" ON public.roadmaps FOR DELETE USING (auth.uid() = user_id);
