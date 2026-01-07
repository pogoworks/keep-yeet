import { useEffect, useRef } from "react";

/**
 * Hook for local keyboard navigation with callbacks.
 * Unlike useKeyboardNav which uses store actions, this accepts callbacks
 * for more flexible, component-scoped navigation.
 *
 * Uses refs to stabilize callback references and avoid listener churn
 * when callbacks change frequently (e.g., during thumbnail loading).
 */
export function useLocalKeyboardNav(
  onNext: () => void,
  onPrev: () => void,
  enabled: boolean = true
) {
  // Store callbacks in refs to avoid recreating the event listener
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  // Keep refs updated with latest callbacks
  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  }, [onNext, onPrev]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          onNextRef.current();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onPrevRef.current();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]); // Only depends on enabled now
}
