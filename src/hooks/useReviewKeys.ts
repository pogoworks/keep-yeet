import { useEffect, useCallback } from "react";
import { useAppStore, type Classification, type ImageFile } from "@/stores/useAppStore";

interface ClassifiedImages {
  keep: ImageFile[];
  maybe: ImageFile[];
  yeet: ImageFile[];
}

/**
 * Hook for review mode keyboard shortcuts.
 * - Arrow Up/Down: Navigate within current column (single select)
 * - Shift + Arrow Up/Down: Extend selection
 * - Arrow Left/Right: Navigate between columns
 * - Alt + Arrow Left/Right: Move selected images to adjacent column
 * - Enter: Reclassify selected to Keep
 * - Backspace: Reclassify selected to Yeet
 * - Cmd/Ctrl + Enter OR Cmd/Ctrl + Backspace: Reclassify selected to Maybe
 */
export function useReviewKeys(
  classifiedImages: ClassifiedImages,
  selectedImageIds: Set<string>,
  setSelectedImageIds: React.Dispatch<React.SetStateAction<Set<string>>>,
  focusedImageId: string | null,
  setFocusedImageId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const view = useAppStore((state) => state.view);
  const reclassifyBatch = useAppStore((state) => state.reclassifyBatch);

  // Find which column and index an image is in
  const findImageLocation = useCallback((imageId: string | null) => {
    if (!imageId) return null;

    const columns: Classification[] = ["keep", "maybe", "yeet"];
    for (const col of columns) {
      const index = classifiedImages[col].findIndex((img) => img.id === imageId);
      if (index !== -1) {
        return { column: col, index };
      }
    }
    return null;
  }, [classifiedImages]);

  useEffect(() => {
    // Only active in review view
    if (view !== "review") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const location = findImageLocation(focusedImageId);
      const columns: Classification[] = ["keep", "maybe", "yeet"];

      // Arrow Up/Down navigation
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();

        if (!location) {
          // Select first image in first non-empty column
          for (const col of columns) {
            if (classifiedImages[col].length > 0) {
              const firstId = classifiedImages[col][0].id;
              setSelectedImageIds(new Set([firstId]));
              setFocusedImageId(firstId);
              break;
            }
          }
          return;
        }

        const currentColumn = classifiedImages[location.column];
        const newIndex = e.key === "ArrowUp"
          ? Math.max(0, location.index - 1)
          : Math.min(currentColumn.length - 1, location.index + 1);

        const newImageId = currentColumn[newIndex]?.id;
        if (!newImageId) return;

        if (e.shiftKey) {
          // Shift+Arrow: Extend selection
          setSelectedImageIds((prev) => {
            const next = new Set(prev);
            next.add(newImageId);
            return next;
          });
        } else {
          // Regular Arrow: Single select
          setSelectedImageIds(new Set([newImageId]));
        }
        setFocusedImageId(newImageId);
        return;
      }

      // Arrow Left/Right navigation
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();

        const colIndex = location ? columns.indexOf(location.column) : -1;
        const direction = e.key === "ArrowLeft" ? -1 : 1;

        // Alt + Arrow: Move all selected images to adjacent column
        if (e.altKey && selectedImageIds.size > 0 && location) {
          const targetColIndex = colIndex + direction;
          // Don't wrap around - only move if there's an adjacent column
          if (targetColIndex >= 0 && targetColIndex < columns.length) {
            const targetClassification = columns[targetColIndex];
            // Move all in single atomic operation
            reclassifyBatch(Array.from(selectedImageIds), targetClassification);
            // Clear selection after move
            setSelectedImageIds(new Set());
            setFocusedImageId(null);
          }
          return;
        }

        // Regular Arrow: Navigate between columns
        if (!location) {
          // Select first image in first non-empty column
          for (const col of columns) {
            if (classifiedImages[col].length > 0) {
              const firstId = classifiedImages[col][0].id;
              setSelectedImageIds(new Set([firstId]));
              setFocusedImageId(firstId);
              break;
            }
          }
          return;
        }

        // Find next non-empty column
        for (let i = 1; i <= columns.length; i++) {
          const newColIndex = (colIndex + direction * i + columns.length) % columns.length;
          const newColumn = classifiedImages[columns[newColIndex]];
          if (newColumn.length > 0) {
            // Try to maintain similar position, or go to last item
            const newIndex = Math.min(location.index, newColumn.length - 1);
            const newImageId = newColumn[newIndex].id;
            setSelectedImageIds(new Set([newImageId]));
            setFocusedImageId(newImageId);
            break;
          }
        }
        return;
      }

      // Reclassification shortcuts - apply to all selected
      if (selectedImageIds.size === 0) return;

      // Helper to reclassify all selected and clear selection
      const reclassifySelected = (classification: Classification) => {
        reclassifyBatch(Array.from(selectedImageIds), classification);
        setSelectedImageIds(new Set());
        setFocusedImageId(null);
      };

      // Maybe: Cmd/Ctrl + Enter OR Cmd/Ctrl + Backspace
      if ((e.metaKey || e.ctrlKey) && (e.key === "Enter" || e.key === "Backspace")) {
        e.preventDefault();
        reclassifySelected("maybe");
        return;
      }

      // Keep: Enter (without modifier)
      if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        reclassifySelected("keep");
        return;
      }

      // Yeet: Backspace (without modifier)
      if (e.key === "Backspace" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        reclassifySelected("yeet");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, focusedImageId, selectedImageIds, classifiedImages, reclassifyBatch, findImageLocation, setSelectedImageIds, setFocusedImageId]);
}
