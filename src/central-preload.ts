// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  CHANNEL_NAMES,
  ChannelFunctionTypeMap,
  CHANNELS_old,
  CHANNELS,
} from "./lib/models/channels";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

// What about there is no arg?
function genericListener<T>(channel: string, callback: (arg: T) => void) {
  const listener = (_: IpcRendererEvent, arg: T) => {
    callback(arg);
  };
  ipcRenderer.on(channel, listener);
  return () => {
    ipcRenderer.off(channel, listener);
  };
}

export const exposeSettings = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.SETTINGS, {
    getAll: async () => {
      return ipcRenderer.invoke(CHANNELS_old.SETTINGS.GET);
    },
    disableShortcut: async (shortcut) => {
      return ipcRenderer.send(CHANNELS_old.SETTINGS.DISABLE_SHORTCUT, shortcut);
    },
    setAudio(audioConfig) {
      return ipcRenderer.send(CHANNELS_old.SETTINGS.SET_AUDIO, audioConfig);
    },
    setKeyboard(keyboardConfig) {
      return ipcRenderer.send(
        CHANNELS_old.SETTINGS.SET_KEYBOARD,
        keyboardConfig,
      );
    },
    setApplication(applicationConfig) {
      return ipcRenderer.send(
        CHANNELS_old.SETTINGS.SET_APPLICATION,
        applicationConfig,
      );
    },
    onSettingsChanged(callback) {
      return genericListener(CHANNELS_old.SETTINGS.SETTINGS_CHANGED, callback);
    },
    setOutput(outputConfig) {
      return ipcRenderer.send(CHANNELS_old.SETTINGS.SET_OUTPUT, outputConfig);
    },
    getLocale() {
      return ipcRenderer.invoke(CHANNELS_old.SETTINGS.GET_LOCALE);
    },
  } satisfies Window["settings"]);
};

export const exposeUrl = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.URL, {
    open: (url) => {
      ipcRenderer.send(CHANNELS_old.URL.OPEN, url);
    },
  } satisfies Window["url"]);
};

export const exposeDevice = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.DEVICE, {
    setDevice: (device) => invoke(CHANNELS.setDevice, device),
    fetchAllDevices: () => invoke(CHANNELS.fetchAllDevices),
  } satisfies Window["device"]);
};

function invoke<C extends keyof ChannelFunctionTypeMap>(
  channel: C,
  ...args: Parameters<ChannelFunctionTypeMap[C]>
): ReturnType<ChannelFunctionTypeMap[C]> {
  return ipcRenderer.invoke(channel, ...args) as ReturnType<
    ChannelFunctionTypeMap[C]
  >;
}

export const exposeDatabase = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.DATABASE, {
    modes: {
      fetchAllModes: () => invoke(CHANNELS.fetchAllModes),
      createMode: (modeCreate) => invoke(CHANNELS.createMode, modeCreate),
      updateMode: (mode) => invoke(CHANNELS.updateMode, mode),
      deleteMode: (modeId) => invoke(CHANNELS.deleteMode, modeId),
      activateMode: (modeId) => invoke(CHANNELS.activateMode, modeId),
    },
    textReplacements: {
      fetchAllTextReplacements: () => invoke(CHANNELS.fetchAllTextReplacements),
      createTextReplacement: (textReplacement) =>
        invoke(CHANNELS.createTextReplacement, textReplacement),
      deleteTextReplacement: (textReplacementId) =>
        invoke(CHANNELS.deleteTextReplacement, textReplacementId),
    },
    results: {
      deleteResult: (resultId) => invoke(CHANNELS.deleteResult, resultId),
      fetchAllResults: () => invoke(CHANNELS.fetchAllResults),
    },
    examples: {
      addExample(promptId, example) {
        return invoke(CHANNELS.addExample, promptId, example);
      },
    },
    voiceModels: {
      fetchAllVoiceModels: () => invoke(CHANNELS.fetchAllVoiceModels),
    },
    languageModels: {
      fetchAllLanguageModels: () => invoke(CHANNELS.fetchAllLanguageModels),
    },
  } satisfies Window["database"]);
};

export const exposeMini = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.MINI, {
    requestAudioLevel: async () => {
      return ipcRenderer.send(CHANNELS_old.MINI.AUDIO_LEVEL_REQUEST);
    },
    onReceiveAudioLevel: (callback) =>
      genericListener(CHANNELS_old.MINI.AUDIO_LEVEL_RESPONSE, callback),
    onStatusUpdate: (callback) =>
      genericListener(CHANNELS_old.MINI.STATUS_UPDATE, callback),
    onResult: (callback) => genericListener(CHANNELS_old.MINI.RESULT, callback),
    onChangeModeShortcutPressed: (callback) =>
      genericListener(CHANNELS_old.MINI.CHANGE_MODE_SHORTCUT_PRESSED, callback),
    setMainContentHeight: (height: number) => {
      ipcRenderer.send(CHANNELS_old.MINI.SET_MAIN_CONTENT_HEIGHT, height);
    },
    onTranscription: (callback) =>
      genericListener(CHANNELS_old.MINI.TRANSCRIPTION, callback),
  } satisfies Window["mini"]);
};

export const exposeRecordingHistory = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.RECORDING_HISTORY, {
    openWindow: () => {
      ipcRenderer.send(CHANNELS_old.RECORDING_HISTORY.OPEN_WINDOW);
    },
    requestAll() {
      return ipcRenderer.send(CHANNELS_old.RECORDING_HISTORY.RESULTS_REQUEST);
    },
    onReceiveResults: (callback) =>
      genericListener(
        CHANNELS_old.RECORDING_HISTORY.RESULTS_RESPONSE,
        callback,
      ),
  } satisfies Window["recordingHistory"]);
};

export const exposeClipboard = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.CLIPBOARD, {
    copy: (text: string) => {
      ipcRenderer.send(CHANNELS_old.CLIPBOARD.COPY, text);
    },
  } satisfies Window["clipboard"]);
};

export const exposeFile = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.FILE, {
    open: (location) => {
      ipcRenderer.send(CHANNELS_old.FILE.OPEN, location);
    },
  } satisfies Window["file"]);
};
