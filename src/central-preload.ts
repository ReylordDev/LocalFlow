// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  ChannelNames,
  PythonChannels,
  Channel,
  ChannelFunction,
  ElectronChannels,
} from "./lib/models/channels";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

/**
 * Invokes an IPC channel and returns the result.
 *
 * This function uses electron's ipcRenderer.invoke to send a message to the main process
 * and returns a promised response. The function is type-safe, ensuring that the arguments and return type
 * match the channel's expected types.
 *
 * @param channel - The IPC channel to invoke
 * @param args - Arguments to pass along the channel
 * @returns A promise that resolves with the result from the main process
 */
function invoke<C extends Channel>(
  channel: C,
  ...args: Parameters<ChannelFunction<C>>
): ReturnType<ChannelFunction<C>> {
  return ipcRenderer.invoke(channel, ...args) as ReturnType<ChannelFunction<C>>;
}

/**
 * Sends a message from the renderer process to the main process via the specified IPC channel.
 *
 * This function does not expect a response from the main process.
 *
 * @param channel - The IPC channel to send the message through.
 * @param args - The arguments to pass with the message, typed according to the channel.
 * @returns void
 */
function send<C extends Channel>(
  channel: C,
  ...args: Parameters<ChannelFunction<C>>
): void {
  ipcRenderer.send(channel, ...args);
}

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
  contextBridge.exposeInMainWorld(ChannelNames.SETTINGS, {
    getAll: async () => invoke(ElectronChannels.getAllSettings),
    disableShortcut: async (shortcut) =>
      send(ElectronChannels.disableShortcut, shortcut),
    setAudio: (audioConfig) => send(ElectronChannels.setAudio, audioConfig),
    setKeyboard: (keyboardConfig) =>
      send(ElectronChannels.setKeyboard, keyboardConfig),
    setApplication: (applicationConfig) =>
      send(ElectronChannels.setApplication, applicationConfig),
    onSettingsChanged: (callback) =>
      genericListener(ElectronChannels.onSettingsChanged, callback),
    setOutput: (outputConfig) => send(ElectronChannels.setOutput, outputConfig),
    getLocale: async () => invoke(ElectronChannels.getLocale),
  } satisfies Window["settings"]);
};

export const exposeUrl = () => {
  contextBridge.exposeInMainWorld(ChannelNames.URL, {
    open: (url) => send(ElectronChannels.openURL, url),
  } satisfies Window["url"]);
};

export const exposeDevice = () => {
  contextBridge.exposeInMainWorld(ChannelNames.DEVICE, {
    setDevice: (device) => invoke(PythonChannels.setDevice, device),
    fetchAllDevices: () => invoke(PythonChannels.fetchAllDevices),
  } satisfies Window["device"]);
};

export const exposeDatabase = () => {
  contextBridge.exposeInMainWorld(ChannelNames.DATABASE, {
    modes: {
      fetchAllModes: () => invoke(PythonChannels.fetchAllModes),
      createMode: (modeCreate) => invoke(PythonChannels.createMode, modeCreate),
      updateMode: (mode) => invoke(PythonChannels.updateMode, mode),
      deleteMode: (modeId) => invoke(PythonChannels.deleteMode, modeId),
      activateMode: (modeId) => invoke(PythonChannels.activateMode, modeId),
    },
    textReplacements: {
      fetchAllTextReplacements: () =>
        invoke(PythonChannels.fetchAllTextReplacements),
      createTextReplacement: (textReplacement) =>
        invoke(PythonChannels.createTextReplacement, textReplacement),
      deleteTextReplacement: (textReplacementId) =>
        invoke(PythonChannels.deleteTextReplacement, textReplacementId),
    },
    results: {
      deleteResult: (resultId) => invoke(PythonChannels.deleteResult, resultId),
      fetchAllResults: () => invoke(PythonChannels.fetchAllResults),
    },
    examples: {
      addExample: (promptId, example) =>
        invoke(PythonChannels.addExample, promptId, example),
    },
    voiceModels: {
      fetchAllVoiceModels: () => invoke(PythonChannels.fetchAllVoiceModels),
    },
    languageModels: {
      fetchAllLanguageModels: () =>
        invoke(PythonChannels.fetchAllLanguageModels),
    },
  } satisfies Window["database"]);
};

export const exposeMini = () => {
  contextBridge.exposeInMainWorld(ChannelNames.MINI, {
    requestAudioLevel: async () => send(ElectronChannels.requestAudioLevel),
    onReceiveAudioLevel: (callback) =>
      genericListener(ElectronChannels.onReceiveAudioLevel, callback),
    onStatusUpdate: (callback) =>
      genericListener(ElectronChannels.onStatusUpdate, callback),
    onResult: (callback) =>
      genericListener(ElectronChannels.onResult, callback),
    onChangeModeShortcutPressed: (callback) =>
      genericListener(ElectronChannels.onChangeModeShortcutPressed, callback),
    setMainContentHeight: (height: number) =>
      send(ElectronChannels.setMainContentHeight, height),
    onTranscription: (callback) =>
      genericListener(ElectronChannels.onTranscription, callback),
  } satisfies Window["mini"]);
};

export const exposeRecordingHistory = () => {
  contextBridge.exposeInMainWorld(ChannelNames.HISTORY_WINDOW, {
    openWindow: () => send(ElectronChannels.openHistoryWindow),
  } satisfies Window["historyWindow"]);
};

export const exposeClipboard = () => {
  contextBridge.exposeInMainWorld(ChannelNames.CLIPBOARD, {
    copy: (text: string) => send(ElectronChannels.copy, text),
  } satisfies Window["clipboard"]);
};

export const exposeFile = () => {
  contextBridge.exposeInMainWorld(ChannelNames.FILE, {
    open: (location) => send(ElectronChannels.openFile, location),
  } satisfies Window["file"]);
};
