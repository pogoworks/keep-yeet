import { useAppStore, useCurrentImage } from "@/stores/useAppStore";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { Filmstrip, MainPreview, InfoPanel } from "@/components/browse";

/**
 * BrowseView - Main view for browsing images in a folder.
 * Layout: MainPreview (center) + InfoPanel (right sidebar) + Filmstrip (bottom)
 */
export function BrowseView() {
  const images = useAppStore((state) => state.images);
  const selectedIndex = useAppStore((state) => state.selectedIndex);
  const selectImage = useAppStore((state) => state.selectImage);
  const currentImage = useCurrentImage();

  // Enable keyboard navigation (arrow keys)
  useKeyboardNav();

  return (
    <div data-slot="browse-view" className="flex h-screen flex-col">
      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {/* Main preview - takes most space */}
        <MainPreview image={currentImage} className="min-w-0 flex-1" />

        {/* Info panel - right sidebar */}
        <InfoPanel image={currentImage} />
      </div>

      {/* Filmstrip - bottom */}
      <Filmstrip
        images={images}
        selectedIndex={selectedIndex}
        onSelect={selectImage}
        thumbnailSize={180}
      />
    </div>
  );
}
