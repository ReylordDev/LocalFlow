// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { CHANNELS } from "../lib/models";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("mini", {
  onRecordingStart: (callback: () => void) => {
    ipcRenderer.on(CHANNELS.MINI.RECORDING_START, callback);
  },
  onRecordingStop: (callback: () => void) => {
    ipcRenderer.on(CHANNELS.MINI.RECORDING_STOP, callback);
  },
  requestAudioLevel: async () => {
    return ipcRenderer.send(CHANNELS.MINI.AUDIO_LEVEL_REQUEST);
  },
  onReceiveAudioLevel: (callback: (audio_level: number) => void) => {
    ipcRenderer.on(
      CHANNELS.MINI.AUDIO_LEVEL_RESPONSE,
      (_, audio_level: number) => {
        callback(audio_level);
      }
    );
  },
});
