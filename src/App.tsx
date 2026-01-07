import { useAppStore } from "@/stores/useAppStore";
import {
  ProjectListView,
  ProjectDetailView,
  ImageWorkspace,
} from "@/views";

function App() {
  const view = useAppStore((state) => state.view);

  // View-based routing
  // ImageWorkspace handles browse/triage/review internally for smooth animations
  switch (view) {
    case "projects":
      return <ProjectListView />;
    case "project-detail":
      return <ProjectDetailView />;
    case "browse":
    case "triage":
    case "review":
      return <ImageWorkspace />;
    default:
      return <ProjectListView />;
  }
}

export default App;
