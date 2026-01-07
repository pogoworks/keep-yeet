import type { ProjectSummary } from "@/lib/tauri";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Folder, Trash } from "@/components/ui/pixel-icon";

export interface ProjectCardProps {
  project: ProjectSummary;
  onSelect: (project: ProjectSummary) => void;
  onDelete: (e: React.MouseEvent, project: ProjectSummary) => void;
  isDeleting?: boolean;
}

/**
 * ProjectCard - Compact card displaying project info.
 * Shows name, path, folders, and dates.
 */
export function ProjectCard({
  project,
  onSelect,
  onDelete,
  isDeleting = false,
}: ProjectCardProps) {
  return (
    <div
      className="group relative cursor-pointer rounded-md border border-border bg-card p-2 transition-colors hover:bg-muted/50"
      onClick={() => onSelect(project)}
    >
      {/* Delete button - top right */}
      <button
        className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        onClick={(e) => onDelete(e, project)}
        disabled={isDeleting}
      >
        <Trash size={12} />
      </button>

      {/* Content */}
      <div className="space-y-0.5 pr-4">
        {/* Name */}
        <div className="truncate text-lg font-semibold leading-tight">
          {project.name}
        </div>

        {/* Path */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-default font-mono text-xs text-muted-foreground">
              {shortenPath(project.path)}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" sideOffset={4}>
            <span className="font-mono">{project.path}</span>
          </TooltipContent>
        </Tooltip>

        {/* Folders */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Folder size={10} className="flex-shrink-0" />
          <span className="truncate">{formatFolders(project)}</span>
        </div>

        {/* Dates */}
        <div className="flex gap-2 text-xs text-muted-foreground/70">
          <span>Created {formatDate(project.created_at)}</span>
          {project.updated_at &&
            formatDate(project.updated_at) !== formatDate(project.created_at) && (
              <span>· Updated {formatDate(project.updated_at)}</span>
            )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortenPath(path: string, segments = 3): string {
  const parts = path.split(/[/\\]/);
  if (parts.length <= segments + 1) return path;
  return "…/" + parts.slice(-segments).join("/");
}

function formatFolders(project: ProjectSummary) {
  if (project.folder_count === 0) {
    return <span className="text-muted-foreground/60">No folders</span>;
  }
  const displayNames = project.folder_names.slice(0, 3);
  const remaining = project.folder_count - displayNames.length;
  return (
    <>
      {displayNames.join(", ")}
      {remaining > 0 && (
        <span className="text-muted-foreground/60"> +{remaining}</span>
      )}
    </>
  );
}
