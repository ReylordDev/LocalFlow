// Python Models
// These have to match the models in models.py

import { UUID } from "crypto";

type Action =
  | "toggle"
  | "cancel"
  | "reset"
  | "audio_level"
  | "select_mode"
  | "get_devices"
  | "set_device"
  | "get_modes"
  | "create_mode"
  | "update_mode"
  | "get_results";

// --------------- Electron to Python IPC Models --------------- //

interface SelectModeCommand {
  mode_id: UUID;
}

interface SelectDeviceCommand {
  index: number;
}

export interface Command {
  action: Action;
  data?: SelectModeCommand | SelectDeviceCommand | ModeCreate;
}

// --------------- Python to Electron IPC Models --------------- //

export interface ProgressMessage {
  step: Action | "init" | "recording" | "compression" | "transcription";
  status: "start" | "complete" | "error";
  timestamp: number;
}

export interface ExceptionMessage {
  exception: string;
  timestamp: number;
}

export interface TranscriptionMessage {
  transcription: string;
}

export interface AudioLevelMessage {
  audio_level: number;
}

export interface ErrorMessage {
  error: string;
}

export interface Device {
  index: number;
  name: string;
  default_samplerate: number;
  is_default: boolean;
}

export interface DevicesMessage {
  devices: Device[];
}

export interface ModesMessage {
  modes: Mode[];
}

export type ControllerStatusType =
  | "idle"
  | "recording"
  | "compressing"
  | "loading_voice_model"
  | "transcribing"
  | "loading_language_model"
  | "generating_ai_result"
  | "saving"
  | "result";

export interface StatusMessage {
  status: ControllerStatusType;
}

export interface ResultMessage {
  result: Result;
}

export interface ResultsMessage {
  results: Result[];
}
export interface Message {
  type:
    | "progress"
    | "transcription"
    | "audio_level"
    | "exception"
    | "devices"
    | "error"
    | "status"
    | "modes"
    | "result"
    | "results"
    | "modes_update";
  data:
    | ProgressMessage
    | TranscriptionMessage
    | AudioLevelMessage
    | ExceptionMessage
    | DevicesMessage
    | ErrorMessage
    | StatusMessage
    | ModesMessage
    | ResultMessage
    | ResultsMessage;
}

// --------------- Database Models --------------- //

export type LanguageType =
  | "auto"
  | "en"
  | "de"
  | "fr"
  | "it"
  | "es"
  | "pt"
  | "hi"
  | "th";

export const languageNameMap: Record<LanguageType, string> = {
  auto: "Auto",
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  pt: "Portuguese",
  hi: "Hindi",
  th: "Thai",
};

export type VoiceModelType = "large-v3-turbo" | "large-v3" | "distil-large-v3";

interface ModeBase {
  name: string;
  default: boolean;
  active: boolean;
  voice_language: LanguageType;
  translate_to_english: boolean;
  record_system_audio: boolean;
  use_language_model: boolean;
}

export interface Mode extends ModeBase {
  id: UUID;
  text_replacements: TextReplacement[];
  voice_model: VoiceModel;
  language_model?: LanguageModel;
  prompt?: Prompt;
  results: Result[];
}

export interface ModeCreate extends ModeBase {
  voice_model_name: string;
  language_model_name?: string;
  prompt?: PromptBase;
  text_replacements: TextReplacementBase[];
}

export interface ModeUpdate extends ModeCreate {
  id: UUID;
}

interface VoiceModelBase {
  name: VoiceModelType;
  language: "english-only" | "multilingual";
  speed: number;
  accuracy: number;
  size: number;
  parameters: number;
}

interface VoiceModel extends VoiceModelBase {
  id: UUID;
  modes: Mode[];
}

interface LanguageModel {
  name: string;
  modes: Mode[];
}

export interface PromptBase {
  system_prompt: string;
  include_clipboard: boolean;
  include_active_window: boolean;

  examples?: ExampleBase[];
}

export interface Prompt extends PromptBase {
  id: string;
  // mode_id?: UUID;
  mode?: Mode;
  examples: Example[];
}

export interface ExampleBase {
  input: string;
  output: string;
}

interface Example extends ExampleBase {
  id: UUID;
  // prompt_id: UUID;
  prompt: Prompt;
}

export interface TextReplacementBase {
  original_text: string;
  replacement_text: string;
}

export interface TextReplacement extends TextReplacementBase {
  id: UUID;

  mode_id?: UUID;
  mode?: Mode;
}

interface ResultBase {
  created_at: number;
  transcription: string;
  ai_result?: string;
  duration: number;
  processing_time: number;
}

export interface Result extends ResultBase {
  id: UUID;
  mode: Mode;

  location: string;
}

// --------------- Frontend Models --------------- //

// TODO: update with new pages
export const pages = [
  "Modes",
  "Configuration",
  "Audio",
  "Credits",
  "Recording History",
] as const;
export type Page = (typeof pages)[number];

export interface ApplicationConfig {
  launchAtStartup: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  enableRecordingWindow: boolean;
  autoCloseRecordingWindow: boolean;
}

export interface KeyboardConfig {
  toggleRecordingShortcut: Electron.Accelerator; // https://www.electronjs.org/docs/latest/api/accelerator
  cancelRecordingShortcut: Electron.Accelerator;
  changeModeShortcut: Electron.Accelerator;
}

export interface AudioConfig {
  device: Device | null;
  useSystemDefaultDevice: boolean;
  automaticallyIncreaseMicVolume: boolean;
  soundEffects: boolean;
  soundEffectsVolume: number;
}

export interface OutputConfig {
  autoPasteResult: boolean;
  restoreClipboard: boolean;
}

export interface AppSettings {
  application: ApplicationConfig;
  keyboard: KeyboardConfig;
  audio: AudioConfig;
  output: OutputConfig;
}

export const CHANNEL_NAMES = {
  CONTROLLER: "controller",
  SETTINGS: "settings",
  URL: "url",
  MINI: "mini",
  DEVICE: "device",
  DATABASE: "database",
  RECORDING_HISTORY: "recordingHistory",
  CLIPBOARD: "clipboard",
  FILE: "file",
};

export const CHANNELS = {
  CONTROLLER: {
    TOGGLE_RECORDING: "controller:toggle-recording",
  },
  SETTINGS: {
    GET: "settings:get-all",
    DISABLE_SHORTCUT: "settings:disable-shortcut",
    SET_AUDIO: "settings:set-audio",
    SET_KEYBOARD: "settings:set-keyboard",
    SET_APPLICATION: "settings:set-application",
    SETTINGS_CHANGED: "settings:changed",
  },
  URL: {
    OPEN: "url:open",
  },
  CLIPBOARD: {
    COPY: "clipboard:copy",
  },
  FILE: {
    OPEN: "file:open",
  },
  MINI: {
    AUDIO_LEVEL_REQUEST: "mini:requestAudioLevel",
    AUDIO_LEVEL_RESPONSE: "mini:audio-level",
    STATUS_UPDATE: "mini:status-update",
    RESULT: "mini:result",
  },
  DEVICE: {
    DEVICES_REQUEST: "device:requestAll",
    DEVICES_RESPONSE: "device:receiveDevices",
    SET: "device:set",
  },
  DATABASE: {
    MODES: {
      MODES_REQUEST: "database:modes:getAll",
      MODES_RESPONSE: "database:modes:receiveModes",
      MODES_UPDATE: "database:modes:update",
      CREATE_MODE: "database:modes:createMode",
      UPDATE_MODE: "database:modes:updateMode",
    },
  },
  RECORDING_HISTORY: {
    OPEN_WINDOW: "recordingHistory:open-window",
    RESULTS_REQUEST: "recordingHistory:requestAll",
    RESULTS_RESPONSE: "recordingHistory:receiveResults",
  },
};

declare global {
  interface Window {
    controller: {
      toggleRecording: () => void;
    };
    settings: {
      getAll: () => Promise<AppSettings>;
      disableShortcut: (shortcut: string) => void;
      setAudio: (audioConfig: AudioConfig) => void;
      setKeyboard: (keyboardConfig: KeyboardConfig) => void;
      setApplication: (applicationConfig: ApplicationConfig) => void;
      onSettingsChanged: (
        callback: (settings: AppSettings) => void
      ) => () => void;
    };
    url: {
      open: (url: string) => void;
    };
    mini: {
      requestAudioLevel: () => void;
      onReceiveAudioLevel: (
        callback: (audioLevel: number) => void
      ) => () => void;
      onStatusUpdate: (
        callback: (status: ControllerStatusType) => void
      ) => () => void;
      onResult: (callback: (result: Result) => void) => () => void;
    };
    device: {
      requestAll: () => void;
      onReceiveDevices: (callback: (devices: Device[]) => void) => () => void;
      set: (device: Device) => void;
    };
    database: {
      modes: {
        requestAll: () => void;
        onReceiveModes: (callback: (modes: Mode[]) => void) => () => void;
        createMode: (mode: ModeCreate) => void;
        updateMode: (mode: ModeUpdate) => void;
        onModesUpdate: (callback: (modes: Mode[]) => void) => () => void;
      };
    };
    recordingHistory: {
      openWindow: () => void;
      requestAll: () => void;
      onReceiveResults: (callback: (results: Result[]) => void) => () => void;
    };
    clipboard: {
      copy: (text: string) => void;
    };
    file: {
      open: (path: string) => void;
    };
  }
}

export const PYTHON_SERVICE_EVENTS = {
  MODELS_READY: "models-ready",
  ERROR: "error",
  TRANSCRIPTION: "transcription",
  AUDIO_LEVEL: "audio-level",
  DEVICES: "devices",
  STATUS_UPDATE: "status-update",
  MODES_UPDATE: "modes-update",
  MODES: "modes",
  RESULT: "result",
  RESULTS: "results",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
  SHORTCUT_PRESSED: {
    TOGGLE: "shortcut-pressed-toggle",
    CANCEL: "shortcut-pressed-cancel",
    CHANGE_MODE: "shortcut-pressed-change-mode",
  },
};
