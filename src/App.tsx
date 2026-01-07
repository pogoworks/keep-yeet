import { useAppStore } from "@/stores/useAppStore";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ProjectListView,
  ProjectDetailView,
  ImageWorkspace,
  ReviewView,
} from "@/views";

function App() {
  const view = useAppStore((state) => state.view);

  // View-based routing
  // ImageWorkspace handles browse/triage/review internally for smooth animations
  const content = (() => {
    switch (view) {
      case "projects":
        return <ProjectListView />;
      case "project-detail":
        return <ProjectDetailView />;
      case "browse":
      case "triage":
        return <ImageWorkspace />;
      case "review":
        return <ReviewView />;
      default:
        return <ProjectListView />;
    }
  })();

  return <TooltipProvider delayDuration={300}>{content}</TooltipProvider>;
}

export default App;
