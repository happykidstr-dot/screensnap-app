"use client";

import {
  Plus, Video, LayoutTemplate, Clock, Sparkles, FolderOpen,
  Coins, ChevronRight, PlayCircle, X, AlignLeft, FileText,
  Globe, Loader2, ArrowLeft, LogOut, Trash2, User
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";
import { supabase } from "@/lib/supabase";
import type { User as SBUser } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  status: "draft" | "rendering" | "completed" | "failed";
  created_at: string;
}

const mockTemplates = [
  { id: 1, title: "Webinar Promo",    category: "Education",  time: "0:45", color: "from-blue-500/20 to-purple-500/20" },
  { id: 2, title: "Product Explainer",category: "Marketing",  time: "1:20", color: "from-emerald-500/20 to-teal-500/20" },
  { id: 3, title: "Internal Comms",   category: "Corporate",  time: "2:00", color: "from-orange-500/20 to-red-500/20" },
  { id: 4, title: "Course Intro",     category: "E-Learning", time: "1:15", color: "from-pink-500/20 to-rose-500/20" },
];

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  rendering: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  draft:     "bg-zinc-800 text-zinc-400 border border-zinc-700",
  failed:    "bg-red-500/10 text-red-400 border border-red-500/20",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const { setScenes, setProject, resetEditor } = useEditorStore();

  const [user, setUser]             = useState<SBUser | null>(null);
  const [projects, setProjects]     = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen]       = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [promptText, setPromptText]     = useState("");
  const [generating, setGenerating]     = useState(false);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Projects ────────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const openProject = (project: Project) => {
    setProject(project.id, project.title);
    router.push(`/editor/${project.id}`);
  };

  // ── Create New ──────────────────────────────────────────────────────────────
  const handleCreate = () => {
    resetEditor();
    setModalOpen(true);
    setCreationStep(0);
    setPromptText("");
  };

  const handleGenerateAI = async () => {
    if (!promptText.trim()) return;
    setGenerating(true);

    try {
      const res  = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();

      if (data.success && data.scenes) {
        setScenes(data.scenes);

        // Create project in Supabase
        const saveRes = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: promptText.slice(0, 60) || 'Untitled Project', scenes: data.scenes }),
        });
        const saveData = await saveRes.json();

        if (saveData.project?.id) {
          setProject(saveData.project.id, saveData.project.title);
          router.push(`/editor/${saveData.project.id}`);
        } else {
          router.push("/editor");
        }
      } else {
        alert("Failed to generate script. Check console.");
        setGenerating(false);
      }
    } catch (e) {
      console.error(e);
      alert("Network error during generation.");
      setGenerating(false);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans relative">

      {/* ── Creation Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          {creationStep === 0 && (
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" /> Create New Video
                </h2>
                <button id="btn-modal-close" onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <button
                  id="btn-start-text"
                  onClick={() => setCreationStep(1)}
                  className="flex flex-col items-start gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white mb-1">Start from Text</h3>
                    <p className="text-sm text-zinc-400">Type an idea or paste content. AI will write a script and build the scenes.</p>
                  </div>
                </button>

                {[
                  { icon: LayoutTemplate, label: "Start from Template", desc: "Choose a layout and populate your content manually.", color: "blue" },
                  { icon: FileText,       label: "Upload PDF / PPT",    desc: "Convert existing slide decks or documents directly to videos.", color: "emerald" },
                  { icon: Globe,          label: "Paste URL",            desc: "Automatically summarize a blog post or news article into a video.", color: "orange" },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <button key={label} disabled className={`flex flex-col items-start gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-left opacity-50 cursor-not-allowed relative`}>
                    <span className={`absolute top-2 right-2 text-[10px] font-medium text-${color}-400 bg-${color}-500/10 px-2 py-0.5 rounded-full border border-${color}-500/20`}>Soon</span>
                    <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 text-${color}-400 flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white mb-1">{label}</h3>
                      <p className="text-sm text-zinc-400">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {creationStep === 1 && (
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/40">
                <button onClick={() => setCreationStep(0)} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-lg font-bold">What is the topic?</h2>
                <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <textarea
                  id="textarea-prompt"
                  className="w-full h-40 bg-black border border-zinc-700 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none leading-relaxed"
                  placeholder="Describe what your video should be about. E.g. 'Create a 3 scene explainer about our new enterprise plan...'"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="px-6 pb-6 flex justify-end">
                <button
                  id="btn-generate-script"
                  onClick={handleGenerateAI}
                  disabled={!promptText.trim() || generating}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Script</>}
                </button>
              </div>
            </div>
          )}

          {generating && creationStep === 1 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/90 border border-purple-500/30 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(138,43,226,0.15)] backdrop-blur-md">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">AI is working…</h2>
                <p className="text-zinc-400 text-center animate-pulse">Structuring scenes, matching avatars, and drafting your script.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 border-r border-zinc-800/50 flex flex-col p-4 bg-zinc-950">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8A2BE2] to-[#4B0082] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">AI Video Studio</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-sm font-medium text-white">
            <FolderOpen className="w-4 h-4 text-zinc-400" /> Projects
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <LayoutTemplate className="w-4 h-4" /> Templates
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <Video className="w-4 h-4" /> Avatars & Voices
          </Link>
        </nav>

        <div className="mt-auto pt-4 border-t border-zinc-800/50 space-y-3">
          {/* Credits */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            <span className="text-sm font-bold">145<span className="text-zinc-500 font-normal">/200</span></span>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-xs text-zinc-300 truncate">{displayName}</span>
              </div>
              <button
                id="btn-signout"
                onClick={handleSignOut}
                title="Sign out"
                className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button className="w-full py-2 px-3 flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold rounded-md hover:bg-zinc-200 transition-colors">
            Upgrade Plan
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-8 relative">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#8A2BE2]/5 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">
                Welcome back, {displayName} 👋
              </h1>
              <p className="text-zinc-400">What kind of video are we creating today?</p>
            </div>
            <button
              id="btn-create-video"
              onClick={handleCreate}
              className="flex items-center gap-2 bg-[#8A2BE2] hover:bg-[#7924c5] text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-[0_0_15px_rgba(138,43,226,0.3)] hover:shadow-[0_0_25px_rgba(138,43,226,0.5)]"
            >
              <Plus className="w-5 h-5" /> Create Video
            </button>
          </div>

          {/* Templates */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Start with a Template
              </h2>
              <button className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockTemplates.map(template => (
                <div key={template.id} className="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-1 flex flex-col cursor-pointer hover:border-zinc-700 transition-all">
                  <div className={`h-32 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center relative overflow-hidden`}>
                    <PlayCircle className="w-10 h-10 text-white/50 group-hover:text-white/80 transition-colors group-hover:scale-110 duration-300" />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[10px] font-medium text-white/80">
                      {template.time}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-[15px] mb-1 group-hover:text-purple-300 transition-colors">{template.title}</h3>
                    <p className="text-xs text-zinc-500">{template.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Projects */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" /> Recent Projects
              </h2>
              {!loadingProjects && projects.length > 0 && (
                <span className="text-xs text-zinc-500">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
              )}
            </div>

            {loadingProjects ? (
              <div className="flex items-center justify-center py-16 text-zinc-600">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading projects…
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl py-16 flex flex-col items-center gap-4 text-zinc-600">
                <FolderOpen className="w-10 h-10" />
                <div className="text-center">
                  <p className="font-medium text-zinc-400">No projects yet</p>
                  <p className="text-sm mt-1">Click "Create Video" to generate your first AI video.</p>
                </div>
                <button
                  onClick={handleCreate}
                  className="mt-2 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  <Plus className="w-4 h-4" /> Create First Video
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/50 text-sm font-medium text-zinc-400 bg-zinc-900/80">
                      <th className="py-3 px-4 font-medium">Project Name</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Created</th>
                      <th className="py-3 px-4 font-medium w-10" />
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {projects.map(project => (
                      <tr
                        key={project.id}
                        onClick={() => openProject(project)}
                        className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-7 rounded bg-zinc-800 flex items-center justify-center shrink-0">
                              <Video className="w-3 h-3 text-zinc-600" />
                            </div>
                            <span className="font-medium group-hover:text-purple-300 transition-colors truncate max-w-xs">{project.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[project.status] || STATUS_STYLE.draft}`}>
                            {project.status === "rendering" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />}
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">{timeAgo(project.created_at)}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            disabled={deletingId === project.id}
                            className="p-1.5 rounded opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            title="Delete project"
                          >
                            {deletingId === project.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
