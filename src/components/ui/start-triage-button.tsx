import { ComponentProps } from "react";
import { Zap } from "./pixel-icon";
import { Button } from "./button";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

export interface StartTriageButtonProps
  extends Omit<ComponentProps<typeof Button>, "children" | "onClick"> {
  /** Override the default startTriage action */
  onClick?: () => void;
  /** Button label (default: "Start Triage") */
  label?: string;
}

export function StartTriageButton({
  onClick,
  size = "sm",
  label = "Start Triage",
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
        "text-base font-medium uppercase tracking-wide",
        className
      )}
      {...props}
    >
      <Zap size={iconSize} />
      {label}
    </Button>
  );
}
