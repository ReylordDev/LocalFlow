import { useEffect, useState } from "react";

const Settings = () => {
  console.log("Settings");

  const [startShortcut, setStartShortcut] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    window.startShortcut.get().then((shortcut: string) => {
      setStartShortcut(shortcut);
    });
  }, []);

  useEffect(() => {
    window.language.get().then((lang: string) => {
      console.log("Language", lang);
      setLanguage(lang);
    });
  }, []);

  return (
    <div className="bg-green-300 h-full w-full">
      <h1 className="font-bold text-3xl">Settings</h1>
      <div className="flex flex-col gap-4 bg-blue-300 p-4">
        <div className="flex justify-between gap-8">
          <p>Activation Shortcut</p>
          <ShortcutRecorder
            currentShortcut={startShortcut}
            onNewShortcut={(shortcut) => {
              window.startShortcut.set(shortcut).then(() => {
                setStartShortcut(shortcut);
                window.startShortcut.set(shortcut);
              });
            }}
          />
        </div>
      </div>
      <div className="flex justify-between gap-8">
        <p>Language</p>
        <select
          className="px-4 py-2 bg-gray-200 rounded"
          onChange={(e) => {
            console.log("Selected Language", e.target.value);
            const selectedLanguage = e.target.value;
            window.language.set(selectedLanguage);
            setLanguage(selectedLanguage);
          }}
          value={language}
        >
          <option value="auto">Auto</option>
          <option value="en">English</option>
          <option value="de">German</option>
          <option value="fr">French</option>
          <option value="it">Italian</option>
          <option value="es">Spanish</option>
          <option value="pt">Portuguese</option>
          <option value="hi">Hindi</option>
          <option value="th">Thai</option>
        </select>
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

  useEffect(() => {
    if (recording) {
      const handleKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        if (e.key === "Escape") {
          setRecording(false);
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
    <button
      onClick={() => setRecording(true)}
      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
    >
      {recording
        ? "Press shortcut..."
        : currentShortcut || "Click to set shortcut"}
    </button>
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
