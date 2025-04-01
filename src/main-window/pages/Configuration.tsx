import { Separator } from "../../components/ui/separator";
import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

export default function ConfigurationPage() {
  const [toggleRecordingShortcut, setToggleRecordingShortcut] = useState("");

  const [cancelRecordingShortcut, setCancelRecordingShortcut] = useState("");

  const [changeModeShortcut, setChangeModeShortcut] = useState("");

  const [launchAtStartup, setLaunchAtStartup] = useState(false);
  const [enableRecordingWindow, setEnableRecordingWindow] = useState(true);
  const [autoCloseRecordingWindow, setAutoCloseRecordingWindow] =
    useState(false);

  const [autoPasteResult, setAutoPasteResult] = useState(false);
  const [restoreClipboard, setRestoreClipboard] = useState(false);

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      console.log("Settings: ", settings);
      setToggleRecordingShortcut(settings.keyboard.toggleRecordingShortcut);
      setCancelRecordingShortcut(settings.keyboard.cancelRecordingShortcut);
      setChangeModeShortcut(settings.keyboard.changeModeShortcut);

      setLaunchAtStartup(settings.application.launchAtStartup);
      setEnableRecordingWindow(settings.application.enableRecordingWindow);
      setAutoCloseRecordingWindow(
        settings.application.autoCloseRecordingWindow
      );

      setAutoPasteResult(settings.output.autoPasteResult);
      setRestoreClipboard(settings.output.restoreClipboard);
    });
  }, []);

  const handleSettingsChange = () => {
    window.settings.setKeyboard({
      toggleRecordingShortcut,
      cancelRecordingShortcut,
      changeModeShortcut,
    });

    window.settings.setApplication({
      launchAtStartup,
      minimizeToTray: true,
      closeToTray: true,
      enableRecordingWindow,
      autoCloseRecordingWindow,
    });

    window.settings.setOutput({
      autoPasteResult,
      restoreClipboard,
    });
  };

  useEffect(() => {
    handleSettingsChange();
  }, [
    toggleRecordingShortcut,
    cancelRecordingShortcut,
    changeModeShortcut,
    launchAtStartup,
    enableRecordingWindow,
    autoCloseRecordingWindow,
    autoPasteResult,
    restoreClipboard,
  ]);

  return (
    <div className="h-full w-full flex flex-col ">
      <div className="flex justify-between items-center px-4 bg-gradient-to-l from-sky-300 to-sky-600 text-white border-b border-zinc-200">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-2xl py-5">Configuration</h1>
        </div>
      </div>
      <div className="flex flex-col gap-4 px-8 py-8 bg-zinc-50 overflow-y-auto h-full">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Keyboard</h2>
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Toggle Recording Shortcut
              </h3>
              <ShortcutRecorder
                currentShortcut={toggleRecordingShortcut}
                onNewShortcut={(shortcut) =>
                  setToggleRecordingShortcut(shortcut)
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Cancel Recording Shortcut
              </h3>
              <ShortcutRecorder
                currentShortcut={cancelRecordingShortcut}
                onNewShortcut={(shortcut) =>
                  setCancelRecordingShortcut(shortcut)
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Change Mode Shortcut</h3>
              <ShortcutRecorder
                currentShortcut={changeModeShortcut}
                onNewShortcut={(shortcut) => setChangeModeShortcut(shortcut)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Application</h2>
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Launch on Login</h3>
              <Switch
                checked={launchAtStartup}
                onCheckedChange={(checked) => {
                  setLaunchAtStartup(checked);
                }}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Enable Recording Window</h3>
              <Switch
                checked={enableRecordingWindow}
                onCheckedChange={(checked) => {
                  setEnableRecordingWindow(checked);
                }}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Close Recording Window Automatically
              </h3>
              <Switch
                checked={autoCloseRecordingWindow}
                onCheckedChange={(checked) => {
                  setAutoCloseRecordingWindow(checked);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Output</h2>
          <div className="flex flex-col gap-2 bg-white border border-zinc-200 rounded-md p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Automatically Paste Result
              </h3>
              <Switch
                checked={autoPasteResult}
                onCheckedChange={(checked) => {
                  setAutoPasteResult(checked);
                }}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Restore Clipboard after Paste
              </h3>
              <Switch
                checked={restoreClipboard}
                onCheckedChange={(checked) => {
                  setRestoreClipboard(checked);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShortcutRecorder({
  currentShortcut,
  onNewShortcut,
}: {
  currentShortcut: string;
  onNewShortcut: (shortcut: string) => void;
}) {
  const [recording, setRecording] = useState(false);

  console.log("Current Shortcut: ", currentShortcut);

  function abortShortcutRecording() {
    setRecording(false);
    onNewShortcut(currentShortcut);
    console.log("Stopped Recording");
  }

  useEffect(() => {
    if (recording) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        if (e.key === "Escape") {
          abortShortcutRecording();
          return;
        }
        const keys = [];
        if (e.ctrlKey) keys.push("Ctrl");
        if (e.shiftKey) keys.push("Shift");
        if (e.altKey) keys.push("Alt");
        if (e.key !== "Control" && e.key !== "Shift" && e.key !== "Alt") {
          keys.push(e.key.toUpperCase());
          if (keys.length > 0 && isValidShortcut(keys.join("+"))) {
            onNewShortcut(keys.join("+"));
            setRecording(false);
          } else {
            console.log("Invalid shortcut: ", keys.join("+"));
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [recording]);

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (recording) {
          abortShortcutRecording();
        } else {
          setRecording(true);
          window.settings.disableShortcut(currentShortcut);
          console.log("Recording Shortcut Setting");
        }
      }}
      className={cn(
        "text-lg w-[180px] font-medium rounded",
        recording && "border-orange-500 border-2"
      )}
    >
      {recording
        ? "Press shortcut..."
        : currentShortcut || "Click to set shortcut"}
    </Button>
  );
}

function isValidShortcut(shortcut: string): boolean {
  const modifiers = [
    "Command",
    "Cmd",
    "Control",
    "Ctrl",
    "CommandOrControl",
    "CmdOrCtrl",
    "Alt",
    "Option",
    "AltGr",
    "Shift",
    "Super",
    "Meta",
  ];
  const keyCodes = [
    ...Array.from({ length: 10 }, (_, i) => i.toString()), // 0-9
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
    ...Array.from({ length: 24 }, (_, i) => `F${i + 1}`), // F1-F24
    ")",
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ":",
    ";",
    "+",
    "=",
    "<",
    ",",
    "_",
    "-",
    ">",
    ".",
    "?",
    "/",
    "~",
    "`",
    "{",
    "]",
    "[",
    "|",
    "\\",
    "}",
    '"',
    "Plus",
    "Space",
    "Tab",
    "Capslock",
    "Numlock",
    "Scrolllock",
    "Backspace",
    "Delete",
    "Insert",
    "Return",
    "Enter",
    "Up",
    "Down",
    "Left",
    "Right",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "Escape",
    "Esc",
    "VolumeUp",
    "VolumeDown",
    "VolumeMute",
    "MediaNextTrack",
    "MediaPreviousTrack",
    "MediaStop",
    "MediaPlayPause",
    "PrintScreen",
    "num0",
    "num1",
    "num2",
    "num3",
    "num4",
    "num5",
    "num6",
    "num7",
    "num8",
    "num9",
    "numdec",
    "numadd",
    "numsub",
    "nummult",
    "numdiv",
  ];

  const parts = shortcut.split("+");
  if (parts.length === 0) return false;

  for (let i = 0; i < parts.length - 1; i++) {
    if (!modifiers.includes(parts[i])) return false;
  }

  console.log("Checking Shortcut");
  console.log(parts[parts.length - 1]);

  return keyCodes.includes(parts[parts.length - 1]);
}
