// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  FormattedTranscripton,
  HistoryItem,
  InputDevice,
  ModelStatus,
} from "../lib/models";
import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("controller", {
  toggleRecording: () => {
    ipcRenderer.send("controller:toggle-recording");
  },
  requestModelStatus: async () => {
    return ipcRenderer.send("controller:requestModelStatus");
  },
  onReceiveModelStatus: (callback: (status: ModelStatus) => void) => {
    ipcRenderer.on("model-status", (_, status) => {
      callback(status);
    });
  },
  getTranscriptions: async () => {
    return ipcRenderer.send("controller:getTranscriptions");
  },
  onReceiveTranscriptions: (
    callback: (transcriptions: HistoryItem[]) => void
  ) => {
    ipcRenderer.on("transcriptions", (_, transcriptions) => {
      callback(transcriptions);
    });
  },
  onReceiveTranscription: (
    callback: (transcription: FormattedTranscripton) => void
  ) => {
    ipcRenderer.on("controller:transcription", (_, transcription) => {
      callback(transcription);
    });
  },
  deleteTranscription: (id: number) => {
    ipcRenderer.send("controller:deleteTranscription", id);
  },
});

contextBridge.exposeInMainWorld("settings", {
  getAll: async () => {
    return ipcRenderer.invoke("settings:get-all");
  },
  setShortcut: async (shortcut: string) => {
    return ipcRenderer.invoke("settings:set-shortcut", shortcut);
  },
  disableShortcut: async () => {
    return ipcRenderer.send("settings:disable-shortcut");
  },
  setLanguage: async (language: string) => {
    return ipcRenderer.invoke("settings:set-language", language);
  },
});

contextBridge.exposeInMainWorld("url", {
  open: (url: string) => {
    ipcRenderer.send("url:open", url);
  },
});

contextBridge.exposeInMainWorld("device", {
  requestAll: () => {
    return ipcRenderer.send("device:requestAll");
  },

  onReceiveDevices: (callback: (devices: InputDevice[]) => void) => {
    ipcRenderer.on("device:devices", (_, devices) => {
      callback(devices);
    });
  },

  set: (device: InputDevice) => {
    return ipcRenderer.send("device:set", device);
  },
});
