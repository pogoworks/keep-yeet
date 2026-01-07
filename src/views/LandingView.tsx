import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore, type ImageFile } from "@/stores/useAppStore";
import { pickFolder, listImages, getThumbnail } from "@/lib/tauri";

/**
 * LandingView - Initial view for selecting a folder to browse.
 * Shows folder picker and recent folders list.
 */
export function LandingView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track current folder loading session for cancellation
  const loadingSessionRef = useRef(0);

  const recentFolders = useAppStore((state) => state.recentFolders);
  const setCurrentFolder = useAppStore((state) => state.setCurrentFolder);
  const addRecentFolder = useAppStore((state) => state.addRecentFolder);
  const setImages = useAppStore((state) => state.setImages);
  const updateImageThumbnail = useAppStore(
    (state) => state.updateImageThumbnail
  );
  const setMode = useAppStore((state) => state.setMode);

  async function loadFolder(folderPath: string) {
    // Increment session to cancel any in-progress thumbnail loading
    const currentSession = ++loadingSessionRef.current;

    try {
      setIsLoading(true);
      setError(null);

      // List images in the folder
      const imageInfos = await listImages(folderPath);

      if (imageInfos.length === 0) {
        setError("No images found in this folder");
        setIsLoading(false);
        return;
      }

      // Convert to ImageFile format (without thumbnails initially)
      const images: ImageFile[] = imageInfos.map((info) => ({
        id: info.id,
        path: info.path,
        name: info.name,
        thumbnailUrl: null,
        size: info.size,
        dimensions:
          info.width && info.height
            ? { width: info.width, height: info.height }
            : undefined,
      }));

      // Update store
      setCurrentFolder(folderPath);
      addRecentFolder(folderPath);
      setImages(images);
      setMode("browse");

      // Load thumbnails in background (don't block mode change)
      loadThumbnailsInBackground(images, currentSession);
    } catch (err) {
      console.error("Failed to load folder:", err);
      setError(err instanceof Error ? err.message : "Failed to load folder");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadThumbnailsInBackground(
    images: ImageFile[],
    session: number
  ) {
    // Load thumbnails progressively, checking for cancellation
    for (const image of images) {
      // Check if this loading session is still valid
      if (loadingSessionRef.current !== session) {
        return; // A new folder was selected, stop loading
      }

      try {
        const thumbnailUrl = await getThumbnail(image.path, 180);

        // Check again after async operation
        if (loadingSessionRef.current !== session) {
          return;
        }

        updateImageThumbnail(image.id, thumbnailUrl);
      } catch (err) {
        console.error(`Failed to load thumbnail for ${image.name}:`, err);
      }
    }
  }

  async function handleSelectFolder() {
    try {
      const folder = await pickFolder();
      if (folder) {
        await loadFolder(folder);
      }
    } catch (err) {
      console.error("Folder picker error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to open folder picker"
      );
    }
  }

  async function handleRecentFolder(folder: string) {
    await loadFolder(folder);
  }

  return (
    <main
      data-slot="landing-view"
      className="flex h-screen flex-col items-center justify-center gap-6 bg-background p-8"
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold">Toss</h1>
        <p className="mt-2 text-muted-foreground">
          Image triage for Stable Diffusion
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select a folder</CardTitle>
          <CardDescription>
            Choose a folder containing images to browse and triage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSelectFolder}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Select Folder"}
          </Button>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {recentFolders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Recent folders</p>
              <ul className="space-y-1">
                {recentFolders.map((folder) => (
                  <li key={folder}>
                    <button
                      onClick={() => handleRecentFolder(folder)}
                      disabled={isLoading}
                      className="w-full truncate rounded-md px-2 py-1 text-left text-sm font-mono hover:bg-muted disabled:opacity-50"
                      title={folder}
                    >
                      {folder}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
