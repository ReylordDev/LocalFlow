import { CircleAlert, CircleDashed, Circle } from "lucide-react";
import { useState } from "react";

const ModelStatus = () => {
  console.log("ModelStatus");

  const [loadingStatus, setLoadingStatus] = useState<
    "offline" | "loading" | "online"
  >("offline");

  if (loadingStatus === "offline") {
    return (
      <div className="flex gap-4 items-center justify-start">
        <CircleAlert size={24} color="red" />
        <p>Uninitialized</p>
      </div>
    );
  }

  if (loadingStatus === "loading") {
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

  return (
    <div className="bg-green-300 h-full w-full">
      <h1 className="font-bold text-3xl">Status</h1>
      <div className="flex flex-col gap-4 bg-blue-300 p-4">
        <div className="flex justify-between gap-8">
          <p>Transcription Model</p>
          <ModelStatus />
        </div>
        <div className="flex justify-between gap-8">
          <p>Formatting Model</p>
          <ModelStatus />
        </div>
      </div>
    </div>
  );
};

export default Status;
