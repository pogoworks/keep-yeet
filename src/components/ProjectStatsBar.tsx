import { CheckCircle, Undo } from "@/components/ui/pixel-icon";

interface ProjectStatsBarProps {
  keepCount: number;
  maybeCount: number;
}

/**
 * ProjectStatsBar - Displays aggregated keep/maybe counts for a project.
 */
export function ProjectStatsBar({ keepCount, maybeCount }: ProjectStatsBarProps) {
  return (
    <div className="flex gap-4 px-3 py-1 text-xs">
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
  );
}
