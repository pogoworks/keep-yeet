import { useRef } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { FilmstripItem } from "./FilmstripItem";
import type { ImageFile } from "@/stores/useAppStore";

export interface FilmstripProps {
  images: ImageFile[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  thumbnailSize?: number;
  className?: string;
}

export function Filmstrip({
  images,
  selectedIndex,
  onSelect,
  thumbnailSize = 180,
  className,
}: FilmstripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected thumbnail to center
  useAutoScroll(selectedIndex, containerRef);

  if (images.length === 0) {
    return (
      <div
        data-slot="filmstrip"
        className={cn(
          "flex h-[220px] items-center justify-center border-t bg-muted/30",
          className
        )}
      >
        <p className="text-muted-foreground">No images in folder</p>
      </div>
    );
  }

  return (
    <div
      data-slot="filmstrip"
      className={cn("border-t bg-muted/30", className)}
    >
      <ScrollArea className="w-full">
        <div
          ref={containerRef}
          className="flex gap-3 p-4"
          style={{ height: thumbnailSize + 32 }}
        >
          {images.map((image, index) => (
            <FilmstripItem
              key={image.id}
              image={image}
              isSelected={index === selectedIndex}
              onClick={() => onSelect(index)}
              size={thumbnailSize}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
