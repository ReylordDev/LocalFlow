// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { HistoryItem, Device, ModelStatus, CHANNELS } from "../lib/models";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("controller", {
  toggleRecording: () => {
    ipcRenderer.send(CHANNELS.CONTROLLER.TOGGLE_RECORDING);
  },
  requestModelStatus: async () => {
    return ipcRenderer.send(CHANNELS.CONTROLLER.MODEL_STATUS_REQUEST);
  },
  onReceiveModelStatus: (callback) => {
    const listener = (_: IpcRendererEvent, status: ModelStatus) => {
      callback(status);
    };
    ipcRenderer.on(CHANNELS.CONTROLLER.MODEL_STATUS_RESPONSE, listener);
    return () => {
      ipcRenderer.off(CHANNELS.CONTROLLER.MODEL_STATUS_RESPONSE, listener);
    };
  },
  getHistory: async () => {
    return ipcRenderer.send(CHANNELS.CONTROLLER.HISTORY_REQUEST);
  },
  onReceiveHistory: (callback) => {
    const listener = (_: IpcRendererEvent, transcriptions: HistoryItem[]) => {
      callback(transcriptions);
    };
    ipcRenderer.on(CHANNELS.CONTROLLER.HISTORY_RESPONSE, listener);
    return () => {
      ipcRenderer.off(CHANNELS.CONTROLLER.HISTORY_RESPONSE, listener);
    };
  },
  deleteTranscription: (id) => {
    ipcRenderer.send(CHANNELS.CONTROLLER.DELETE_TRANSCRIPTION, id);
  },
} satisfies Window["controller"]);

contextBridge.exposeInMainWorld("settings", {
  getAll: async () => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.GET);
  },
  setShortcut: async (shortcut) => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.SET_SHORTCUT, shortcut);
  },
  disableShortcut: async () => {
    return ipcRenderer.send(CHANNELS.SETTINGS.DISABLE_SHORTCUT);
  },
  setLanguage: async (language) => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.SET_LANGUAGE, language);
  },
} satisfies Window["settings"]);

contextBridge.exposeInMainWorld("url", {
  open: (url) => {
    ipcRenderer.send(CHANNELS.URL.OPEN, url);
  },
} satisfies Window["url"]);

contextBridge.exposeInMainWorld("device", {
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
