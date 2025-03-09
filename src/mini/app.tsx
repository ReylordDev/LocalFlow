import { createRoot } from "react-dom/client";
import SpeechVocalization from "../components/SpeechVocalization";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

const App = () => {
  const [status, setStatus] = useState<
    | "default"
    | "transcribing"
    | "formatting"
    | "loading_transcriber"
    | "loading_formatter"
  >("default");

  useEffect(() => {
    const unsubscribe = window.mini.onStatusUpdate((status) => {
      setStatus(status);
    });

    return () => {
      setStatus("default");
      unsubscribe();
    };
  }, []);

  return (
    <div className="bg-transparent text-white flex justify-center items-center">
      {status === "loading_transcriber" ? (
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
      ) : status === "loading_formatter" ? (
        <div className="flex h-10 bg-zinc-800 rounded-full p-1 px-4 justify-center drag">
          <div className="flex justify-center items-center gap-4 ">
            <LoaderCircle size={20} className="animate-spin-slow" />
            Loading formatter model...
          </div>
        </div>
      ) : status === "formatting" ? (
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
