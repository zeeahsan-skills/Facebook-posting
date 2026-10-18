# FB Posting Tool — Autonomous AI Facebook Group Posting Agent

A personal web application to manage Facebook group posting campaigns: groups, campaigns,
scheduling, an autonomous background worker, click analytics, and WhatsApp remote control.

## Stack

- **Frontend:** Next.js 14 + Tailwind CSS (deployed on Vercel)
- **Database & Auth:** Supabase (Postgres + Row Level Security)
- **Background worker:** Separate persistent worker (cron-based) with an authorized browser session
- **Click tracking:** Built-in redirect tracker (`/api/track/[code]`)

## Quick Start (5 minutes)

### 1. Supabase setup
1. Create a project at [supabase.com](https://supabase.com) (free tier is enough).
2. SQL Editor → New query → paste `supabase/migrations/001_schema.sql` → Run.
3. Project Settings → API → copy:
   - Project URL
   - `anon` public key
   - `service_role` key (secret — server only)

### 2. Environment variables (Vercel → Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
Then redeploy. Or copy `.env.example` to `.env.local` for local dev.

### 3. Create your account
Open the site → Sign up → start adding groups and campaigns.

## Pages

| Page | What it does |
|---|---|
| Dashboard | Overview cards, clicks chart, CSV exports |
| Facebook Groups | Add / edit / delete / search groups |
| Spreadsheet | Import groups from CSV |
| Campaign Manager | Captions, links, auto tracking links, enable/disable |
| Posting Scheduler | Assign campaigns to groups with date/time |
| AI Agent Control | Pause / resume the background worker |
| Click Analytics | Real tracked clicks per campaign, trends |
| Posting History | Every task, status, errors, retry button |
| Notifications | Activity log of every agent decision |
| WhatsApp Control | Setup status + supported commands |
| Settings | Limits, retries, privacy notes |

## Background worker

The web app manages data; posting runs in a separate worker so it keeps working
when the browser is closed. The worker:

1. Reads `tasks` where `status = 'queued'` and `scheduled_at <= now()`.
2. Checks `worker_control.paused` — stops if paused.
3. Validates group URL + caption + link (decision engine rules).
4. Posts via the authorized browser session (anonymous mode where the group allows it).
5. Writes the result back: `posted` / `pending_approval` / `failed` + `post_link`.
6. Logs every decision to `activity_log`.

A reference Python worker (`worker/supabase_worker.py`) implements this loop
against the same Supabase tables. It needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

**Important:** There is no official Meta API for posting to Facebook Groups.
The worker uses a real browser session on your own machine with your own account.
This carries account-restriction risk — the worker posts max 1 task per run with
human-like spacing, and never bypasses login challenges or CAPTCHAs.

## Click tracking

Each campaign gets a unique tracking link: `https://your-site/api/track/<code>`.
Opening it logs a click event (timestamp, referrer, IP hash) and 302-redirects to
the destination URL. Analytics pages show **real clicks only** — never estimates.

## WhatsApp setup (optional)

1. Create a Meta developer app with WhatsApp Business Platform.
2. Add a dedicated phone number.
3. Add `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` as env vars.
4. Implement the webhook at `/api/whatsapp/webhook` (scaffold in README — commands:
   START, PAUSE, RESUME, STOP, STATUS, REPORT, TODAY; only your verified number accepted).

Until configured, the WhatsApp page honestly shows "Not connected".

## Security

- Supabase Row Level Security: users see only their own rows.
- Service-role key never touches the browser.
- No Facebook credentials are ever stored — the worker uses your machine's session.
- Idempotency keys prevent duplicate tasks; bounded retries (3) prevent runaway loops.

## Project structure

```
app/                    Pages + API routes
  (pages)               dashboard, groups, import, campaigns, scheduler,
                        control, analytics, history, notifications, whatsapp,
                        settings, setup, login
  api/                  groups, campaigns, tasks, import, control, track,
                        export, stats, activity
components/             Shell (sidebar), ui (shared styles)
lib/                    supabase clients, api auth helper
supabase/migrations/    001_schema.sql
worker/                 reference background worker (Python)
```
