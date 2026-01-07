import { useRef, useEffect, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import { animate } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReviewListItem } from "./ReviewListItem";
import { Check, Undo, Trash } from "@/components/ui/pixel-icon";
import type { ImageFile, Classification } from "@/stores/useAppStore";

export interface DragDropColumnProps {
  classification: Classification;
  images: ImageFile[];
  selectedImageIds: Set<string>;
  focusedImageId: string | null;
  onSelectImage: (imageId: string, addToSelection?: boolean) => void;
}

const columnConfig = {
  keep: {
    label: "Keep",
    icon: Check,
    headerBg: "bg-keep-muted",
    headerText: "text-keep",
    borderColor: "border-keep",
    ringColor: "ring-keep",
    emptyText: "Drag images here to keep",
  },
  maybe: {
    label: "Maybe",
    icon: Undo,
    headerBg: "bg-maybe-muted",
    headerText: "text-maybe",
    borderColor: "border-maybe",
    ringColor: "ring-maybe",
    emptyText: "Drag images here for later review",
  },
  yeet: {
    label: "Yeet",
    icon: Trash,
    headerBg: "bg-yeet-muted",
    headerText: "text-yeet",
    borderColor: "border-yeet",
    ringColor: "ring-yeet",
    emptyText: "Drag images here to discard",
  },
};

export function DragDropColumn({
  classification,
  images,
  selectedImageIds,
  focusedImageId,
  onSelectImage,
}: DragDropColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: classification,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);

  const config = columnConfig[classification];
  const Icon = config.icon;

  // Register item ref
  const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(id, el);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // Auto-scroll to focused item with smooth animation
  useEffect(() => {
    if (!focusedImageId || !scrollRef.current) return;

    const itemEl = itemRefs.current.get(focusedImageId);
    if (!itemEl) return;

    const scrollContainer = scrollRef.current;
    const containerRect = scrollContainer.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();

    // Calculate relative position
    const itemTop = itemRect.top - containerRect.top + scrollContainer.scrollTop;
    const itemBottom = itemTop + itemRect.height;
    const viewTop = scrollContainer.scrollTop;
    const viewBottom = viewTop + containerRect.height;

    let targetScroll = scrollContainer.scrollTop;

    // Check if item is outside visible area
    if (itemTop < viewTop + 8) {
      // Item is above viewport - scroll up
      targetScroll = itemTop - 8;
    } else if (itemBottom > viewBottom - 48) {
      // Item is below viewport (accounting for gradient) - scroll down
      targetScroll = itemBottom - containerRect.height + 48;
    } else {
      // Item is visible, no scroll needed
      return;
    }

    // Cancel any ongoing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Animate scroll with spring physics
    animationRef.current = animate(scrollContainer.scrollTop, targetScroll, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      onUpdate: (value) => {
        scrollContainer.scrollTop = value;
      },
    });
  }, [focusedImageId]);

  return (
    <div
      ref={setNodeRef}
      data-slot="drag-drop-column"
      data-classification={classification}
      className={cn(
        "flex flex-1 flex-col rounded-lg border-2 bg-card transition-all duration-[--duration-fast]",
        isOver
          ? cn(config.borderColor, "ring-2", config.ringColor)
          : "border-border"
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-md px-3 py-2",
          config.headerBg
        )}
      >
        <Icon className={cn("size-4", config.headerText)} />
        <span className={cn("font-medium", config.headerText)}>
          {config.label}
        </span>
        <span className={cn("ml-auto text-sm tabular-nums", config.headerText)}>
          {images.length}
        </span>
      </div>

      {/* Scrollable image list with gradient fade */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-none"
        >
          <div className="flex flex-col gap-0.5 p-2 pb-8">
            {images.length === 0 ? (
              <div className="flex h-24 items-center justify-center text-center text-xs text-muted-foreground">
                {config.emptyText}
              </div>
            ) : (
              images.map((image) => (
                <div
                  key={image.id}
                  ref={(el) => setItemRef(image.id, el)}
                >
                  <ReviewListItem
                    image={image}
                    classification={classification}
                    isSelected={selectedImageIds.has(image.id)}
                    isFocused={focusedImageId === image.id}
                    onSelect={(addToSelection) => onSelectImage(image.id, addToSelection)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
        {/* Gradient fade indicating more content */}
        {images.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
        )}
      </div>
    </div>
  );
}
