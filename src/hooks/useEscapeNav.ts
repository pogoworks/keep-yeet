import { useEffect, useCallback } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { ask } from "@tauri-apps/plugin-dialog";

interface UseEscapeNavOptions {
  /**
   * For project-detail view: callback when ESC is pressed on a folder tab.
   * If provided, this is called instead of clearProject when not on overview.
   */
  onEscapeFromFolderTab?: () => void;
  /**
   * Whether currently on the overview tab (only relevant for project-detail view).
   */
  isOverview?: boolean;
}

/**
 * useEscapeNav - Handles ESC key navigation across views.
 *
 * Behavior:
 * - project-detail + overview tab: ESC → project selection
 * - project-detail + folder tab: ESC → overview tab (via callback)
 * - triage: ESC → folder view (with confirmation if classifications exist)
 */
export function useEscapeNav(options: UseEscapeNavOptions = {}) {
  const { onEscapeFromFolderTab, isOverview = true } = options;

  const view = useAppStore((state) => state.view);
  const clearProject = useAppStore((state) => state.clearProject);
  const resetTriage = useAppStore((state) => state.resetTriage);
  const classifications = useAppStore((state) => state.classifications);

  const handleEscape = useCallback(async () => {
    if (view === "project-detail") {
      if (isOverview) {
        // Overview tab → go back to project selection
        clearProject();
      } else if (onEscapeFromFolderTab) {
        // Folder tab → go back to overview (via callback)
        onEscapeFromFolderTab();
      }
    } else if (view === "triage") {
      // Check if there are any classifications
      const hasClassifications = Object.keys(classifications).length > 0;

      if (hasClassifications) {
        // Show confirmation dialog
        const confirmed = await ask(
          "Your triage progress will be lost.",
          { title: "Exit triage?", kind: "warning" }
        );
        if (!confirmed) return;
      }

      // Go back to folder view (project-detail with folder tab active)
      resetTriage();
    }
  }, [view, isOverview, onEscapeFromFolderTab, clearProject, resetTriage, classifications]);

  useEffect(() => {
    // Only active in project-detail or triage views
    if (view !== "project-detail" && view !== "triage") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore if a dialog is open (check for radix dialog)
      if (document.querySelector("[role='dialog']")) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, handleEscape]);
}
