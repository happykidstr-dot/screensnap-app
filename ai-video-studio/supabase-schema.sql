-- ==========================================
-- Project Factory AI Video Studio
-- Supabase Schema — Full Setup
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Projects Table
create table if not exists projects (
  id          uuid       default gen_random_uuid() primary key,
  user_id     uuid       references auth.users on delete cascade,
  title       text       not null default 'Untitled Project',
  status      text       check (status in ('draft', 'rendering', 'completed', 'failed')) default 'draft',
  created_at  timestamptz default timezone('utc', now()) not null,
  updated_at  timestamptz default timezone('utc', now()) not null
);

-- 2. Scenes Table
create table if not exists scenes (
  id             uuid    default gen_random_uuid() primary key,
  project_id     uuid    references public.projects on delete cascade not null,
  script_text    text,
  avatar_id      text    default 'stock_1',
  voice_id       text    default 'en_adam',
  background_url text    default 'solid_gray',
  "order"        integer not null default 0,
  duration       numeric default 5.0
);

-- 3. Avatars
create table if not exists avatars (
  id          text    primary key,
  name        text    not null,
  preview_url text,
  type        text    check (type in ('stock', 'custom')) default 'stock',
  is_premium  boolean default false
);

-- 4. Voices
create table if not exists voices (
  id                text    primary key,
  name              text    not null,
  language          text,
  accent            text,
  preview_audio_url text,
  type              text    check (type in ('stock', 'cloned')) default 'stock',
  is_premium        boolean default false
);

-- 5. Renders (Job Tracking)
create table if not exists renders (
  id         uuid    default gen_random_uuid() primary key,
  project_id uuid    references public.projects on delete cascade not null,
  job_id     text,
  status     text    check (status in ('pending', 'processing', 'completed', 'failed')) default 'pending',
  video_url  text,
  cost       integer default 5,
  created_at timestamptz default timezone('utc', now()) not null
);

-- 6. User Credits
create table if not exists user_credits (
  user_id    uuid    references auth.users on delete cascade primary key,
  balance    integer default 200,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table projects      enable row level security;
alter table scenes        enable row level security;
alter table renders       enable row level security;
alter table user_credits  enable row level security;

-- Projects: users can only CRUD their own
create policy "Users manage own projects"
  on projects for all using (auth.uid() = user_id);

-- Scenes: users can access scenes of their own projects
create policy "Users manage own scenes"
  on scenes for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Renders: same as scenes
create policy "Users manage own renders"
  on renders for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Credits
create policy "Users manage own credits"
  on user_credits for all using (auth.uid() = user_id);

-- Avatars & Voices: public read
alter table avatars enable row level security;
alter table voices  enable row level security;
create policy "Public read avatars" on avatars for select using (true);
create policy "Public read voices"  on voices  for select using (true);

-- ─── Seed: Stock Avatars ──────────────────────────────────────────────────────
insert into avatars (id, name, preview_url, type) values
  ('stock_1', 'Emma (Professional)', null, 'stock'),
  ('stock_2', 'Liam (Casual)',        null, 'stock'),
  ('stock_3', 'Sarah (Energetic)',    null, 'stock')
on conflict (id) do nothing;

-- ─── Seed: Stock Voices ───────────────────────────────────────────────────────
insert into voices (id, name, language, accent, type) values
  ('en_adam',     'Adam',     'English', 'American',      'stock'),
  ('en_charlotte','Charlotte', 'English', 'British',       'stock'),
  ('tr_ahmet',    'Ahmet',    'Turkish', 'Professional',   'stock'),
  ('tr_ayse',     'Ayşe',     'Turkish', 'Warm',           'stock')
on conflict (id) do nothing;

-- ─── Function: Auto-create credits on signup ──────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_credits (user_id, balance)
  values (new.id, 200)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: fires when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
