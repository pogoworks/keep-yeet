import {
  useAppStore,
  useCurrentImage,
  useTriageProgress,
} from "@/stores/useAppStore";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useTriageKeys } from "@/hooks/useTriageKeys";
import { Filmstrip, MainPreview, InfoPanel } from "@/components/browse";
import { TriageControls } from "@/components/triage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "@/components/ui/pixel-icon";

/**
 * TriageView - View for classifying images as KEEP/MAYBE/YEET.
 * Same layout as BrowseView but with triage controls at the bottom.
 */
export function TriageView() {
  const images = useAppStore((state) => state.images);
  const selectedIndex = useAppStore((state) => state.selectedIndex);
  const selectImage = useAppStore((state) => state.selectImage);
  const currentImage = useCurrentImage();
  const classifications = useAppStore((state) => state.classifications);
  const { current, total } = useTriageProgress();

  const currentFolder = useAppStore((state) => state.currentFolder);
  const currentProject = useAppStore((state) => state.currentProject);
  const resetTriage = useAppStore((state) => state.resetTriage);
  const finishTriage = useAppStore((state) => state.finishTriage);

  console.log("[TriageView] Render:", {
    imagesCount: images.length,
    selectedIndex,
    currentImage: currentImage?.name,
    currentFolder: currentFolder?.source_path,
    current,
    total,
  });

  // Enable keyboard navigation (arrow keys)
  useKeyboardNav();
  // Enable triage keyboard shortcuts (K/M/Y)
  useTriageKeys();

  // Check if all images are classified
  const isComplete = total > 0 && current > total;

  function getFolderName(path: string): string {
    return path.split(/[\/\\]/).pop() || path;
  }

  function handleBack() {
    resetTriage();
  }

  if (!currentFolder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">No folder selected</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No images loaded</p>
        <Button variant="outline" onClick={handleBack}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div data-slot="triage-view" className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold">
            Triage: {getFolderName(currentFolder.source_path)}
          </h1>
          {currentProject && (
            <p className="truncate text-xs text-muted-foreground">
              {currentProject.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Progress display */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tabular-nums">
              {Math.min(current, total)} / {total}
            </span>
            {isComplete && <CheckCircle size={20} className="text-keep" />}
          </div>
          {/* Finish button when all classified */}
          {isComplete && (
            <Button onClick={finishTriage} variant="keep">
              Review & Finish
            </Button>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {/* Main preview - takes most space */}
        <MainPreview image={currentImage} className="min-w-0 flex-1" />

        {/* Info panel - right sidebar */}
        <InfoPanel image={currentImage} />
      </div>

      {/* Filmstrip with classifications */}
      <Filmstrip
        images={images}
        selectedIndex={selectedIndex}
        onSelect={selectImage}
        thumbnailSize={180}
        classifications={classifications}
      />

      {/* Triage controls - fixed bottom bar */}
      <TriageControls />
    </div>
  );
}
