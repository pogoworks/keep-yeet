import { useEffect, type RefObject } from "react";

/**
 * Hook that auto-scrolls a selected item into view within a container.
 * Used by Filmstrip to keep the selected thumbnail centered.
 */
export function useAutoScroll(
  selectedIndex: number,
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string = "[data-filmstrip-item]"
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll(itemSelector);
    const selectedItem = items[selectedIndex];

    if (selectedItem) {
      selectedItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedIndex, containerRef, itemSelector]);
}
