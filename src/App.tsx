import { useAppStore } from "@/stores/useAppStore";
import { BrowseView, ProjectListView, ProjectDetailView } from "@/views";

function App() {
  const view = useAppStore((state) => state.view);

  // View-based routing
  switch (view) {
    case "projects":
      return <ProjectListView />;
    case "project-detail":
      return <ProjectDetailView />;
    case "browse":
      return <BrowseView />;
    case "triage":
      // Phase 5: Triage view
      return <BrowseView />; // Placeholder - uses browse view for now
    case "review":
      // Phase 5: Review view
      return <BrowseView />; // Placeholder - uses browse view for now
    default:
      return <ProjectListView />;
  }
}

export default App;
