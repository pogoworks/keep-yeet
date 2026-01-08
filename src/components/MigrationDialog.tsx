import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { migrateProjectOutputs, updateProjectOutputMode } from "@/lib/tauri";
import { toast } from "sonner";

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectPath: string;
  targetMode: "unified" | "per-folder";
  hasExistingOutputs: boolean;
  onComplete: () => void;
}

/**
 * MigrationDialog - Confirms output mode change and optionally migrates existing files.
 */
export function MigrationDialog({
  open,
  onOpenChange,
  projectPath,
  targetMode,
  hasExistingOutputs,
  onComplete,
}: MigrationDialogProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [conflicts, setConflicts] = useState<string[]>([]);

  const isToUnified = targetMode === "unified";

  async function handleUpdateOnly() {
    try {
      await updateProjectOutputMode(projectPath, targetMode);
      toast.success("Output mode updated");
      onComplete();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update output mode"
      );
    }
  }

  async function handleMigrate() {
    setIsMigrating(true);
    try {
      // First migrate files
      const conflictList = await migrateProjectOutputs(projectPath, targetMode);
      setConflicts(conflictList);

      // Then update the mode
      await updateProjectOutputMode(projectPath, targetMode);

      if (conflictList.length > 0) {
        toast.warning(
          `Migration complete with ${conflictList.length} renamed files`
        );
      } else {
        toast.success("Migration completed successfully");
      }

      onComplete();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setIsMigrating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Switch to {isToUnified ? "Unified" : "Per-Folder"} Output?
          </DialogTitle>
          <DialogDescription>
            {isToUnified
              ? "All future triages will place files in single keep/ and maybe/ folders at the project root."
              : "All future triages will place files in separate folders for each source (e.g., folder-name/keep/)."}
          </DialogDescription>
        </DialogHeader>

        {hasExistingOutputs && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">You have existing triaged files.</p>
            <p className="mt-1 text-muted-foreground">
              {isToUnified
                ? "Would you like to move them to the unified structure? File name conflicts will be auto-renamed (e.g., IMG_001.jpg → IMG_001_1.jpg)."
                : "Would you like to move them back to per-folder structure based on their original source?"}
            </p>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="rounded-md bg-muted p-3 text-xs">
            <p className="mb-2 font-medium">Renamed files:</p>
            <ul className="space-y-0.5">
              {conflicts.slice(0, 5).map((file) => (
                <li key={file} className="text-muted-foreground">
                  {file}
                </li>
              ))}
              {conflicts.length > 5 && (
                <li className="text-muted-foreground">
                  ...and {conflicts.length - 5} more
                </li>
              )}
            </ul>
          </div>
        )}

        <DialogFooter className="mt-2">
          {hasExistingOutputs ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="outline" onClick={handleUpdateOnly}>
                Don't move files
              </Button>
              <Button onClick={handleMigrate} disabled={isMigrating}>
                {isMigrating ? "Migrating..." : "Move files"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateOnly}>Confirm</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
