import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "@/components/ui/pixel-icon";

import { Button } from "@/components/ui/button";
import { StartTriageButton } from "@/components/ui/start-triage-button";
import { AppShell } from "@/components/layout/AppShell";
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
    width: 256, // w-64 = 16rem = 256px (slightly narrower)
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
  const setImages = useAppStore((state) => state.setImages);
  const updateImageThumbnail = useAppStore((state) => state.updateImageThumbnail);

  // Triage mode state & actions
  const { current, total } = useTriageProgress();
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

  // Derived values for animations
  const isTriage = mode === "triage";
  const thumbnailSize = isTriage ? 72 : 100;
  const filmstripHeight = thumbnailSize + 24; // thumbnail + padding

  // Header actions - animated swap between browse/triage modes
  const headerActions = (
    <AnimatePresence mode="wait">
      {isTriage ? (
        <motion.div
          key="triage-header"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium tabular-nums text-muted-foreground">
              {Math.min(current, total)}/{total}
            </span>
            {isComplete && <CheckCircle size={14} className="text-keep" />}
          </div>
          <Button
            onClick={finishTriage}
            variant={isComplete ? "keep" : "outline"}
            size="sm"
            disabled={Object.keys(classifications).length === 0}
          >
            {isComplete ? "Review" : "Review"}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="browse-header"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">
            {images.length} images
          </span>
          {images.length > 0 && <StartTriageButton label="Triage" />}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Footer - triage controls + filmstrip
  const footer = (
    <div className="border-t">
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
  );

  // Empty/loading states
  if (!currentFolder) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">No folder selected</p>
        </div>
      </AppShell>
    );
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading images...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (images.length === 0) {
    return (
      <AppShell>
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">No images loaded</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      headerActions={headerActions}
      footer={footer}
      contentScrolls={false}
    >
      {/* Main content area - preview + optional info panel */}
      <div className="flex h-full min-h-0 overflow-hidden">
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
              className="flex-shrink-0 overflow-hidden border-l"
            >
              <InfoPanel image={currentImage} className="h-full w-64" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

export default ImageWorkspace;
