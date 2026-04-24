import { NextResponse } from 'next/server';

// ONE-TIME setup route — run once to create tables
// GET /api/setup-db
// DELETE this file after running!

const SCHEMA_SQL = `
-- Projects Table
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null default 'Untitled Project',
  status text check (status in ('draft', 'rendering', 'completed', 'failed')) default 'draft',
  created_at timestamptz default timezone('utc', now()) not null,
  updated_at timestamptz default timezone('utc', now()) not null
);

-- Scenes Table
create table if not exists scenes (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  script_text text,
  avatar_id text default 'stock_1',
  voice_id text default 'en_adam',
  background_url text default 'solid_gray',
  "order" integer not null default 0,
  duration numeric default 5.0
);

-- Enable RLS
alter table projects enable row level security;
alter table scenes enable row level security;

-- Drop existing policies if any (idempotent)
drop policy if exists "Users manage own projects" on projects;
drop policy if exists "Users manage own scenes" on scenes;

-- RLS Policies
create policy "Users manage own projects"
  on projects for all using (auth.uid() = user_id);

create policy "Users manage own scenes"
  on scenes for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );
`;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Use anon key with rpc if service key not available
    const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !key) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Use Supabase REST API to execute SQL via rpc
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: SCHEMA_SQL }),
    });

    if (!res.ok) {
      // Try the pg endpoint instead
      const pgRes = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: SCHEMA_SQL }),
      });

      if (!pgRes.ok) {
        const errText = await pgRes.text();
        return NextResponse.json({
          error: 'Could not auto-run schema. Please run supabase-schema.sql manually in Supabase SQL Editor.',
          details: errText,
          manualUrl: `https://supabase.com/dashboard/project/hxtxxmldlqwmgbsrwsym/sql/new`,
        }, { status: 200 }); // 200 so user sees the message
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully!',
      tables: ['projects', 'scenes'],
    });

  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      manualUrl: `https://supabase.com/dashboard/project/hxtxxmldlqwmgbsrwsym/sql/new`,
      hint: 'Run supabase-schema.sql manually in Supabase SQL Editor',
    }, { status: 200 });
  }
}
