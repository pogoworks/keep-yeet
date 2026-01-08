import { ComponentProps } from "react";
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
  /** Whether the keyboard shortcut is currently pressed (for visual feedback) */
  isPressed?: boolean;
}

export function StartTriageButton({
  onClick,
  size = "sm",
  label = "Start Triage",
  showShortcut = true,
  isPressed = false,
  className,
  ...props
}: StartTriageButtonProps) {
  const startTriage = useAppStore((state) => state.startTriage);
  const iconSize = size === "lg" ? 16 : 14;

  return (
    <Button
      onClick={onClick ?? startTriage}
      size={size}
      variant="triage"
      className={cn(
        "text-base font-medium tracking-wide",
        isPressed && "bg-amber-500 text-amber-950 shadow-[0_0_20px_0_oklch(0.75_0.18_85/0.5)] scale-[1.02]",
        className
      )}
      {...props}
    >
      <Zap size={iconSize} />
      {label}
      {showShortcut && (
        <Kbd className="ml-1.5 bg-black/20 text-current">⇧↵</Kbd>
      )}
    </Button>
  );
}
