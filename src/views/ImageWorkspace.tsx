import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, CheckCircle } from "@/components/ui/pixel-icon";

import { Button } from "@/components/ui/button";
import { MainPreview } from "@/components/browse/MainPreview";
import { InfoPanel } from "@/components/browse/InfoPanel";
import { Filmstrip } from "@/components/browse/Filmstrip";
import { TriageControls } from "@/components/triage/TriageControls";

import { useAppStore, useCurrentImage, useTriageProgress } from "@/stores/useAppStore";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useTriageKeys } from "@/hooks/useTriageKeys";
import { listImages, getThumbnail } from "@/lib/tauri";
import type { ImageFile } from "@/stores/useAppStore";

type WorkspaceMode = "browse" | "triage";

// Animation variants
const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
};

const infoPanelVariants = {
  visible: {
    width: 288, // w-72 = 18rem = 288px
    opacity: 1,
    transition: springTransition,
  },
  hidden: {
    width: 0,
    opacity: 0,
    transition: springTransition,
  },
};

export function ImageWorkspace() {
  // Read mode from store so component stays mounted across transitions
  const view = useAppStore((state) => state.view);
  const mode: WorkspaceMode = view === "triage" || view === "review" ? "triage" : "browse";
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingSessionRef = useRef(0);

  // Shared state
  const images = useAppStore((state) => state.images);
  const selectedIndex = useAppStore((state) => state.selectedIndex);
  const selectImage = useAppStore((state) => state.selectImage);
  const currentImage = useCurrentImage();
  const classifications = useAppStore((state) => state.classifications);

  const currentFolder = useAppStore((state) => state.currentFolder);
  const currentProject = useAppStore((state) => state.currentProject);
  const clearFolder = useAppStore((state) => state.clearFolder);
  const setImages = useAppStore((state) => state.setImages);
  const updateImageThumbnail = useAppStore((state) => state.updateImageThumbnail);

  // Browse mode actions
  const startTriage = useAppStore((state) => state.startTriage);

  // Triage mode state & actions
  const { current, total } = useTriageProgress();
  const resetTriage = useAppStore((state) => state.resetTriage);
  const finishTriage = useAppStore((state) => state.finishTriage);
  const isComplete = total > 0 && current > total;

  // Keyboard navigation (both modes)
  useKeyboardNav();
  // Triage shortcuts (only active in triage mode due to internal checks)
  useTriageKeys();

  // Load images when folder changes
  useEffect(() => {
    if (!currentFolder) return;

    const currentSession = ++loadingSessionRef.current;

    async function loadFolderImages() {
      try {
        setIsLoading(true);
        setError(null);

        const imageInfos = await listImages(currentFolder!.source_path);

        if (loadingSessionRef.current !== currentSession) return;

        if (imageInfos.length === 0) {
          setError("No images found in this folder");
          setImages([]);
          setIsLoading(false);
          return;
        }

        const loadedImages: ImageFile[] = imageInfos.map((info) => ({
          id: info.id,
          path: info.path,
          name: info.name,
          thumbnailUrl: null,
          size: info.size,
          dimensions:
            info.width && info.height
              ? { width: info.width, height: info.height }
              : undefined,
        }));

        setImages(loadedImages);
        setIsLoading(false);

        // Load thumbnails in background
        for (const image of loadedImages) {
          if (loadingSessionRef.current !== currentSession) return;

          try {
            const thumbnailUrl = await getThumbnail(image.path, 180);
            if (loadingSessionRef.current !== currentSession) return;
            updateImageThumbnail(image.id, thumbnailUrl);
          } catch (err) {
            console.error(`Failed to load thumbnail for ${image.name}:`, err);
          }
        }
      } catch (err) {
        console.error("Failed to load images:", err);
        setError(err instanceof Error ? err.message : "Failed to load images");
        setIsLoading(false);
      }
    }

    loadFolderImages();
  }, [currentFolder, setImages, updateImageThumbnail]);

  function getFolderName(path: string): string {
    return path.split(/[/\\]/).pop() || path;
  }

  function handleBack() {
    if (mode === "triage") {
      resetTriage();
    } else {
      clearFolder();
    }
  }

  // Derived values for animations
  const isTriage = mode === "triage";
  const thumbnailSize = isTriage ? 80 : 120;
  const filmstripHeight = thumbnailSize + 32; // thumbnail + padding for scaled selection (scale-105)

  // Empty states
  if (!currentFolder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No folder selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={handleBack}>
          Go Back
        </Button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No images loaded</p>
        <Button variant="outline" onClick={handleBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div data-slot="image-workspace" className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">
            {isTriage ? "Triage: " : ""}
            {getFolderName(currentFolder.source_path)}
          </h1>
          {currentProject && (
            <p className="truncate text-xs text-muted-foreground">
              {currentProject.name}
            </p>
          )}
        </div>

        {/* Right side actions - animated swap */}
        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {isTriage ? (
              <motion.div
                key="triage-header"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">
                    {Math.min(current, total)} / {total}
                  </span>
                  {isComplete && <CheckCircle size={20} className="text-keep" />}
                </div>
                <Button
                  onClick={finishTriage}
                  variant={isComplete ? "keep" : "outline"}
                  disabled={Object.keys(classifications).length === 0}
                >
                  {isComplete ? "Review & Finish" : "Review"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="browse-header"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="text-sm text-muted-foreground">
                  {images.length} images
                </span>
                {images.length > 0 && (
                  <Button onClick={startTriage} size="sm">
                    <Play size={16} className="mr-2" />
                    Start Triage
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Main preview - takes remaining space */}
        <MainPreview image={currentImage} className="min-w-0 flex-1" />

        {/* Info panel - animates width to 0 in triage mode */}
        <AnimatePresence>
          {!isTriage && (
            <motion.div
              key="info-panel"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={infoPanelVariants}
              className="flex-shrink-0 overflow-hidden"
            >
              <InfoPanel image={currentImage} className="h-full w-72" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom section - triage controls + filmstrip */}
      <div className="overflow-hidden">
        {/* Triage controls - slides up from filmstrip */}
        <AnimatePresence>
          {isTriage && (
            <motion.div
              key="triage-controls"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springTransition}
              className="overflow-hidden"
            >
              <TriageControls />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filmstrip */}
        <motion.div
          animate={{ height: filmstripHeight }}
          transition={springTransition}
          className="overflow-hidden"
        >
          <Filmstrip
            images={images}
            selectedIndex={selectedIndex}
            onSelect={selectImage}
            thumbnailSize={thumbnailSize}
            classifications={isTriage ? classifications : undefined}
            className="h-full"
          />
        </motion.div>
      </div>
    </div>
  );
}

export default ImageWorkspace;
