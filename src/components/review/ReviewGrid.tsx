import { cn } from "@/lib/utils";
import { DragDropColumn } from "./DragDropColumn";
import { ReviewPreviewPanel } from "./ReviewPreviewPanel";
import type { ImageFile, Classification } from "@/stores/useAppStore";

export interface ClassifiedImages {
  keep: ImageFile[];
  maybe: ImageFile[];
  yeet: ImageFile[];
}

export interface ReviewGridProps {
  classifiedImages: ClassifiedImages;
  selectedImageIds: Set<string>;
  focusedImageId: string | null;
  onSelectImage: (imageId: string, addToSelection?: boolean) => void;
  classifications: Record<string, Classification>;
  className?: string;
}

export function ReviewGrid({
  classifiedImages,
  selectedImageIds,
  focusedImageId,
  onSelectImage,
  classifications,
  className,
}: ReviewGridProps) {
  // Find the focused image for preview
  const allImages = [
    ...classifiedImages.keep,
    ...classifiedImages.maybe,
    ...classifiedImages.yeet,
  ];
  const focusedImage = allImages.find((img) => img.id === focusedImageId);
  const focusedClassification = focusedImageId
    ? classifications[focusedImageId]
    : undefined;

  return (
    <div
      data-slot="review-grid"
      className={cn("flex min-h-0 flex-1 gap-4 p-4", className)}
    >
      {/* Three columns */}
      <div className="flex min-w-0 flex-1 gap-4">
        <DragDropColumn
          classification="keep"
          images={classifiedImages.keep}
          selectedImageIds={selectedImageIds}
          focusedImageId={focusedImageId}
          onSelectImage={onSelectImage}
        />
        <DragDropColumn
          classification="maybe"
          images={classifiedImages.maybe}
          selectedImageIds={selectedImageIds}
          focusedImageId={focusedImageId}
          onSelectImage={onSelectImage}
        />
        <DragDropColumn
          classification="yeet"
          images={classifiedImages.yeet}
          selectedImageIds={selectedImageIds}
          focusedImageId={focusedImageId}
          onSelectImage={onSelectImage}
        />
      </div>

      {/* Preview panel */}
      <ReviewPreviewPanel
        image={focusedImage}
        classification={focusedClassification}
        selectedCount={selectedImageIds.size}
        className="w-[400px] flex-shrink-0"
      />
    </div>
  );
}
