// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { HistoryItem, Device, ModelStatus, CHANNELS } from "../lib/models";
import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("controller", {
  toggleRecording: () => {
    ipcRenderer.send(CHANNELS.CONTROLLER.TOGGLE_RECORDING);
  },
  requestModelStatus: async () => {
    return ipcRenderer.send(CHANNELS.CONTROLLER.MODEL_STATUS_REQUEST);
  },
  onReceiveModelStatus: (callback: (status: ModelStatus) => void) => {
    ipcRenderer.on(CHANNELS.CONTROLLER.MODEL_STATUS_RESPONSE, (_, status) => {
      callback(status);
    });
  },
  getHistory: async () => {
    return ipcRenderer.send(CHANNELS.CONTROLLER.HISTORY_REQUEST);
  },
  onReceiveHistory: (callback: (transcriptions: HistoryItem[]) => void) => {
    ipcRenderer.on(
      CHANNELS.CONTROLLER.HISTORY_RESPONSE,
      (_, transcriptions) => {
        callback(transcriptions);
      }
    );
  },
  deleteTranscription: (id: number) => {
    ipcRenderer.send(CHANNELS.CONTROLLER.DELETE_TRANSCRIPTION, id);
  },
});

contextBridge.exposeInMainWorld("settings", {
  getAll: async () => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.GET);
  },
  setShortcut: async (shortcut: string) => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.SET_SHORTCUT, shortcut);
  },
  disableShortcut: async () => {
    return ipcRenderer.send(CHANNELS.SETTINGS.DISABLE_SHORTCUT);
  },
  setLanguage: async (language: string) => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.SET_LANGUAGE, language);
  },
});

contextBridge.exposeInMainWorld("url", {
  open: (url: string) => {
    ipcRenderer.send(CHANNELS.URL.OPEN, url);
  },
});

contextBridge.exposeInMainWorld("device", {
  requestAll: () => {
    return ipcRenderer.send(CHANNELS.DEVICE.DEVICES_REQUEST);
  },

  onReceiveDevices: (callback: (devices: Device[]) => void) => {
    ipcRenderer.on(CHANNELS.DEVICE.DEVICES_RESPONSE, (_, devices) => {
      callback(devices);
    });
  },

  set: (device: Device) => {
    return ipcRenderer.send(CHANNELS.DEVICE.SET, device);
  },
});
