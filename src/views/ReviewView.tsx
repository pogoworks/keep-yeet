import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";

import { AppShell } from "@/components/layout/AppShell";
import { ReviewHeaderActions } from "@/components/review/ReviewHeader";
import { ReviewGrid } from "@/components/review/ReviewGrid";
import { Button } from "@/components/ui/button";
import { Check, Trash, Undo } from "@/components/ui/pixel-icon";
import {
  useAppStore,
  type Classification,
  type ImageFile,
} from "@/stores/useAppStore";
import { useReviewKeys } from "@/hooks/useReviewKeys";
import { executeTriage } from "@/lib/tauri";

interface TriageResult {
  keep: number;
  maybe: number;
  yeet: number;
}

export function ReviewView() {
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [focusedImageId, setFocusedImageId] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [activeImage, setActiveImage] = useState<ImageFile | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // Store state
  const currentFolder = useAppStore((state) => state.currentFolder);
  const currentProjectPath = useAppStore((state) => state.currentProjectPath);
  const classifications = useAppStore((state) => state.classifications);
  const classificationOrder = useAppStore((state) => state.classificationOrder);
  const images = useAppStore((state) => state.images);

  // Store actions
  const reclassify = useAppStore((state) => state.reclassify);
  const clearFolder = useAppStore((state) => state.clearFolder);
  const refreshProjectStats = useAppStore((state) => state.refreshProjectStats);

  // Compute classified images with useMemo, using classificationOrder for ordering
  const classifiedImages = useMemo(() => {
    const imageMap = new Map(images.map((img) => [img.id, img]));

    // Use order arrays to maintain proper ordering
    const getOrderedImages = (order: string[]) =>
      order
        .map((id) => imageMap.get(id))
        .filter((img): img is ImageFile => img !== undefined);

    return {
      keep: getOrderedImages(classificationOrder.keep),
      maybe: getOrderedImages(classificationOrder.maybe),
      yeet: getOrderedImages(classificationOrder.yeet),
    };
  }, [images, classificationOrder]);

  // Enable keyboard navigation and reclassification shortcuts
  useReviewKeys(classifiedImages, selectedImageIds, setSelectedImageIds, focusedImageId, setFocusedImageId);

  // DnD sensors - require 8px movement to start dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragStart(event: { active: { id: string | number } }) {
    const draggedImage = images.find((img) => img.id === event.active.id);
    setActiveImage(draggedImage ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveImage(null);

    if (!over) return;

    const imageId = active.id as string;
    const newClassification = over.id as Classification;

    // Only reclassify if dropped on a different column
    const currentClassification = classifications[imageId];
    if (newClassification !== currentClassification) {
      reclassify(imageId, newClassification);
    }
  }

  function handleSelectImage(imageId: string, addToSelection = false) {
    if (addToSelection) {
      setSelectedImageIds((prev) => {
        const next = new Set(prev);
        if (next.has(imageId)) {
          next.delete(imageId);
        } else {
          next.add(imageId);
        }
        return next;
      });
    } else {
      setSelectedImageIds(new Set([imageId]));
    }
    setFocusedImageId(imageId);
  }

  async function handleAccept() {
    if (!currentFolder || !currentProjectPath) {
      console.error("Missing folder or project path");
      return;
    }

    setIsAccepting(true);

    try {
      await executeTriage(
        currentProjectPath,
        currentFolder.id,
        currentFolder.source_path,
        currentFolder.output_mode,
        classifiedImages.keep.map((img) => img.path),
        classifiedImages.maybe.map((img) => img.path),
        classifiedImages.yeet.map((img) => img.path)
      );

      // Success: show result screen
      setTriageResult({
        keep: classifiedImages.keep.length,
        maybe: classifiedImages.maybe.length,
        yeet: classifiedImages.yeet.length,
      });
      await refreshProjectStats();
    } catch (error) {
      console.error("Failed to execute triage:", error);
      toast.error("Failed to execute triage");
    } finally {
      setIsAccepting(false);
    }
  }

  function handleFinish() {
    clearFolder();
  }

  // Calculate stats
  const stats = {
    keep: classifiedImages.keep.length,
    maybe: classifiedImages.maybe.length,
    yeet: classifiedImages.yeet.length,
  };

  // Error states
  if (!currentFolder) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">No folder selected</p>
        </div>
      </AppShell>
    );
  }

  // Success screen
  if (triageResult) {
    const total = triageResult.keep + triageResult.maybe + triageResult.yeet;
    return (
      <AppShell>
        <div className="relative flex h-full flex-col items-center justify-center gap-6">
          <div className="mesh-complete absolute inset-0 opacity-30" />

          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="flex size-14 items-center justify-center rounded-full bg-keep/20">
              <Check className="size-7 text-keep" />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold">Triage Complete</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {total} images sorted
              </p>
            </div>

            <div className="flex gap-5">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 text-keep">
                  <Check className="size-4" />
                  <span className="text-xl font-bold tabular-nums">{triageResult.keep}</span>
                </div>
                <span className="text-xs text-muted-foreground">Kept</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 text-maybe">
                  <Undo className="size-4" />
                  <span className="text-xl font-bold tabular-nums">{triageResult.maybe}</span>
                </div>
                <span className="text-xs text-muted-foreground">Maybe</span>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 text-yeet">
                  <Trash className="size-4" />
                  <span className="text-xl font-bold tabular-nums">{triageResult.yeet}</span>
                </div>
                <span className="text-xs text-muted-foreground">Yeeted</span>
              </div>
            </div>

            <Button onClick={handleFinish} variant="keep" size="sm" className="mt-2">
              Done
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <AppShell
        headerActions={
          <ReviewHeaderActions
            stats={stats}
            onAccept={handleAccept}
            isAccepting={isAccepting}
          />
        }
        contentScrolls={false}
      >
        <ReviewGrid
          classifiedImages={classifiedImages}
          selectedImageIds={selectedImageIds}
          focusedImageId={focusedImageId}
          onSelectImage={handleSelectImage}
          classifications={classifications}
        />

        {/* Drag overlay - shows the dragged item */}
        <DragOverlay>
          {activeImage ? (
            <div className="flex w-40 items-center gap-2 rounded-md border border-primary bg-card px-2 py-1.5 opacity-95 shadow-lg">
              <div className="size-7 flex-shrink-0 overflow-hidden rounded bg-muted">
                {activeImage.thumbnailUrl ? (
                  <img
                    src={activeImage.thumbnailUrl}
                    alt={activeImage.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-xs">
                {activeImage.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </AppShell>
    </DndContext>
  );
}

export default ReviewView;
