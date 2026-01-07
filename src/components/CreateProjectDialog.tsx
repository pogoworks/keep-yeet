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
import { createProject, pickOutputLocation } from "@/lib/tauri";
import { FolderOpen } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

/**
 * CreateProjectDialog - Dialog for creating a new project.
 * Allows setting project name and output location.
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePickLocation() {
    try {
      const path = await pickOutputLocation();
      if (path) {
        setOutputPath(path);
      }
    } catch (err) {
      console.error("Failed to pick location:", err);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!outputPath.trim()) {
      setError("Please select an output location");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await createProject(name.trim(), outputPath.trim());

      // Reset form
      setName("");
      setOutputPath("");
      onCreated();
    } catch (err) {
      console.error("Failed to create project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      // Reset form when closing
      setName("");
      setOutputPath("");
      setError(null);
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set a name and choose where to save triaged images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="project-name"
              placeholder="My SD Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>

          {/* Output Location */}
          <div className="space-y-2">
            <label htmlFor="output-location" className="text-sm font-medium">
              Output Location
            </label>
            <div className="flex gap-2">
              <Input
                id="output-location"
                placeholder="~/Documents/Toss"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePickLocation}
              >
                <FolderOpen className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A folder with the project name will be created here
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
