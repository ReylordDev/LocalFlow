// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import {
  exposeController,
  exposeSettings,
  exposeUrl,
  exposeDevice,
  exposeDatabase,
  exposeRecordingHistory,
} from "../central_preload";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

exposeController();

exposeSettings();

exposeUrl();

exposeDevice();

exposeDatabase();

exposeRecordingHistory(); // Maybe this is bad to expose completely here but we'll see.
