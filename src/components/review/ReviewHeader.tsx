import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ArrowLeft, CheckCircle } from "@/components/ui/pixel-icon";

export interface ReviewStats {
  keep: number;
  maybe: number;
  yeet: number;
}

export interface ReviewHeaderProps {
  title: string;
  subtitle?: string;
  stats: ReviewStats;
  onBack: () => void;
  onAccept: () => void;
  isAccepting?: boolean;
}

export function ReviewHeader({
  title,
  subtitle,
  stats,
  onBack,
  onAccept,
  isAccepting = false,
}: ReviewHeaderProps) {
  const totalClassified = stats.keep + stats.maybe + stats.yeet;
  const hasClassifications = totalClassified > 0;

  return (
    <header
      data-slot="review-header"
      className="flex items-center gap-4 border-b px-4 py-3"
    >
      {/* Back button */}
      <Button variant="ghost" size="icon" onClick={onBack} disabled={isAccepting}>
        <ArrowLeft size={20} />
      </Button>

      {/* Title and subtitle */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold">{title}</h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        <StatBadge label="Keep" count={stats.keep} colorClass="text-keep" />
        <StatBadge label="Maybe" count={stats.maybe} colorClass="text-maybe" />
        <StatBadge label="Yeet" count={stats.yeet} colorClass="text-yeet" />
      </div>

      {/* Keyboard shortcuts */}
      <div className="hidden items-center gap-4 border-l border-border pl-4 text-xs text-muted-foreground lg:flex">
        <ShortcutHint keys={["↵"]} label="Keep" labelClass="text-keep" />
        <ShortcutHint keys={["⌘", "↵"]} label="Maybe" labelClass="text-maybe" />
        <ShortcutHint keys={["⌫"]} label="Yeet" labelClass="text-yeet" />
        <ShortcutHint keys={["⌥", "←→"]} label="Move" />
        <ShortcutHint keys={["⇧", "↑↓"]} label="Multi" />
      </div>

      {/* Accept button */}
      <Button
        variant="keep"
        onClick={onAccept}
        disabled={!hasClassifications || isAccepting}
      >
        {isAccepting ? (
          <>
            <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            Accept
          </>
        )}
      </Button>
    </header>
  );
}

function StatBadge({
  label,
  count,
  colorClass,
}: {
  label: string;
  count: number;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("text-sm font-medium tabular-nums", colorClass)}>
        {count}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
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
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <Kbd key={i}>{key}</Kbd>
      ))}
      <span className={cn("ml-0.5", labelClass)}>{label}</span>
    </div>
  );
}
