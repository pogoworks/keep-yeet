import { Button } from "@/components/ui/button";
import { Play } from "@/components/ui/pixel-icon";
import { MainPreview, Filmstrip, GlassInfoPanel } from "@/components/browse";

import { useFolderSession } from "@/hooks/useFolderSession";
import { useLocalKeyboardNav } from "@/hooks/useLocalKeyboardNav";

import type { Folder } from "@/lib/tauri";

interface FolderBrowseViewProps {
  folder: Folder;
  onStartTriage: () => void;
}

const THUMBNAIL_SIZE = 100;
const FILMSTRIP_HEIGHT = THUMBNAIL_SIZE + 32; // thumbnail + padding

/**
 * FolderBrowseView - Inline browse experience for a folder.
 * Composes MainPreview + Filmstrip with floating info panel.
 */
export function FolderBrowseView({
  folder,
  onStartTriage,
}: FolderBrowseViewProps) {
  const {
    images,
    selectedIndex,
    isLoading,
    error,
    currentImage,
    selectImage,
    navigateNext,
    navigatePrev,
  } = useFolderSession(folder.id, folder.source_path);

  // Local keyboard navigation
  useLocalKeyboardNav(navigateNext, navigatePrev, !isLoading);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading images...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No images in this folder</p>
      </div>
    );
  }

  return (
    <div data-slot="folder-browse-view" className="relative flex h-full flex-col">
      {/* Main preview area with floating elements */}
      <div data-slot="browse-preview-area" className="relative flex-1 overflow-hidden">
        <MainPreview image={currentImage} className="h-full" />

        {/* Glass info panel - top right */}
        <GlassInfoPanel
          image={currentImage}
          className="absolute top-4 right-4 z-10"
        />

        {/* Start Triage button - bottom right, above filmstrip */}
        <div className="pointer-events-none absolute bottom-4 right-4">
          <Button
            onClick={onStartTriage}
            size="lg"
            className="pointer-events-auto shadow-lg"
          >
            <Play size={16} className="mr-1.5" />
            Start Triage
          </Button>
        </div>
      </div>

      {/* Filmstrip */}
      <div
        style={{ height: FILMSTRIP_HEIGHT }}
        className="flex-shrink-0 border-t"
      >
        <Filmstrip
          images={images}
          selectedIndex={selectedIndex}
          onSelect={selectImage}
          thumbnailSize={THUMBNAIL_SIZE}
          className="h-full"
        />
      </div>
    </div>
  );
}
