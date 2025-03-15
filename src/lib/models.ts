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
  | "set_device";

// --------------- Electron to Python IPC Models --------------- //

interface SelectModeCommand {
  mode_id: UUID;
}

interface SelectDeviceCommand {
  index: number;
}

export interface Command {
  action: Action;
  data?: SelectModeCommand | SelectDeviceCommand;
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

export interface LanguageModelTranscriptionMessage {
  formatted_transcription: string;
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
}

export interface DevicesMessage {
  devices: Device[];
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

export interface Message {
  type:
    | "progress"
    | "transcription"
    | "formatted_transcription"
    | "audio_level"
    | "exception"
    | "devices"
    | "error"
    | "status";
  data:
    | ProgressMessage
    | TranscriptionMessage
    | LanguageModelTranscriptionMessage
    | AudioLevelMessage
    | ExceptionMessage
    | DevicesMessage
    | ErrorMessage
    | StatusMessage;
}

// --------------- Database Models --------------- //

type LanguageType =
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

type VoiceModelType = "large-v3-turbo" | "large-v3" | "distil-large-v3";

interface Mode {
  id: UUID;
  name: string;
  default: boolean;
  active: boolean;

  text_replacements: TextReplacement[];

  voice_model: VoiceModel;
  voice_model_id: VoiceModelType;
  voice_language: LanguageType;
  translate_to_english: boolean;

  use_language_model: boolean;
  language_model?: LanguageModel;
  language_model_id?: string;
  prompt?: Prompt;

  record_system_audio: boolean;
}

interface VoiceModel {
  name: VoiceModelType;
  language: "english-only" | "multilingual";
  speed: number;
  accuracy: number;
  size: number;
  parameters: number;

  modes: Mode[];
}

interface LanguageModel {
  name: string;
  modes: Mode[];
}

interface Prompt {
  id: string;

  mode_id?: UUID;
  mode?: Mode;

  system_prompt: string;
  examples: Example[];

  include_clipboard: boolean;
  include_active_window: boolean;
}

interface Example {
  id: UUID;
  input: string;
  output: string;

  prompt_id: UUID;
  prompt: Prompt;
}

interface TextReplacement {
  id: UUID;
  original_text: string;
  replacement_text: string;

  mode_id?: UUID;
  mode?: Mode;
}

interface Result {
  id: UUID;
  mode_id: UUID;
  created_at: number;
  transcription: string;
  ai_result?: string;
  duration: number;
  processing_time: number;

  location: string;
}

// --------------- Frontend Models --------------- //

// TODO: update with new pages
export type Page = "Settings" | "Credits";

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
}

export const CHANNELS = {
  CONTROLLER: {
    TOGGLE_RECORDING: "controller:toggle-recording",
  },
  SETTINGS: {
    GET: "settings:get-all",
    SET_SHORTCUT: "settings:set-shortcut",
    DISABLE_SHORTCUT: "settings:disable-shortcut",
  },
  URL: {
    OPEN: "url:open",
  },
  MINI: {
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
    };
    settings: {
      getAll: () => Promise<AppSettings>;
      setShortcut: (shortcut: string) => Promise<string>;
      disableShortcut: () => void;
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
  TRANSCRIPTION: "transcription",
  AUDIO_LEVEL: "audio-level",
  DEVICES: "devices",
  STATUS_UPDATE: "status-update",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
  SHORTCUT_PRESSED: "start-shortcut-pressed",
};
