import { createRoot } from "react-dom/client";
import { Button } from "./components/ui/button";
import { useEffect, useState } from "react";

const App = () => {
  const [backendInitialized, setBackendInitialized] = useState(false);

  window.controller.onSetInitialized((initialized) => {
    console.log("Backend initialized", initialized);
    setBackendInitialized(initialized);
  });

  useEffect(() => {
    window.controller.isInitialized().then((initialized) => {
      console.log("Backend initialized", initialized);
      setBackendInitialized(initialized);
    });
  }, []);

  return (
    <div className="font-sans bg-background">
      <h1 className="text-4xl text-center text-text">Hello World</h1>
      {backendInitialized ? (
        <div className="flex w-full justify-start items-center">
          <Button onClick={window.controller.start}>Start</Button>
          <Button onClick={window.controller.stop}>Stop</Button>
        </div>
      ) : (
        <div className="flex w-full justify-start items-center">
          <Button disabled>Start</Button>
          <Button disabled>Stop</Button>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
