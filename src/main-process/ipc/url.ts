import { ipcMain, shell } from "electron";

export function registerURLHandlers() {
  ipcMain.on("url:open", (_, url: string) => {
    shell.openExternal(url);
  });
}
