import { ipcMain } from "electron";
import { SettingsService } from "../services/settings-service";
import { PythonService } from "../services/python-service";
import {
  ApplicationConfig,
  AudioConfig,
  CHANNELS,
  KeyboardConfig,
  OutputConfig,
} from "../../lib/models";

export function registerSettingsHandlers(
  settingsService: SettingsService,
  pythonService: PythonService,
) {
  ipcMain.handle(CHANNELS.SETTINGS.GET, () => {
    return settingsService.currentSettings;
  });

  ipcMain.on(CHANNELS.SETTINGS.DISABLE_SHORTCUT, (_, shortcut: string) => {
    settingsService.disableShortcut(shortcut);
  });

  ipcMain.on(CHANNELS.SETTINGS.SET_AUDIO, (_, audioConfig: AudioConfig) => {
    settingsService.updateAudioConfig(audioConfig);
  });

  ipcMain.on(
    CHANNELS.SETTINGS.SET_KEYBOARD,
    (_, keyboardConfig: KeyboardConfig) => {
      settingsService.updateKeyboardConfig(keyboardConfig);
    },
  );

  ipcMain.on(
    CHANNELS.SETTINGS.SET_APPLICATION,
    (_, applicationConfig: ApplicationConfig) => {
      settingsService.updateApplicationConfig(applicationConfig);
    },
  );

  ipcMain.on(CHANNELS.SETTINGS.SET_OUTPUT, (_, outputConfig: OutputConfig) => {
    settingsService.updateOutputConfig(outputConfig);
  });
}
