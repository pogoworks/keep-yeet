import { cn } from "@/lib/utils";
import { MainPreview } from "@/components/browse/MainPreview";
import { Check, Undo, Trash } from "@/components/ui/pixel-icon";
import type { ImageFile, Classification } from "@/stores/useAppStore";

export interface ReviewPreviewPanelProps {
  image: ImageFile | undefined;
  classification: Classification | undefined;
  selectedCount?: number;
  className?: string;
}

const badgeConfig = {
  keep: {
    icon: Check,
    bg: "bg-keep",
    fg: "text-keep-foreground",
    label: "Keep",
  },
  maybe: {
    icon: Undo,
    bg: "bg-maybe",
    fg: "text-maybe-foreground",
    label: "Maybe",
  },
  yeet: {
    icon: Trash,
    bg: "bg-yeet",
    fg: "text-yeet-foreground",
    label: "Yeet",
  },
};

export function ReviewPreviewPanel({
  image,
  classification,
  selectedCount = 0,
  className,
}: ReviewPreviewPanelProps) {
  if (!image) {
    return (
      <div
        data-slot="review-preview-panel"
        className={cn(
          "flex flex-col items-center justify-center border-l border-border bg-black/95",
          className
        )}
      >
        <p className="text-muted-foreground">Select an image to preview</p>
        <p className="mt-2 text-xs text-muted-foreground/70">
          Click on any image or use arrow keys
        </p>
      </div>
    );
  }

  const config = classification ? badgeConfig[classification] : null;
  const Icon = config?.icon;

  return (
    <div
      data-slot="review-preview-panel"
      className={cn("flex flex-col border-l border-border", className)}
    >
      {/* Preview image */}
      <MainPreview image={image} className="min-h-0 flex-1" />

      {/* Image info footer */}
      <div className="flex items-center gap-3 border-t border-border bg-card px-4 py-3">
        {/* Classification badge */}
        {config && Icon && (
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1",
              config.bg,
              config.fg
            )}
          >
            <Icon className="size-3.5" />
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        )}

        {/* File name and dimensions */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{image.name}</p>
          {image.dimensions && (
            <p className="text-xs text-muted-foreground">
              {image.dimensions.width} x {image.dimensions.height}
            </p>
          )}
        </div>

        {/* Selected count indicator */}
        {selectedCount > 1 && (
          <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {selectedCount} selected
          </div>
        )}
      </div>
    </div>
  );
}
