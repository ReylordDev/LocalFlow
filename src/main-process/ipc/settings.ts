import { ipcMain } from "electron";
import { SettingsService } from "../services/settings-service";
import { PythonService } from "../services/python-service";

export function registerSettingsHandlers(
  settingsService: SettingsService,
  pythonService: PythonService
) {
  ipcMain.handle("settings:get-all", () => {
    return settingsService.currentSettings;
  });

  ipcMain.handle("settings:set-shortcut", (_, shortcut: string) => {
    settingsService.setStartShortcut(shortcut);
    return shortcut;
  });

  ipcMain.on("settings:disable-shortcut", () => {
    settingsService.disableStartShortcut();
  });

  ipcMain.handle("settings:set-language", (_, language: string) => {
    settingsService.setLanguage(language);
    pythonService.sendCommand({
      action: "set_language",
      data: { language: language },
    });
    return language;
  });
}
