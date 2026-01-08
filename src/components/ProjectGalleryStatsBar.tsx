import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { CheckCircle, Undo, Play } from "@/components/ui/pixel-icon";
import { formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statsBarVariants = cva(
  "flex h-10 items-center justify-between border-t px-3 text-xs",
  {
    variants: {
      variant: {
        keep: "",
        maybe: "",
      },
    },
    defaultVariants: {
      variant: "keep",
    },
  }
);

interface ProjectGalleryStatsBarProps
  extends VariantProps<typeof statsBarVariants> {
  imageCount: number;
  totalSize: number;
  onReTriage?: () => void;
  className?: string;
}

/**
 * ProjectGalleryStatsBar - Displays image count, total size, and optional re-triage button.
 * Uses keep/maybe variants for color styling.
 */
export function ProjectGalleryStatsBar({
  imageCount,
  totalSize,
  variant = "keep",
  onReTriage,
  className,
}: ProjectGalleryStatsBarProps) {
  const Icon = variant === "keep" ? CheckCircle : Undo;
  const iconColor = variant === "keep" ? "text-keep" : "text-maybe";

  return (
    <div className={cn(statsBarVariants({ variant }), className)}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Icon size={14} className={iconColor} />
          <span className="font-medium">{imageCount}</span>
          <span className="text-muted-foreground">
            {imageCount === 1 ? "image" : "images"}
          </span>
        </div>
        <span className="text-muted-foreground/50">•</span>
        <span className="text-muted-foreground">{formatBytes(totalSize)}</span>
      </div>

      {variant === "maybe" && onReTriage && imageCount > 0 && (
        <Button variant="maybe" size="sm" onClick={onReTriage} className="h-6 px-2 text-xs">
          <Play size={10} className="mr-1" />
          Re-triage
        </Button>
      )}
    </div>
  );
}
