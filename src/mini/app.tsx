import { createRoot } from "react-dom/client";
import SpeechVocalization from "../components/SpeechVocalization";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { ControllerStatusType } from "../lib/models";

const App = () => {
  const [status, setStatus] = useState<ControllerStatusType>("idle");

  useEffect(() => {
    const unsubscribe = window.mini.onStatusUpdate((status) => {
      setStatus(status);
    });

    return () => {
      setStatus("idle");
      unsubscribe();
    };
  }, []);

  return (
    <div className="bg-transparent text-white flex justify-center items-center">
      {status === "loading_voice_model" ? (
        <div className="flex h-10 bg-zinc-800 rounded-full p-1 px-4 justify-center drag">
          <div className="flex justify-center items-center gap-4 ">
            <LoaderCircle size={20} className="animate-spin-slow" />
            Loading transcriber model...
          </div>
        </div>
      ) : status === "transcribing" ? (
        <div className="flex h-10 bg-zinc-800 rounded-full p-1 px-4 justify-center drag">
          <div className="flex justify-center items-center gap-4 ">
            <LoaderCircle size={20} className="animate-spin-slow" />
            Transcribing audio...
          </div>
        </div>
      ) : status === "loading_language_model" ? (
        <div className="flex h-10 bg-zinc-800 rounded-full p-1 px-4 justify-center drag">
          <div className="flex justify-center items-center gap-4 ">
            <LoaderCircle size={20} className="animate-spin-slow" />
            Loading formatter model...
          </div>
        </div>
      ) : status === "generating_ai_result" ? (
        <div className="flex h-10 bg-zinc-800 rounded-full p-1 px-4 justify-center drag">
          <div className="flex justify-center items-center gap-4 ">
            <LoaderCircle size={20} className="animate-spin-slow" />
            Formatting transcription...
          </div>
        </div>
      ) : (
        <SpeechVocalization />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);
