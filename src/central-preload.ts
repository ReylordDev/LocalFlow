// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { CHANNEL_NAMES, CHANNELS } from "./lib/models/channels";
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
      return ipcRenderer.invoke(CHANNELS.SETTINGS.GET);
    },
    disableShortcut: async (shortcut) => {
      return ipcRenderer.send(CHANNELS.SETTINGS.DISABLE_SHORTCUT, shortcut);
    },
    setAudio(audioConfig) {
      return ipcRenderer.send(CHANNELS.SETTINGS.SET_AUDIO, audioConfig);
    },
    setKeyboard(keyboardConfig) {
      return ipcRenderer.send(CHANNELS.SETTINGS.SET_KEYBOARD, keyboardConfig);
    },
    setApplication(applicationConfig) {
      return ipcRenderer.send(
        CHANNELS.SETTINGS.SET_APPLICATION,
        applicationConfig,
      );
    },
    onSettingsChanged(callback) {
      return genericListener(CHANNELS.SETTINGS.SETTINGS_CHANGED, callback);
    },
    setOutput(outputConfig) {
      return ipcRenderer.send(CHANNELS.SETTINGS.SET_OUTPUT, outputConfig);
    },
    getLocale() {
      return ipcRenderer.invoke(CHANNELS.SETTINGS.GET_LOCALE);
    },
  } satisfies Window["settings"]);
};

export const exposeUrl = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.URL, {
    open: (url) => {
      ipcRenderer.send(CHANNELS.URL.OPEN, url);
    },
  } satisfies Window["url"]);
};

export const exposeDevice = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.DEVICE, {
    requestAll: () => {
      return ipcRenderer.send(CHANNELS.DEVICE.DEVICES_REQUEST);
    },
    onReceiveDevices: (callback) => {
      return genericListener(CHANNELS.DEVICE.DEVICES_RESPONSE, callback);
    },
    set: (device) => {
      return ipcRenderer.send(CHANNELS.DEVICE.SET, device);
    },
  } satisfies Window["device"]);
};

export const exposeDatabase = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.DATABASE, {
    modes: {
      requestAll: () => {
        return ipcRenderer.send(CHANNELS.DATABASE.MODES.MODES_REQUEST);
      },
      onReceiveModes: (callback) =>
        genericListener(CHANNELS.DATABASE.MODES.MODES_RESPONSE, callback),
      createMode: (mode) => {
        return ipcRenderer.send(CHANNELS.DATABASE.MODES.CREATE_MODE, mode);
      },
      updateMode(mode) {
        return ipcRenderer.send(CHANNELS.DATABASE.MODES.UPDATE_MODE, mode);
      },
      deleteMode(modeId) {
        return ipcRenderer.send(CHANNELS.DATABASE.MODES.DELETE_MODE, modeId);
      },
      activateMode(modeId) {
        return ipcRenderer.send(CHANNELS.DATABASE.MODES.ACTIVATE_MODE, modeId);
      },
      onModesUpdate: (callback) =>
        genericListener(CHANNELS.DATABASE.MODES.MODES_UPDATE, callback),
    },
    textReplacements: {
      requestAll: () => {
        ipcRenderer.send(
          CHANNELS.DATABASE.TEXT_REPLACEMENTS.TEXT_REPLACEMENTS_REQUEST,
        );
      },
      onReceiveTextReplacements: (callback) =>
        genericListener(
          CHANNELS.DATABASE.TEXT_REPLACEMENTS.TEXT_REPLACEMENTS_RESPONSE,
          callback,
        ),
      createTextReplacement: (textReplacement) => {
        ipcRenderer.send(
          CHANNELS.DATABASE.TEXT_REPLACEMENTS.CREATE_TEXT_REPLACEMENT,
          textReplacement,
        );
      },
      deleteTextReplacement: (textReplacementId) => {
        ipcRenderer.send(
          CHANNELS.DATABASE.TEXT_REPLACEMENTS.DELETE_TEXT_REPLACEMENT,
          textReplacementId,
        );
      },
    },
    results: {
      deleteResult(resultId) {
        return ipcRenderer.send(
          CHANNELS.DATABASE.RESULTS.DELETE_RESULT,
          resultId,
        );
      },
    },
    examples: {
      addExample(promptId, example) {
        return ipcRenderer.send(
          CHANNELS.DATABASE.EXAMPLES.ADD_EXAMPLE,
          promptId,
          example,
        );
      },
    },
    voiceModels: {
      requestAll: () => {
        return ipcRenderer.send(
          CHANNELS.DATABASE.VOICE_MODELS.VOICE_MODELS_REQUEST,
        );
      },
      onReceiveVoiceModels: (callback) =>
        genericListener(
          CHANNELS.DATABASE.VOICE_MODELS.VOICE_MODELS_RESPONSE,
          callback,
        ),
    },
    languageModels: {
      requestAll: () => {
        return ipcRenderer.send(
          CHANNELS.DATABASE.LANGUAGE_MODELS.LANGUAGE_MODELS_REQUEST,
        );
      },
      onReceiveLanguageModels: (callback) =>
        genericListener(
          CHANNELS.DATABASE.LANGUAGE_MODELS.LANGUAGE_MODELS_RESPONSE,
          callback,
        ),
    },
  } satisfies Window["database"]);
};

export const exposeMini = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.MINI, {
    requestAudioLevel: async () => {
      return ipcRenderer.send(CHANNELS.MINI.AUDIO_LEVEL_REQUEST);
    },
    onReceiveAudioLevel: (callback) =>
      genericListener(CHANNELS.MINI.AUDIO_LEVEL_RESPONSE, callback),
    onStatusUpdate: (callback) =>
      genericListener(CHANNELS.MINI.STATUS_UPDATE, callback),
    onResult: (callback) => genericListener(CHANNELS.MINI.RESULT, callback),
    onChangeModeShortcutPressed: (callback) =>
      genericListener(CHANNELS.MINI.CHANGE_MODE_SHORTCUT_PRESSED, callback),
    setMainContentHeight: (height: number) => {
      ipcRenderer.send(CHANNELS.MINI.SET_MAIN_CONTENT_HEIGHT, height);
    },
    onTranscription: (callback) =>
      genericListener(CHANNELS.MINI.TRANSCRIPTION, callback),
  } satisfies Window["mini"]);
};

export const exposeRecordingHistory = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.RECORDING_HISTORY, {
    openWindow: () => {
      ipcRenderer.send(CHANNELS.RECORDING_HISTORY.OPEN_WINDOW);
    },
    requestAll() {
      return ipcRenderer.send(CHANNELS.RECORDING_HISTORY.RESULTS_REQUEST);
    },
    onReceiveResults: (callback) =>
      genericListener(CHANNELS.RECORDING_HISTORY.RESULTS_RESPONSE, callback),
  } satisfies Window["recordingHistory"]);
};

export const exposeClipboard = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.CLIPBOARD, {
    copy: (text: string) => {
      ipcRenderer.send(CHANNELS.CLIPBOARD.COPY, text);
    },
  } satisfies Window["clipboard"]);
};

export const exposeFile = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.FILE, {
    open: (location) => {
      ipcRenderer.send(CHANNELS.FILE.OPEN, location);
    },
  } satisfies Window["file"]);
};
