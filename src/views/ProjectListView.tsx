import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { useAppStore } from "@/stores/useAppStore";
import type { ProjectSummary } from "@/lib/tauri";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { Folder, Plus, Trash } from "@/components/ui/pixel-icon";
import { deleteProject } from "@/lib/tauri";
import { ask } from "@tauri-apps/plugin-dialog";

/**
 * ProjectListView - Home screen showing all projects.
 * Allows creating new projects and opening existing ones.
 */
export function ProjectListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const view = useAppStore((state) => state.view);
  const projects = useAppStore((state) => state.projects);
  const loadProjects = useAppStore((state) => state.loadProjects);
  const selectProject = useAppStore((state) => state.selectProject);

  // Reload projects whenever view changes to "projects" (including on mount)
  useEffect(() => {
    if (view === "projects") {
      setIsLoading(true);
      loadProjects().finally(() => setIsLoading(false));
    }
  }, [view, loadProjects]);

  async function handleDeleteProject(
    e: React.MouseEvent,
    project: ProjectSummary
  ) {
    e.stopPropagation();
    const confirmed = await ask(
      `This only removes it from the list, files are not deleted.`,
      { title: `Delete project "${project.name}"?`, kind: "warning" }
    );
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(project.id);
      await deleteProject(project.id);
      await loadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleProjectCreated() {
    setIsCreateOpen(false);
    try {
      await loadProjects();
    } catch (err) {
      console.error("Failed to reload projects:", err);
    }
  }

  function formatDate(dateString: string | null) {
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

  return (
    <AppShell
      headerActions={
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          New Project
        </Button>
      }
      contentClassName="p-4"
    >
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <Folder size={48} className="text-muted-foreground/50" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">No projects yet</h2>
            <p className="text-sm text-muted-foreground">
              Create a project to start triaging images
            </p>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative cursor-pointer rounded-md border border-border bg-card p-2 transition-colors hover:bg-muted/50"
              onClick={() => selectProject(project)}
            >
              {/* Delete button - top right */}
              <button
                className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                onClick={(e) => handleDeleteProject(e, project)}
                disabled={deletingId === project.id}
              >
                <Trash size={12} />
              </button>
              {/* Content */}
              <div className="space-y-0.5 pr-4">
                {/* Name */}
                <div className="font-semibold text-lg leading-tight truncate">
                  {project.name}
                </div>
                {/* Path */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-mono text-[10px] text-muted-foreground cursor-default">
                      {shortenPath(project.path)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" sideOffset={4}>
                    <span className="font-mono">{project.path}</span>
                  </TooltipContent>
                </Tooltip>
                {/* Folders */}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Folder size={10} className="flex-shrink-0" />
                  <span className="truncate">{formatFolders(project)}</span>
                </div>
                {/* Dates */}
                <div className="flex gap-2 text-[10px] text-muted-foreground/70">
                  <span>Created {formatDate(project.created_at)}</span>
                  {project.updated_at && formatDate(project.updated_at) !== formatDate(project.created_at) && (
                    <span>· Updated {formatDate(project.updated_at)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleProjectCreated}
      />
    </AppShell>
  );
}
