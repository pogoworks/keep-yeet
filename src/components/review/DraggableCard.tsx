import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { FilmstripItem } from "@/components/browse/FilmstripItem";
import type { ImageFile, Classification } from "@/stores/useAppStore";

export interface DraggableCardProps {
  image: ImageFile;
  classification: Classification;
  isSelected: boolean;
  onSelect: () => void;
}

export function DraggableCard({
  image,
  classification,
  isSelected,
  onSelect,
}: DraggableCardProps) {
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
      className={cn(
        "touch-none transition-opacity",
        isDragging && "opacity-50 cursor-grabbing"
      )}
      onClick={(e) => {
        // Only select if not dragging
        if (!isDragging) {
          e.stopPropagation();
          onSelect();
        }
      }}
    >
      <FilmstripItem
        image={image}
        isSelected={isSelected}
        onClick={() => {}} // Parent handles click
        size={100}
        classification={classification}
      />
    </div>
  );
}
