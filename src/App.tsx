import { Button } from "@/components/ui/button";

function App() {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-4xl font-bold">Toss</h1>
      <p className="text-muted-foreground">Image triage for Stable Diffusion</p>
      <Button>Select Folder</Button>
    </main>
  );
}

export default App;
