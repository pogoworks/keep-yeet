import { useState, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { getThumbnail } from "@/lib/tauri";
import type { ImageFile, Classification } from "@/stores/useAppStore";
import { Check, HelpCircle, Trash2 } from "lucide-react";

const filmstripItemVariants = cva(
  "relative flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all duration-200",
  {
    variants: {
      selected: {
        true: "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10",
        false: "hover:ring-1 hover:ring-muted-foreground/50 hover:scale-102",
      },
      classification: {
        keep: "ring-2 ring-keep ring-offset-1 ring-offset-background",
        maybe: "ring-2 ring-maybe ring-offset-1 ring-offset-background",
        yeet: "ring-2 ring-yeet ring-offset-1 ring-offset-background opacity-60",
        none: "",
      },
    },
    defaultVariants: {
      selected: false,
      classification: "none",
    },
    compoundVariants: [
      // When selected AND classified, selection ring takes precedence but we add a subtle background
      {
        selected: true,
        classification: "keep",
        className: "ring-keep",
      },
      {
        selected: true,
        classification: "maybe",
        className: "ring-maybe",
      },
      {
        selected: true,
        classification: "yeet",
        className: "ring-yeet opacity-60",
      },
    ],
  }
);

export interface FilmstripItemProps
  extends VariantProps<typeof filmstripItemVariants> {
  image: ImageFile;
  isSelected: boolean;
  onClick: () => void;
  size?: number;
  classification?: Classification;
}

const ClassificationBadge = ({
  classification,
}: {
  classification: Classification;
}) => {
  const config = {
    keep: {
      icon: Check,
      bg: "bg-keep",
      fg: "text-keep-foreground",
    },
    maybe: {
      icon: HelpCircle,
      bg: "bg-maybe",
      fg: "text-maybe-foreground",
    },
    yeet: {
      icon: Trash2,
      bg: "bg-yeet",
      fg: "text-yeet-foreground",
    },
  };

  const { icon: Icon, bg, fg } = config[classification];

  return (
    <div
      className={cn(
        "absolute right-1 top-1 flex size-6 items-center justify-center rounded-full shadow-md",
        bg,
        fg
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
    </div>
  );
};

export function FilmstripItem({
  image,
  isSelected,
  onClick,
  size = 180,
  classification,
}: FilmstripItemProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    image.thumbnailUrl
  );
  const [isLoading, setIsLoading] = useState(!image.thumbnailUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If thumbnail already exists in image data, use it
    if (image.thumbnailUrl) {
      setThumbnailUrl(image.thumbnailUrl);
      setIsLoading(false);
      return;
    }

    // Otherwise, fetch the thumbnail
    let cancelled = false;

    async function loadThumbnail() {
      try {
        setIsLoading(true);
        setError(false);
        const url = await getThumbnail(image.path, size);
        if (!cancelled) {
          setThumbnailUrl(url);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load thumbnail:", err);
          setError(true);
          setIsLoading(false);
        }
      }
    }

    loadThumbnail();

    return () => {
      cancelled = true;
    };
  }, [image.path, image.thumbnailUrl, size]);

  return (
    <div
      data-slot="filmstrip-item"
      data-filmstrip-item
      data-selected={isSelected}
      data-classification={classification ?? "none"}
      onClick={onClick}
      className={cn(
        filmstripItemVariants({
          selected: isSelected,
          classification: classification ?? "none",
        })
      )}
      style={{ width: size, height: size }}
    >
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-2">
          <span className="text-2xl">?</span>
          <span className="mt-1 truncate text-xs text-muted-foreground">
            {image.name}
          </span>
        </div>
      ) : (
        <img
          src={thumbnailUrl ?? undefined}
          alt={image.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
      {/* Classification badge overlay */}
      {classification && <ClassificationBadge classification={classification} />}
    </div>
  );
}
