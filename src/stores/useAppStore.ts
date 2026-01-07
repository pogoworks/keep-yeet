import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Classification = "keep" | "maybe" | "yeet";
export type AppMode = "landing" | "browse" | "triage" | "review";

export interface ImageFile {
  id: string;
  path: string;
  name: string;
  thumbnailUrl: string | null;
  size: number;
  dimensions?: { width: number; height: number };
}

interface AppState {
  // Folder state
  currentFolder: string | null;
  recentFolders: string[];

  // Image state
  images: ImageFile[];
  selectedIndex: number;

  // Triage state
  mode: AppMode;
  sessionName: string | null;
  classifications: Record<string, Classification>;
  triageIndex: number;

  // Actions
  setCurrentFolder: (folder: string | null) => void;
  addRecentFolder: (folder: string) => void;
  setImages: (images: ImageFile[]) => void;
  updateImageThumbnail: (id: string, thumbnailUrl: string) => void;
  selectImage: (index: number) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  setMode: (mode: AppMode) => void;
  startTriage: (sessionName: string) => void;
  classify: (classification: Classification) => void;
  reclassify: (imageId: string, classification: Classification) => void;
  finishTriage: () => void;
  resetTriage: () => void;
  reset: () => void;
}

const initialState = {
  currentFolder: null,
  recentFolders: [],
  images: [],
  selectedIndex: 0,
  mode: "landing" as AppMode,
  sessionName: null,
  classifications: {},
  triageIndex: 0,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentFolder: (folder) => set({ currentFolder: folder }),

      addRecentFolder: (folder) => {
        const { recentFolders } = get();
        const filtered = recentFolders.filter((f) => f !== folder);
        set({ recentFolders: [folder, ...filtered].slice(0, 10) });
      },

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
        const { selectedIndex, images, mode, triageIndex } = get();
        if (mode === "triage") {
          // In triage mode, navigate through unclassified images
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
        const { selectedIndex, mode, triageIndex } = get();
        if (mode === "triage") {
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

      setMode: (mode) => set({ mode }),

      startTriage: (sessionName) => {
        set({
          mode: "triage",
          sessionName,
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
          mode: isComplete ? "review" : "triage",
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
        set({ mode: "review" });
      },

      resetTriage: () => {
        set({
          mode: "browse",
          sessionName: null,
          classifications: {},
          triageIndex: 0,
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: "toss-storage",
      partialize: (state) => ({
        recentFolders: state.recentFolders,
      }),
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
