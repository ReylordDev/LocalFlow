import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { InputDevice } from "../lib/models";

const languages = [
  { code: "auto", name: "Auto" },
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
];

const Settings = () => {
  console.log("Settings");

  const [startShortcut, setStartShortcut] = useState("");
  const [language, setLanguage] = useState("Auto");
  const [inputDevice, setInputDevice] = useState<InputDevice | null>(null);
  const [devices, setDevices] = useState<InputDevice[]>([]);

  useEffect(() => {
    window.settings.getAll().then((settings) => {
      console.log("Received Settings", settings);
      setStartShortcut(settings.startShortcut);
      setLanguage(settings.language);
    });
  }, []);

  window.device.onReceiveDevices((devices: InputDevice[]) => {
    console.log("Received Devices", devices);
    setDevices(devices);
    if (!inputDevice) {
      setInputDevice(devices[0]);
    }
  });

  useEffect(() => {
    window.device.requestAll();
  }, []);

  console.log("Start Shortcut", startShortcut);
  console.log("Language", language);
  console.log("Input Device", inputDevice);
  console.log("Devices", devices);

  return (
    <div className="gap-12 flex-col flex h-full w-full">
      <h1 className="font-bold text-5xl">Settings</h1>
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Activation Shortcut</h2>
            <p>Change the global keybind to toggle the recording</p>
          </div>
          <ShortcutRecorder
            currentShortcut={startShortcut}
            onNewShortcut={(shortcut) => {
              window.settings.setShortcut(shortcut).then(() => {
                setStartShortcut(shortcut);
              });
            }}
          />
        </div>
        <div
          className="flex justify-between items-center
        "
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Input Device</h2>
            <p>Choose your microphone</p>
          </div>
          <Select
            value={inputDevice?.name || ""}
            onValueChange={(deviceName: string) => {
              const device = devices.find((d) => d.name === deviceName);
              if (device) {
                setInputDevice(device);
                window.device.set(device);
              }
            }}
          >
            <SelectTrigger className="w-[180px] rounded text-lg text-left">
              <SelectValue placeholder="Input Device" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem
                  key={device.index}
                  value={device.name}
                  className={cn(device === inputDevice && "bg-gray-200")}
                >
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Language</h2>
            <p>Select your default speaking language</p>
          </div>
          <Select
            value={language || "auto"}
            onValueChange={(lang) => {
              setLanguage(lang);
              window.settings.setLanguage(lang);
            }}
          >
            <SelectTrigger className="w-[180px] rounded text-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Settings;

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
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [recording, onNewShortcut]);

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (recording) {
          abortShortcutRecording();
        } else {
          setRecording(true);
          window.settings.disableShortcut(); // Disable the current shortcut while recording a new one
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
