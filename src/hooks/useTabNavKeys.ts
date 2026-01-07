import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

interface NavTab {
  id: string;
  label: string;
}

interface UseTabNavKeysOptions {
  tabs: NavTab[];
  onTabChange: (tabId: string) => void;
  /** Called when Cmd/Ctrl+Enter is pressed on a folder tab */
  onStartTriage?: () => void;
  /** Whether currently on a folder tab (not overview) */
  canStartTriage?: boolean;
}

/**
 * Hook for tab navigation keyboard shortcuts.
 * - Cmd/Ctrl + 1: Overview (first tab)
 * - Cmd/Ctrl + 2: First folder
 * - Cmd/Ctrl + 3: Second folder
 * - etc. up to 9
 * - Cmd/Ctrl + Enter: Start triage (when on a folder tab)
 */
export function useTabNavKeys({
  tabs,
  onTabChange,
  onStartTriage,
  canStartTriage = false,
}: UseTabNavKeysOptions) {
  const view = useAppStore((state) => state.view);

  useEffect(() => {
    // Only active in project-detail view
    if (view !== "project-detail") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore if a dialog is open
      if (document.querySelector("[role='dialog']")) {
        return;
      }

      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      if (!(e.metaKey || e.ctrlKey)) return;

      // Cmd/Ctrl + Enter: Start triage
      if (e.key === "Enter" && canStartTriage && onStartTriage) {
        e.preventDefault();
        onStartTriage();
        return;
      }

      // Number keys 1-9 for tab switching
      const keyNum = parseInt(e.key, 10);
      if (isNaN(keyNum) || keyNum < 1 || keyNum > 9) return;

      // Map key number to tab index (1 = index 0, 2 = index 1, etc.)
      const tabIndex = keyNum - 1;

      // Check if tab exists at this index
      if (tabIndex < tabs.length) {
        e.preventDefault();
        onTabChange(tabs[tabIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, tabs, onTabChange, onStartTriage, canStartTriage]);
}
