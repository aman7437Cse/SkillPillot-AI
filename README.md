# 🚀 SkillPilot AI

> **Anti-Overwhelm AI-Powered Student Learning Platform**  
> Learn any skill with structured, bite-sized daily micro-tasks, intelligent schedule rebalancing, skill gap diagnostics, and gamified mastery.

---

## 🌟 Core Features

- **Personalized Anti-Overwhelm Roadmaps**: AI-curated progressive learning journeys divided into structured phases with daily 25–45 minute micro-tasks.
- **Guided Daily Focus Mode**: Distraction-free daily mission dashboard featuring an integrated Pomodoro focus timer, bite-sized conceptual mental models, actionable practical challenges, and verified resources.
- **Smart Pace Recovery (Anti-Abandonment Engine)**: Missed 2 or 3 days? Recalibrate your schedule with a single click using 3 tailored strategies:
  1. *Gentle Redistribution (Zero Guilt)*: Shifts tasks into upcoming days without increasing daily workload.
  2. *Micro-Sprint*: Pairs subtasks over 3 days to catch up on time.
  3. *Core Essentials Only*: Converts elective deep-dives into optional reading.
- **Diagnostic Skill Gap Radar & Revision Quizzes**: Identifies critical conceptual blockers and offers interactive 3-question micro-quizzes with instant explanations to turn weak areas into mastered skills.
- **Gamified Momentum**: Daily streaks (🔥), Knowledge XP (⚡), and confetti celebration animations upon completing tasks and acing diagnostic assessments.
- **Dual-Mode Architectural Resilience**: Runs 100% out-of-the-box with deterministic AI curriculum generation and persistent local state, while seamlessly connecting to Google Gemini AI and Supabase PostgreSQL when credentials are provided.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express, TypeScript, Zod Schema Validation, Helmet, CORS, Morgan |
| **AI Engine** | Google Gemini 2.5 Flash (`@google/genai`) with Deterministic Fallback Generator |
| **Database** | PostgreSQL & Supabase with Row Level Security (RLS) + In-Memory Local Store |

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- Node.js `v18+` (Tested on `v24.14.1`)
- npm `v9+` (Tested on `11.11.0`)

### 2. Install Dependencies
Run from the root directory:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Run Development Servers
To start both the Express backend (`http://localhost:5001`) and the Vite frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Alternatively, run them in separate terminal windows:
```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Vite React Frontend
npm run dev:client
```

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Environment Configuration

Copy `.env.example` to `server/.env` and `client/.env`:

### `server/.env`
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key_here

# (Optional) Google Gemini API for live generative curriculum
GEMINI_API_KEY=

# (Optional) Supabase PostgreSQL for cloud persistence
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5001/api
```

> **Note:** If `GEMINI_API_KEY` or `SUPABASE_URL` are not provided, SkillPilot AI will operate seamlessly using its offline deterministic curriculum generator and local data store.

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

To set up persistence in Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`server/db/schema.sql`](file:///Users/amangupta7437/Documents/SkillPath%20Ai/server/db/schema.sql).
4. Add your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `server/.env`.

---

## 🧪 Testing and Verification

- **Backend Health Check**:
  ```bash
  curl http://localhost:5001/api/health
  ```
- **Fetch Roadmaps**:
  ```bash
  curl http://localhost:5001/api/roadmaps
  ```
- **Type Checking & Production Build**:
  ```bash
  npm run build
  ```
