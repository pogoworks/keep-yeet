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

      // Maybe: Shift + Enter OR Shift + Backspace
      if (e.shiftKey && (e.key === "Enter" || e.key === "Backspace")) {
        e.preventDefault();
        classify("maybe");
        return;
      }

      // Keep: Enter (without shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        classify("keep");
        return;
      }

      // Yeet: Backspace (without shift)
      if (e.key === "Backspace" && !e.shiftKey) {
        e.preventDefault();
        classify("yeet");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, classify]);
}
