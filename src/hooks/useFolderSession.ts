import { useState, useEffect, useRef, useCallback } from "react";
import { listImages, getThumbnail } from "@/lib/tauri";
import type { ImageFile } from "@/stores/useAppStore";

export interface FolderSession {
  images: ImageFile[];
  selectedIndex: number;
  isLoading: boolean;
  error: string | null;
  currentImage: ImageFile | undefined;
  selectImage: (index: number) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
}

/**
 * Hook for managing per-folder image state.
 * Encapsulates image loading, selection, and navigation for inline browsing.
 */
export function useFolderSession(
  folderId: string | null,
  sourcePath: string | null
): FolderSession {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingSessionRef = useRef(0);

  // Load images when folder changes
  useEffect(() => {
    if (!folderId || !sourcePath) {
      setImages([]);
      setSelectedIndex(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    const currentSession = ++loadingSessionRef.current;

    async function loadFolderImages() {
      try {
        setIsLoading(true);
        setError(null);

        const imageInfos = await listImages(sourcePath!);

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
        setSelectedIndex(0);
        setIsLoading(false);

        // Load thumbnails in background
        for (const image of loadedImages) {
          // Check session BEFORE any async work
          if (loadingSessionRef.current !== currentSession) return;

          try {
            const thumbnailUrl = await getThumbnail(image.path, 180);

            // Check session AFTER async work, before state update
            if (loadingSessionRef.current !== currentSession) return;

            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id ? { ...img, thumbnailUrl } : img
              )
            );
          } catch (err) {
            // Check session before logging to avoid noise from cancelled loads
            if (loadingSessionRef.current !== currentSession) return;
            console.error(`Failed to load thumbnail for ${image.name}:`, err);
          }
        }
      } catch (err) {
        console.error("Failed to load images:", err);
        if (loadingSessionRef.current !== currentSession) return;
        setError(err instanceof Error ? err.message : "Failed to load images");
        setIsLoading(false);
      }
    }

    loadFolderImages();
  }, [folderId, sourcePath]);

  // Navigation methods
  const selectImage = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const navigateNext = useCallback(() => {
    setSelectedIndex((prev) => {
      const maxIndex = images.length - 1;
      return Math.min(prev + 1, maxIndex);
    });
  }, [images.length]);

  const navigatePrev = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const currentImage = images[selectedIndex];

  return {
    images,
    selectedIndex,
    isLoading,
    error,
    currentImage,
    selectImage,
    navigateNext,
    navigatePrev,
  };
}
