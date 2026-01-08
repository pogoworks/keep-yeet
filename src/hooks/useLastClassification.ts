import { useRef, useEffect, useState } from "react";
import { useAppStore, type Classification } from "@/stores/useAppStore";

/**
 * Tracks the most recent classification action.
 */
export function useLastClassification() {
  const classifications = useAppStore((state) => state.classifications);
  const [lastClassification, setLastClassification] = useState<Classification | null>(null);
  const prevClassificationsRef = useRef<Record<string, Classification>>({});

  useEffect(() => {
    const prevClassifications = prevClassificationsRef.current;

    // Find any classification that changed (new or reclassified)
    for (const [imageId, classification] of Object.entries(classifications)) {
      if (prevClassifications[imageId] !== classification) {
        setLastClassification(classification);
        break;
      }
    }

    prevClassificationsRef.current = { ...classifications };
  }, [classifications]);

  return { lastClassification, classificationCount: Object.keys(classifications).length };
}
