import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { useAppStore } from "@/stores/useAppStore";
import type { ProjectSummary } from "@/lib/tauri";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { ProjectCard } from "@/components/ProjectCard";
import { Folder, Plus } from "@/components/ui/pixel-icon";
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
      toast.error("Failed to delete project");
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
      toast.error("Failed to reload projects");
    }
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
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={selectProject}
              onDelete={handleDeleteProject}
              isDeleting={deletingId === project.id}
            />
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
