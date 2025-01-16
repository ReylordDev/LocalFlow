// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  FormattedTranscripton,
  ModelStatus,
  Transcriptions,
} from "../lib/models";
import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("controller", {
  isInitialized: async () => {
    return ipcRenderer.invoke("controller:isInitialized");
  },
  onSetInitialized: (callback: (initialized: boolean) => void) => {
    ipcRenderer.on("controller:setInitialized", (_, initialized) => {
      callback(initialized);
    });
  },
  start: () => {
    ipcRenderer.send("controller:start");
  },
  stop: () => {
    ipcRenderer.send("controller:stop");
  },
  loadModels: () => {
    ipcRenderer.send("controller:loadModels");
  },
  unloadModels: () => {
    ipcRenderer.send("controller:unloadModels");
  },
  requestAudioLevel: async () => {
    return ipcRenderer.send("controller:requestAudioLevel");
  },
  onReceiveAudioLevel: (callback: (audioLevel: number) => void) => {
    ipcRenderer.on("controller:audioLevel", (_, audioLevel) => {
      callback(audioLevel);
    });
  },
  requestModelStatus: async () => {
    return ipcRenderer.send("controller:requestModelStatus");
  },
  onReceiveModelStatus: (callback: (status: ModelStatus) => void) => {
    ipcRenderer.on("controller:modelStatus", (_, status) => {
      callback(status);
    });
  },
  getTranscriptions: async () => {
    return ipcRenderer.send("controller:getTranscriptions");
  },
  onReceiveTranscriptions: (
    callback: (transcriptions: Transcriptions) => void
  ) => {
    ipcRenderer.on("controller:transcriptions", (_, transcriptions) => {
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
});

contextBridge.exposeInMainWorld("startShortcut", {
  get: async () => {
    return ipcRenderer.invoke("start-shortcut:get");
  },
  set: async (shortcut: string) => {
    return ipcRenderer.invoke("start-shortcut:set", shortcut);
  },
  disable: () => {
    return ipcRenderer.send("start-shortcut:disable");
  },
});

contextBridge.exposeInMainWorld("language", {
  get: async () => {
    return ipcRenderer.invoke("language:get");
  },
  set: (language: string) => {
    ipcRenderer.invoke("language:set", language);
  },
});
