import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getImageDataUrl } from "@/lib/tauri";
import type { ImageFile } from "@/stores/useAppStore";

export interface MainPreviewProps {
  image: ImageFile | undefined;
  className?: string;
}

export function MainPreview({ image, className }: MainPreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setImageUrl(null);
      return;
    }

    let cancelled = false;
    const imagePath = image.path;

    async function loadImage() {
      try {
        setIsLoading(true);
        setError(null);
        const url = await getImageDataUrl(imagePath);
        if (!cancelled) {
          setImageUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load image:", err);
          setError(err instanceof Error ? err.message : "Failed to load image");
          setIsLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [image?.path]);

  // Empty state
  if (!image) {
    return (
      <div
        data-slot="main-preview"
        className={cn(
          "flex flex-1 items-center justify-center bg-black/95",
          className
        )}
      >
        <p className="text-muted-foreground">Select an image to preview</p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        data-slot="main-preview"
        className={cn(
          "flex flex-1 items-center justify-center bg-black/95",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading image...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        data-slot="main-preview"
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-2 bg-black/95",
          className
        )}
      >
        <span className="text-4xl">!</span>
        <p className="text-sm text-muted-foreground">{error}</p>
        <p className="text-xs text-muted-foreground/70">{image.name}</p>
      </div>
    );
  }

  return (
    <div
      data-slot="main-preview"
      className={cn(
        "flex flex-1 items-center justify-center bg-black/95 p-4",
        className
      )}
    >
      <img
        src={imageUrl ?? undefined}
        alt={image.name}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}
