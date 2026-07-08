# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Is

**Social Media AI** — a tool that helps create viral Instagram Reels by analyzing competitor content. It scrapes competitors' recent videos, identifies the most viral ones, analyzes them with AI (video understanding + content breakdown), and generates new adapted video concepts for a given brand.

---

## How to Run

```bash
cd app
npm install
npm run dev
# Open http://localhost:3000
```

**Required environment variables** (in `.env` at project root):
- `APIFY_API_TOKEN` — Apify Instagram scraper
- `GEMINI_API_KEY` — Google Gemini video analysis
- `ANTHROPIC_API_KEY` — Claude concept generation
- `SESSION_SECRET` — signs login session cookies (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

**First-time setup** — bootstrap an admin account (safe to re-run, never touches configs/creators/videos data):
```bash
# Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in .env, then:
cd app
npx tsx src/scripts/seed-auth.ts
```

---

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **CSV files** for data storage (in `data/` directory)
- **Apify** — Instagram scraping
- **Google Gemini 2.0 Flash** — Video analysis (upload + multimodal)
- **Claude Sonnet** — New concept generation

---

## How The System Works

### Pipeline Overview

1. **Input** — Select a config and parameters (max videos, top-K, days lookback) via the Run page
2. **Load Config** — Retrieve analysis prompt, new concepts prompt, and creator list from CSV
3. **Scrape** — For each competitor creator, scrape recent Instagram Reels via Apify
4. **Filter & Rank** — Filter by date, sort by views, take top-K most viral
5. **Analyze** — Download video, upload to Gemini, analyze (extracts Concept, Hook, Retention, Reward, Script)
6. **Generate** — Send analysis + brand context to Claude for adapted video concepts
7. **Save** — Append results to `data/videos.csv`, viewable in the Videos page with thumbnails. Thumbnails and creator avatars are downloaded once and cached under `data/media/` (via `src/lib/media.ts`) instead of storing the raw Instagram CDN URL, since those URLs are signed and expire.

### Two Customizable Prompts Per Config

- **Analysis Instruction** — How Gemini should break down the video
- **New Concepts Instruction** — How Claude should adapt the reference for the brand

---

## Multi-Client Platform (Auth + Workspaces)

This is being built out in stages into a multi-client platform. Stage 1 (done) adds authentication and a workspace shell; feature logic inside workspace tabs comes in later stages.

- **Two account types**: `admin` (sees/manages everything) and `client` (sees only their assigned workspace(s)).
- **Auth**: email/password login, sessions are signed HTTP-only cookies (`app/src/lib/session.ts`, Web Crypto HMAC — no auth library dependency). Password hashing via Node's `crypto.scrypt` (`app/src/lib/password.ts`). Route protection is centralized in `app/src/proxy.ts` (Next.js's `middleware.ts` convention, renamed to `proxy.ts` in Next 16 — must live in `src/` alongside `app/`, not at the project root).
- **Admin-only pages**: `/`, `/videos`, `/run`, `/configs`, `/creators`, `/admin` (and their API routes) all require an admin session. Non-admin/unauthenticated requests are redirected (pages) or get 401/403 JSON (API).
- **Admin dashboard** (`/admin`): create/rename/delete workspaces, create client accounts, assign clients to workspaces.
- **Workspace shell** (`/workspace/[workspaceId]/...`): 6 tabs — Inspiration, Notes, Footage, Analysis, Content Calendar, Reports — currently all placeholders. Per-workspace access is checked in `app/src/app/workspace/[workspaceId]/layout.tsx` against the `workspace_clients.csv` join table (admins bypass this check).
- **Data**: `data/users.csv`, `data/workspaces.csv`, `data/workspace_clients.csv` — same CSV read/write convention as everything else, via `app/src/lib/csv.ts`.
- **Bootstrapping the first admin**: `app/src/scripts/seed-auth.ts` (see "First-time setup" above). Kept separate from `app/src/scripts/seed.ts`, which unconditionally overwrites `configs.csv`/`creators.csv`/`videos.csv` and should only ever be run on a fresh install.

---

## Workspace Structure

```
.
├── CLAUDE.md                              # This file
├── .env                                   # API keys (not committed)
├── app/                                   # Next.js application
│   ├── src/
│   │   ├── proxy.ts                       # Route protection (Next 16's middleware.ts convention)
│   │   ├── app/                           # Pages and API routes
│   │   │   ├── layout.tsx                 # Slim root shell (html/body + TooltipProvider only)
│   │   │   ├── login/page.tsx             # Login page
│   │   │   ├── admin/                     # Admin dashboard: workspaces, client accounts, assignments
│   │   │   ├── workspace/                 # Client-facing workspace picker + shell
│   │   │   │   ├── page.tsx               # Picker (auto-redirects if exactly one workspace)
│   │   │   │   └── [workspaceId]/         # Workspace shell + 6 tabs (inspiration/notes/footage/analysis/calendar/reports)
│   │   │   ├── (dashboard)/               # Route group: admin-only legacy pipeline pages (same URLs as before)
│   │   │   │   ├── page.tsx               # Dashboard
│   │   │   │   ├── videos/page.tsx        # Videos browser with thumbnails
│   │   │   │   ├── run/page.tsx           # Pipeline runner with live progress
│   │   │   │   ├── configs/page.tsx       # Config management
│   │   │   │   └── creators/page.tsx      # Creator management
│   │   │   └── api/                       # API routes (configs, creators, videos, pipeline, media, auth, workspaces, users, workspace-clients)
│   │   ├── lib/                           # Core logic
│   │   │   ├── pipeline.ts               # Pipeline orchestration
│   │   │   ├── apify.ts                  # Apify scraper client
│   │   │   ├── gemini.ts                 # Gemini video analysis client
│   │   │   ├── claude.ts                 # Claude concept generation client
│   │   │   ├── csv.ts                    # CSV read/write utilities
│   │   │   ├── media.ts                  # Downloads Instagram CDN images and stores them locally
│   │   │   ├── session.ts                # Signed session cookie create/verify (Web Crypto)
│   │   │   ├── password.ts               # Password hashing (scrypt)
│   │   │   ├── auth.ts                   # getCurrentUser/setSessionCookie helpers
│   │   │   └── types.ts                  # TypeScript interfaces
│   │   └── components/                    # UI components (shadcn + custom)
│   └── package.json
├── data/                                  # CSV data storage
│   ├── configs.csv                        # Pipeline configurations
│   ├── creators.csv                       # Instagram creator accounts
│   ├── videos.csv                         # Analyzed video results
│   ├── users.csv                          # Admin/client accounts
│   ├── workspaces.csv                     # Client workspaces
│   ├── workspace_clients.csv              # Workspace <-> client assignment (join table)
│   └── media/                             # Locally cached thumbnails/avatars (served via /api/media/*)
├── context/                               # Background context for Claude
├── plans/                                 # Implementation plans
└── .claude/commands/                      # Slash commands (prime, create-plan, implement)
```

---

## App Pages

| Page | Path | Access | Description |
|------|------|--------|-------------|
| Login | `/login` | Public | Email/password sign in |
| Dashboard | `/` | Admin | Summary stats, recent videos |
| Videos | `/videos` | Admin | Browse results with thumbnails, expandable analysis & concepts |
| Run Pipeline | `/run` | Admin | Select config, set params, run with live progress streaming |
| Configs | `/configs` | Admin | CRUD for pipeline configs (prompts, categories) |
| Creators | `/creators` | Admin | CRUD for competitor Instagram accounts |
| Workspaces (admin) | `/admin` | Admin | CRUD workspaces, create client accounts, manage access |
| Workspace picker | `/workspace` | Client | Lists assigned workspaces (auto-redirects if only one) |
| Workspace shell | `/workspace/[id]/...` | Admin + assigned client | 6 tabs: Inspiration, Notes, Footage, Analysis, Content Calendar, Reports (placeholders for now) |

---

## Commands

### /prime
Initialize a new session with full context awareness.

### /create-plan [request]
Create a detailed implementation plan in `plans/`.

### /implement [plan-path]
Execute a plan step by step.

---

## Critical Instruction: Maintain This File

After any change to the workspace, ask:
1. Does this change add new functionality?
2. Does it modify the workspace structure documented above?
3. Should a new command be listed?
4. Does context/ need updates?

If yes, update the relevant sections.

---

## Session Workflow

1. **Start**: Run `/prime` to load context
2. **Work**: Use commands or direct Claude with tasks
3. **Plan changes**: Use `/create-plan` before significant additions
4. **Execute**: Use `/implement` to execute plans
5. **Maintain**: Claude updates CLAUDE.md and context/ as the workspace evolves
