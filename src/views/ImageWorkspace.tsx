import { useState, useEffect, useRef } from "react";
import { CheckCircle } from "@/components/ui/pixel-icon";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { MainPreview } from "@/components/browse/MainPreview";
import { Filmstrip } from "@/components/browse/Filmstrip";
import { TriageControls } from "@/components/triage/TriageControls";
import { TriageFeedback } from "@/components/triage/TriageFeedback";

import { useAppStore, useCurrentImage, useTriageProgress } from "@/stores/useAppStore";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useTriageKeys } from "@/hooks/useTriageKeys";
import { useEscapeNav } from "@/hooks/useEscapeNav";
import { useLastClassification } from "@/hooks/useLastClassification";
import { listImages, getThumbnail } from "@/lib/tauri";
import type { ImageFile } from "@/stores/useAppStore";

export function ImageWorkspace() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingSessionRef = useRef(0);

  // State
  const images = useAppStore((state) => state.images);
  const selectedIndex = useAppStore((state) => state.selectedIndex);
  const selectImage = useAppStore((state) => state.selectImage);
  const currentImage = useCurrentImage();
  const classifications = useAppStore((state) => state.classifications);

  const currentFolder = useAppStore((state) => state.currentFolder);
  const setImages = useAppStore((state) => state.setImages);
  const updateImageThumbnail = useAppStore((state) => state.updateImageThumbnail);

  // Triage state & actions
  const { current, total } = useTriageProgress();
  const finishTriage = useAppStore((state) => state.finishTriage);
  const isComplete = total > 0 && current > total;

  // Keyboard navigation and triage shortcuts
  useKeyboardNav();
  useTriageKeys();
  useEscapeNav(); // ESC → exit triage (with confirmation if in progress)

  // Track last classification for visual feedback
  const { lastClassification, classificationCount } = useLastClassification();

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

  // Layout constants
  const thumbnailSize = 72;
  const filmstripHeight = thumbnailSize + 24; // thumbnail + padding

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-3">
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
        Review
      </Button>
    </div>
  );

  // Footer - triage controls + filmstrip
  const footer = (
    <div className="border-t">
      <TriageControls />
      <div style={{ height: filmstripHeight }} className="overflow-hidden">
        <Filmstrip
          images={images}
          selectedIndex={selectedIndex}
          onSelect={selectImage}
          thumbnailSize={thumbnailSize}
          classifications={classifications}
          className="h-full"
        />
      </div>
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
      <TriageFeedback
        classificationCount={classificationCount}
        lastClassification={lastClassification}
        className="h-full"
      >
        <MainPreview image={currentImage} className="h-full" />
      </TriageFeedback>
    </AppShell>
  );
}

export default ImageWorkspace;
