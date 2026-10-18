-- FB Posting Tool — Supabase schema v1
-- Run this in Supabase SQL Editor (or via migrations)

-- Groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  url text not null,
  country text,
  category text,
  created_at timestamptz default now()
);

-- Campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  caption text not null,
  destination_url text not null,
  tracking_code text unique not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Tasks (one per group+campaign posting job)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  campaign_id uuid references campaigns(id) on delete cascade not null,
  scheduled_at timestamptz,
  timezone text default 'Asia/Karachi',
  status text not null default 'queued'
    check (status in ('queued','processing','posted','pending_approval','failed','needs_review','skipped')),
  post_link text,
  error text,
  attempts int default 0,
  idempotency_key text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Click events (from /api/track/[code])
create table if not exists click_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete set null,
  clicked_at timestamptz default now(),
  referrer text,
  country text,
  ip_hash text
);

-- Activity log (decision engine events)
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  task_id uuid references tasks(id) on delete set null,
  event text not null,
  detail text,
  created_at timestamptz default now()
);

-- Worker control (single row per user)
create table if not exists worker_control (
  user_id uuid primary key references auth.users(id) on delete cascade,
  paused boolean default false,
  updated_at timestamptz default now()
);

-- Row Level Security
alter table groups enable row level security;
alter table campaigns enable row level security;
alter table tasks enable row level security;
alter table click_events enable row level security;
alter table activity_log enable row level security;
alter table worker_control enable row level security;

-- Policies: users see only their own rows
create policy "own groups" on groups for all using (auth.uid() = user_id);
create policy "own campaigns" on campaigns for all using (auth.uid() = user_id);
create policy "own tasks" on tasks for all using (auth.uid() = user_id);
create policy "own clicks" on click_events for all using (
  exists (select 1 from campaigns c where c.id = campaign_id and c.user_id = auth.uid())
);
create policy "own log" on activity_log for all using (auth.uid() = user_id);
create policy "own control" on worker_control for all using (auth.uid() = user_id);

-- Service role bypasses RLS (used by background worker)
