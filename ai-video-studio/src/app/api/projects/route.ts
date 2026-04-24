import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Scene } from '@/store/useEditorStore';

// ─── GET /api/projects ─── List user's projects ─────────────────────────────
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, projects: [] });
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, projects: projects || [] });

  } catch (err: any) {
    console.error('[PROJECTS GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/projects ─── Create a new project with scenes ────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();
    const { title = 'Untitled Project', scenes = [] } = body;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        project: { id: `local-${Date.now()}`, title, status: 'draft' }
      });
    }

    // 1. Insert project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ user_id: user.id, title, status: 'draft' })
      .select()
      .single();

    if (projectError) throw projectError;

    // 2. Insert scenes
    if (scenes.length > 0) {
      const sceneRows = (scenes as Scene[]).map((s, i) => ({
        project_id: project.id,
        script_text: s.script,
        avatar_id: s.avatarId,
        voice_id: s.voiceId,
        background_url: s.backgroundUrl,
        order: i,
        duration: s.duration,
      }));

      const { error: scenesError } = await supabase.from('scenes').insert(sceneRows);
      if (scenesError) throw scenesError;
    }

    return NextResponse.json({ success: true, project });

  } catch (err: any) {
    console.error('[PROJECTS POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
