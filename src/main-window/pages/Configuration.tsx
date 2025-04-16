import { Separator } from "../../components/ui/separator";
import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { useConfigStore } from "../../stores/config-store";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

export default function ConfigurationPage() {
  const {
    keyboard,
    application,
    output,
    setKeyboardConfig,
    setApplicationConfig,
    setOutputConfig,
    loadSettings,
  } = useConfigStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-l from-sky-300 to-sky-600 px-4 text-white">
        <div className="flex items-center gap-4">
          <h1 className="py-5 text-2xl font-bold">Configuration</h1>
        </div>
      </div>
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-zinc-50 px-8 py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Keyboard</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Toggle Recording Shortcut
              </h3>
              <ShortcutRecorder
                currentShortcut={keyboard.toggleRecordingShortcut}
                onNewShortcut={(shortcut) =>
                  setKeyboardConfig({
                    ...keyboard,
                    toggleRecordingShortcut: shortcut,
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Cancel Recording Shortcut
              </h3>
              <ShortcutRecorder
                currentShortcut={keyboard.cancelRecordingShortcut}
                onNewShortcut={(shortcut) =>
                  setKeyboardConfig({
                    ...keyboard,
                    cancelRecordingShortcut: shortcut,
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Change Mode Shortcut</h3>
              <ShortcutRecorder
                currentShortcut={keyboard.changeModeShortcut}
                onNewShortcut={(shortcut) =>
                  setKeyboardConfig({
                    ...keyboard,
                    changeModeShortcut: shortcut,
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Application</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Launch on Login</h3>
              <Switch
                checked={application.launchAtStartup}
                onCheckedChange={(checked) =>
                  setApplicationConfig({
                    ...application,
                    launchAtStartup: checked,
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Enable Recording Window</h3>
              <Switch
                checked={application.enableRecordingWindow}
                onCheckedChange={(checked) =>
                  setApplicationConfig({
                    ...application,
                    enableRecordingWindow: checked,
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Close Recording Window Automatically
              </h3>
              <Switch
                checked={application.autoCloseRecordingWindow}
                onCheckedChange={(checked) =>
                  setApplicationConfig({
                    ...application,
                    autoCloseRecordingWindow: checked,
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Minimize to the System Tray
              </h3>
              <Switch
                checked={application.minimizeToTray}
                onCheckedChange={(checked) =>
                  setApplicationConfig({
                    ...application,
                    minimizeToTray: checked,
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Close to Tray</h3>
              <Switch
                checked={application.closeToTray}
                onCheckedChange={(checked) =>
                  setApplicationConfig({
                    ...application,
                    closeToTray: checked,
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Output</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Automatically Paste Result
              </h3>
              <Switch
                checked={output.autoPasteResult}
                onCheckedChange={(checked) =>
                  setOutputConfig({
                    ...output,
                    autoPasteResult: checked,
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Restore Clipboard after Paste
              </h3>
              <Switch
                checked={output.restoreClipboard}
                onCheckedChange={(checked) =>
                  setOutputConfig({
                    ...output,
                    restoreClipboard: checked,
                  })
                }
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

  function abortShortcutRecording() {
    setRecording(false);
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
            console.info("New shortcut is valid: ", keys.join("+"));
            onNewShortcut(keys.join("+"));
            setRecording(false);
          } else {
            console.warn("Invalid shortcut: ", keys.join("+"));
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
          console.debug("Recording Shortcut Setting");
        }
      }}
      className={cn(
        "w-[180px] rounded text-lg font-medium",
        recording && "border-2 border-orange-500",
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

  console.debug("Checking Shortcut");
  console.debug(parts[parts.length - 1]);

  return keyCodes.includes(parts[parts.length - 1]);
}
