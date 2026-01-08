import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
import { ProjectGalleryPanel } from "@/components/ProjectGalleryPanel";
import { OutputModeToggle } from "@/components/OutputModeToggle";
import { SubNavigation, type NavTab } from "@/components/SubNavigation";
import { FolderPlus } from "@/components/ui/pixel-icon";

/**
 * ProjectDetailView - Shows project details with folder list.
 * Allows adding/removing source folders and navigating to browse/triage.
 */
export function ProjectDetailView() {
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(true);

  const currentProject = useAppStore((state) => state.currentProject);
  const currentProjectPath = useAppStore((state) => state.currentProjectPath);
  const currentProjectStats = useAppStore((state) => state.currentProjectStats);
  const currentFolder = useAppStore((state) => state.currentFolder);
  const refreshProjectStats = useAppStore((state) => state.refreshProjectStats);
  const preloadProjectFolders = useAppStore((state) => state.preloadProjectFolders);
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

  // Handle re-triage of maybes (placeholder - will implement startReTriage action)
  function handleReTriage() {
    toast.info("Re-triage feature coming soon");
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
      // Preload images for all folders (including the new one)
      preloadProjectFolders();
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
              isGalleryOpen={isGalleryOpen}
              onGalleryToggle={() => setIsGalleryOpen((prev) => !prev)}
            />
          </motion.div>
        </div>
      )}
    </>
  );

  return (
    <AppShell
      headerSecondary={headerSecondary}
      contentClassName={isOverview && currentProject.folders.length === 0 ? "p-4" : undefined}
      contentScrolls={false}
    >
      {isOverview ? (
        // Overview: Split layout - folders on left, gallery on right
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
          <div className="flex h-full flex-col">
            {/* Main split area */}
            <div className="relative flex min-h-0 flex-1 overflow-hidden">
              {/* Left: Folder cards - 3-column width using rem for scaling */}
              <div className="h-full w-[40rem] flex-shrink-0 space-y-3 overflow-auto p-4">
                <h2 className="px-1 text-xs font-medium text-muted-foreground">
                  Source Folders
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {currentProject.folders.map((folder) => (
                    <SourceFolderCard
                      key={folder.id}
                      folder={folder}
                      stats={getFolderStats(folder.id)}
                      onClick={() => setActiveTab(folder.id)}
                    />
                  ))}
                </div>
                <AddFolderCard onClick={() => setIsAddFolderOpen(true)} />
              </div>

              {/* Right: Gallery panel - fills remaining space */}
              <AnimatePresence>
                {isGalleryOpen && (
                  <motion.div
                    className="h-full min-w-0 flex-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  >
                    <ProjectGalleryPanel
                      projectPath={currentProjectPath}
                      onReTriage={handleReTriage}
                      className="h-full"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom bar - spans full width */}
            <div className="flex items-center gap-1.5 border-t bg-background px-3 py-2 text-xs">
              <OutputModeToggle
                projectPath={currentProjectPath}
                currentMode={currentProject.output_directory_mode ?? "per-folder"}
                projectStats={currentProjectStats}
                onModeChanged={refreshProjectStats}
              />
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
