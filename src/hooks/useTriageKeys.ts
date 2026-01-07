import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Hook for triage keyboard shortcuts (K/M/Y keys).
 * Handles classification actions in triage mode.
 */
export function useTriageKeys() {
  const view = useAppStore((state) => state.view);
  const classify = useAppStore((state) => state.classify);

  console.log("[useTriageKeys] Hook called, view:", view);

  useEffect(() => {
    console.log("[useTriageKeys] useEffect running, view:", view);
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

      switch (e.key.toLowerCase()) {
        case "k":
          e.preventDefault();
          classify("keep");
          break;
        case "m":
          e.preventDefault();
          classify("maybe");
          break;
        case "y":
          e.preventDefault();
          classify("yeet");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, classify]);
}
