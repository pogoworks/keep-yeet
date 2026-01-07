import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Close } from "@/components/ui/pixel-icon";
import { InfoPanel } from "@/components/browse/InfoPanel";

import type { ImageFile } from "@/stores/useAppStore";

interface FloatingInfoPanelProps {
  image: ImageFile | undefined;
  isOpen: boolean;
  onClose: () => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
};

/**
 * FloatingInfoPanel - Fixed position overlay for image info.
 * Slides in from the right edge without affecting main content layout.
 */
export function FloatingInfoPanel({
  image,
  isOpen,
  onClose,
}: FloatingInfoPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-slot="floating-info-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={springTransition}
          className="absolute bottom-0 right-0 top-0 z-10 w-72 border-l bg-background shadow-xl"
        >
          <div className="relative h-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-2 top-2 z-10 h-6 w-6"
            >
              <Close size={12} />
            </Button>
            <InfoPanel image={image} className="h-full border-l-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
