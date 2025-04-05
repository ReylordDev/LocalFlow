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
  | "delete_mode"
  | "switch_mode"
  | "get_results"
  | "delete_result"
  | "add_example"
  | "get_voice_models"
  | "get_language_models"
  | "get_text_replacements"
  | "create_text_replacement"
  | "delete_text_replacement";

// --------------- Electron to Python IPC Models --------------- //

interface SelectModeCommand {
  mode_id: UUID;
}

interface SelectResultCommand {
  result_id: UUID;
}

interface SelectDeviceCommand {
  index: number;
}

interface SelectTextReplacementCommand {
  text_replacement_id: UUID;
}

interface AddExampleCommand {
  prompt_id: UUID;
  example: ExampleBase;
}

export interface Command {
  action: Action;
  data?:
    | SelectModeCommand
    | SelectDeviceCommand
    | SelectResultCommand
    | ModeCreate
    | ModeUpdate
    | AddExampleCommand
    | SelectTextReplacementCommand
    | TextReplacementBase;
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

export interface VoiceModelsMessage {
  voice_models: VoiceModel[];
}

export interface LanguageModelsMessage {
  language_models: LanguageModel[];
}

export interface TextReplacementsMessage {
  text_replacements: TextReplacement[];
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
    | "modes_update"
    | "voice_models"
    | "language_models"
    | "text_replacements";
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
    | ResultsMessage
    | VoiceModelsMessage
    | LanguageModelsMessage
    | TextReplacementsMessage;
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

export type ModeUpdate = Partial<ModeBase> & { id: UUID } & {
  voice_model_name?: string;
  language_model_name?: string;
  prompt?: Partial<PromptBase>;
  text_replacements?: TextReplacementBase[];
};

interface VoiceModelBase {
  name: VoiceModelType;
  language: "english-only" | "multilingual";
  speed: number;
  accuracy: number;
  size: number;
  parameters: number;
}

export interface VoiceModel extends VoiceModelBase {
  id: UUID;
  modes: Mode[];
}

export interface LanguageModel {
  name: string;
  modes: Mode[];
}

export interface PromptBase {
  system_prompt: string;
  include_clipboard: boolean;
  include_active_window: boolean;

  examples: ExampleBase[];
}

export interface Prompt extends PromptBase {
  id: UUID;
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
  "Text Replacements",
  "Configuration",
  "Audio",
  "Recording History",
  "Credits",
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
  SETTINGS: {
    GET: "settings:get-all",
    DISABLE_SHORTCUT: "settings:disable-shortcut",
    SET_AUDIO: "settings:set-audio",
    SET_KEYBOARD: "settings:set-keyboard",
    SET_APPLICATION: "settings:set-application",
    SET_OUTPUT: "settings:set-output",
    SETTINGS_CHANGED: "settings:changed",
    GET_LOCALE: "settings:get-locale",
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
    TRANSCRIPTION: "mini:transcription",
    CHANGE_MODE_SHORTCUT_PRESSED: "mini:change-mode-shortcut-pressed",
    SET_MAIN_CONTENT_HEIGHT: "mini:setMainContentHeight",
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
      DELETE_MODE: "database:modes:deleteMode",
      ACTIVATE_MODE: "database:modes:activateMode",
    },
    RESULTS: {
      DELETE_RESULT: "database:results:deleteResult",
    },
    EXAMPLES: {
      ADD_EXAMPLE: "database:examples:addExample",
    },
    TEXT_REPLACEMENTS: {
      TEXT_REPLACEMENTS_REQUEST: "database:textReplacements:getAll",
      TEXT_REPLACEMENTS_RESPONSE:
        "database:textReplacements:receiveTextReplacements",
      CREATE_TEXT_REPLACEMENT: "database:textReplacements:create",
      DELETE_TEXT_REPLACEMENT: "database:textReplacements:delete",
    },
    VOICE_MODELS: {
      VOICE_MODELS_REQUEST: "database:voiceModels:getAll",
      VOICE_MODELS_RESPONSE: "database:voiceModels:receiveVoiceModels",
    },
    LANGUAGE_MODELS: {
      LANGUAGE_MODELS_REQUEST: "database:languageModels:getAll",
      LANGUAGE_MODELS_RESPONSE: "database:languageModels:receiveLanguageModels",
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
      setOutput: (outputConfig: OutputConfig) => void;
      onSettingsChanged: (
        callback: (settings: AppSettings) => void,
      ) => () => void;
      getLocale: () => Promise<string>;
    };
    url: {
      open: (url: string) => void;
    };
    mini: {
      requestAudioLevel: () => void;
      onReceiveAudioLevel: (
        callback: (audioLevel: number) => void,
      ) => () => void;
      onStatusUpdate: (
        callback: (status: ControllerStatusType) => void,
      ) => () => void;
      onResult: (callback: (result: Result) => void) => () => void;
      onTranscription(callback: (transcription: string) => void): () => void;
      onChangeModeShortcutPressed: (callback: () => void) => () => void;
      setMainContentHeight: (height: number) => void;
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
        deleteMode: (modeId: UUID) => void;
        onModesUpdate: (callback: (modes: Mode[]) => void) => () => void;
        activateMode: (modeId: UUID) => void;
      };
      results: {
        deleteResult: (resultId: UUID) => void;
      };
      examples: {
        // Or use modeId? Should work the same
        addExample: (promptId: UUID, example: ExampleBase) => void;
      };
      textReplacements: {
        requestAll: () => void;
        onReceiveTextReplacements: (
          callback: (textReplacements: TextReplacement[]) => void,
        ) => () => void;
        createTextReplacement: (textReplacement: TextReplacementBase) => void;
        deleteTextReplacement: (textReplacementId: UUID) => void;
      };
      voiceModels: {
        requestAll: () => void;
        onReceiveVoiceModels: (
          callback: (voiceModels: VoiceModel[]) => void,
        ) => () => void;
      };
      languageModels: {
        requestAll: () => void;
        onReceiveLanguageModels: (
          callback: (languageModels: LanguageModel[]) => void,
        ) => () => void;
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
  VOICE_MODELS: "voice-models",
  LANGUAGE_MODELS: "language-models",
  TEXT_REPLACEMENTS: "text-replacements",
};

export const SETTINGS_SERVICE_EVENTS = {
  SETTINGS_CHANGED: "settings-changed",
  SHORTCUT_PRESSED: {
    TOGGLE: "shortcut-pressed-toggle",
    CANCEL: "shortcut-pressed-cancel",
    CHANGE_MODE: "shortcut-pressed-change-mode",
  },
};
