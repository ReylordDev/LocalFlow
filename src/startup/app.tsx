import { createRoot } from "react-dom/client";
import { LoaderCircle } from "lucide-react";

const App = () => {
  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-3xl">Initializing...</h1>
          <LoaderCircle size={64} className="animate-spin" />
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
