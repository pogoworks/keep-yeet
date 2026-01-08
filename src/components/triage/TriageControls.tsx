import { useAppStore, useTriageProgress, type Classification } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Check, Undo, Trash } from "@/components/ui/pixel-icon";
import { cn } from "@/lib/utils";

interface TriageControlsProps {
  className?: string;
  pressedKey?: Classification | null;
}

/**
 * TriageControls - Bottom bar with KEEP/MAYBE/YEET buttons.
 * Shows progress indicator and keyboard shortcuts.
 */
export function TriageControls({ className, pressedKey }: TriageControlsProps) {
  const classify = useAppStore((state) => state.classify);
  const images = useAppStore((state) => state.images);
  const { current, total } = useTriageProgress();

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

      {/* Triage buttons - centered (Yeet left, Keep right like Tinder swipe) */}
      <div className="flex items-center gap-3">
        <TriageButton
          variant="yeet"
          icon={<Trash size={20} />}
          label="Yeet"
          shortcut="D"
          onClick={() => classify("yeet")}
          disabled={isComplete || images.length === 0}
          isPressed={pressedKey === "yeet"}
        />
        <TriageButton
          variant="maybe"
          icon={<Undo size={20} />}
          label="Maybe"
          shortcut="␣"
          onClick={() => classify("maybe")}
          disabled={isComplete || images.length === 0}
          isPressed={pressedKey === "maybe"}
        />
        <TriageButton
          variant="keep"
          icon={<Check size={20} />}
          label="Keep"
          shortcut="K"
          onClick={() => classify("keep")}
          disabled={isComplete || images.length === 0}
          isPressed={pressedKey === "keep"}
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
  isPressed?: boolean;
}

const pressedStyles = {
  keep: "bg-keep text-keep-foreground shadow-[var(--glow-keep)] scale-[1.02]",
  maybe: "bg-maybe text-maybe-foreground shadow-[var(--glow-maybe)] scale-[1.02]",
  yeet: "bg-yeet text-yeet-foreground shadow-[var(--glow-yeet)] scale-[1.02]",
};

function TriageButton({
  variant,
  icon,
  label,
  shortcut,
  onClick,
  disabled,
  isPressed,
}: TriageButtonProps) {
  return (
    <Button
      variant={variant}
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative min-w-[120px] gap-2",
        isPressed && pressedStyles[variant]
      )}
    >
      {icon}
      <span>{label}</span>
      <Kbd className="ml-1 bg-black/20 text-current">{shortcut}</Kbd>
    </Button>
  );
}
