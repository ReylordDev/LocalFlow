import { ipcMain } from "electron";
import { SettingsService } from "../services/settings-service";
import {
  ApplicationConfig,
  AudioConfig,
  KeyboardConfig,
  OutputConfig,
} from "../../lib/models/settings";
import { CHANNELS_old } from "../../lib/models/channels";

export function registerSettingsHandlers(settingsService: SettingsService) {
  ipcMain.handle(CHANNELS_old.SETTINGS.GET, () => {
    return settingsService.currentSettings;
  });

  ipcMain.on(CHANNELS_old.SETTINGS.DISABLE_SHORTCUT, (_, shortcut: string) => {
    settingsService.disableShortcut(shortcut);
  });

  ipcMain.on(CHANNELS_old.SETTINGS.SET_AUDIO, (_, audioConfig: AudioConfig) => {
    settingsService.updateAudioConfig(audioConfig);
  });

  ipcMain.on(
    CHANNELS_old.SETTINGS.SET_KEYBOARD,
    (_, keyboardConfig: KeyboardConfig) => {
      settingsService.updateKeyboardConfig(keyboardConfig);
    },
  );

  ipcMain.on(
    CHANNELS_old.SETTINGS.SET_APPLICATION,
    (_, applicationConfig: ApplicationConfig) => {
      settingsService.updateApplicationConfig(applicationConfig);
    },
  );

  ipcMain.on(
    CHANNELS_old.SETTINGS.SET_OUTPUT,
    (_, outputConfig: OutputConfig) => {
      settingsService.updateOutputConfig(outputConfig);
    },
  );
}
