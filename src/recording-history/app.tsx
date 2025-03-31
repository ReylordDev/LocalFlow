import { createRoot } from "react-dom/client";
import HistoryWindow from "./HistoryWindow";

const App = () => {
  return (
    <div className="font-sans  bg-background">
      <HistoryWindow />
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
