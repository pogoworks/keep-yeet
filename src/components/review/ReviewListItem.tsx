import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { ImageFile, Classification } from "@/stores/useAppStore";

export interface ReviewListItemProps {
  image: ImageFile;
  classification: Classification;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (addToSelection?: boolean) => void;
}

export function ReviewListItem({
  image,
  classification,
  isSelected,
  isFocused,
  onSelect,
}: ReviewListItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: image.id,
      data: { image, classification },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-slot="review-list-item"
      data-selected={isSelected}
      data-focused={isFocused}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onSelect(e.shiftKey || e.metaKey || e.ctrlKey);
        }
      }}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-md border px-2 py-1.5 transition-all duration-[--duration-fast]",
        "hover:bg-muted/50",
        isDragging && "cursor-grabbing opacity-50",
        // Selected state (can have multiple)
        isSelected && cn(
          classification === "keep" && "border-keep bg-keep/10",
          classification === "maybe" && "border-maybe bg-maybe/10",
          classification === "yeet" && "border-yeet bg-yeet/10"
        ),
        // Focused state (only one, shows ring)
        isFocused && cn(
          "ring-1 ring-offset-1 ring-offset-background",
          classification === "keep" && "ring-keep",
          classification === "maybe" && "ring-maybe",
          classification === "yeet" && "ring-yeet"
        ),
        // Default state
        !isSelected && !isFocused && "border-border/50"
      )}
    >
      {/* Thumbnail */}
      <div className="size-8 flex-shrink-0 overflow-hidden rounded bg-muted">
        {image.thumbnailUrl ? (
          <img
            src={image.thumbnailUrl}
            alt={image.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <div className="size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}
      </div>

      {/* File name */}
      <span className="min-w-0 flex-1 truncate text-xs">{image.name}</span>
    </div>
  );
}
