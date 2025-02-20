// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { CHANNELS } from "../lib/models";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld("mini", {
  onRecordingStart: (callback) => {
    const listener = () => {
      callback();
    };
    ipcRenderer.on(CHANNELS.MINI.RECORDING_START, listener);
    return () => {
      ipcRenderer.off(CHANNELS.MINI.RECORDING_START, listener);
    };
  },
  onRecordingStop: (callback) => {
    const listener = () => {
      callback();
    };
    ipcRenderer.on(CHANNELS.MINI.RECORDING_STOP, listener);
    return () => {
      ipcRenderer.off(CHANNELS.MINI.RECORDING_STOP, listener);
    };
  },
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
} satisfies Window["mini"]);
