import { FolderPlus } from "@/components/ui/pixel-icon";

interface AddFolderCardProps {
  onClick?: () => void;
}

/**
 * AddFolderCard - A card matching SourceFolderCard's structure for adding new folders.
 * Uses dashed border styling with centered icon and text.
 */
export function AddFolderCard({ onClick }: AddFolderCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-transparent text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
    >
      <FolderPlus size={32} />
      <span className="text-xs font-medium uppercase tracking-wide">
        Add Folder
      </span>
    </button>
  );
}
