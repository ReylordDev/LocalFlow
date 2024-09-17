// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

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
});
