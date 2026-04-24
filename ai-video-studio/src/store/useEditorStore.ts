import { create } from 'zustand';

export type Scene = {
  id: string;
  script: string;
  avatarId: string;
  voiceId: string;
  backgroundUrl: string;
  duration: number;
};

interface EditorState {
  // Project metadata
  projectId: string | null;
  projectTitle: string;
  isSaving: boolean;
  lastSaved: Date | null;

  // Scenes
  scenes: Scene[];
  selectedSceneId: string | null;

  // Actions
  setProject: (id: string, title: string) => void;
  setProjectTitle: (title: string) => void;
  setIsSaving: (v: boolean) => void;
  setLastSaved: (d: Date) => void;
  addScene: () => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  removeScene: (id: string) => void;
  selectScene: (id: string) => void;
  setScenes: (scenes: Scene[]) => void;
  resetEditor: () => void;
}

const defaultScene: Omit<Scene, 'id'> = {
  script: '',
  avatarId: 'stock_1',
  voiceId: 'en_adam',
  backgroundUrl: 'solid_gray',
  duration: 5.0,
};

export const useEditorStore = create<EditorState>((set) => ({
  projectId: null,
  projectTitle: 'Untitled Project',
  isSaving: false,
  lastSaved: null,

  scenes: [
    { ...defaultScene, id: '1', script: 'Welcome to this presentation.' }
  ],
  selectedSceneId: '1',

  setProject: (id, title) => set({ projectId: id, projectTitle: title }),
  setProjectTitle: (title) => set({ projectTitle: title }),
  setIsSaving: (v) => set({ isSaving: v }),
  setLastSaved: (d) => set({ lastSaved: d }),

  setScenes: (newScenes) => set({
    scenes: newScenes,
    selectedSceneId: newScenes[0]?.id || null
  }),

  addScene: () => set((state) => {
    const newId = `scene_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return {
      scenes: [...state.scenes, { ...defaultScene, id: newId }],
      selectedSceneId: newId,
    };
  }),

  updateScene: (id, updates) => set((state) => ({
    scenes: state.scenes.map((scene) =>
      scene.id === id ? { ...scene, ...updates } : scene
    ),
  })),

  removeScene: (id) => set((state) => {
    const newScenes = state.scenes.filter((s) => s.id !== id);
    return {
      scenes: newScenes,
      selectedSceneId: state.selectedSceneId === id ? (newScenes[0]?.id || null) : state.selectedSceneId,
    };
  }),

  selectScene: (id) => set({ selectedSceneId: id }),

  resetEditor: () => set({
    projectId: null,
    projectTitle: 'Untitled Project',
    isSaving: false,
    lastSaved: null,
    scenes: [{ ...defaultScene, id: '1', script: 'Welcome to this presentation.' }],
    selectedSceneId: '1',
  }),
}));
