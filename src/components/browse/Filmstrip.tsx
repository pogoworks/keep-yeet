import { useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { FilmstripItem } from "./FilmstripItem";
import type { ImageFile, Classification } from "@/stores/useAppStore";

export interface FilmstripProps {
  images: ImageFile[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  thumbnailSize?: number;
  className?: string;
  classifications?: Record<string, Classification>;
}

export function Filmstrip({
  images,
  selectedIndex,
  onSelect,
  thumbnailSize = 180,
  className,
  classifications,
}: FilmstripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected thumbnail to center
  useAutoScroll(selectedIndex, containerRef);

  if (images.length === 0) {
    return (
      <div
        data-slot="filmstrip"
        className={cn(
          "flex items-center justify-center border-t bg-muted/30",
          className
        )}
        style={{ height: thumbnailSize + 32 }}
      >
        <p className="text-muted-foreground">No images in folder</p>
      </div>
    );
  }

  const containerHeight = thumbnailSize + 32; // Room for thumbnails + scale effect

  return (
    <div
      data-slot="filmstrip"
      className={cn("border-t bg-muted/30", className)}
      style={{ height: containerHeight }}
    >
      <ScrollArea className="h-full w-full">
        <div
          ref={containerRef}
          className="flex items-center gap-3 px-4 transition-[height] duration-300 ease-out"
          style={{ height: containerHeight }}
        >
          {images.map((image, index) => (
            <FilmstripItem
              key={image.id}
              image={image}
              isSelected={index === selectedIndex}
              onClick={() => onSelect(index)}
              size={thumbnailSize}
              classification={classifications?.[image.id]}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
