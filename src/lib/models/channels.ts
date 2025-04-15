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

/**
 * Enum representing IPC channels for communication between the Electron Processes and the Python Backend
 */
export enum PythonChannels {
  // Mode channels
  fetchAllModes = "database:modes:getAll",
  createMode = "database:modes:createMode",
  updateMode = "database:modes:updateMode",
  deleteMode = "database:modes:deleteMode",
  activateMode = "database:modes:activateMode",

  // Result channels
  fetchAllResults = "database:results:getAll",
  deleteResult = "database:results:deleteResult",

  // Example channels
  addExample = "database:examples:addExample",

  // VoiceModel channels
  fetchAllVoiceModels = "database:voiceModels:getAll",

  // LanguageModel channels
  fetchAllLanguageModels = "database:languageModels:getAll",

  // TextReplacement channels
  fetchAllTextReplacements = "database:textReplacements:getAll",
  createTextReplacement = "database:textReplacements:create",
  deleteTextReplacement = "database:textReplacements:delete",

  // Device channels
  fetchAllDevices = "device:getAll",
  setDevice = "device:set",
}

/**
 * Map the Python IPC channels to their respective function type.
 * This is used to define the functions that will be called when a channel is invoked.
 */
type PythonChannelMap = {
  // Mode channels
  [PythonChannels.fetchAllModes]: () => Promise<Mode[]>;
  [PythonChannels.createMode]: (mode: ModeCreate) => Promise<Mode[]>;
  [PythonChannels.updateMode]: (mode: ModeUpdate) => Promise<Mode[]>;
  [PythonChannels.deleteMode]: (modeId: UUID) => Promise<Mode[]>;
  [PythonChannels.activateMode]: (modeId: UUID) => Promise<Mode[]>;

  // Result channels
  [PythonChannels.fetchAllResults]: () => Promise<Result[]>;
  [PythonChannels.deleteResult]: (resultId: UUID) => Promise<Result[]>;

  // Example channels
  [PythonChannels.addExample]: (promptId: UUID, example: ExampleBase) => void;

  // VoiceModel channels
  [PythonChannels.fetchAllVoiceModels]: () => Promise<VoiceModel[]>;

  // LanguageModel channels
  [PythonChannels.fetchAllLanguageModels]: () => Promise<LanguageModel[]>;

  // TextReplacement channels
  [PythonChannels.fetchAllTextReplacements]: () => Promise<TextReplacement[]>;
  [PythonChannels.createTextReplacement]: (
    textReplacement: TextReplacementBase,
  ) => void;
  [PythonChannels.deleteTextReplacement]: (textReplacementId: UUID) => void;

  // Device channels
  [PythonChannels.fetchAllDevices]: () => Promise<Device[]>;
  [PythonChannels.setDevice]: (device: Device) => void;
};

export type PythonChannel = keyof PythonChannelMap;
export type PythonChannelFunction<C extends PythonChannel> =
  PythonChannelMap[C];

/**
 * Enum representing IPC channels for intra-Electron communication between the main and renderer processes.
 */
export enum ElectronChannels {
  // Settings channels
  getAllSettings = "settings:get-all",
  disableShortcut = "settings:disable-shortcut",
  setAudio = "settings:set-audio",
  setKeyboard = "settings:set-keyboard",
  setApplication = "settings:set-application",
  setOutput = "settings:set-output",
  onSettingsChanged = "settings:changed",
  getLocale = "settings:get-locale",

  // URL channels
  openURL = "url:open",

  // Mini channels
  requestAudioLevel = "mini:requestAudioLevel",
  onReceiveAudioLevel = "mini:receiveAudioLevel",
  onStatusUpdate = "mini:status-update",
  onResult = "mini:result",
  onTranscription = "mini:transcription",
  onChangeModeShortcutPressed = "mini:change-mode-shortcut-pressed",
  setMainContentHeight = "mini:setMainContentHeight",

  // Recording History channels
  openHistoryWindow = "recordingHistory:openWindow",

  // Clipboard channels
  copy = "clipboard:copy",

  // File channels
  openFile = "file:open",
}

/**
 * Map the Electron IPC channels to their respective function type.
 * This is used to define the functions that will be called when a channel is invoked.
 */
type ElectronChannelMap = {
  // Settings channels
  [ElectronChannels.getAllSettings]: () => Promise<AppSettings>;
  [ElectronChannels.disableShortcut]: (shortcut: string) => void;
  [ElectronChannels.setAudio]: (audioConfig: AudioConfig) => void;
  [ElectronChannels.setKeyboard]: (keyboardConfig: KeyboardConfig) => void;
  [ElectronChannels.setApplication]: (
    applicationConfig: ApplicationConfig,
  ) => void;
  [ElectronChannels.setOutput]: (outputConfig: OutputConfig) => void;
  [ElectronChannels.onSettingsChanged]: (
    callback: (settings: AppSettings) => void,
  ) => () => void;
  [ElectronChannels.getLocale]: () => Promise<string>;

  // URL channels
  [ElectronChannels.openURL]: (url: string) => void;

  // Mini channels
  [ElectronChannels.requestAudioLevel]: () => void;
  [ElectronChannels.onReceiveAudioLevel]: (
    callback: (audioLevel: number) => void,
  ) => () => void;
  [ElectronChannels.onStatusUpdate]: (
    callback: (status: ControllerStatusType) => void,
  ) => () => void;
  [ElectronChannels.onResult]: (
    callback: (result: Result) => void,
  ) => () => void;
  [ElectronChannels.onTranscription]: (
    callback: (transcription: string) => void,
  ) => () => void;
  [ElectronChannels.onChangeModeShortcutPressed]: (
    callback: (shortcut: string) => void,
  ) => () => void;
  [ElectronChannels.setMainContentHeight]: (height: number) => void;

  // Recording History channels
  [ElectronChannels.openHistoryWindow]: () => void;

  // Clipboard channels
  [ElectronChannels.copy]: (text: string) => void;

  // File channels
  [ElectronChannels.openFile]: (path: string) => void;
};

export type ElectronChannel = keyof ElectronChannelMap;
export type ElectronChannelFunction<C extends ElectronChannel> =
  ElectronChannelMap[C];

export type Channel = PythonChannel | ElectronChannel;
export type ChannelFunction<C extends Channel> = C extends PythonChannel
  ? PythonChannelFunction<C>
  : C extends ElectronChannel
    ? ElectronChannelFunction<C>
    : never;

declare global {
  interface Window {
    settings: {
      getAll: ChannelFunction<ElectronChannels.getAllSettings>;
      disableShortcut: ChannelFunction<ElectronChannels.disableShortcut>;
      setAudio: ChannelFunction<ElectronChannels.setAudio>;
      setKeyboard: ChannelFunction<ElectronChannels.setKeyboard>;
      setApplication: ChannelFunction<ElectronChannels.setApplication>;
      setOutput: ChannelFunction<ElectronChannels.setOutput>;
      onSettingsChanged: ChannelFunction<ElectronChannels.onSettingsChanged>;
      getLocale: ChannelFunction<ElectronChannels.getLocale>;
    };
    url: {
      open: ChannelFunction<ElectronChannels.openURL>;
    };
    mini: {
      requestAudioLevel: ChannelFunction<ElectronChannels.requestAudioLevel>;
      onReceiveAudioLevel: ChannelFunction<ElectronChannels.onReceiveAudioLevel>;
      onStatusUpdate: ChannelFunction<ElectronChannels.onStatusUpdate>;
      onResult: ChannelFunction<ElectronChannels.onResult>;
      onTranscription: ChannelFunction<ElectronChannels.onTranscription>;
      onChangeModeShortcutPressed: ChannelFunction<ElectronChannels.onChangeModeShortcutPressed>;
      setMainContentHeight: ChannelFunction<ElectronChannels.setMainContentHeight>;
    };
    device: {
      setDevice: ChannelFunction<PythonChannels.setDevice>;
      fetchAllDevices: ChannelFunction<PythonChannels.fetchAllDevices>;
    };
    database: {
      modes: {
        fetchAllModes: ChannelFunction<PythonChannels.fetchAllModes>;
        createMode: ChannelFunction<PythonChannels.createMode>;
        updateMode: ChannelFunction<PythonChannels.updateMode>;
        deleteMode: ChannelFunction<PythonChannels.deleteMode>;
        activateMode: ChannelFunction<PythonChannels.activateMode>;
      };
      results: {
        fetchAllResults: ChannelFunction<PythonChannels.fetchAllResults>;
        deleteResult: ChannelFunction<PythonChannels.deleteResult>;
      };
      examples: {
        addExample: ChannelFunction<PythonChannels.addExample>;
      };
      textReplacements: {
        fetchAllTextReplacements: ChannelFunction<PythonChannels.fetchAllTextReplacements>;
        createTextReplacement: ChannelFunction<PythonChannels.createTextReplacement>;
        deleteTextReplacement: ChannelFunction<PythonChannels.deleteTextReplacement>;
      };
      voiceModels: {
        fetchAllVoiceModels: ChannelFunction<PythonChannels.fetchAllVoiceModels>;
      };
      languageModels: {
        fetchAllLanguageModels: ChannelFunction<PythonChannels.fetchAllLanguageModels>;
      };
    };
    historyWindow: {
      openWindow: ChannelFunction<ElectronChannels.openHistoryWindow>;
    };
    clipboard: {
      copy: ChannelFunction<ElectronChannels.copy>;
    };
    file: {
      open: ChannelFunction<ElectronChannels.openFile>;
    };
  }
}

export const ChannelNames = {
  SETTINGS: "settings",
  URL: "url",
  MINI: "mini",
  DEVICE: "device",
  DATABASE: "database",
  HISTORY_WINDOW: "historyWindow",
  CLIPBOARD: "clipboard",
  FILE: "file",
};

// Python service events for IPC communication
export enum PythonEvents {
  MODELS_READY = "models-ready",
  ERROR = "error",
  AUDIO_LEVEL = "audio-level",
  STATUS_UPDATE = "status-update",
  MODES = "modes",
  RESULT = "result",
  TRANSCRIPTION = "transcription",
}

// Define the mapping between event names and their payload types
export type PythonEventMap = {
  [PythonEvents.MODELS_READY]: void;
  [PythonEvents.ERROR]: Error;
  [PythonEvents.AUDIO_LEVEL]: number;
  [PythonEvents.STATUS_UPDATE]: ControllerStatusType;
  [PythonEvents.MODES]: Mode[];
  [PythonEvents.RESULT]: Result;
  [PythonEvents.TRANSCRIPTION]: string;
};
