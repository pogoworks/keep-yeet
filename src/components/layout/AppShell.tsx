import { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface AppShellProps {
  /** Content for the right side of the header (buttons, stats, etc.) */
  headerActions?: ReactNode;
  /** Optional secondary header row (e.g., stats bar, tabs) */
  headerSecondary?: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Fixed footer content (e.g., filmstrip, toolbar) */
  footer?: ReactNode;
  /**
   * If true, children area will not scroll (useful when children handle their own layout).
   * Default: true (content scrolls)
   */
  contentScrolls?: boolean;
  /** Additional class for the content area */
  contentClassName?: string;
}

/**
 * AppShell - Consistent layout wrapper for all views.
 * Provides fixed header with breadcrumbs, scrollable content zone, and optional footer.
 */
export function AppShell({
  headerActions,
  headerSecondary,
  children,
  footer,
  contentScrolls = true,
  contentClassName,
}: AppShellProps) {
  return (
    <div data-slot="app-shell" className="flex h-screen flex-col bg-background">
      {/* Fixed Header */}
      <header
        data-slot="app-header"
        className="flex h-11 flex-shrink-0 items-center justify-between border-b px-3"
      >
        <Breadcrumb />
        {headerActions && (
          <div className="flex items-center gap-2">{headerActions}</div>
        )}
      </header>

      {/* Optional secondary header row */}
      {headerSecondary && (
        <div
          data-slot="app-header-secondary"
          className="flex-shrink-0 border-b"
        >
          {headerSecondary}
        </div>
      )}

      {/* Main content area */}
      <main
        data-slot="app-content"
        className={cn(
          "min-h-0 flex-1",
          contentScrolls && "overflow-auto",
          contentClassName
        )}
      >
        {children}
      </main>

      {/* Fixed footer */}
      {footer && (
        <footer data-slot="app-footer" className="flex-shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
}
