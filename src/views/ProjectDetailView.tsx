import { useState } from "react";
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
import { AddFolderDialog } from "@/components/AddFolderDialog";
import { removeFolderFromProject } from "@/lib/tauri";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  FolderPlus,
  Trash,
  Images,
  CheckCircle,
  Undo,
  ArrowRight,
} from "@/components/ui/pixel-icon";

/**
 * ProjectDetailView - Shows project details with folder list.
 * Allows adding/removing source folders and navigating to browse/triage.
 */
export function ProjectDetailView() {
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [removingFolderId, setRemovingFolderId] = useState<string | null>(null);

  const currentProject = useAppStore((state) => state.currentProject);
  const currentProjectPath = useAppStore((state) => state.currentProjectPath);
  const currentProjectStats = useAppStore((state) => state.currentProjectStats);
  const refreshProjectStats = useAppStore((state) => state.refreshProjectStats);
  const selectFolder = useAppStore((state) => state.selectFolder);

  if (!currentProject || !currentProjectPath) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">No project selected</p>
        </div>
      </AppShell>
    );
  }

  async function handleRemoveFolder(folderId: string) {
    if (!currentProjectPath) return;
    const confirmed = await ask(
      "This will remove the folder from the project but won't delete any files.",
      { title: "Remove this folder?", kind: "warning" }
    );
    if (!confirmed) return;

    try {
      setRemovingFolderId(folderId);
      await removeFolderFromProject(currentProjectPath, folderId);
      await refreshProjectStats();
    } catch (err) {
      console.error("Failed to remove folder:", err);
    } finally {
      setRemovingFolderId(null);
    }
  }

  async function handleFolderAdded() {
    setIsAddFolderOpen(false);
    try {
      await refreshProjectStats();
    } catch (err) {
      console.error("Failed to refresh project stats:", err);
    }
  }

  function getFolderName(path: string): string {
    // Handle both Unix and Windows path separators
    return path.split(/[\/\\]/).pop() || path;
  }

  function getFolderStats(folderId: string) {
    return currentProjectStats?.folder_stats.find(
      (s) => s.folder_id === folderId
    );
  }

  // Stats bar component
  const statsBar = currentProjectStats ? (
    <div className="flex gap-4 px-3 py-2 text-xs">
      <div className="flex items-center gap-1.5">
        <CheckCircle size={14} className="text-keep" />
        <span className="font-medium">{currentProjectStats.total_keep}</span>
        <span className="text-muted-foreground">kept</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Undo size={14} className="text-maybe" />
        <span className="font-medium">{currentProjectStats.total_maybe}</span>
        <span className="text-muted-foreground">maybe</span>
      </div>
    </div>
  ) : null;

  return (
    <AppShell
      headerActions={
        <Button size="sm" onClick={() => setIsAddFolderOpen(true)}>
          <FolderPlus size={14} className="mr-1.5" />
          Add Folder
        </Button>
      }
      headerSecondary={statsBar}
      contentClassName="p-4"
    >
      {currentProject.folders.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <FolderPlus size={48} className="text-muted-foreground/50" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">No source folders</h2>
            <p className="text-sm text-muted-foreground">
              Add a folder containing images to start triaging
            </p>
          </div>
          <Button size="sm" onClick={() => setIsAddFolderOpen(true)}>
            <FolderPlus size={14} className="mr-1.5" />
            Add Your First Folder
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="px-1 text-xs font-medium text-muted-foreground">
            Source Folders
          </h2>
          {currentProject.folders.map((folder) => {
            const stats = getFolderStats(folder.id);
            return (
              <Card
                key={folder.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => selectFolder(folder)}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-medium">
                        {getFolderName(folder.source_path)}
                      </CardTitle>
                      <CardDescription className="truncate font-mono text-xs">
                        {folder.source_path}
                      </CardDescription>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
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
                          handleRemoveFolder(folder.id);
                        }}
                        disabled={removingFolderId === folder.id}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="flex items-center justify-between text-xs">
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
                              <span className="text-keep">
                                {stats.keep_count} kept
                              </span>
                              <span className="text-maybe">
                                {stats.maybe_count} maybe
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Folder Dialog */}
      <AddFolderDialog
        open={isAddFolderOpen}
        onOpenChange={setIsAddFolderOpen}
        projectPath={currentProjectPath}
        onAdded={handleFolderAdded}
      />
    </AppShell>
  );
}
