import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { CheckCircle } from "@/components/ui/pixel-icon";

export interface ReviewStats {
  keep: number;
  maybe: number;
  yeet: number;
}

export interface ReviewHeaderActionsProps {
  stats: ReviewStats;
  onAccept: () => void;
  isAccepting?: boolean;
}

/**
 * ReviewHeaderActions - Header actions for review mode.
 * Shows stats, keyboard shortcuts, and accept button.
 * Designed to be used as headerActions in AppShell.
 */
export function ReviewHeaderActions({
  stats,
  onAccept,
  isAccepting = false,
}: ReviewHeaderActionsProps) {
  const totalClassified = stats.keep + stats.maybe + stats.yeet;
  const hasClassifications = totalClassified > 0;

  return (
    <div className="flex items-center gap-3">
      {/* Stats */}
      <div className="flex items-center gap-2">
        <StatBadge count={stats.keep} colorClass="text-keep" />
        <StatBadge count={stats.maybe} colorClass="text-maybe" />
        <StatBadge count={stats.yeet} colorClass="text-yeet" />
      </div>

      {/* Keyboard shortcuts - hidden on small screens */}
      <div className="hidden items-center gap-3 border-l border-border pl-3 text-xs text-muted-foreground lg:flex">
        <ShortcutHint keys={["↵"]} label="K" labelClass="text-keep" />
        <ShortcutHint keys={["⌘↵"]} label="M" labelClass="text-maybe" />
        <ShortcutHint keys={["⌫"]} label="Y" labelClass="text-yeet" />
      </div>

      {/* Accept button */}
      <Button
        variant="keep"
        size="sm"
        onClick={onAccept}
        disabled={!hasClassifications || isAccepting}
      >
        {isAccepting ? (
          <>
            <div className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle size={14} />
            Accept
          </>
        )}
      </Button>
    </div>
  );
}

function StatBadge({
  count,
  colorClass,
}: {
  count: number;
  colorClass: string;
}) {
  return (
    <span className={cn("text-xs font-medium tabular-nums", colorClass)}>
      {count}
    </span>
  );
}

function ShortcutHint({
  keys,
  label,
  labelClass,
}: {
  keys: string[];
  label: string;
  labelClass?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {keys.map((key, i) => (
        <Kbd key={i} className="h-4 min-w-4 text-xs">{key}</Kbd>
      ))}
      <span className={cn("ml-0.5", labelClass)}>{label}</span>
    </div>
  );
}

// Keep old export for backwards compatibility during refactor
export { ReviewHeaderActions as ReviewHeader };
export type { ReviewHeaderActionsProps as ReviewHeaderProps };
