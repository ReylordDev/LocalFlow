import { createRoot } from "react-dom/client";
import SpeechVocalization from "../components/SpeechVocalization";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, AudioWaveform, Loader2 } from "lucide-react";
import { ControllerStatusType, Mode } from "../lib/models/database";
import { Separator } from "../components/ui/separator";
import { useSettings } from "../hooks/use-settings";
import { ShortcutDisplay } from "../components/shortcut";
import { cn, formatTimer } from "../lib/utils";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { ErrorBoundary } from "../components/error-boundary";

/**
 * Mini window application component
 * Displays recording status, transcription results, and mode selection
 */
const App = () => {
  const [status, setStatus] = useState<ControllerStatusType>("idle");
  const settings = useSettings();
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [modes, setModes] = useState<Mode[]>([]);
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [modeError, setModeError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = window.mini.onStatusUpdate((status) => {
      console.info("Status updated:", status);
      setStatus(status);
    });

    return () => {
      setStatus("idle");
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.database.modes
      .fetchAllModes()
      .then((modes) => {
        console.debug("Fetched modes:", modes);
        const activeMode = modes.find((mode) => mode.active);
        setActiveMode(activeMode || null);
        setModes(modes);
        setModeError(null);
      })
      .catch((error) => {
        console.error("Failed to request modes:", error);
        setModeError(
          error instanceof Error ? error : new Error("Failed to request modes"),
        );
      });
  }, []);

  useEffect(() => {
    const unsubscribe = window.mini.onChangeModeShortcutPressed(() => {
      console.debug("Change mode shortcut pressed");
      setModePickerOpen((prev) => !prev);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Display error if we have one
  if (modeError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 p-4 text-center">
        <AlertCircle className="mb-2 size-8 text-rose-500" />
        <h2 className="mb-1 text-lg font-semibold">Mode Loading Error</h2>
        <p className="text-sm text-zinc-600">{modeError.message}</p>
        <button
          className="mt-4 rounded bg-zinc-200 px-4 py-2 text-sm hover:bg-zinc-300"
          onClick={() => {
            setModeError(null);
            try {
              window.database.modes.fetchAllModes();
            } catch (error) {
              console.error("Failed to reload modes:", error);
              setModeError(
                error instanceof Error
                  ? error
                  : new Error("Failed to reload modes"),
              );
            }
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin-slow" />
      </div>
    );
  }

  // Main component rendering
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
      }}
    >
      <div className="flex h-screen w-full select-none flex-col justify-end bg-transparent font-sans">
        <div className="drag flex w-full flex-col items-center justify-end rounded-3xl border border-zinc-500 bg-zinc-50">
          {!modePickerOpen ? (
            <ErrorBoundary>
              <MainContentDisplay status={status} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary>
              <ModePicker
                modes={modes}
                setActiveMode={setActiveMode}
                setModePickerOpen={setModePickerOpen}
              />
            </ErrorBoundary>
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
    </ErrorBoundary>
  );
};

const appElement = document.getElementById("app");
if (!appElement) {
  throw new Error("App element not found");
}
const root = createRoot(appElement);
root.render(<App />);

interface StatusDisplayProps {
  status: ControllerStatusType;
}

/**
 * Displays the current status of the recording process
 * @param status The current status of the controller
 */
const StatusDisplay = ({ status }: StatusDisplayProps) => {
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

interface MainContentDisplayProps {
  status: ControllerStatusType;
}

/**
 * Main content display component that adapts based on current recording status
 * @param status The current status of the controller
 */
const MainContentDisplay = ({ status }: MainContentDisplayProps) => {
  const [resultText, setResultText] = useState("");
  const [transcriptionText, setTranscriptionText] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe = window.mini.onResult((result) => {
      console.info("Result updated: ", result);
      setResultText(
        result.mode.use_language_model && result.ai_result
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
    const padding = 16; // Padding in pixels
    const border = 2; // Border in pixels
    const maxHeight = 328; // Maximum height in pixels
    const minHeight = 112 + border; // Minimum height in pixels
    if (status === "result" || status === "generating_ai_result") {
      if (resultText || transcriptionText) {
        const resultTextArea = document.querySelector(
          "#result-text",
        ) as HTMLTextAreaElement;
        const transcriptionTextArea = document.querySelector(
          "#transcription-text",
        ) as HTMLTextAreaElement;
        const textArea = resultTextArea || transcriptionTextArea; // Use the appropriate text area based on the status
        console.debug("Text area: ", textArea.id);
        const textHeight = textArea.clientHeight;
        console.debug("Text height: ", textHeight);
        const computedHeight = textHeight + padding + border;
        console.debug("Computed height: ", computedHeight);
        const height = Math.min(Math.max(computedHeight, minHeight), maxHeight);
        window.mini.setMainContentHeight(height);
      }
    } else {
      window.mini.setMainContentHeight(minHeight);
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
      console.debug("Transcription text: ", transcriptionText);
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
              resultText.trim().length > 200 ? "text-left" : "text-center",
            )}
          >
            {resultText.trim()}
          </p>
        </div>
      );
    default:
      return <div>Unknown status</div>;
  }
};

interface TimerDisplayProps {
  status: ControllerStatusType;
}

/**
 * Displays a timer during recording
 * @param status The current status of the controller
 */
const TimerDisplay = ({ status }: TimerDisplayProps) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let timerInterval: NodeJS.Timeout = setInterval(() => {}, 1000); // Initialize with an empty interval
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

interface ModePickerProps {
  modes: Mode[];
  setActiveMode: (mode: Mode) => void;
  setModePickerOpen: (open: boolean) => void;
}

/**
 * Mode picker component for selecting different recording modes
 * @param modes List of available recording modes
 * @param setActiveMode Function to set the active mode
 * @param setModePickerOpen Function to toggle the mode picker visibility
 */
const ModePicker = ({
  modes,
  setActiveMode,
  setModePickerOpen,
}: ModePickerProps) => {
  const heightPerMode = 40; // Height of each mode item in pixels
  const gapHeight = 8; // Gap between mode items in pixels
  const paddingHeight = 16; // Padding around the mode picker in pixels
  const borderHeight = 2; // Border height in pixels
  const minHeight = 112 + borderHeight; // Minimum height of the mode picker in pixels
  const maxHeight = 328; // Maximum height of the mode picker in pixels

  useEffect(() => {
    const totalHeight =
      modes.length * heightPerMode +
      (modes.length - 1) * gapHeight +
      paddingHeight +
      borderHeight;

    const computedHeight = Math.min(totalHeight, maxHeight);
    window.mini.setMainContentHeight(Math.max(computedHeight, minHeight));

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
