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
import { Input } from "@/components/ui/input";
import { pickFolder, addFolderToProject } from "@/lib/tauri";
import { Folder, ArrowsHorizontal, Copy } from "@/components/ui/pixel-icon";

interface AddFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectPath: string;
  onAdded: () => void;
}

type OutputMode = "move" | "copy";

/**
 * AddFolderDialog - Dialog for adding a source folder to a project.
 * Allows picking a folder and choosing move vs copy mode.
 */
export function AddFolderDialog({
  open,
  onOpenChange,
  projectPath,
  onAdded,
}: AddFolderDialogProps) {
  const [sourcePath, setSourcePath] = useState("");
  const [outputMode, setOutputMode] = useState<OutputMode>("move");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePickFolder() {
    try {
      const path = await pickFolder();
      if (path) {
        setSourcePath(path);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to pick folder:", err);
    }
  }

  async function handleAdd() {
    if (!sourcePath.trim()) {
      setError("Please select a source folder");
      return;
    }

    try {
      setIsAdding(true);
      setError(null);
      await addFolderToProject(projectPath, sourcePath.trim(), outputMode);

      // Reset form
      setSourcePath("");
      setOutputMode("move");
      onAdded();
    } catch (err) {
      console.error("Failed to add folder:", err);
      setError(err instanceof Error ? err.message : "Failed to add folder");
    } finally {
      setIsAdding(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      // Reset form when closing
      setSourcePath("");
      setOutputMode("move");
      setError(null);
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Source Folder</DialogTitle>
          <DialogDescription>
            Select a folder containing images to triage. Choose whether to move
            or copy files when triaging.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Folder */}
          <div className="space-y-2">
            <label htmlFor="source-folder" className="text-sm font-medium">
              Source Folder
            </label>
            <div className="flex gap-2">
              <Input
                id="source-folder"
                placeholder="Click to select a folder..."
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                className="flex-1 font-mono text-sm"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                onClick={handlePickFolder}
              >
                <Folder size={16} className="mr-2" />
                Browse
              </Button>
            </div>
          </div>

          {/* Output Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Output Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOutputMode("move")}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  outputMode === "move"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <ArrowsHorizontal
                  size={24}
                  className={
                    outputMode === "move"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                />
                <div className="text-center">
                  <p className="font-medium">Move</p>
                  <p className="text-xs text-muted-foreground">
                    Files are moved to project folder
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setOutputMode("copy")}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                  outputMode === "copy"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Copy
                  size={24}
                  className={
                    outputMode === "copy"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                />
                <div className="text-center">
                  <p className="font-medium">Copy</p>
                  <p className="text-xs text-muted-foreground">
                    Files are copied, originals kept
                  </p>
                </div>
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!sourcePath.trim() || isAdding}>
            {isAdding ? "Adding..." : "Add Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
