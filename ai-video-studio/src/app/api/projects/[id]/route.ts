import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { Scene } from '@/store/useEditorStore';

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/projects/[id] ─── Load a project with its scenes ───────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (id.startsWith('local-')) {
        return NextResponse.json({ success: true, project: { id, title: 'Local Project', status: 'draft', scenes: [] } });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (pErr) throw pErr;

    const { data: scenes, error: sErr } = await supabase
      .from('scenes')
      .select('*')
      .eq('project_id', id)
      .order('order');
    if (sErr) throw sErr;

    return NextResponse.json({ success: true, project: { ...project, scenes: scenes || [] } });

  } catch (err: any) {
    console.error('[PROJECT GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/projects/[id] ─── Update project title/status + upsert scenes ─
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (id.startsWith('local-')) return NextResponse.json({ success: true });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, status, scenes } = body;

    // Update project meta
    const updates: Record<string, unknown> = {};
    if (title  !== undefined) updates.title  = title;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    }

    // Upsert scenes — delete old then insert new (simple full replace)
    if (scenes && Array.isArray(scenes)) {
      await supabase.from('scenes').delete().eq('project_id', id);

      if (scenes.length > 0) {
        const sceneRows = (scenes as Scene[]).map((s, i) => ({
          project_id: id,
          script_text: s.script,
          avatar_id: s.avatarId,
          voice_id: s.voiceId,
          background_url: s.backgroundUrl,
          order: i,
          duration: s.duration,
        }));
        const { error } = await supabase.from('scenes').insert(sceneRows);
        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[PROJECT PATCH]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/projects/[id] ─── Delete a project ─────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: true });

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[PROJECT DELETE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
