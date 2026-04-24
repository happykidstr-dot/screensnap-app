"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEditorStore } from "@/store/useEditorStore";

export default function EditorRedirect() {
  const router = useRouter();
  const { projectId } = useEditorStore();

  useEffect(() => {
    if (projectId) {
      router.replace(`/editor/${projectId}`);
    } else {
      // No active project → go back to dashboard to create one
      router.replace("/");
    }
  }, [projectId, router]);

  return (
    <div className="flex min-h-screen bg-black items-center justify-center">
      <div className="text-zinc-400 text-sm animate-pulse">Redirecting…</div>
    </div>
  );
}

