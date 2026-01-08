import { CheckCircle, Undo, PanelRight } from "@/components/ui/pixel-icon";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProjectStatsBarProps {
  keepCount: number;
  maybeCount: number;
  rightContent?: ReactNode;
  isGalleryOpen?: boolean;
  onGalleryToggle?: () => void;
}

/**
 * ProjectStatsBar - Displays aggregated keep/maybe counts for a project.
 * Optionally accepts right-aligned content (e.g., output mode toggle) and gallery toggle.
 */
export function ProjectStatsBar({
  keepCount,
  maybeCount,
  rightContent,
  isGalleryOpen,
  onGalleryToggle,
}: ProjectStatsBarProps) {
  return (
    <div className="flex items-center justify-between border-t px-3 py-1 text-xs">
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 px-1.5 py-1">
          <CheckCircle size={14} className="text-keep" />
          <span className="font-medium">{keepCount}</span>
          <span className="text-muted-foreground">kept</span>
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-1">
          <Undo size={14} className="text-maybe" />
          <span className="font-medium">{maybeCount}</span>
          <span className="text-muted-foreground">maybe</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {rightContent}
        {onGalleryToggle && (
          <button
            onClick={onGalleryToggle}
            className={cn(
              "rounded p-1 text-muted-foreground transition-colors hover:text-foreground",
              isGalleryOpen && "bg-muted text-foreground"
            )}
            title={isGalleryOpen ? "Hide gallery" : "Show gallery"}
          >
            <PanelRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
