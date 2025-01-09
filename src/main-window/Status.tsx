import { ModelStatus } from "../lib/models";
import { CircleAlert, CircleDashed, Circle } from "lucide-react";
import { useState, useEffect } from "react";

const ModelStatus = ({
  status,
}: {
  status: "offline" | "loading" | "online";
}) => {
  console.log("ModelStatus", status);

  if (status === "offline") {
    return (
      <div className="flex gap-4 items-center justify-start">
        <CircleAlert size={24} color="red" />
        <p>Not Loaded</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex gap-4 items-center justify-start">
        <CircleDashed size={24} color="yellow" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-center justify-start">
      <Circle size={24} color="green" />
      <p>Online</p>
    </div>
  );
};

const Status = () => {
  console.log("Status");
  const [transcriberStatus, setTranscriberStatus] = useState<
    "offline" | "loading" | "online"
  >("offline");

  const [formatterStatus, setFormatterStatus] = useState<
    "offline" | "loading" | "online"
  >("offline");

  window.controller.onReceiveModelStatus((status: ModelStatus) => {
    console.log("received model status", status);
    setFormatterStatus(status.formatter_status);
    setTranscriberStatus(status.transcriber_status);
  });

  useEffect(() => {
    console.log("ModelStatus useEffect");

    const interval = setInterval(() => {
      console.log("Requesting model status");
      window.controller.requestModelStatus();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-green-300 h-full w-full">
      <h1 className="font-bold text-3xl">Status</h1>
      <div className="flex flex-col gap-4 bg-blue-300 p-4">
        <div className="flex justify-between gap-8">
          <p>Transcription Model</p>
          <ModelStatus status={transcriberStatus} />
        </div>
        <div className="flex justify-between gap-8">
          <p>Formatting Model</p>
          <ModelStatus status={formatterStatus} />
        </div>
        <div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
            onClick={() => {
              // TODO: add model load
              window.controller.loadModels();
            }}
          >
            Load Models into Memory
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={() => {
              // TODO: add model unload
              window.controller.unloadModels();
            }}
          >
            Unload Models
          </button>
        </div>
      </div>
    </div>
  );
};

export default Status;
