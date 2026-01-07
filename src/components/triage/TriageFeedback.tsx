import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Classification } from "@/stores/useAppStore";

interface TriageFeedbackProps {
  classificationCount: number;
  lastClassification: Classification | null;
  children: React.ReactNode;
  className?: string;
}

const COLORS = {
  keep: "oklch(0.78 0.24 130)",
  maybe: "oklch(0.78 0.14 195)",
  yeet: "oklch(0.72 0.22 10)",
};

/**
 * TriageFeedback - Tron-style light trails on triage actions.
 *
 * - Keep: trails shoot RIGHT (like swiping right)
 * - Yeet: trails shoot LEFT (like swiping left)
 * - Maybe: trails shoot from CENTER outward to both sides
 */
export function TriageFeedback({
  classificationCount,
  lastClassification,
  children,
  className,
}: TriageFeedbackProps) {
  const [feedback, setFeedback] = useState<{
    type: Classification;
    key: number;
  } | null>(null);

  useEffect(() => {
    if (classificationCount > 0 && lastClassification) {
      setFeedback({ type: lastClassification, key: Date.now() });
    }
  }, [classificationCount, lastClassification]);

  const color = feedback ? COLORS[feedback.type] : COLORS.keep;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}

      {/* Light trails - all shoot from center outward */}
      <AnimatePresence>
        {feedback && (
          <>
            <LightTrail
              key={`top-left-${feedback.key}`}
              color={color}
              position="top"
              direction="left"
              onComplete={() => setFeedback(null)}
            />
            <LightTrail
              key={`top-right-${feedback.key}`}
              color={color}
              position="top"
              direction="right"
            />
            <LightTrail
              key={`bottom-left-${feedback.key}`}
              color={color}
              position="bottom"
              direction="left"
            />
            <LightTrail
              key={`bottom-right-${feedback.key}`}
              color={color}
              position="bottom"
              direction="right"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface LightTrailProps {
  color: string;
  position: "top" | "bottom";
  direction: "left" | "right";
  onComplete?: () => void;
}

function LightTrail({ color, position, direction, onComplete }: LightTrailProps) {
  const isTop = position === "top";
  const isRight = direction === "right";

  const trailWidth = 30;

  // Gradient: trail fades behind the "head"
  const gradient = isRight
    ? `linear-gradient(to right, transparent, ${color} 40%, ${color})`
    : `linear-gradient(to left, transparent, ${color} 40%, ${color})`;

  // Animate from center outward
  const animateX = isRight ? `${100 - trailWidth}%` : `-${100 - trailWidth}%`;

  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute h-px",
        isTop ? "top-0" : "bottom-0"
      )}
      style={{
        width: `${trailWidth}%`,
        background: gradient,
        left: "50%",
        marginLeft: `-${trailWidth / 2}%`,
      }}
      initial={{
        x: "0%",
        opacity: 0,
      }}
      animate={{
        x: animateX,
        opacity: [0, 1, 1, 0],
      }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
        opacity: { times: [0, 0.05, 0.7, 1] },
      }}
      onAnimationComplete={onComplete}
    />
  );
}
