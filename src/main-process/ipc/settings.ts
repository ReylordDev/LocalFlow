import { ipcMain } from "electron";
import { SettingsService } from "../services/settings-service";
import {
  ApplicationConfig,
  AudioConfig,
  KeyboardConfig,
  OutputConfig,
} from "../../lib/models/settings";
import { ElectronChannels } from "../../lib/models/channels";

export function registerSettingsHandlers(settingsService: SettingsService) {
  ipcMain.handle(ElectronChannels.getAllSettings, () => {
    return settingsService.currentSettings;
  });

  ipcMain.on(ElectronChannels.disableShortcut, (_, shortcut: string) => {
    settingsService.disableShortcut(shortcut);
  });

  ipcMain.on(ElectronChannels.setAudio, (_, audioConfig: AudioConfig) => {
    settingsService.updateAudioConfig(audioConfig);
  });

  ipcMain.on(
    ElectronChannels.setKeyboard,
    (_, keyboardConfig: KeyboardConfig) => {
      settingsService.updateKeyboardConfig(keyboardConfig);
    },
  );

  ipcMain.on(
    ElectronChannels.setApplication,
    (_, applicationConfig: ApplicationConfig) => {
      settingsService.updateApplicationConfig(applicationConfig);
    },
  );

  ipcMain.on(ElectronChannels.setOutput, (_, outputConfig: OutputConfig) => {
    settingsService.updateOutputConfig(outputConfig);
  });
}
