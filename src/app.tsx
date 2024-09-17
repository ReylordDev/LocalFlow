import { createRoot } from "react-dom/client";

const Component = () => {
  return (
    <div>
      <h1 className="text-4xl text-center text-green-500">Hello World</h1>
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<Component />);
