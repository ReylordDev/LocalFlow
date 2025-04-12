import { CHANNELS_old } from "../../lib/models/channels";
import { ipcMain, shell } from "electron";

export function registerURLHandlers() {
  ipcMain.on(CHANNELS_old.URL.OPEN, (_, url: string) => {
    shell.openExternal(url);
  });
}
