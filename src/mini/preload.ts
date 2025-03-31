// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { exposeSettings, exposeDatabase, exposeMini } from "../central_preload";
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object

exposeMini();

exposeSettings();

exposeDatabase();
