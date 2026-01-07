import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore } from "@/stores/useAppStore";
import { AddFolderDialog } from "@/components/AddFolderDialog";
import { removeFolderFromProject } from "@/lib/tauri";
import {
  ArrowLeft,
  FolderPlus,
  Trash2,
  Images,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

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
  const clearProject = useAppStore((state) => state.clearProject);
  const refreshProjectStats = useAppStore((state) => state.refreshProjectStats);
  const selectFolder = useAppStore((state) => state.selectFolder);

  if (!currentProject || !currentProjectPath) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  async function handleRemoveFolder(folderId: string) {
    if (!currentProjectPath) return;
    if (!confirm("Remove this folder from the project?")) return;

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

  return (
    <main
      data-slot="project-detail-view"
      className="flex h-screen flex-col bg-background"
    >
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <Button variant="ghost" size="icon" onClick={clearProject}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{currentProject.name}</h1>
          <p className="text-sm font-mono text-muted-foreground truncate">
            {currentProjectPath}
          </p>
        </div>
        <Button onClick={() => setIsAddFolderOpen(true)}>
          <FolderPlus className="mr-2 size-4" />
          Add Folder
        </Button>
      </header>

      {/* Stats Bar */}
      {currentProjectStats && (
        <div className="flex gap-6 border-b px-6 py-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500" />
            <span className="font-medium">{currentProjectStats.total_keep}</span>
            <span className="text-muted-foreground">kept</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="size-4 text-yellow-500" />
            <span className="font-medium">{currentProjectStats.total_maybe}</span>
            <span className="text-muted-foreground">maybe</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {currentProject.folders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <FolderPlus className="size-16 text-muted-foreground/50" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">No source folders</h2>
              <p className="text-muted-foreground">
                Add a folder containing images to start triaging
              </p>
            </div>
            <Button onClick={() => setIsAddFolderOpen(true)}>
              <FolderPlus className="mr-2 size-4" />
              Add Your First Folder
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
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
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">
                          {getFolderName(folder.source_path)}
                        </CardTitle>
                        <CardDescription className="truncate font-mono text-xs">
                          {folder.source_path}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
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
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFolder(folder.id);
                          }}
                          disabled={removingFolderId === folder.id}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {stats && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <Images className="size-4 text-muted-foreground" />
                              <span>{stats.source_count} to triage</span>
                            </div>
                            {(stats.keep_count > 0 || stats.maybe_count > 0) && (
                              <>
                                <span className="text-muted-foreground">|</span>
                                <span className="text-green-600">
                                  {stats.keep_count} kept
                                </span>
                                <span className="text-yellow-600">
                                  {stats.maybe_count} maybe
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Folder Dialog */}
      <AddFolderDialog
        open={isAddFolderOpen}
        onOpenChange={setIsAddFolderOpen}
        projectPath={currentProjectPath}
        onAdded={handleFolderAdded}
      />
    </main>
  );
}
