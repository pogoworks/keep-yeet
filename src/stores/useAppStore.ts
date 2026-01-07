import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Project,
  ProjectSummary,
  Folder,
  ProjectStats,
} from "@/lib/tauri";
import {
  listProjects as fetchProjects,
  getProject as fetchProject,
  getProjectStats as fetchProjectStats,
} from "@/lib/tauri";

export type Classification = "keep" | "maybe" | "yeet";
export type AppView =
  | "projects"
  | "project-detail"
  | "browse"
  | "triage"
  | "review";

export interface ImageFile {
  id: string;
  path: string;
  name: string;
  thumbnailUrl: string | null;
  size: number;
  dimensions?: { width: number; height: number };
}

interface AppState {
  // Navigation
  view: AppView;

  // Project state
  projects: ProjectSummary[];
  currentProject: Project | null;
  currentProjectPath: string | null;
  currentProjectStats: ProjectStats | null;
  currentFolder: Folder | null;

  // Image state (for browse/triage)
  images: ImageFile[];
  selectedIndex: number;

  // Triage state
  classifications: Record<string, Classification>;
  triageIndex: number;

  // Actions - Navigation
  setView: (view: AppView) => void;

  // Actions - Projects
  loadProjects: () => Promise<void>;
  selectProject: (projectSummary: ProjectSummary) => Promise<void>;
  clearProject: () => void;
  refreshProjectStats: () => Promise<void>;

  // Actions - Folders
  selectFolder: (folder: Folder) => void;
  clearFolder: () => void;

  // Actions - Images
  setImages: (images: ImageFile[]) => void;
  updateImageThumbnail: (id: string, thumbnailUrl: string) => void;
  selectImage: (index: number) => void;
  navigateNext: () => void;
  navigatePrev: () => void;

  // Actions - Triage
  startTriage: () => void;
  classify: (classification: Classification) => void;
  reclassify: (imageId: string, classification: Classification) => void;
  finishTriage: () => void;
  resetTriage: () => void;

  // Actions - Reset
  reset: () => void;
}

const initialState = {
  view: "projects" as AppView,
  projects: [] as ProjectSummary[],
  currentProject: null as Project | null,
  currentProjectPath: null as string | null,
  currentProjectStats: null as ProjectStats | null,
  currentFolder: null as Folder | null,
  images: [] as ImageFile[],
  selectedIndex: 0,
  classifications: {} as Record<string, Classification>,
  triageIndex: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      setView: (view) => set({ view }),

      // Projects
      loadProjects: async () => {
        const projects = await fetchProjects();
        set({ projects });
      },

      selectProject: async (projectSummary) => {
        const project = await fetchProject(projectSummary.path);
        const stats = await fetchProjectStats(projectSummary.path);
        set({
          currentProject: project,
          currentProjectPath: projectSummary.path,
          currentProjectStats: stats,
          view: "project-detail",
        });
      },

      clearProject: () => {
        set({
          currentProject: null,
          currentProjectPath: null,
          currentProjectStats: null,
          currentFolder: null,
          view: "projects",
        });
      },

      refreshProjectStats: async () => {
        const { currentProjectPath } = get();
        if (!currentProjectPath) return;
        const project = await fetchProject(currentProjectPath);
        const stats = await fetchProjectStats(currentProjectPath);
        set({ currentProject: project, currentProjectStats: stats });
      },

      // Folders
      selectFolder: (folder) => {
        set({ currentFolder: folder, view: "browse" });
      },

      clearFolder: () => {
        set({
          currentFolder: null,
          images: [],
          selectedIndex: 0,
          classifications: {},
          triageIndex: 0,
          view: "project-detail",
        });
      },

      // Images
      setImages: (images) => set({ images, selectedIndex: 0 }),

      updateImageThumbnail: (id, thumbnailUrl) => {
        const { images } = get();
        set({
          images: images.map((img) =>
            img.id === id ? { ...img, thumbnailUrl } : img
          ),
        });
      },

      selectImage: (index) => {
        const { images } = get();
        if (index >= 0 && index < images.length) {
          set({ selectedIndex: index });
        }
      },

      navigateNext: () => {
        const { selectedIndex, images, view, triageIndex } = get();
        if (view === "triage") {
          const nextIndex = triageIndex + 1;
          if (nextIndex < images.length) {
            set({ triageIndex: nextIndex, selectedIndex: nextIndex });
          }
        } else {
          if (selectedIndex < images.length - 1) {
            set({ selectedIndex: selectedIndex + 1 });
          }
        }
      },

      navigatePrev: () => {
        const { selectedIndex, view, triageIndex } = get();
        if (view === "triage") {
          const prevIndex = triageIndex - 1;
          if (prevIndex >= 0) {
            set({ triageIndex: prevIndex, selectedIndex: prevIndex });
          }
        } else {
          if (selectedIndex > 0) {
            set({ selectedIndex: selectedIndex - 1 });
          }
        }
      },

      // Triage
      startTriage: () => {
        set({
          view: "triage",
          classifications: {},
          triageIndex: 0,
          selectedIndex: 0,
        });
      },

      classify: (classification) => {
        const { images, triageIndex, classifications } = get();
        const currentImage = images[triageIndex];
        if (!currentImage) return;

        const newClassifications = {
          ...classifications,
          [currentImage.id]: classification,
        };

        const nextIndex = triageIndex + 1;
        const isComplete = nextIndex >= images.length;

        set({
          classifications: newClassifications,
          triageIndex: isComplete ? triageIndex : nextIndex,
          selectedIndex: isComplete ? triageIndex : nextIndex,
          view: isComplete ? "review" : "triage",
        });
      },

      reclassify: (imageId, classification) => {
        const { classifications } = get();
        set({
          classifications: {
            ...classifications,
            [imageId]: classification,
          },
        });
      },

      finishTriage: () => {
        set({ view: "review" });
      },

      resetTriage: () => {
        set({
          view: "browse",
          classifications: {},
          triageIndex: 0,
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: "toss-storage",
      partialize: () => ({}), // Don't persist anything for now
    }
  )
);

// Selectors
export const useCurrentImage = () =>
  useAppStore((state) => state.images[state.selectedIndex]);

export const useTriageProgress = () =>
  useAppStore((state) => ({
    current: state.triageIndex + 1,
    total: state.images.length,
  }));

export const useClassifiedImages = () =>
  useAppStore((state) => {
    const { images, classifications } = state;
    return {
      keep: images.filter((img) => classifications[img.id] === "keep"),
      maybe: images.filter((img) => classifications[img.id] === "maybe"),
      yeet: images.filter((img) => classifications[img.id] === "yeet"),
    };
  });
