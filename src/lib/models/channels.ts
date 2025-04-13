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

type PythonChannelMap = {
  // Mode channels
  [PythonChannels.fetchAllModes]: () => Promise<Mode[]>;
  [PythonChannels.createMode]: (mode: ModeCreate) => Promise<Mode[]>;
  [PythonChannels.updateMode]: (mode: ModeUpdate) => Promise<Mode[]>;
  [PythonChannels.deleteMode]: (modeId: UUID) => Promise<Mode[]>;
  [PythonChannels.activateMode]: (modeId: UUID) => Promise<Mode[]>;

  // Result channels
  [PythonChannels.deleteResult]: (resultId: UUID) => Promise<Result[]>;
  [PythonChannels.fetchAllResults]: () => Promise<Result[]>;

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

  // Controller channels
  toggleRecording = "controller:toggle-recording",

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

  // Controller channels
  [ElectronChannels.toggleRecording]: () => void;

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
    controller: {
      toggleRecording: ElectronChannelMap[ElectronChannels.toggleRecording];
    };
    settings: {
      getAll: ElectronChannelMap[ElectronChannels.getAllSettings];
      disableShortcut: ElectronChannelMap[ElectronChannels.disableShortcut];
      setAudio: ElectronChannelMap[ElectronChannels.setAudio];
      setKeyboard: ElectronChannelMap[ElectronChannels.setKeyboard];
      setApplication: ElectronChannelMap[ElectronChannels.setApplication];
      setOutput: ElectronChannelMap[ElectronChannels.setOutput];
      onSettingsChanged: ElectronChannelMap[ElectronChannels.onSettingsChanged];
      getLocale: ElectronChannelMap[ElectronChannels.getLocale];
    };
    url: {
      open: ElectronChannelMap[ElectronChannels.openURL];
    };
    mini: {
      requestAudioLevel: ElectronChannelMap[ElectronChannels.requestAudioLevel];
      onReceiveAudioLevel: ElectronChannelMap[ElectronChannels.onReceiveAudioLevel];
      onStatusUpdate: ElectronChannelMap[ElectronChannels.onStatusUpdate];
      onResult: ElectronChannelMap[ElectronChannels.onResult];
      onTranscription: ElectronChannelMap[ElectronChannels.onTranscription];
      onChangeModeShortcutPressed: ElectronChannelMap[ElectronChannels.onChangeModeShortcutPressed];
      setMainContentHeight: ElectronChannelMap[ElectronChannels.setMainContentHeight];
    };
    device: {
      setDevice: PythonChannelMap[PythonChannels.setDevice];
      fetchAllDevices: PythonChannelMap[PythonChannels.fetchAllDevices];
    };
    database: {
      modes: {
        fetchAllModes: PythonChannelMap[PythonChannels.fetchAllModes];
        createMode: PythonChannelMap[PythonChannels.createMode];
        updateMode: PythonChannelMap[PythonChannels.updateMode];
        deleteMode: PythonChannelMap[PythonChannels.deleteMode];
        activateMode: PythonChannelMap[PythonChannels.activateMode];
      };
      results: {
        fetchAllResults: PythonChannelMap[PythonChannels.fetchAllResults];
        deleteResult: PythonChannelMap[PythonChannels.deleteResult];
      };
      examples: {
        addExample: PythonChannelMap[PythonChannels.addExample];
      };
      textReplacements: {
        fetchAllTextReplacements: PythonChannelMap[PythonChannels.fetchAllTextReplacements];
        createTextReplacement: PythonChannelMap[PythonChannels.createTextReplacement];
        deleteTextReplacement: PythonChannelMap[PythonChannels.deleteTextReplacement];
      };
      voiceModels: {
        fetchAllVoiceModels: PythonChannelMap[PythonChannels.fetchAllVoiceModels];
      };
      languageModels: {
        fetchAllLanguageModels: PythonChannelMap[PythonChannels.fetchAllLanguageModels];
      };
    };
    historyWindow: {
      openWindow: ElectronChannelMap[ElectronChannels.openHistoryWindow];
    };
    clipboard: {
      copy: ElectronChannelMap[ElectronChannels.copy];
    };
    file: {
      open: ElectronChannelMap[ElectronChannels.openFile];
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
