import { useAppStore } from "@/stores/useAppStore";
import {
  BrowseView,
  ProjectListView,
  ProjectDetailView,
  TriageView,
} from "@/views";

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
      return <TriageView />;
    case "review":
      // Phase 6: Review view - placeholder for now
      return <TriageView />;
    default:
      return <ProjectListView />;
  }
}

export default App;
