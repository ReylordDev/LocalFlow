import { createRoot } from "react-dom/client";
import SpeechVocalization from "../components/SpeechVocalization";
import { useEffect, useState } from "react";
import { AudioWaveform, Loader2 } from "lucide-react";
import { ControllerStatusType } from "../lib/models";
import { Separator } from "../components/ui/separator";
import { useSettings } from "../lib/hooks";
import { ShortcutDisplay } from "../components/shortcut";
import { formatTimer } from "../lib/utils";

const App = () => {
  const [status, setStatus] = useState<ControllerStatusType>("idle");
  const settings = useSettings();

  useEffect(() => {
    const unsubscribe = window.mini.onStatusUpdate((status) => {
      setStatus(status);
    });

    return () => {
      setStatus("idle");
      unsubscribe();
    };
  }, []);

  if (!settings) {
    return null; // or a loading state
  }

  return (
    <div className="bg-transparent text-white h-screen w-screen font-sans select-none">
      <div className="h-full w-full flex flex-col justify-end items-center bg-zinc-900 rounded-3xl border-zinc-600 border drag">
        <div className="size-full flex justify-center items-center">
          <MainContentDisplay status={status} />
        </div>
        <div className="h-24 bg-zinc-800 rounded-b-3xl w-full flex justify-between items-center border-t-zinc-500 border-t">
          <div className="pl-8">
            <StatusDisplay status={status} />
          </div>
          <TimerDisplay status={status} />
          <div className="flex h-6 items-center pr-8 space-x-6">
            <div className="flex items-center gap-4">
              Mode
              <ShortcutDisplay
                shortcut={settings.keyboard.changeModeShortcut}
              />
            </div>
            <Separator orientation="vertical" decorative />
            <div className="flex items-center gap-4">
              {status === "idle" ? "Start" : "Stop"}
              <ShortcutDisplay
                shortcut={settings.keyboard.toggleRecordingShortcut}
              />
            </div>
            <Separator orientation="vertical" decorative />
            <div className="flex items-center gap-4">
              Cancel
              <ShortcutDisplay
                shortcut={settings.keyboard.cancelRecordingShortcut}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("app"));
root.render(<App />);

const StatusDisplay = ({ status }: { status: ControllerStatusType }) => {
  switch (status) {
    case "idle":
      return <AudioWaveform />;
    case "recording":
      return (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-500 size-4 flex items-center justify-center animate-pulse"></span>
          Recording
        </div>
      );
    case "loading_voice_model":
      return <div>Loading transcriber model...</div>;
    case "transcribing":
      return <div>Transcribing audio...</div>;
    case "loading_language_model":
      return <div>Loading formatter model...</div>;
    case "generating_ai_result":
      return <div>Formatting transcription...</div>;
    case "compressing":
      return <div>Compressing audio...</div>;
    case "saving":
      return <div>Saving transcription...</div>;
    case "result":
      return (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-lime-500 size-4 flex items-center justify-center"></span>
          Done
        </div>
      );
    default:
      return <div>Unknown status</div>;
  }
};

const MainContentDisplay = ({ status }: { status: ControllerStatusType }) => {
  switch (status) {
    case "idle":
      return <SpeechVocalization />;
    case "recording":
      return <SpeechVocalization />;
    case "compressing":
      return <Loader2 className="animate-spin-slow" />;
    case "loading_voice_model":
      return <Loader2 className="animate-spin-slow" />;
    case "transcribing":
      return <Loader2 className="animate-spin-slow" />;
    case "loading_language_model":
      return <Loader2 className="animate-spin-slow" />;
    case "generating_ai_result":
      return <Loader2 className="animate-spin-slow" />;
    case "result":
      return <div>Done</div>;
    default:
      return <div>Unknown status</div>;
  }
};

const TimerDisplay = ({ status }: { status: ControllerStatusType }) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (status === "recording") {
      timerInterval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    } else {
      if (status === "idle") {
        setTimer(0);
      }
      clearInterval(timerInterval);
    }

    return () => clearInterval(timerInterval);
  }, [status]);

  if (status === "idle") {
    return null; // or a placeholder when idle
  }

  return (
    <div className="flex justify-center text-white items-center">
      {formatTimer(timer)}
    </div>
  );
};
