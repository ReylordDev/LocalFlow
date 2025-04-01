import { createRoot } from "react-dom/client";
import SpeechVocalization from "../components/SpeechVocalization";
import { useEffect, useState } from "react";
import { AudioWaveform, Loader2 } from "lucide-react";
import { ControllerStatusType, Mode } from "../lib/models";
import { Separator } from "../components/ui/separator";
import { useSettings } from "../lib/hooks";
import { ShortcutDisplay } from "../components/shortcut";
import { cn, formatTimer } from "../lib/utils";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

const App = () => {
  const [status, setStatus] = useState<ControllerStatusType>("idle");
  const settings = useSettings();
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [modes, setModes] = useState<Mode[]>([]);
  const [modePickerOpen, setModePickerOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = window.mini.onStatusUpdate((status) => {
      console.log("Status updated: ", status);
      setStatus(status);
    });

    return () => {
      setStatus("idle");
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.database.modes.requestAll();
  }, []);

  const handleReceiveModes = (modes: Mode[]) => {
    const activeMode = modes.find((mode) => mode.active);
    setActiveMode(activeMode || null);
    setModes(modes);
  };

  useEffect(() => {
    const unsubscribe = window.database.modes.onModesUpdate((modes) => {
      console.log("Modes updated: ", modes);
      handleReceiveModes(modes);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.database.modes.onReceiveModes((modes) => {
      console.log("Received modes: ", modes);
      handleReceiveModes(modes);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!settings) {
    return null; // or a loading state
  }

  return (
    <div className="bg-transparent h-screen w-full font-sans select-none flex flex-col justify-end">
      <div className="w-full flex flex-col justify-end items-center bg-zinc-50 rounded-3xl border-zinc-500 border drag">
        {!modePickerOpen ? (
          <MainContentDisplay status={status} />
        ) : (
          <ModePicker
            modes={modes}
            setActiveMode={setActiveMode}
            setModePickerOpen={setModePickerOpen}
          />
        )}
        <div className="h-14 shrink-0 bg-zinc-100 text-zinc-600 rounded-b-3xl w-full flex justify-between items-center border-t-zinc-200 border-t">
          <div className="pl-8 ">
            <StatusDisplay status={status} />
          </div>
          <TimerDisplay status={status} />
          {!modePickerOpen ? (
            <div className="flex h-6 items-center pr-8 space-x-6">
              <div className="flex items-center gap-4">
                {activeMode ? activeMode.name : ""}
                <ShortcutDisplay
                  shortcut={settings.keyboard.changeModeShortcut}
                />
              </div>
              <Separator orientation="vertical" decorative />
              <div className="flex items-center gap-4">
                {status === "idle" || status === "result" ? "Start" : "Stop"}
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
          ) : (
            <div className="flex h-6 items-center pr-8 space-x-6">
              <div className="flex items-center gap-4">
                Navigate
                <ShortcutDisplay shortcut={"Up"} />
                <ShortcutDisplay shortcut={"Down"} />
              </div>
              <Separator orientation="vertical" decorative />
              <div className="flex items-center gap-4">
                Select Mode
                <ShortcutDisplay shortcut={"Enter"} />
              </div>
              <Separator orientation="vertical" decorative />
              <div className="flex items-center gap-4">
                Cancel
                <ShortcutDisplay shortcut={"Esc"} />
              </div>
            </div>
          )}
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
      return <div>Loading language model...</div>;
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
  const [resultText, setResultText] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = window.mini.onResult((result) => {
      console.log("Result updated: ", result);
      setResultText(
        result.mode.use_language_model ? result.ai_result : result.transcription
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  switch (status) {
    case "idle":
      return (
        <div className="flex justify-center items-center min-h-28">
          <SpeechVocalization isRecording={false} />
        </div>
      );
    case "recording":
      return (
        <div className="flex justify-center items-center min-h-28">
          <SpeechVocalization isRecording={true} />
        </div>
      );
    case "compressing":
    case "loading_voice_model":
    case "transcribing":
    case "loading_language_model":
    case "generating_ai_result":
    case "saving":
      return (
        <div className="flex justify-center items-center min-h-28">
          <Loader2 className="animate-spin-slow" />
        </div>
      );
    case "result":
      return (
        // <textarea
        //   readOnly
        //   className="bg-zinc-900 text-white resize-none overflow-y-auto no-drag select-text border-0 ring-0 rounded-3xl w-full text-wrapjjj p-4 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        //   value={resultText || ""}
        // />
        <div className="flex flex-col justify-center w-full px-4 py-2 select-text no-drag max-h-[328px] min-h-28 rounded-t-3xl">
          <p
            className={cn(
              "whitespace-pre-wrap overflow-y-auto scrollbar",
              resultText?.trim().length > 200 ? "text-left" : "text-center"
            )}
          >
            {resultText?.trim()}
          </p>
        </div>
      );
    default:
      return <div>Unknown status</div>;
  }
};

const TimerDisplay = ({ status }: { status: ControllerStatusType }) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (status === "recording") {
      setTimer(0); // Reset timer when starting to record
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
    <div className="flex justify-center items-center">{formatTimer(timer)}</div>
  );
};

const ModePicker = ({
  modes,
  setActiveMode,
  setModePickerOpen,
}: {
  modes: Mode[];
  setActiveMode: (mode: Mode) => void;
  setModePickerOpen: (open: boolean) => void;
}) => {
  return (
    <div className="flex justify-center items-center min-h-28 w-full no-drag">
      <RadioGroup
        className="flex flex-col items-center gap-2 w-full px-4"
        onValueChange={(value) => {
          const selectedMode = modes.find((mode) => mode.id === value);
          if (selectedMode) {
            // TODO
          }
        }}
      >
        {modes.map((mode, index) => (
          <div
            key={mode.id}
            className="flex justify-between items-center w-full px-4 py-2 hover:bg-zinc-300 rounded-xl"
          >
            <label
              htmlFor={index.toString()}
              className="flex items-center gap-2 w-full"
            >
              <ShortcutDisplay shortcut={`Shift+${index + 1}`} />
              <span>{mode.name}</span>
            </label>
            <RadioGroupItem id={index.toString()} value={mode.id} />
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
