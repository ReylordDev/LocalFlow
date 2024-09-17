import { createRoot } from "react-dom/client";
import { Button } from "./components/ui/button";

const App = () => {
  return (
    <div className="font-sans bg-background">
      <h1 className="text-4xl text-center text-text">Hello World</h1>
      <Button variant="default">Click me</Button>
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
