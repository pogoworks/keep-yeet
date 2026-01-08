import { useState, useEffect, useCallback } from "react";
import { listOutputImages, getThumbnail } from "@/lib/tauri";
import type { ImageFile } from "@/stores/useAppStore";

export type GalleryTab = "keep" | "maybe";

export interface GallerySession {
  tab: GalleryTab;
  setTab: (tab: GalleryTab) => void;
  images: ImageFile[];
  selectedIndex: number;
  isLoading: boolean;
  error: string | null;
  currentImage: ImageFile | undefined;
  selectImage: (index: number) => void;
  navigateNext: () => void;
  navigatePrev: () => void;
  totalSize: number;
  refresh: () => void;
}

/**
 * Hook for managing gallery state (keeps/maybes tabs).
 * Loads images from project output directories.
 */
export function useGallerySession(projectPath: string | null): GallerySession {
  const [tab, setTab] = useState<GalleryTab>("keep");
  const [keepImages, setKeepImages] = useState<ImageFile[]>([]);
  const [maybeImages, setMaybeImages] = useState<ImageFile[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<{
    keep: number;
    maybe: number;
  }>({ keep: 0, maybe: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  // Load images for current tab
  useEffect(() => {
    if (!projectPath) {
      setKeepImages([]);
      setMaybeImages([]);
      return;
    }

    let cancelled = false;

    async function loadImages() {
      try {
        setIsLoading(true);
        setError(null);

        const classification = tab === "keep" ? "keep" : "maybe";
        // projectPath is guaranteed non-null here due to early return
        const outputImages = await listOutputImages(projectPath!, classification);

        if (cancelled) return;

        const imageFiles: ImageFile[] = outputImages.map((info) => ({
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

        // Set images for current tab
        if (tab === "keep") {
          setKeepImages(imageFiles);
        } else {
          setMaybeImages(imageFiles);
        }

        setIsLoading(false);

        // Load thumbnails in background
        for (const image of imageFiles) {
          if (cancelled) break;
          try {
            const thumbnailUrl = await getThumbnail(image.path, 100);
            if (!cancelled) {
              if (tab === "keep") {
                setKeepImages((prev) =>
                  prev.map((img) =>
                    img.id === image.id ? { ...img, thumbnailUrl } : img
                  )
                );
              } else {
                setMaybeImages((prev) =>
                  prev.map((img) =>
                    img.id === image.id ? { ...img, thumbnailUrl } : img
                  )
                );
              }
            }
          } catch (err) {
            console.error(`Failed to load thumbnail for ${image.name}:`, err);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load images"
          );
          setIsLoading(false);
        }
      }
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [projectPath, tab, loadKey]);

  const images = tab === "keep" ? keepImages : maybeImages;
  const selectedIndex = selectedIndexes[tab];
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);

  const selectImage = useCallback(
    (index: number) => {
      setSelectedIndexes((prev) => ({ ...prev, [tab]: index }));
    },
    [tab]
  );

  const navigateNext = useCallback(() => {
    setSelectedIndexes((prev) => ({
      ...prev,
      [tab]: Math.min(prev[tab] + 1, images.length - 1),
    }));
  }, [tab, images.length]);

  const navigatePrev = useCallback(() => {
    setSelectedIndexes((prev) => ({
      ...prev,
      [tab]: Math.max(prev[tab] - 1, 0),
    }));
  }, [tab]);

  const refresh = useCallback(() => {
    setLoadKey((k) => k + 1);
  }, []);

  const currentImage = images[selectedIndex];

  return {
    tab,
    setTab,
    images,
    selectedIndex,
    isLoading,
    error,
    currentImage,
    selectImage,
    navigateNext,
    navigatePrev,
    totalSize,
    refresh,
  };
}
