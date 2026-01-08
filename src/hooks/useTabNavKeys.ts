import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

interface NavTab {
  id: string;
  label: string;
}

interface UseTabNavKeysOptions {
  tabs: NavTab[];
  onTabChange: (tabId: string) => void;
  /** Called when Shift+Enter is released on a folder tab */
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
 * - Shift + Enter: Start triage (press to preview, release to commit)
 */
export function useTabNavKeys({
  tabs,
  onTabChange,
  onStartTriage,
  canStartTriage = false,
}: UseTabNavKeysOptions) {
  const view = useAppStore((state) => state.view);
  const [isStartTriagePressed, setIsStartTriagePressed] = useState(false);
  // Ref to avoid stale closure in keyup handler
  const isPressedRef = useRef(false);

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

      // Ignore key repeat
      if (e.repeat) return;

      // Shift + Enter: Preview start triage (don't trigger yet)
      if (e.shiftKey && e.key === "Enter" && canStartTriage && onStartTriage) {
        e.preventDefault();
        isPressedRef.current = true;
        setIsStartTriagePressed(true);
        return;
      }

      // Check for Cmd (Mac) or Ctrl (Windows/Linux) for tab switching
      if (!(e.metaKey || e.ctrlKey)) return;

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

    const handleKeyUp = (e: KeyboardEvent) => {
      // Trigger start triage on Shift+Enter release
      if (e.key === "Enter" && isPressedRef.current && onStartTriage) {
        e.preventDefault();
        onStartTriage();
        isPressedRef.current = false;
        setIsStartTriagePressed(false);
      }
    };

    // Clear pressed state if window loses focus
    const handleBlur = () => {
      isPressedRef.current = false;
      setIsStartTriagePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [view, tabs, onTabChange, onStartTriage, canStartTriage]);

  return { isStartTriagePressed };
}
