import { CHANNELS } from "../../lib/models/channels";
import { ipcMain, shell } from "electron";

export function registerURLHandlers() {
  ipcMain.on(CHANNELS.URL.OPEN, (_, url: string) => {
    shell.openExternal(url);
  });
}
