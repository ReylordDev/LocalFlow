// IPC channel constants for communication between renderer and main processes

import {
  ControllerStatusType,
  Device,
  ModeCreate,
  ModeUpdate,
  ExampleBase,
  TextReplacement,
  TextReplacementBase,
  VoiceModel,
  LanguageModel,
  Result,
  Mode,
} from "./database";
import {
  ApplicationConfig,
  AppSettings,
  AudioConfig,
  KeyboardConfig,
  OutputConfig,
} from "./settings";
import { UUID } from "crypto";

enum ModeChannels {
  fetchAllModes = "database:modes:getAll",
  createMode = "database:modes:createMode",
  updateMode = "database:modes:updateMode",
  deleteMode = "database:modes:deleteMode",
  activateMode = "database:modes:activateMode",
}

enum ResultChannels {
  fetchAllResults = "database:results:getAll",
  deleteResult = "database:results:deleteResult",
}

enum ExampleChannels {
  addExample = "database:examples:addExample",
}

enum VoiceModelChannels {
  fetchAllVoiceModels = "database:voiceModels:getAll",
}

enum LanguageModelChannels {
  fetchAllLanguageModels = "database:languageModels:getAll",
}

enum TextReplacementChannels {
  fetchAllTextReplacements = "database:textReplacements:getAll",
  createTextReplacement = "database:textReplacements:create",
  deleteTextReplacement = "database:textReplacements:delete",
}

enum DeviceChannels {
  fetchAllDevices = "device:getAll",
  setDevice = "device:set",
}

export enum CHANNELS {
  fetchAllModes = ModeChannels.fetchAllModes,
  createMode = ModeChannels.createMode,
  updateMode = ModeChannels.updateMode,
  deleteMode = ModeChannels.deleteMode,
  activateMode = ModeChannels.activateMode,
  deleteResult = ResultChannels.deleteResult,
  addExample = ExampleChannels.addExample,
  fetchAllResults = ResultChannels.fetchAllResults,
  fetchAllVoiceModels = VoiceModelChannels.fetchAllVoiceModels,
  fetchAllLanguageModels = LanguageModelChannels.fetchAllLanguageModels,
  fetchAllTextReplacements = TextReplacementChannels.fetchAllTextReplacements,
  createTextReplacement = TextReplacementChannels.createTextReplacement,
  deleteTextReplacement = TextReplacementChannels.deleteTextReplacement,
  fetchAllDevices = DeviceChannels.fetchAllDevices,
  setDevice = DeviceChannels.setDevice,
}

export type ChannelFunctionTypeMap = {
  [CHANNELS.fetchAllModes]: () => Promise<Mode[]>;
  [CHANNELS.createMode]: (mode: ModeCreate) => Promise<Mode[]>;
  [CHANNELS.updateMode]: (mode: ModeUpdate) => Promise<Mode[]>;
  [CHANNELS.deleteMode]: (modeId: UUID) => Promise<Mode[]>;
  [CHANNELS.activateMode]: (modeId: UUID) => Promise<Mode[]>;
  [CHANNELS.deleteResult]: (resultId: UUID) => Promise<Result[]>;
  [CHANNELS.addExample]: (promptId: UUID, example: ExampleBase) => void;
  [CHANNELS.fetchAllResults]: () => Promise<Result[]>;
  [CHANNELS.fetchAllVoiceModels]: () => Promise<VoiceModel[]>;
  [CHANNELS.fetchAllLanguageModels]: () => Promise<LanguageModel[]>;
  [CHANNELS.fetchAllTextReplacements]: () => Promise<TextReplacement[]>;
  [CHANNELS.createTextReplacement]: (
    textReplacement: TextReplacementBase,
  ) => void;
  [CHANNELS.deleteTextReplacement]: (textReplacementId: UUID) => void;
  [CHANNELS.setDevice]: (device: Device) => void;
  [CHANNELS.fetchAllDevices]: () => Promise<Device[]>;
};

export type ChannelType = keyof ChannelFunctionTypeMap;
export type ChannelFunctionType<C extends ChannelType> =
  ChannelFunctionTypeMap[C];

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
      setDevice: ChannelFunctionTypeMap[CHANNELS.setDevice];
      fetchAllDevices: ChannelFunctionTypeMap[CHANNELS.fetchAllDevices];
    };
    database: {
      modes: {
        fetchAllModes: ChannelFunctionTypeMap[CHANNELS.fetchAllModes];
        createMode: ChannelFunctionTypeMap[CHANNELS.createMode];
        updateMode: ChannelFunctionTypeMap[CHANNELS.updateMode];
        deleteMode: ChannelFunctionTypeMap[CHANNELS.deleteMode];
        activateMode: ChannelFunctionTypeMap[CHANNELS.activateMode];
      };
      results: {
        fetchAllResults: ChannelFunctionTypeMap[CHANNELS.fetchAllResults];
        deleteResult: ChannelFunctionTypeMap[CHANNELS.deleteResult];
      };
      examples: {
        addExample: ChannelFunctionTypeMap[CHANNELS.addExample];
      };
      textReplacements: {
        fetchAllTextReplacements: ChannelFunctionTypeMap[CHANNELS.fetchAllTextReplacements];
        requestAll: () => void;
        onReceiveTextReplacements: (
          callback: (textReplacements: TextReplacement[]) => void,
        ) => () => void;
        createTextReplacement: ChannelFunctionTypeMap[CHANNELS.createTextReplacement];
        deleteTextReplacement: ChannelFunctionTypeMap[CHANNELS.deleteTextReplacement];
      };
      voiceModels: {
        requestAll: () => void;
        onReceiveVoiceModels: (
          callback: (voiceModels: VoiceModel[]) => void,
        ) => () => void;
        fetchAllVoiceModels: ChannelFunctionTypeMap[CHANNELS.fetchAllVoiceModels];
      };
      languageModels: {
        requestAll: () => void;
        onReceiveLanguageModels: (
          callback: (languageModels: LanguageModel[]) => void,
        ) => () => void;
        fetchAllLanguageModels: ChannelFunctionTypeMap[CHANNELS.fetchAllLanguageModels];
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

export const CHANNELS_old = {
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

// Python service events for IPC communication
export enum PYTHON_SERVICE_EVENTS {
  MODELS_READY = "models-ready",
  ERROR = "error",
  AUDIO_LEVEL = "audio-level",
  STATUS_UPDATE = "status-update",
  MODES = "modes",
  RESULT = "result",
}

// Define the mapping between event names and their payload types
export type PythonEventMap = {
  [PYTHON_SERVICE_EVENTS.MODELS_READY]: void;
  [PYTHON_SERVICE_EVENTS.ERROR]: Error;
  [PYTHON_SERVICE_EVENTS.AUDIO_LEVEL]: number;
  [PYTHON_SERVICE_EVENTS.STATUS_UPDATE]: ControllerStatusType;
  [PYTHON_SERVICE_EVENTS.MODES]: Mode[];
  [PYTHON_SERVICE_EVENTS.RESULT]: Result;
};
