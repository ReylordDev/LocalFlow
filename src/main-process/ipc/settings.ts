import { ipcMain } from "electron";
import { SettingsService } from "../services/settings-service";
import { PythonService } from "../services/python-service";
import { AudioConfig, CHANNELS } from "../../lib/models";

export function registerSettingsHandlers(
  settingsService: SettingsService,
  pythonService: PythonService
) {
  ipcMain.handle(CHANNELS.SETTINGS.GET, () => {
    return settingsService.currentSettings;
  });

  ipcMain.handle(CHANNELS.SETTINGS.SET_SHORTCUT, (_, shortcut: string) => {
    settingsService.setStartShortcut(shortcut);
    return shortcut;
  });

  ipcMain.on(CHANNELS.SETTINGS.DISABLE_SHORTCUT, () => {
    settingsService.disableStartShortcut();
  });

  ipcMain.on(CHANNELS.SETTINGS.SET_AUDIO, (_, audioConfig: AudioConfig) => {
    settingsService.updateAudioConfig(audioConfig);
  });
}
