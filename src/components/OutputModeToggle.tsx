import { useState } from "react";
import { MigrationDialog } from "@/components/MigrationDialog";
import { Folder, Grid } from "@/components/ui/pixel-icon";
import type { ProjectStats } from "@/lib/tauri";

interface OutputModeToggleProps {
  projectPath: string;
  currentMode: "unified" | "per-folder";
  projectStats: ProjectStats | null;
  onModeChanged: () => Promise<void>;
}

/**
 * OutputModeToggle - Button to toggle between unified and per-folder output modes.
 * Shows migration dialog when switching with existing outputs.
 */
export function OutputModeToggle({
  projectPath,
  currentMode,
  projectStats,
  onModeChanged,
}: OutputModeToggleProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [targetMode, setTargetMode] = useState<"unified" | "per-folder">(
    currentMode === "unified" ? "per-folder" : "unified"
  );

  const isUnified = currentMode === "unified";
  const hasOutputs =
    projectStats &&
    (projectStats.total_keep > 0 || projectStats.total_maybe > 0);

  function handleClick() {
    const newMode = isUnified ? "per-folder" : "unified";
    setTargetMode(newMode);
    setShowDialog(true);
  }

  async function handleComplete() {
    await onModeChanged();
  }

  const Icon = isUnified ? Grid : Folder;
  const label = isUnified
    ? "Unified output folders"
    : "Separate output per source";

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon size={12} />
        <span>{label}</span>
      </button>

      <MigrationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        projectPath={projectPath}
        targetMode={targetMode}
        hasExistingOutputs={!!hasOutputs}
        onComplete={handleComplete}
      />
    </>
  );
}
