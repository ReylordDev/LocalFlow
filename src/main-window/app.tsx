import { createRoot } from "react-dom/client";
import MainWindow from "./MainWindow";

const App = () => {
  return (
    <div className="bg-background font-sans">
      <MainWindow />
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
