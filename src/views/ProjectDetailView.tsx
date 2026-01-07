import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { useAppStore } from "@/stores/useAppStore";
import { AddFolderDialog } from "@/components/AddFolderDialog";
import { SourceFolderCard } from "@/components/SourceFolderCard";
import { ProjectStatsBar } from "@/components/ProjectStatsBar";
import { SubNavigation, type NavTab } from "@/components/SubNavigation";
import { FolderPlus } from "@/components/ui/pixel-icon";

/**
 * ProjectDetailView - Shows project details with folder list.
 * Allows adding/removing source folders and navigating to browse/triage.
 */
export function ProjectDetailView() {
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const currentProject = useAppStore((state) => state.currentProject);
  const currentProjectPath = useAppStore((state) => state.currentProjectPath);
  const currentProjectStats = useAppStore((state) => state.currentProjectStats);
  const refreshProjectStats = useAppStore((state) => state.refreshProjectStats);
  const selectFolder = useAppStore((state) => state.selectFolder);

  // Build navigation tabs from folders
  const navTabs = useMemo((): NavTab[] => {
    const tabs: NavTab[] = [{ id: "overview", label: "Overview", icon: "grid" }];
    if (currentProject) {
      currentProject.folders.forEach((folder) => {
        const name = folder.source_path.split(/[\/\\]/).pop() || folder.source_path;
        tabs.push({ id: folder.id, label: name, icon: "folder" });
      });
    }
    return tabs;
  }, [currentProject]);

  if (!currentProject || !currentProjectPath) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">No project selected</p>
        </div>
      </AppShell>
    );
  }

  async function handleFolderAdded() {
    setIsAddFolderOpen(false);
    try {
      await refreshProjectStats();
    } catch (err) {
      console.error("Failed to refresh project stats:", err);
    }
  }

  function getFolderStats(folderId: string) {
    return currentProjectStats?.folder_stats.find(
      (s) => s.folder_id === folderId
    );
  }

  const headerSecondary = (
    <>
      <SubNavigation
        tabs={navTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {currentProjectStats && (
        <div className="border-t">
          <ProjectStatsBar
            keepCount={currentProjectStats.total_keep}
            maybeCount={currentProjectStats.total_maybe}
          />
        </div>
      )}
    </>
  );

  return (
    <AppShell
      headerActions={
        <Button size="sm" onClick={() => setIsAddFolderOpen(true)}>
          <FolderPlus size={14} className="mr-1.5" />
          Add Folder
        </Button>
      }
      headerSecondary={headerSecondary}
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
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {currentProject.folders.map((folder) => (
              <SourceFolderCard
                key={folder.id}
                folder={folder}
                stats={getFolderStats(folder.id)}
                onClick={() => selectFolder(folder)}
              />
            ))}
          </div>
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
