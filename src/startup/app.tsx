import { createRoot } from "react-dom/client";
import { LoaderCircle } from "lucide-react";

const App = () => {
  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="flex w-full h-full justify-center items-center bg-background ">
        <div className="flex flex-col gap-2 justify-center items-center">
          <h1 className="text-3xl">Models are loading...</h1>
          <LoaderCircle size={64} className="animate-spin" />
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
