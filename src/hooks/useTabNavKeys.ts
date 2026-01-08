import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

interface NavTab {
  id: string;
  label: string;
}

interface UseTabNavKeysOptions {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  /** Called when Shift+Enter is released on a folder tab */
  onStartTriage?: () => void;
  /** Whether currently on a folder tab (not overview) */
  canStartTriage?: boolean;
}

/**
 * Hook for tab navigation keyboard shortcuts.
 * - Ctrl + Tab: Next tab (sequential)
 * - Ctrl + Shift + Tab: Previous tab (sequential)
 * - Cmd/Ctrl + 1-9: Jump to specific tab
 * - Shift + Enter: Start triage (press to preview, release to commit)
 */
export function useTabNavKeys({
  tabs,
  activeTab,
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

      // Ctrl + Tab / Ctrl + Shift + Tab: Sequential tab navigation
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTab);
        if (currentIndex === -1) return;

        let nextIndex: number;
        if (e.shiftKey) {
          // Ctrl + Shift + Tab: Previous tab (wrap to end)
          nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        } else {
          // Ctrl + Tab: Next tab (wrap to start)
          nextIndex = currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
        }
        onTabChange(tabs[nextIndex].id);
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
  }, [view, tabs, activeTab, onTabChange, onStartTriage, canStartTriage]);

  return { isStartTriagePressed };
}
