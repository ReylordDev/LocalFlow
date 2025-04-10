import { createRoot } from "react-dom/client";
import MainWindow from "./MainWindow";

const App = () => {
  return (
    <div className="bg-background font-sans">
      <MainWindow />
    </div>
  );
};

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Root element not found");
}
const root = createRoot(rootElement);
root.render(<App />);
