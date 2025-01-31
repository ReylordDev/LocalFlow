// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("mini", {
  onRecordingStart: (callback: () => void) => {
    ipcRenderer.on("mini:recording-start", callback);
  },
  onRecordingStop: (callback: () => void) => {
    ipcRenderer.on("mini:recording-stop", callback);
  },
  requestAudioLevel: async () => {
    return ipcRenderer.send("mini:requestAudioLevel");
  },
  onReceiveAudioLevel: (callback: (audio_level: number) => void) => {
    ipcRenderer.on("mini:audio-level", (_, audio_level: number) => {
      callback(audio_level);
    });
  },
});
