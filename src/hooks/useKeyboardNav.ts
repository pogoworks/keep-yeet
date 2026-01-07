import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Hook for keyboard navigation in browse/triage modes.
 * Listens for arrow keys and calls navigateNext/navigatePrev from the store.
 */
export function useKeyboardNav() {
  const view = useAppStore((state) => state.view);
  const navigateNext = useAppStore((state) => state.navigateNext);
  const navigatePrev = useAppStore((state) => state.navigatePrev);

  useEffect(() => {
    // Only active in browse or triage views
    if (view !== "browse" && view !== "triage") return;

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
          navigateNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigatePrev();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, navigateNext, navigatePrev]);
}
