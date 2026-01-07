import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { listImages, getThumbnail } from "@/lib/tauri";
import type { Folder, FolderStats } from "@/lib/tauri";
import { Image, Clock, Close, MoreHorizontal, Check } from "@/components/ui/pixel-icon";

interface SourceFolderCardProps {
  folder: Folder;
  stats?: FolderStats;
  onClick?: () => void;
}

const THUMBNAIL_COUNT = 9;
const THUMBNAIL_SIZE = 50;

type TriageStatus = "not_started" | "started" | "triaged";

function getTriageStatus(stats?: FolderStats): TriageStatus {
  if (!stats) return "not_started";
  const { source_count, keep_count, maybe_count } = stats;
  if (source_count === 0 && (keep_count > 0 || maybe_count > 0)) return "triaged";
  if (keep_count > 0 || maybe_count > 0) return "started";
  return "not_started";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * SourceFolderCard - Displays a source folder with thumbnail preview grid.
 * Shows a 3x3 grid of thumbnails from the folder with folder info below.
 */
export function SourceFolderCard({ folder, stats, onClick }: SourceFolderCardProps) {
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  const folderName = folder.source_path.split(/[\/\\]/).pop() || folder.source_path;
  const imageCount = stats ? stats.source_count + stats.keep_count + stats.maybe_count : 0;
  const status = getTriageStatus(stats);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnails() {
      try {
        const images = await listImages(folder.source_path);
        const imagesToLoad = images.slice(0, THUMBNAIL_COUNT);

        const urls = await Promise.all(
          imagesToLoad.map((img) => getThumbnail(img.path, THUMBNAIL_SIZE))
        );

        if (!cancelled) {
          setThumbnails(urls);
        }
      } catch (err) {
        console.error("Failed to load thumbnails:", err);
      }
    }

    loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [folder.source_path]);

  const statusConfig = {
    not_started: {
      icon: Close,
      label: "Not started",
      colorClass: "text-rose-400",
    },
    started: {
      icon: MoreHorizontal,
      label: "Started",
      colorClass: "text-cyan-400",
    },
    triaged: {
      icon: Check,
      label: "Triaged",
      colorClass: "text-lime-400",
    },
  };

  const { icon: StatusIcon, label: statusLabel, colorClass } = statusConfig[status];

  return (
    <Card
      className="cursor-pointer gap-0 overflow-hidden py-0 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      {/* Thumbnail grid - 3x3 */}
      <div className="grid grid-cols-3 grid-rows-3 gap-px bg-border">
        {Array.from({ length: THUMBNAIL_COUNT }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-muted"
          >
            {thumbnails[index] ? (
              <img
                src={thumbnails[index]}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
        ))}
      </div>

      {/* Folder info */}
      <div className="space-y-0.5 p-2">
        {/* Folder name */}
        <div className="truncate text-lg font-semibold leading-tight">{folderName}</div>

        {/* Image count */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Image size={10} className="flex-shrink-0" />
          <span>{imageCount} images</span>
        </div>

        {/* Added date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <Clock size={10} className="flex-shrink-0" />
          <span>Added {formatDate(folder.added_at)}</span>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
          <StatusIcon size={10} className="flex-shrink-0" />
          <span className="uppercase">{statusLabel}</span>
        </div>
      </div>
    </Card>
  );
}
