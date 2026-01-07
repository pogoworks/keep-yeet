import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main
      data-slot="project-list-view"
      className="flex h-screen flex-col bg-background"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Toss</h1>
          <p className="text-sm text-muted-foreground">
            Image triage for Stable Diffusion
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} className="mr-2" />
          New Project
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Folder size={64} className="text-muted-foreground/50" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">No projects yet</h2>
              <p className="text-muted-foreground">
                Create a project to start triaging images
              </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} className="mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => selectProject(project)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteProject(e, project)}
                      disabled={deletingId === project.id}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                  <CardDescription className="truncate font-mono text-xs">
                    {project.path}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(project.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleProjectCreated}
      />
    </main>
  );
}
