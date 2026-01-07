import { useAppStore } from "@/stores/useAppStore";
import { BrowseView, LandingView } from "@/views";

function App() {
  const mode = useAppStore((state) => state.mode);

  // Mode-based routing
  switch (mode) {
    case "browse":
      return <BrowseView />;
    case "triage":
      // Phase 4: Triage view
      return <BrowseView />; // Placeholder - uses browse view for now
    case "review":
      // Phase 5: Review view
      return <BrowseView />; // Placeholder - uses browse view for now
    case "landing":
    default:
      return <LandingView />;
  }
}

export default App;
