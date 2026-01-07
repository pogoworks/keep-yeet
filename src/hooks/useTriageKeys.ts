import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Hook for triage keyboard shortcuts.
 * - Enter: Keep
 * - Backspace: Yeet
 * - Shift + Enter OR Shift + Backspace: Maybe
 */
export function useTriageKeys() {
  const view = useAppStore((state) => state.view);
  const classify = useAppStore((state) => state.classify);

  useEffect(() => {
    // Only active in triage view
    if (view !== "triage") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Keep: K
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        classify("keep");
        return;
      }

      // Maybe: Space
      if (e.key === " ") {
        e.preventDefault();
        classify("maybe");
        return;
      }

      // Yeet: D
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        classify("yeet");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, classify]);
}
