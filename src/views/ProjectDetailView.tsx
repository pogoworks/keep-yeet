import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { useAppStore } from "@/stores/useAppStore";
import { useEscapeNav } from "@/hooks/useEscapeNav";
import { useTabNavKeys } from "@/hooks/useTabNavKeys";
import { AddFolderDialog } from "@/components/AddFolderDialog";
import { AddFolderCard } from "@/components/AddFolderCard";
import { SourceFolderCard } from "@/components/SourceFolderCard";
import { FolderBrowseView } from "@/components/FolderBrowseView";
import { ProjectStatsBar } from "@/components/ProjectStatsBar";
import { SubNavigation, type NavTab } from "@/components/SubNavigation";
import { FolderPlus } from "@/components/ui/pixel-icon";

/**
 * ProjectDetailView - Shows project details with folder list.
 * Allows adding/removing source folders and navigating to browse/triage.
 */
export function ProjectDetailView() {
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);

  const currentProject = useAppStore((state) => state.currentProject);
  const currentProjectPath = useAppStore((state) => state.currentProjectPath);
  const currentProjectStats = useAppStore((state) => state.currentProjectStats);
  const currentFolder = useAppStore((state) => state.currentFolder);
  const refreshProjectStats = useAppStore((state) => state.refreshProjectStats);
  const selectFolder = useAppStore((state) => state.selectFolder);
  const startTriage = useAppStore((state) => state.startTriage);

  // Initialize activeTab from currentFolder (avoids animation flash when returning from triage)
  const [activeTab, setActiveTab] = useState(() =>
    currentFolder ? currentFolder.id : "overview"
  );

  // Sync activeTab with currentFolder (e.g., when returning from triage)
  useEffect(() => {
    if (currentFolder) {
      setActiveTab(currentFolder.id);
    }
  }, [currentFolder]);

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

  // Get active folder from tab
  const activeFolder = useMemo(() => {
    if (activeTab === "overview" || !currentProject) return null;
    return currentProject.folders.find((f) => f.id === activeTab) || null;
  }, [activeTab, currentProject]);

  // Handle starting triage from folder browse view
  function handleStartTriage() {
    if (!activeFolder) return;
    selectFolder(activeFolder);
    startTriage();
  }

  const isOverview = activeTab === "overview";

  // ESC key navigation: overview → projects, folder tab → overview
  const handleEscapeFromFolderTab = useCallback(() => {
    setActiveTab("overview");
  }, []);

  useEscapeNav({
    isOverview,
    onEscapeFromFolderTab: handleEscapeFromFolderTab,
  });

  // Ctrl+Tab/Ctrl+Shift+Tab sequential nav, Cmd/Ctrl+1-9 direct jump, Shift+Enter triage
  const { isStartTriagePressed } = useTabNavKeys({
    tabs: navTabs,
    activeTab,
    onTabChange: setActiveTab,
    onStartTriage: handleStartTriage,
    canStartTriage: !!activeFolder,
  });

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
      toast.error("Failed to refresh project stats");
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
      {/* Stats bar collapses - AppShell border-b handles separator */}
      {currentProjectStats && (
        <div className="overflow-hidden">
          <motion.div
            initial={false}
            animate={{ height: isOverview ? "auto" : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          >
            <ProjectStatsBar
              keepCount={currentProjectStats.total_keep}
              maybeCount={currentProjectStats.total_maybe}
            />
          </motion.div>
        </div>
      )}
    </>
  );

  return (
    <AppShell
      headerSecondary={headerSecondary}
      contentClassName={isOverview ? "p-4" : undefined}
      contentScrolls={isOverview}
    >
      {isOverview ? (
        // Overview: Folder cards grid
        currentProject.folders.length === 0 ? (
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
                  onClick={() => setActiveTab(folder.id)}
                />
              ))}
              <AddFolderCard onClick={() => setIsAddFolderOpen(true)} />
            </div>
          </div>
        )
      ) : activeFolder ? (
        // Folder tab: Browse view
        <FolderBrowseView
          folder={activeFolder}
          onStartTriage={handleStartTriage}
          isStartTriagePressed={isStartTriagePressed}
        />
      ) : null}

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
