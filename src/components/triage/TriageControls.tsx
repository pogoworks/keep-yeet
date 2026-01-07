import { useAppStore, useTriageProgress } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { Check, Undo, Trash } from "@/components/ui/pixel-icon";
import { cn } from "@/lib/utils";

interface TriageControlsProps {
  className?: string;
}

/**
 * TriageControls - Bottom bar with KEEP/MAYBE/YEET buttons.
 * Shows progress indicator and keyboard shortcuts.
 */
export function TriageControls({ className }: TriageControlsProps) {
  const classify = useAppStore((state) => state.classify);
  const images = useAppStore((state) => state.images);
  const { current, total } = useTriageProgress();

  console.log("[TriageControls] Render:", { imagesCount: images.length, current, total });

  const isComplete = current > total;

  return (
    <div
      data-slot="triage-controls"
      className={cn(
        "relative flex items-center justify-center gap-4 border-t bg-card/80 px-6 py-4 backdrop-blur-sm",
        className
      )}
    >
      {/* Progress indicator - left side */}
      <div className="absolute left-6 flex flex-col gap-1">
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {Math.min(current, total)} / {total}
        </span>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-[var(--duration-fast)]"
            style={{ width: `${total > 0 ? (Math.min(current, total) / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Triage buttons - centered */}
      <div className="flex items-center gap-3">
        <TriageButton
          variant="keep"
          icon={<Check size={20} />}
          label="Keep"
          shortcut="K"
          onClick={() => classify("keep")}
          disabled={isComplete || images.length === 0}
        />
        <TriageButton
          variant="maybe"
          icon={<Undo size={20} />}
          label="Maybe"
          shortcut="M"
          onClick={() => classify("maybe")}
          disabled={isComplete || images.length === 0}
        />
        <TriageButton
          variant="yeet"
          icon={<Trash size={20} />}
          label="Yeet"
          shortcut="Y"
          onClick={() => classify("yeet")}
          disabled={isComplete || images.length === 0}
        />
      </div>

      {/* Keyboard hint - right side */}
      <div className="absolute right-6 text-xs text-muted-foreground">
        ← → to navigate
      </div>
    </div>
  );
}

interface TriageButtonProps {
  variant: "keep" | "maybe" | "yeet";
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
}

function TriageButton({
  variant,
  icon,
  label,
  shortcut,
  onClick,
  disabled,
}: TriageButtonProps) {
  return (
    <Button
      variant={variant}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="relative min-w-[120px] gap-2"
    >
      {icon}
      <span>{label}</span>
      <kbd className="ml-1 rounded bg-black/20 px-1.5 py-0.5 text-xs font-mono">
        {shortcut}
      </kbd>
    </Button>
  );
}
