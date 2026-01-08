import { MainPreview, Filmstrip } from "@/components/browse";
import { ProjectGalleryStatsBar } from "@/components/ProjectGalleryStatsBar";
import { useGallerySession, type GalleryTab } from "@/hooks/useGallerySession";
import { useLocalKeyboardNav } from "@/hooks/useLocalKeyboardNav";
import { cn } from "@/lib/utils";
import { CheckCircle, Undo } from "@/components/ui/pixel-icon";

const THUMBNAIL_SIZE = 80;
const FILMSTRIP_HEIGHT = THUMBNAIL_SIZE + 32;

interface GalleryTabButtonProps {
  tab: GalleryTab;
  isActive: boolean;
  onClick: () => void;
}

function GalleryTabButton({ tab, isActive, onClick }: GalleryTabButtonProps) {
  const Icon = tab === "keep" ? CheckCircle : Undo;
  const label = tab === "keep" ? "Keeps" : "Maybes";
  const iconColor = tab === "keep" ? "text-keep" : "text-maybe";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon size={12} className={iconColor} />
      <span className="uppercase">{label}</span>
    </button>
  );
}

interface ProjectGalleryPanelProps {
  projectPath: string;
  onReTriage: () => void;
  className?: string;
}

/**
 * ProjectGalleryPanel - Tabbed gallery for viewing keeps/maybes.
 * Composes tabs + MainPreview + Filmstrip + ProjectGalleryStatsBar.
 */
export function ProjectGalleryPanel({
  projectPath,
  onReTriage,
  className,
}: ProjectGalleryPanelProps) {
  const {
    tab,
    setTab,
    images,
    selectedIndex,
    isLoading,
    error,
    currentImage,
    selectImage,
    navigateNext,
    navigatePrev,
    totalSize,
  } = useGallerySession(projectPath);

  // Local keyboard navigation (only when not loading)
  useLocalKeyboardNav(navigateNext, navigatePrev, !isLoading);

  return (
    <div className={cn("flex h-full flex-col border-l bg-background", className)}>
      {/* Tabs */}
      <div className="flex border-b">
        <GalleryTabButton
          tab="keep"
          isActive={tab === "keep"}
          onClick={() => setTab("keep")}
        />
        <GalleryTabButton
          tab="maybe"
          isActive={tab === "maybe"}
          onClick={() => setTab("maybe")}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No {tab === "keep" ? "keeps" : "maybes"} yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Triage some folders to see images here
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Preview */}
            <div className="relative flex-1 overflow-hidden">
              <MainPreview image={currentImage} className="h-full" />
            </div>

            {/* Filmstrip */}
            <div
              style={{ height: FILMSTRIP_HEIGHT }}
              className="flex-shrink-0"
            >
              <Filmstrip
                images={images}
                selectedIndex={selectedIndex}
                onSelect={selectImage}
                thumbnailSize={THUMBNAIL_SIZE}
                className="h-full"
              />
            </div>
          </>
        )}
      </div>

      {/* Stats Bar */}
      <ProjectGalleryStatsBar
        imageCount={images.length}
        totalSize={totalSize}
        variant={tab}
        onReTriage={tab === "maybe" ? onReTriage : undefined}
      />
    </div>
  );
}
