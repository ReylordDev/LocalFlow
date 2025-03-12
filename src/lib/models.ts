// Python Models
// These have to match the models in models.py

type Action =
  | "start"
  | "stop"
  | "reset"
  | "audio_level"
  | "quit"
  | "model_status"
  | "model_load"
  | "get_history"
  | "delete_transcription"
  | "set_language"
  | "get_devices"
  | "set_device";

export interface ProgressMessage {
  step:
    | Action
    | "init"
    | "recording"
    | "compression"
    | "transcription"
    | "formatting"
    | "committing_to_history"
    | "loading_transcriber"
    | "loading_formatter";
  status: "start" | "complete" | "error";
  timestamp: number;
}

export interface Command {
  action: Action;
  data?: object;
}

export interface Message {
  type:
    | "audio_level"
    | "progress"
    | "raw_transcription"
    | "formatted_transcription"
    | "exception"
    | "model_status"
    | "history"
    | "error"
    | "devices";
  data:
    | ProgressMessage
    | RawTranscription
    | FormattedTranscripton
    | AudioLevel
    | ExceptionMessage
    | ModelStatus
    | History
    | Devices
    | Error;
}

// TODO: Fix snake case
export interface RawTranscription {
  raw_transcription: string;
}

export interface FormattedTranscripton {
  formatted_transcription: string;
}

export interface AudioLevel {
  audio_level: number;
}

export interface ExceptionMessage {
  exception: string;
  timestamp: number;
}

export interface Error {
  error: string;
}

export interface ModelStatus {
  transcriber_status: "offline" | "online";
  formatter_status: "offline" | "online";
}

export interface HistoryItem {
  id: number;
  raw_transcription: string;
  formatted_transcription: string;
  created_at: string;
}

export interface History {
  transcriptions: HistoryItem[];
}

export interface Device {
  index: number;
  name: string;
  default_samplerate: number;
}

export interface Devices {
  devices: Device[];
}

// Frontend-only models
export type Page = "Settings" | "History" | "Credits";

interface ApplicationConfig {
  launchAtStartup: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  enableRecordingWindow: boolean;
  autoCloseRecordingWindow: boolean;
}

interface KeyboardConfig {
  toggleRecordingShortcut: Electron.Accelerator; // https://www.electronjs.org/docs/latest/api/accelerator
  cancelRecordingShortcut: Electron.Accelerator;
  changeModeShortcut: Electron.Accelerator;
}

interface AudioConfig {
  device: Device | null;
  useSystemDefaultDevice: boolean;
  automaticallyIncreaseMicVolume: boolean;
  soundEffects: boolean;
  soundEffectsVolume: number;
}

interface OutputConfig {
  autoPasteResult: boolean;
  restoreClipboard: boolean;
}

export interface AppSettings {
  application: ApplicationConfig;
  keyboard: KeyboardConfig;
  audio: AudioConfig;
  output: OutputConfig;
  language: string; // TODO: remove
}

export type MiniStatus =
  | "default"
  | "transcribing"
  | "formatting"
  | "loading_transcriber"
  | "loading_formatter";

export const CHANNELS = {
  CONTROLLER: {
    TOGGLE_RECORDING: "controller:toggle-recording",
    MODEL_STATUS_REQUEST: "controller:requestModelStatus",
    MODEL_STATUS_RESPONSE: "controller:model-status",
    HISTORY_REQUEST: "controller:getHistory",
    HISTORY_RESPONSE: "controller:history",
    DELETE_TRANSCRIPTION: "controller:deleteTranscription",
  },
  SETTINGS: {
    GET: "settings:get-all",
    SET_SHORTCUT: "settings:set-shortcut",
    DISABLE_SHORTCUT: "settings:disable-shortcut",
    SET_LANGUAGE: "settings:set-language",
  },
  URL: {
    OPEN: "url:open",
  },
  MINI: {
    RECORDING_START: "mini:recording-start",
    RECORDING_STOP: "mini:recording-stop",
    AUDIO_LEVEL_REQUEST: "mini:requestAudioLevel",
    AUDIO_LEVEL_RESPONSE: "mini:audio-level",
    STATUS_UPDATE: "mini:status-update",
  },
  DEVICE: {
    DEVICES_REQUEST: "device:requestAll",
    DEVICES_RESPONSE: "device:receiveDevices",
    SET: "device:set",
  },
};

declare global {
  interface Window {
    controller: {
      toggleRecording: () => void;
      requestModelStatus: () => void;
      onReceiveModelStatus: (
        callback: (status: ModelStatus) => void
      ) => () => void;
      getHistory: () => void;
      onReceiveHistory: (
        callback: (transcriptions: HistoryItem[]) => void
      ) => () => void;
      deleteTranscription: (id: number) => void;
    };
    settings: {
      getAll: () => Promise<AppSettings>;
      setShortcut: (shortcut: string) => Promise<string>;
      disableShortcut: () => void;
      setLanguage: (language: string) => Promise<string>;
    };
    url: {
      open: (url: string) => void;
    };
    mini: {
      onRecordingStart: (callback: () => void) => () => void;
      onRecordingStop: (callback: () => void) => () => void;
      requestAudioLevel: () => void;
      onReceiveAudioLevel: (
        callback: (audioLevel: number) => void
      ) => () => void;
      onStatusUpdate: (callback: (status: MiniStatus) => void) => () => void;
    };
    device: {
      requestAll: () => void;
      onReceiveDevices: (callback: (devices: Device[]) => void) => () => void;
      set: (device: Device) => void;
    };
  }
}

export const PYTHON_SERVICE_EVENTS = {
  MODELS_READY: "models-ready",
  ERROR: "error",
  RECORDING_START: "recording-start",
  RECORDING_STOP: "recording-stop",
  TRANSCRIPTION: "transcription",
  AUDIO_LEVEL: "audio-level",
  MODEL_STATUS: "model-status",
  HISTORY: "history",
  DEVICES: "devices",
  STATUS_UPDATE: "status-update",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
  SHORTCUT_PRESSED: "start-shortcut-pressed",
};
