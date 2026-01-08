import { useEffect, useState, useRef } from "react";
import { useAppStore, type Classification } from "@/stores/useAppStore";

/**
 * Hook for triage keyboard shortcuts.
 * Press to preview (button shows active state), release to commit.
 * - K: Keep
 * - Space: Maybe
 * - D: Yeet
 * - Backspace: Undo and go back
 */
export function useTriageKeys() {
  const view = useAppStore((state) => state.view);
  const classify = useAppStore((state) => state.classify);
  const unclassify = useAppStore((state) => state.unclassify);
  const [pressedKey, setPressedKey] = useState<Classification | null>(null);
  // Ref to avoid stale closure in keyup handler
  const pressedKeyRef = useRef<Classification | null>(null);

  useEffect(() => {
    // Only active in triage view
    if (view !== "triage") return;

    const getClassificationFromKey = (key: string): Classification | null => {
      if (key === "k" || key === "K") return "keep";
      if (key === " ") return "maybe";
      if (key === "d" || key === "D") return "yeet";
      return null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ignore key repeat
      if (e.repeat) return;

      // Backspace: undo and go back (immediate, no preview)
      if (e.key === "Backspace") {
        e.preventDefault();
        unclassify();
        return;
      }

      const classification = getClassificationFromKey(e.key);
      if (classification) {
        e.preventDefault();
        pressedKeyRef.current = classification;
        setPressedKey(classification);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const classification = getClassificationFromKey(e.key);
      // Use ref to avoid stale closure
      if (classification && classification === pressedKeyRef.current) {
        e.preventDefault();
        classify(classification);
        pressedKeyRef.current = null;
        setPressedKey(null);
      }
    };

    // Clear pressed state if window loses focus
    const handleBlur = () => {
      pressedKeyRef.current = null;
      setPressedKey(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [view, classify, unclassify]);

  return { pressedKey };
}
