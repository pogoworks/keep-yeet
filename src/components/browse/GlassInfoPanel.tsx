import { useState } from "react";
import { motion } from "framer-motion";

import { cn, formatBytes } from "@/lib/utils";
import { InfoBox, Close } from "@/components/ui/pixel-icon";

import type { ImageFile } from "@/stores/useAppStore";

interface GlassInfoPanelProps {
  image: ImageFile | undefined;
  className?: string;
}

const COLLAPSED_SIZE = 40;
const EXPANDED_WIDTH = 288; // 18rem
const EXPANDED_HEIGHT = 340;

const transition = {
  type: "tween",
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
} as const;

/**
 * GlassInfoPanel - Floating glass panel that morphs from a button.
 * Click to expand, shows image metadata.
 */
export function GlassInfoPanel({ image, className }: GlassInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      data-slot="glass-info-panel"
      initial={false}
      animate={{
        width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_SIZE,
        height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_SIZE,
      }}
      transition={transition}
      style={{ borderRadius: isExpanded ? 12 : 20 }}
      className={cn(
        "relative overflow-hidden",
        "bg-card/70 backdrop-blur-md",
        "border border-white/10",
        "shadow-xl",
        className
      )}
    >
      {/* Icon container - 3D flip between info and close */}
      <div
        className="absolute top-0 right-0 h-[38px] w-[38px]"
        style={{ perspective: 200 }}
      >
        {/* Info icon - front */}
        <motion.button
          initial={false}
          animate={{ rotateY: isExpanded ? 180 : 0 }}
          transition={transition}
          onClick={() => setIsExpanded(true)}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full hover:bg-white/10",
            isExpanded && "pointer-events-none"
          )}
          style={{ backfaceVisibility: "hidden" }}
          aria-label="Show image info"
        >
          <InfoBox size={18} />
        </motion.button>

        {/* Close icon - back */}
        <motion.button
          initial={false}
          animate={{ rotateY: isExpanded ? 0 : -180 }}
          transition={transition}
          onClick={() => setIsExpanded(false)}
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full hover:bg-white/10",
            !isExpanded && "pointer-events-none"
          )}
          style={{ backfaceVisibility: "hidden" }}
          aria-label="Close"
        >
          <Close size={18} />
        </motion.button>
      </div>

      {/* Panel content - always rendered, fades in after morph */}
      <motion.div
        initial={false}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.15, delay: isExpanded ? 0.25 : 0 }}
        className={cn("h-full p-4 pt-[38px]", !isExpanded && "pointer-events-none")}
      >
        {/* Content */}
        {image ? (
          <div className="space-y-3">
            <InfoRow label="Filename" value={image.name} mono truncate />
            <InfoRow
              label="Dimensions"
              value={
                image.dimensions
                  ? `${image.dimensions.width} × ${image.dimensions.height}`
                  : "Unknown"
              }
            />
            <InfoRow label="File Size" value={formatBytes(image.size)} />
            <InfoRow label="Path" value={image.path} mono truncate small />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select an image to view details
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  small?: boolean;
}

function InfoRow({ label, value, mono, truncate, small }: InfoRowProps) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm",
          mono && "font-mono",
          truncate && "truncate",
          small && "text-xs"
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}
