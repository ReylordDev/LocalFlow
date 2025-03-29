// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { CHANNELS, ControllerStatusType } from "../lib/models";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("mini", {
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
} satisfies Window["mini"]);

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
  setAudio(audioConfig) {
    return ipcRenderer.send(CHANNELS.SETTINGS.SET_AUDIO, audioConfig);
  },
} satisfies Window["settings"]);
