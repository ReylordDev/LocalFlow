// IPC channel constants for communication between renderer and main processes

declare global {
  interface Window {
    controller: {
      toggleRecording: () => void;
    };
    settings: {
      getAll: () => Promise<import("./settings").AppSettings>;
      disableShortcut: (shortcut: string) => void;
      setAudio: (audioConfig: import("./settings").AudioConfig) => void;
      setKeyboard: (
        keyboardConfig: import("./settings").KeyboardConfig,
      ) => void;
      setApplication: (
        applicationConfig: import("./settings").ApplicationConfig,
      ) => void;
      setOutput: (outputConfig: import("./settings").OutputConfig) => void;
      onSettingsChanged: (
        callback: (settings: import("./settings").AppSettings) => void,
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
        callback: (status: import("./database").ControllerStatusType) => void,
      ) => () => void;
      onResult: (
        callback: (result: import("./database").Result) => void,
      ) => () => void;
      onTranscription(callback: (transcription: string) => void): () => void;
      onChangeModeShortcutPressed: (callback: () => void) => () => void;
      setMainContentHeight: (height: number) => void;
    };
    device: {
      requestAll: () => void;
      onReceiveDevices: (
        callback: (devices: import("./database").Device[]) => void,
      ) => () => void;
      set: (device: import("./database").Device) => void;
    };
    database: {
      modes: {
        requestAll: () => void;
        onReceiveModes: (
          callback: (modes: import("./database").Mode[]) => void,
        ) => () => void;
        createMode: (mode: import("./database").ModeCreate) => void;
        updateMode: (mode: import("./database").ModeUpdate) => void;
        deleteMode: (modeId: import("crypto").UUID) => void;
        onModesUpdate: (
          callback: (modes: import("./database").Mode[]) => void,
        ) => () => void;
        activateMode: (modeId: import("crypto").UUID) => void;
      };
      results: {
        deleteResult: (resultId: import("crypto").UUID) => void;
      };
      examples: {
        addExample: (
          promptId: import("crypto").UUID,
          example: import("./database").ExampleBase,
        ) => void;
      };
      textReplacements: {
        requestAll: () => void;
        onReceiveTextReplacements: (
          callback: (
            textReplacements: import("./database").TextReplacement[],
          ) => void,
        ) => () => void;
        createTextReplacement: (
          textReplacement: import("./database").TextReplacementBase,
        ) => void;
        deleteTextReplacement: (
          textReplacementId: import("crypto").UUID,
        ) => void;
      };
      voiceModels: {
        requestAll: () => void;
        onReceiveVoiceModels: (
          callback: (voiceModels: import("./database").VoiceModel[]) => void,
        ) => () => void;
      };
      languageModels: {
        requestAll: () => void;
        onReceiveLanguageModels: (
          callback: (
            languageModels: import("./database").LanguageModel[],
          ) => void,
        ) => () => void;
      };
    };
    recordingHistory: {
      openWindow: () => void;
      requestAll: () => void;
      onReceiveResults: (
        callback: (results: import("./database").Result[]) => void,
      ) => () => void;
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

// Python service events for IPC communication
export enum PYTHON_SERVICE_EVENTS {
  MODELS_READY = "models-ready",
  ERROR = "error",
  TRANSCRIPTION = "transcription",
  AUDIO_LEVEL = "audio-level",
  DEVICES = "devices",
  STATUS_UPDATE = "status-update",
  MODES_UPDATE = "modes-update",
  MODES = "modes",
  RESULT = "result",
  RESULTS = "results",
  VOICE_MODELS = "voice-models",
  LANGUAGE_MODELS = "language-models",
  TEXT_REPLACEMENTS = "text-replacements",
}

// Define the mapping between event names and their payload types
export type PythonEventMap = {
  [PYTHON_SERVICE_EVENTS.MODELS_READY]: void;
  [PYTHON_SERVICE_EVENTS.ERROR]: Error;
  [PYTHON_SERVICE_EVENTS.TRANSCRIPTION]: string;
  [PYTHON_SERVICE_EVENTS.AUDIO_LEVEL]: number;
  [PYTHON_SERVICE_EVENTS.DEVICES]: import("./database").Device[];
  [PYTHON_SERVICE_EVENTS.STATUS_UPDATE]: import("./database").ControllerStatusType;
  [PYTHON_SERVICE_EVENTS.MODES_UPDATE]: import("./database").Mode[];
  [PYTHON_SERVICE_EVENTS.MODES]: import("./database").Mode[];
  [PYTHON_SERVICE_EVENTS.RESULT]: import("./database").Result;
  [PYTHON_SERVICE_EVENTS.RESULTS]: import("./database").Result[];
  [PYTHON_SERVICE_EVENTS.VOICE_MODELS]: import("./database").VoiceModel[];
  [PYTHON_SERVICE_EVENTS.LANGUAGE_MODELS]: import("./database").LanguageModel[];
  [PYTHON_SERVICE_EVENTS.TEXT_REPLACEMENTS]: import("./database").TextReplacement[];
};
