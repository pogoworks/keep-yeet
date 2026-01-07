import { useEffect, useRef, useState } from "react";
import {
  useAppStore,
  useCurrentImage,
  type ImageFile,
} from "@/stores/useAppStore";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { Filmstrip, MainPreview, InfoPanel } from "@/components/browse";
import { Button } from "@/components/ui/button";
import { listImages, getThumbnail } from "@/lib/tauri";
import { ArrowLeft, Play } from "lucide-react";

/**
 * BrowseView - Main view for browsing images in a folder.
 * Layout: Header + MainPreview (center) + InfoPanel (right sidebar) + Filmstrip (bottom)
 */
export function BrowseView() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingSessionRef = useRef(0);

  const images = useAppStore((state) => state.images);
  const selectedIndex = useAppStore((state) => state.selectedIndex);
  const selectImage = useAppStore((state) => state.selectImage);
  const currentImage = useCurrentImage();

  const currentFolder = useAppStore((state) => state.currentFolder);
  const currentProject = useAppStore((state) => state.currentProject);
  const clearFolder = useAppStore((state) => state.clearFolder);
  const setImages = useAppStore((state) => state.setImages);
  const updateImageThumbnail = useAppStore(
    (state) => state.updateImageThumbnail
  );
  const startTriage = useAppStore((state) => state.startTriage);

  // Enable keyboard navigation (arrow keys)
  useKeyboardNav();

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

        // Convert to ImageFile format
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
    // Handle both Unix and Windows path separators
    return path.split(/[\/\\]/).pop() || path;
  }

  if (!currentFolder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No folder selected</p>
      </div>
    );
  }

  return (
    <div data-slot="browse-view" className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={clearFolder}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate">
            {getFolderName(currentFolder.source_path)}
          </h1>
          {currentProject && (
            <p className="text-xs text-muted-foreground truncate">
              {currentProject.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {images.length} images
          </span>
          {images.length > 0 && (
            <Button onClick={startTriage} size="sm">
              <Play className="mr-2 size-4" />
              Start Triage
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading images...</p>
        </div>
      ) : error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={clearFolder}>
            Go Back
          </Button>
        </div>
      ) : (
        <>
          {/* Main content area */}
          <div className="flex min-h-0 flex-1">
            {/* Main preview - takes most space */}
            <MainPreview image={currentImage} className="min-w-0 flex-1" />

            {/* Info panel - right sidebar */}
            <InfoPanel image={currentImage} />
          </div>

          {/* Filmstrip - bottom */}
          <Filmstrip
            images={images}
            selectedIndex={selectedIndex}
            onSelect={selectImage}
            thumbnailSize={180}
          />
        </>
      )}
    </div>
  );
}
