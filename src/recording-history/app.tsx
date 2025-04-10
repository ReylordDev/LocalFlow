import { createRoot } from "react-dom/client";
import HistoryWindow from "./HistoryWindow";

const App = () => {
  return (
    <div className="bg-background font-sans">
      <HistoryWindow />
    </div>
  );
};

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Root element not found");
}
const root = createRoot(rootElement);
root.render(<App />);
