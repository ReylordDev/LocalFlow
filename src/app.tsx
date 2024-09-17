import { createRoot } from "react-dom/client";

const App = () => {
  return (
    <div>
      <h1 className="text-4xl text-center text-text">Hello World</h1>
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
