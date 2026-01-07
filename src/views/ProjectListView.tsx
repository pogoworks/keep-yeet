import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => selectProject(project)}
            >
              <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">
                    {project.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteProject(e, project)}
                    disabled={deletingId === project.id}
                  >
                    <Trash size={14} />
                  </Button>
                </div>
                <CardDescription className="truncate font-mono text-xs">
                  {project.path}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0">
                <p className="text-xs text-muted-foreground">
                  {formatDate(project.created_at)}
                </p>
              </CardContent>
            </Card>
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
