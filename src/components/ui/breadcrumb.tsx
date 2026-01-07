import {
  ChevronRight,
  Home,
  Briefcase,
  Folder,
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
  const setView = useAppStore((state) => state.setView);
  const resetTriage = useAppStore((state) => state.resetTriage);

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
      onClick: view !== "project-detail" ? () => {
        // If in triage/review, need to reset triage state first
        if (view === "triage" || view === "review") {
          resetTriage();
        }
        clearFolder();
      } : undefined,
      isActive: view === "project-detail",
    });
  }

  // Folder level (browse/triage/review)
  if (currentFolder) {
    const folderName = currentFolder.source_path.split(/[/\\]/).pop() || "Folder";

    // In browse mode, folder is the active segment
    if (view === "browse") {
      segments.push({
        label: folderName.toUpperCase(),
        icon: Folder,
        isActive: true,
      });
    } else {
      // In triage/review, folder is clickable to go back to browse
      segments.push({
        label: folderName.toUpperCase(),
        icon: Folder,
        onClick: () => {
          if (view === "triage") {
            resetTriage();
          } else if (view === "review") {
            setView("triage");
            // Then reset from triage
            setTimeout(() => resetTriage(), 0);
          }
        },
        isActive: false,
      });

      // Mode segment
      if (view === "triage") {
        segments.push({
          label: "TRIAGE",
          icon: User,
          isActive: true,
        });
      } else if (view === "review") {
        segments.push({
          label: "TRIAGE",
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
