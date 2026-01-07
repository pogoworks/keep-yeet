import { useRef, useEffect, useState } from "react";
import { useAppStore, type Classification } from "@/stores/useAppStore";

/**
 * Tracks the most recent classification action.
 */
export function useLastClassification() {
  const classifications = useAppStore((state) => state.classifications);
  const [lastClassification, setLastClassification] = useState<Classification | null>(null);
  const prevCountRef = useRef(0);
  const prevClassificationsRef = useRef<Record<string, Classification>>({});

  useEffect(() => {
    const currentCount = Object.keys(classifications).length;
    const prevCount = prevCountRef.current;

    if (currentCount > prevCount) {
      const prevKeys = new Set(Object.keys(prevClassificationsRef.current));
      const newKey = Object.keys(classifications).find((key) => !prevKeys.has(key));

      if (newKey) {
        setLastClassification(classifications[newKey]);
      }
    }

    prevCountRef.current = currentCount;
    prevClassificationsRef.current = { ...classifications };
  }, [classifications]);

  return { lastClassification, classificationCount: Object.keys(classifications).length };
}
