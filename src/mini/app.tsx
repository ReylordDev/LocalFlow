import { createRoot } from "react-dom/client";
import SpeechVocalization from "../components/SpeechVocalization";

const App = () => {
  return (
    <div className="bg-transparent">
      <SpeechVocalization />
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
