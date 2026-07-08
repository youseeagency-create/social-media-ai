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
- `DATABASE_URL` — Postgres connection string (Neon, provisioned via Vercel's Marketplace integration; same DB used for local dev and production for now)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token for voice-note audio (auto-added when the Blob store is created; pulled locally into `app/.env.local` via `vercel env pull`)

**First-time setup**:
```bash
cd app
npx drizzle-kit generate   # only needed after changing src/lib/schema.ts
npm run db:migrate         # applies drizzle/*.sql to DATABASE_URL
# Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in .env, then:
npx tsx src/scripts/seed-auth.ts   # safe to re-run — skips if the email already exists
```

---

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **CSV files** for pipeline data storage (`configs`/`creators`/`videos`, in `data/` directory)
- **Postgres (Neon)** via **Drizzle ORM** for auth/workspace data (`users`/`workspaces`/`workspace_clients`) — see "Multi-Client Platform" below
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

This is being built out in stages into a multi-client platform. Stage 1 added authentication and a workspace shell (CSV-backed); that was then migrated to Postgres since Vercel's filesystem is read-only/ephemeral. All seven workspace tabs are now functional: Inspiration, Notes, Footage, Analysis, Content Calendar, Chat, and Reports. `configs`/`creators`/`videos` are still CSV-backed — only the auth/workspace/tab entities moved to the database.

- **Two account types**: `admin` (sees/manages everything) and `client` (sees only their assigned workspace(s)).
- **Auth**: email/password login, sessions are signed HTTP-only cookies (`app/src/lib/session.ts`, Web Crypto HMAC — no auth library dependency). Password hashing via Node's `crypto.scrypt` (`app/src/lib/password.ts`). Route protection is centralized in `app/src/proxy.ts` (Next.js's `middleware.ts` convention, renamed to `proxy.ts` in Next 16 — must live in `src/` alongside `app/`, not at the project root).
- **Admin-only pages**: `/`, `/videos`, `/run`, `/configs`, `/creators`, `/admin` (and their API routes) all require an admin session. Non-admin/unauthenticated requests are redirected (pages) or get 401/403 JSON (API).
- **Admin dashboard** (`/admin`): the admin landing page after login (client component). Shows an **overview** — stat tiles (total workspaces, clients, workspaces active this week), a **quick-links** row to the legacy pipeline tools (`/videos`, `/run`, `/creators`, `/configs`), a **searchable** list of workspace cards (each with client count + last-activity date, linking into the workspace), and a **recent cross-client activity feed**. Management actions live on the same page: create/rename/delete workspaces, create client accounts, assign clients to workspaces. Overview data comes from admin-only `GET /api/admin/overview` (`getAdminOverview` in `db.ts`, which aggregates last-activity + a recent feed across every content table).
- **Workspace shell** (`/workspace/[workspaceId]/...`): a **Home** overview tab plus Inspiration, Notes, Footage, Analysis, Content Calendar, Chat, Reports, and an admin-only **Admin Notes** tab (`workspace-tabs.tsx`). Per-workspace access is checked in `app/src/app/workspace/[workspaceId]/layout.tsx` via `isUserAssignedToWorkspace` (admins bypass); clients are additionally blocked from **archived** workspaces there.
- **Chat tab**: a simple per-workspace messaging thread shared by the admin and every client assigned to that workspace (`app/src/components/chat-tab.tsx`). Table `messages` (`workspace_id`, `sender_id`, `body`, `created_at`); `GET/POST /api/messages` authorized with `requireWorkspaceAccess`. No websockets — the client polls every ~4s (and on window focus). Messages show sender name, an admin badge, and a timestamp; own messages align right. The chat page (`app/src/app/workspace/[workspaceId]/chat/page.tsx`) is a server component that passes the current user's id so the UI can align "you" vs. others.
- **Inspiration tab**: save Instagram/TikTok/YouTube/other links per workspace (platform auto-detected in `app/src/lib/inspiration.ts`). Thumbnails: YouTube derived instantly; Instagram (Apify `scrapePostThumbnail`) and TikTok (free oEmbed) are scraped **asynchronously** — the link saves immediately with `thumbnail_status = pending`, then the client calls `POST /api/inspiration/thumbnail?id=` which resolves the cover URL (`app/src/lib/thumbnails.ts`), downloads it, and persists it to **Vercel Blob** (source CDN URLs are signed/expiring, so we store our own copy). Failures (private/deleted posts, rate limits, timeouts) flip status to `failed` and the card keeps its platform badge with a retry affordance. Deleting an item `del()`s its Blob thumbnail. **Notes tab**: text notes + browser-recorded voice notes in one chronological list. Voice audio is stored in **Vercel Blob** (`@vercel/blob`, public access) via the client-upload flow — `app/src/components/voice-recorder.tsx` records via `MediaRecorder`, uploads through `app/src/app/api/notes/upload/route.ts` (`handleUpload`, auth in `onBeforeGenerateToken`), then the note row is saved client-side (the completion webhook doesn't fire locally). Deleting a voice note also `del()`s its blob. Requires `BLOB_READ_WRITE_TOKEN` (from the Vercel Blob store).
- **Footage tab**: per-workspace media library. Upload video/image/audio files (drag-drop or picker, multi-file, 500 MB cap) via Vercel Blob **client-upload** with a progress bar (`app/src/components/footage-tab.tsx` → `POST /api/footage/upload` `handleUpload`, same auth pattern as voice notes; `maximumSizeInBytes` enforces the cap). Files render with inline players (`<video>`/`<audio>`/`<img>`). `kind` is derived server-side from the content type (`app/src/lib/footage.ts`). Deleting an item `del()`s its blob.
- **Analysis tab**: upload a video (or pick one from Footage) → AI breakdown + future-content ideas, per workspace, with full history. Processing is **async**: `POST /api/analysis` creates a `processing` row and runs the chain in `after()` (route `maxDuration = 300`) — download video → Gemini (`uploadVideo` + `analyzeVideo`, `app/src/lib/gemini.ts`) → Claude (`generateContentIdeas`, `app/src/lib/claude.ts`) → mark `completed`/`failed` (`app/src/lib/analysis-runner.ts`). The client polls `GET /api/analysis` while any row is `processing`; a stuck/failed row shows a **Retry** (`POST /api/analysis/process`). Video uploaded via Blob client-upload (`/api/analysis/upload`, video-only). Analysis prompt is editable per run (default in `app/src/lib/analysis.ts`), brand context optional. Results rendered with `MarkdownContent`. **Note**: requires Gemini API quota — the free tier can return 429 (`limit: 0` for gemini-2.0-flash); enable billing on the Google AI project for real analyses.
- **Content Calendar tab**: schedule content items (title, description, date, status `planned|filming|posted`) onto a **month grid** (click a day to add, an item to edit; `app/src/components/calendar-tab.tsx`). Table `calendar_items` (`scheduled_date` is a `date`); `/api/calendar` GET/POST/PUT/DELETE.
- **Reports tab**: a **live** client-ready summary (`app/src/lib/reports.ts` aggregates inspiration/notes/footage/analyses/calendar for a workspace, optional date range) plus an optional **Claude executive summary**, rendered as a light "document" with **Print / Save-as-PDF** (browser `window.print()` + `@media print` in `globals.css` showing only `#report`). `POST /api/reports/generate` returns `{ report, summary, summaryError }`; if the AI summary fails (e.g. no Anthropic credits) the report still returns and the UI shows an admin-only note. No new table (live view).
- **Client-facing tab API routes** (`/api/inspiration`, `/api/notes`, `/api/notes/upload`, `/api/inspiration/thumbnail`, `/api/footage`, `/api/footage/upload`, `/api/analysis`, `/api/analysis/process`, `/api/analysis/upload`, `/api/calendar`, `/api/messages`, `/api/activity`, `/api/notifications`, `/api/search`, `/api/reports/generate`) are intentionally **not** under the admin-only `/api/workspaces/*` prefix and are **not** in the `proxy.ts` matcher — each handler authorizes with `requireWorkspaceAccess(workspaceId)` (`app/src/lib/auth.ts`: admin bypass, else `isUserAssignedToWorkspace`), so both admins and assigned clients can read/write their own workspace's data. (`/api/admin/*` — e.g. the dashboard overview — **is** admin-only, gated by `proxy.ts` and re-checked in the handler.)
- **Data**: Postgres tables `users`, `workspaces` (+ `archived_at` soft-deactivate), `workspace_clients`, `inspiration_items` (+ `size_bytes`), `notes` (+ `size_bytes`), `footage`, `analyses`, `calendar_items`, `messages`, `admin_notes`, `notification_reads` (schema in `app/src/lib/schema.ts`, queries in `app/src/lib/db.ts`). Reports, the admin dashboard overview, and the activity/search/notifications feeds are all live aggregations (no dedicated table beyond the above).
- **Admin dashboard extras**: an **activity log** (`GET /api/activity`; `listActivity` unions every content table with the actor's name/role — "Jerry uploaded footage…"), **archive/unarchive** workspaces (`PATCH /api/workspaces` → `setWorkspaceArchived`; archived = hidden from the admin's active list and fully blocked for clients, data preserved), a **storage dashboard** (per-workspace + total bytes from `footage`/`notes`/`inspiration_items` `size_bytes`), and **unseen-activity dots** on workspace cards.
- **Client home** (`/workspace/[id]/home`): the client's landing overview (recent activity, upcoming calendar, latest chat, quick links to every tab). The workspace index and the picker both redirect here; it's the first tab.
- **Notifications**: per-user/-workspace/-section `notification_reads` marks. `GET /api/notifications?workspaceId=` → per-tab unseen counts (badges in `workspace-tabs.tsx`; opening a tab POSTs `markSeen`); `GET /api/notifications` (no id) → `{workspaceId: true}` aggregate dots. Only counts items authored by the *other* party.
- **Workspace search** (`GET /api/search`, `searchWorkspace`): ILIKE across inspiration/notes/footage/calendar/chat. Header search box (`workspace-search-box.tsx`) → results page `/workspace/[id]/search`.
- **Admin-only private notes**: `admin_notes` table, `GET/POST/DELETE /api/admin/notes` (admin-only, gated by the `/api/admin/*` prefix + re-checked), surfaced as an **"Admin Notes" tab that only renders for admins**; clients can't see the tab or reach the route (page guard `notFound`).
- **Export**: Footage items have per-item Download buttons; the Notes tab has an **Export** button that downloads all notes as Markdown (voice notes as audio links).
- **Workspace navigation**: the workspace header has an always-visible back link (admin → `/admin`, client → `/workspace`).
- **AI dependencies**: the Analysis tab needs Gemini quota (`GEMINI_API_KEY`) + Anthropic credits (`ANTHROPIC_API_KEY`); the Reports AI summary needs Anthropic credits. All degrade gracefully (clear message / report-without-summary) when a key is out of quota/credits.
- **Known limitation**: deleting a workspace cascades its DB rows but does **not** delete the Blob objects (voice notes, IG/TikTok thumbnails, footage) — blobs are only `del()`d on individual-item delete. Orphaned blobs would need a sweep if this matters later. All workspace-scoped tables have `ON DELETE CASCADE` on `workspace_id` (deleting a workspace clears its content); `created_by` FKs use `ON DELETE SET NULL`. Schema changes: edit `schema.ts`, run `npx drizzle-kit generate` (writes SQL to `app/drizzle/`, commit it), then `npm run db:migrate`.
- **Bootstrapping the first admin**: `npx tsx src/scripts/seed-auth.ts` (see "First-time setup" above) — idempotent, skips if `ADMIN_EMAIL` already exists in the DB. Unrelated to `app/src/scripts/seed.ts`, which unconditionally overwrites `configs.csv`/`creators.csv`/`videos.csv` and should only ever be run on a fresh install.
- **Renaming the admin account**: `npx tsx src/scripts/rename-admin.ts` — idempotent one-off that renames an existing admin's email from `FROM_EMAIL` (default `admin@example.com`) to `ADMIN_EMAIL` in `.env`. Used to move the admin to `abu@hayemedia.com`; no-ops if the target already exists or the source is missing.

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
│   │   │   │   └── [workspaceId]/         # Workspace shell + 7 tabs (inspiration/notes/footage/analysis/calendar/chat/reports)
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
│   │   │   ├── csv.ts                    # CSV read/write utilities (configs/creators/videos only)
│   │   │   ├── schema.ts                 # Drizzle Postgres schema (users/workspaces/workspace_clients/inspiration_items/notes)
│   │   │   ├── db.ts                     # Drizzle client + query functions
│   │   │   ├── inspiration.ts            # URL platform detection + YouTube thumbnail derivation
│   │   │   ├── thumbnails.ts             # IG(Apify)/TikTok(oEmbed) thumbnail resolve + store to Vercel Blob
│   │   │   ├── footage.ts                # Footage size cap + content-type→kind helper (shared client/server)
│   │   │   ├── analysis.ts               # Analysis default prompt + size cap (shared client/server)
│   │   │   ├── analysis-runner.ts        # Background chain: video → Gemini → Claude → save
│   │   │   ├── reports.ts                # Aggregates a workspace's data into a report snapshot
│   │   │   ├── media.ts                  # Downloads Instagram CDN images and stores them locally
│   │   │   ├── session.ts                # Signed session cookie create/verify (Web Crypto)
│   │   │   ├── password.ts               # Password hashing (scrypt)
│   │   │   ├── auth.ts                   # getCurrentUser/setSessionCookie helpers
│   │   │   └── types.ts                  # TypeScript interfaces (User/Workspace/WorkspaceClient re-exported from schema.ts)
│   │   ├── scripts/
│   │   │   ├── seed.ts                   # Fresh-install seed for configs/creators/videos (destructive, run once)
│   │   │   ├── seed-auth.ts              # Idempotent admin bootstrap (Postgres)
│   │   │   ├── rename-admin.ts           # Idempotent one-off: rename existing admin's email
│   │   │   └── migrate.ts                # Applies drizzle/*.sql to DATABASE_URL
│   │   └── components/                    # UI components (shadcn + custom)
│   ├── drizzle/                           # Generated SQL migrations (committed)
│   ├── drizzle.config.ts                  # drizzle-kit config
│   └── package.json
├── data/                                  # CSV data storage (pipeline entities only — auth/workspaces are in Postgres)
│   ├── configs.csv                        # Pipeline configurations
│   ├── creators.csv                       # Instagram creator accounts
│   ├── videos.csv                         # Analyzed video results
│   └── media/                             # Locally cached thumbnails/avatars (served via /api/media/*)
├── context/                               # Background context for Claude
├── plans/                                 # Implementation plans
└── .claude/commands/                      # Slash commands (prime, create-plan, implement)
```

---

## App Pages

| Page | Path | Access | Description |
|------|------|--------|-------------|
| Home | `/` | Public | Marketing homepage (`app/src/app/page.tsx`) — HayeMedia agency site; Client Login + Apply CTAs. Not gated by `proxy.ts`. |
| Login | `/login` | Public | Email/password sign in |
| Dashboard | `/` | Admin | Summary stats, recent videos |
| Videos | `/videos` | Admin | Browse results with thumbnails, expandable analysis & concepts |
| Run Pipeline | `/run` | Admin | Select config, set params, run with live progress streaming |
| Configs | `/configs` | Admin | CRUD for pipeline configs (prompts, categories) |
| Creators | `/creators` | Admin | CRUD for competitor Instagram accounts |
| Admin dashboard | `/admin` | Admin | Landing page after admin login: overview stats, quick links to tools, searchable workspace list with last-activity, recent-activity feed; plus CRUD workspaces, create client accounts, manage access |
| Workspace picker | `/workspace` | Client | Lists assigned workspaces (auto-redirects if only one; admins are redirected to `/admin`) |
| Workspace shell | `/workspace/[id]/...` | Admin + assigned client | Home overview + Inspiration, Notes, Footage, Analysis, Content Calendar, Chat, Reports, and admin-only Admin Notes; header has back-to-dashboard link + workspace search |

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
