import { ElectronChannels } from "../../lib/models/channels";
import { ipcMain, shell } from "electron";

export function registerURLHandlers() {
  ipcMain.on(ElectronChannels.openURL, (_, url: string) => {
    shell.openExternal(url);
  });
}
