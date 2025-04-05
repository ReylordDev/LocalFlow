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

  useEffect(() => {
    const unsubscribe = window.mini.onChangeModeShortcutPressed(() => {
      console.log("Change mode shortcut pressed");
      setModePickerOpen((prev) => !prev);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (!settings) {
    return null; // or a loading state
  }

  return (
    <div className="flex h-screen w-full select-none flex-col justify-end bg-transparent font-sans">
      <div className="drag flex w-full flex-col items-center justify-end rounded-3xl border border-zinc-500 bg-zinc-50">
        {!modePickerOpen ? (
          <MainContentDisplay status={status} />
        ) : (
          <ModePicker
            modes={modes}
            setActiveMode={setActiveMode}
            setModePickerOpen={setModePickerOpen}
          />
        )}
        <div className="flex h-14 w-full shrink-0 items-center justify-between rounded-b-3xl border-t border-t-zinc-200 bg-zinc-100 text-zinc-600">
          <div className="pl-8">
            <StatusDisplay status={status} />
          </div>
          <TimerDisplay status={status} />
          {!modePickerOpen ? (
            <div className="flex h-6 items-center space-x-6 pr-8">
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
                {status === "result" ? "Reset" : "Cancel"}
                <ShortcutDisplay
                  shortcut={settings.keyboard.cancelRecordingShortcut}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-6 items-center space-x-6 pr-8">
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
                <ShortcutDisplay
                  shortcut={settings.keyboard.changeModeShortcut}
                />
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
          <span className="flex size-4 animate-pulse items-center justify-center rounded-full bg-rose-500"></span>
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
          <span className="flex size-4 items-center justify-center rounded-full bg-lime-500"></span>
          Done
        </div>
      );
    default:
      return <div>Unknown status</div>;
  }
};

const MainContentDisplay = ({ status }: { status: ControllerStatusType }) => {
  const [resultText, setResultText] = useState<string | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe = window.mini.onResult((result) => {
      console.log("Result updated: ", result);
      setResultText(
        result.mode.use_language_model
          ? result.ai_result
          : result.transcription,
      );
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === "generating_ai_result") {
      const unsubscribe = window.mini.onTranscription((transcription) => {
        setTranscriptionText(transcription);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [status]);

  useEffect(() => {
    if (status === "result" || status === "generating_ai_result") {
      if (resultText || transcriptionText) {
        const padding = 16; // Padding in pixels
        const border = 2; // Border in pixels
        const maxHeight = 328; // Maximum height in pixels
        const minHeight = 112; // Minimum height in pixels
        const resultTextArea = document.querySelector(
          "#result-text",
        ) as HTMLTextAreaElement;
        const transcriptionTextArea = document.querySelector(
          "#transcription-text",
        ) as HTMLTextAreaElement;
        const textArea = resultTextArea || transcriptionTextArea; // Use the appropriate text area based on the status
        console.log("Text area: ", textArea.id);
        const textHeight = textArea.clientHeight;
        console.log("Text height: ", textHeight);
        const computedHeight = textHeight + padding + border;
        console.log("Computed height: ", computedHeight);
        const height = Math.min(Math.max(computedHeight, minHeight), maxHeight);
        window.mini.setMainContentHeight(height);
      }
    }
  }, [status, resultText, transcriptionText]);

  switch (status) {
    case "idle":
      return (
        <div className="flex min-h-28 items-center justify-center">
          <SpeechVocalization isRecording={false} />
        </div>
      );
    case "recording":
      return (
        <div className="flex min-h-28 items-center justify-center">
          <SpeechVocalization isRecording={true} />
        </div>
      );
    case "compressing":
    case "loading_voice_model":
    case "transcribing":
    case "loading_language_model":
    case "saving":
      return (
        <div className="flex min-h-28 items-center justify-center">
          <Loader2 className="animate-spin-slow" />
        </div>
      );
    case "generating_ai_result":
      console.log("Transcription text: ", transcriptionText);
      if (!transcriptionText) {
        return (
          <div className="flex min-h-28 items-center justify-center">
            <Loader2 className="animate-spin-slow" />
          </div>
        );
      } else {
        return (
          <div className="no-drag flex max-h-[328px] min-h-28 w-full select-text flex-col justify-center rounded-t-3xl px-4 py-2">
            <p
              id="transcription-text"
              className={cn(
                "scrollbar overflow-y-auto whitespace-pre-wrap",
                transcriptionText.trim().length > 200
                  ? "text-left"
                  : "text-center",
              )}
            >
              {transcriptionText.trim()}
            </p>
          </div>
        );
      }
    case "result":
      return (
        <div className="no-drag flex max-h-[328px] min-h-28 w-full select-text flex-col justify-center rounded-t-3xl px-4 py-2">
          <p
            id="result-text"
            className={cn(
              "scrollbar overflow-y-auto whitespace-pre-wrap",
              resultText?.trim().length > 200 ? "text-left" : "text-center",
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
    <div className="flex items-center justify-center">{formatTimer(timer)}</div>
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
  const heightPerMode = 40; // Height of each mode item in pixels
  const gapHeight = 8; // Gap between mode items in pixels
  const paddingHeight = 16; // Padding around the mode picker in pixels
  const borderHeight = 2; // Border height in pixels
  const minHeight = 112; // Minimum height of the mode picker in pixels
  const maxHeight = 328; // Maximum height of the mode picker in pixels

  useEffect(() => {
    const totalHeight =
      modes.length * heightPerMode +
      (modes.length - 1) * gapHeight +
      paddingHeight +
      borderHeight;

    window.mini.setMainContentHeight(
      Math.min(totalHeight, Math.max(minHeight, maxHeight)),
    );

    return () => {
      window.mini.setMainContentHeight(minHeight + borderHeight);
    };
  }, [modes.length, heightPerMode, gapHeight, paddingHeight, maxHeight]);

  return (
    <div className="no-drag flex max-h-[328px] min-h-28 w-full items-center justify-center py-2">
      <RadioGroup
        defaultValue={modes.find((mode) => mode.active)?.id}
        className="scrollbar flex max-h-full w-full flex-col items-center gap-2 overflow-y-auto px-4"
        onValueChange={(value) => {
          const selectedMode = modes.find((mode) => mode.id === value);
          if (selectedMode) {
            modes
              .filter((mode) => mode.id !== selectedMode.id && mode.active)
              .forEach((mode) => {
                window.database.modes.updateMode({
                  id: mode.id,
                  active: false,
                });
              });
            window.database.modes.updateMode({
              id: selectedMode.id,
              active: true,
            });
            setActiveMode(selectedMode);
          }
        }}
      >
        {modes.map((mode, index) => (
          <div
            key={mode.id}
            className="flex w-full items-center justify-between rounded-xl px-4 py-2 hover:bg-zinc-300"
          >
            <label
              htmlFor={index.toString()}
              className="flex w-full items-center gap-2"
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
