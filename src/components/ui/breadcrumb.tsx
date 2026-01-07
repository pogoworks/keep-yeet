import {
  ChevronRight,
  Home,
  Briefcase,
  User,
  Eye,
} from "@/components/ui/pixel-icon";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";
import { type ComponentType } from "react";

interface BreadcrumbSegment {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
  isActive?: boolean;
}

/**
 * Breadcrumb - Navigation breadcrumb derived from app state.
 * Clickable segments allow quick navigation back through the hierarchy.
 * Uses mono font, uppercase text, and pixel icons.
 */
export function Breadcrumb({ className }: { className?: string }) {
  const view = useAppStore((state) => state.view);
  const currentProject = useAppStore((state) => state.currentProject);
  const currentFolder = useAppStore((state) => state.currentFolder);
  const clearProject = useAppStore((state) => state.clearProject);
  const clearFolder = useAppStore((state) => state.clearFolder);
  const resetTriage = useAppStore((state) => state.resetTriage);
  const setView = useAppStore((state) => state.setView);

  // Build segments based on current state
  const segments: BreadcrumbSegment[] = [];

  // Root: Projects
  segments.push({
    label: "PROJECTS",
    icon: Home,
    onClick: view !== "projects" ? clearProject : undefined,
    isActive: view === "projects",
  });

  // Project level
  if (currentProject) {
    segments.push({
      label: currentProject.name.toUpperCase(),
      icon: Briefcase,
      onClick: view !== "project-detail"
        ? (view === "triage" || view === "review" ? resetTriage : clearFolder)
        : undefined,
      isActive: view === "project-detail",
    });
  }

  // Mode segment (triage/review) - includes folder name
  if (currentFolder && (view === "triage" || view === "review")) {
    const folderName = currentFolder.source_path.split(/[/\\]/).pop() || "Folder";

    if (view === "triage") {
      // TRIAGE (FolderName) - active segment
      segments.push({
        label: `TRIAGE (${folderName})`,
        icon: User,
        isActive: true,
      });
    } else if (view === "review") {
      // TRIAGE (FolderName) - clickable to go back to triage
      segments.push({
        label: `TRIAGE (${folderName})`,
        icon: User,
        onClick: () => setView("triage"),
        isActive: false,
      });
      segments.push({
        label: "REVIEW",
        icon: Eye,
        isActive: true,
      });
    }
  }

  return (
    <nav
      data-slot="breadcrumb"
      className={cn("flex items-center gap-1 font-mono text-xs", className)}
      aria-label="Breadcrumb"
    >
      {segments.map((segment, index) => {
        const Icon = segment.icon;
        return (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight size={12} className="text-muted-foreground/40" />
            )}
            {segment.onClick ? (
              <button
                onClick={segment.onClick}
                className="flex items-center gap-1.5 rounded px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon size={12} />
                <span>{segment.label}</span>
              </button>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1.5 px-1.5 py-1",
                  segment.isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon size={12} />
                <span>{segment.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
