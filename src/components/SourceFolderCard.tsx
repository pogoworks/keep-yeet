import { Button } from "@/components/ui/button";
import { Trash, Images, ArrowRight } from "@/components/ui/pixel-icon";
import type { Folder, FolderStats } from "@/lib/tauri";

interface SourceFolderCardProps {
  folder: Folder;
  stats?: FolderStats;
  onClick?: () => void;
  onRemove?: () => void;
  isRemoving?: boolean;
}

/**
 * SourceFolderCard - Displays a source folder with stats and actions.
 * Used in the Project detail view to show folders available for triage.
 */
export function SourceFolderCard({
  folder,
  stats,
  onClick,
  onRemove,
  isRemoving = false,
}: SourceFolderCardProps) {
  function getFolderName(path: string): string {
    return path.split(/[\/\\]/).pop() || path;
  }

  return (
    <div
      className="cursor-pointer rounded-md border border-border bg-card p-2 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      {/* Header row: name, path, mode badge, delete */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{getFolderName(folder.source_path)}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {folder.source_path}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              folder.output_mode === "move"
                ? "bg-blue-500/10 text-blue-500"
                : "bg-purple-500/10 text-purple-500"
            }`}
          >
            {folder.output_mode}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            disabled={isRemoving}
          >
            <Trash size={14} />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {stats && (
            <>
              <div className="flex items-center gap-1">
                <Images size={14} className="text-muted-foreground" />
                <span>{stats.source_count} to triage</span>
              </div>
              {(stats.keep_count > 0 || stats.maybe_count > 0) && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-keep">{stats.keep_count} kept</span>
                  <span className="text-maybe">{stats.maybe_count} maybe</span>
                </>
              )}
            </>
          )}
        </div>
        <ArrowRight size={14} className="text-muted-foreground" />
      </div>
    </div>
  );
}
