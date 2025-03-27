// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { Device, CHANNELS, Mode, CHANNEL_NAMES } from "../lib/models";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

contextBridge.exposeInMainWorld(CHANNEL_NAMES.CONTROLLER, {
  toggleRecording: () => {
    ipcRenderer.send(CHANNELS.CONTROLLER.TOGGLE_RECORDING);
  },
} satisfies Window["controller"]);

contextBridge.exposeInMainWorld(CHANNEL_NAMES.SETTINGS, {
  getAll: async () => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.GET);
  },
  setShortcut: async (shortcut) => {
    return ipcRenderer.invoke(CHANNELS.SETTINGS.SET_SHORTCUT, shortcut);
  },
  disableShortcut: async () => {
    return ipcRenderer.send(CHANNELS.SETTINGS.DISABLE_SHORTCUT);
  },
} satisfies Window["settings"]);

contextBridge.exposeInMainWorld(CHANNEL_NAMES.URL, {
  open: (url) => {
    ipcRenderer.send(CHANNELS.URL.OPEN, url);
  },
} satisfies Window["url"]);

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
  },
} satisfies Window["database"]);
