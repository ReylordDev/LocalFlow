// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  Device,
  CHANNELS,
  Mode,
  CHANNEL_NAMES,
  AppSettings,
  ControllerStatusType,
  Result,
} from "./lib/models";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

export const exposeController = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.CONTROLLER, {
    toggleRecording: () => {
      ipcRenderer.send(CHANNELS.CONTROLLER.TOGGLE_RECORDING);
    },
  } satisfies Window["controller"]);
};

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
        applicationConfig
      );
    },
    onSettingsChanged(callback) {
      const listener = (_: IpcRendererEvent, settings: AppSettings) => {
        callback(settings);
      };
      ipcRenderer.on(CHANNELS.SETTINGS.SETTINGS_CHANGED, listener);
      return () => {
        ipcRenderer.off(CHANNELS.SETTINGS.SETTINGS_CHANGED, listener);
      };
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
      const listener = (_: IpcRendererEvent, devices: Device[]) => {
        callback(devices);
      };
      ipcRenderer.on(CHANNELS.DEVICE.DEVICES_RESPONSE, listener);
      return () => {
        ipcRenderer.off(CHANNELS.DEVICE.DEVICES_RESPONSE, listener);
      };
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
      onReceiveModes: (callback) => {
        const listener = (_: IpcRendererEvent, modes: Mode[]) => {
          callback(modes);
        };
        ipcRenderer.on(CHANNELS.DATABASE.MODES.MODES_RESPONSE, listener);
        return () => {
          ipcRenderer.off(CHANNELS.DATABASE.MODES.MODES_RESPONSE, listener);
        };
      },
      createMode: (mode) => {
        return ipcRenderer.send(CHANNELS.DATABASE.MODES.CREATE_MODE, mode);
      },
      updateMode(mode) {
        return ipcRenderer.send(CHANNELS.DATABASE.MODES.UPDATE_MODE, mode);
      },
      onModesUpdate(callback) {
        const listener = (_: IpcRendererEvent, modes: Mode[]) => {
          callback(modes);
        };
        ipcRenderer.on(CHANNELS.DATABASE.MODES.MODES_UPDATE, listener);
        return () => {
          ipcRenderer.off(CHANNELS.DATABASE.MODES.MODES_UPDATE, listener);
        };
      },
    },
  } satisfies Window["database"]);
};

export const exposeMini = () => {
  contextBridge.exposeInMainWorld(CHANNEL_NAMES.MINI, {
    requestAudioLevel: async () => {
      return ipcRenderer.send(CHANNELS.MINI.AUDIO_LEVEL_REQUEST);
    },
    onReceiveAudioLevel: (callback) => {
      const listener = (_: IpcRendererEvent, audio_level: number) => {
        callback(audio_level);
      };
      ipcRenderer.on(CHANNELS.MINI.AUDIO_LEVEL_RESPONSE, listener);
      return () => {
        ipcRenderer.off(CHANNELS.MINI.AUDIO_LEVEL_RESPONSE, listener);
      };
    },
    onStatusUpdate: (callback) => {
      const listener = (_: IpcRendererEvent, status: ControllerStatusType) => {
        callback(status);
      };
      ipcRenderer.on(CHANNELS.MINI.STATUS_UPDATE, listener);
      return () => {
        ipcRenderer.off(CHANNELS.MINI.STATUS_UPDATE, listener);
      };
    },
    onResult(callback) {
      const listener = (_: IpcRendererEvent, result: Result) => {
        callback(result);
      };
      ipcRenderer.on(CHANNELS.MINI.RESULT, listener);
      return () => {
        ipcRenderer.off(CHANNELS.MINI.RESULT, listener);
      };
    },
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
    onReceiveResults(callback) {
      const listener = (_: IpcRendererEvent, results: Result[]) => {
        callback(results);
      };
      ipcRenderer.on(CHANNELS.RECORDING_HISTORY.RESULTS_RESPONSE, listener);
      return () => {
        ipcRenderer.off(CHANNELS.RECORDING_HISTORY.RESULTS_RESPONSE, listener);
      };
    },
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
