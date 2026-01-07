import { ComponentProps, useMemo } from "react";
import { Zap } from "./pixel-icon";
import { Button } from "./button";
import { Kbd } from "./kbd";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

export interface StartTriageButtonProps
  extends Omit<ComponentProps<typeof Button>, "children" | "onClick"> {
  /** Override the default startTriage action */
  onClick?: () => void;
  /** Button label (default: "Start Triage") */
  label?: string;
  /** Show keyboard shortcut hint (default: true) */
  showShortcut?: boolean;
}

export function StartTriageButton({
  onClick,
  size = "sm",
  label = "Start Triage",
  showShortcut = true,
  className,
  ...props
}: StartTriageButtonProps) {
  const startTriage = useAppStore((state) => state.startTriage);
  const iconSize = size === "lg" ? 16 : 14;

  // Detect Mac vs Windows/Linux for shortcut display
  const isMac = useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    []
  );
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <Button
      onClick={onClick ?? startTriage}
      size={size}
      variant="triage"
      className={cn(
        "text-base font-medium tracking-wide",
        className
      )}
      {...props}
    >
      <Zap size={iconSize} />
      {label}
      {showShortcut && (
        <Kbd className="ml-1.5 bg-black/20 text-current">{modKey}↵</Kbd>
      )}
    </Button>
  );
}
