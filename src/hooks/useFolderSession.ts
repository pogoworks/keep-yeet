import { useState, useEffect, useCallback } from "react";
import { useAppStore, type ImageFile } from "@/stores/useAppStore";

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
 * Reads from the store's folder cache for instant tab switching.
 * Selection state is local to each tab instance.
 */
export function useFolderSession(
  folderId: string | null,
  sourcePath: string | null
): FolderSession {
  // Get cache and refresh action from store
  const folderCache = useAppStore((state) => state.folderCache);
  const refreshFolderCache = useAppStore((state) => state.refreshFolderCache);

  // Local selection state (per-tab, not cached)
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Get cached data for this folder
  const cacheEntry = folderId ? folderCache[folderId] : undefined;

  // Reset selection when folder changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [folderId]);

  // If not in cache and we have a valid folder, trigger load
  useEffect(() => {
    if (folderId && sourcePath && !cacheEntry) {
      refreshFolderCache(folderId, sourcePath);
    }
  }, [folderId, sourcePath, cacheEntry, refreshFolderCache]);

  // Derive state from cache
  const images = cacheEntry?.images ?? [];
  const isLoading = cacheEntry?.status === "loading" || (!cacheEntry && !!folderId);
  const error = cacheEntry?.status === "error" ? (cacheEntry.error ?? "Failed to load") : null;

  // Navigation methods
  const selectImage = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const navigateNext = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, images.length - 1));
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
