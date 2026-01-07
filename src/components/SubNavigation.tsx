import { Grid, Folder } from "@/components/ui/pixel-icon";
import { cn } from "@/lib/utils";

export interface NavTab {
  id: string;
  label: string;
  icon: "grid" | "folder";
}

interface NavTabButtonProps {
  tab: NavTab;
  isActive: boolean;
  onClick: () => void;
}

function NavTabButton({ tab, isActive, onClick }: NavTabButtonProps) {
  const Icon = tab.icon === "grid" ? Grid : Folder;
  const iconColor = tab.icon === "grid" ? "text-lime-400" : "text-teal-400";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 font-medium transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon size={14} className={iconColor} />
      <span className="uppercase">{tab.label}</span>
    </button>
  );
}

interface SubNavigationProps {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * SubNavigation - Tab navigation for switching between views.
 * Used below the header to navigate between Overview and folder views.
 */
export function SubNavigation({
  tabs,
  activeTab,
  onTabChange,
}: SubNavigationProps) {
  return (
    <div className="flex pl-1.5 text-xs">
      {tabs.map((tab) => (
        <NavTabButton
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTab}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
}
