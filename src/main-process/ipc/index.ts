import { ipcMain } from "electron";
import { PythonService } from "../services/python-service";
import { SettingsService } from "../services/settings-service";
import { WindowManager } from "../windows/window-manager";
import { AppConfig } from "../utils/config";
import { registerURLHandlers } from "./url";
import { registerDeviceHandlers } from "./device";
import { registerSettingsHandlers } from "./settings";
import { CHANNELS, ModeCreate, ModeUpdate } from "../../lib/models";

export function registerIpcHandlers(
  settingsService: SettingsService,
  config: AppConfig,
  pythonService: PythonService,
  windowManager: WindowManager
) {
  registerSettingsHandlers(settingsService, pythonService);
  registerURLHandlers();
  registerDeviceHandlers(pythonService);

  ipcMain.on(CHANNELS.CONTROLLER.TOGGLE_RECORDING, () => {
    pythonService.toggleRecording();
  });

  ipcMain.on(CHANNELS.MINI.AUDIO_LEVEL_REQUEST, () => {
    pythonService.sendCommand({
      action: "audio_level",
    });
  });

  ipcMain.on(CHANNELS.DATABASE.MODES.MODES_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_modes",
    });
  });

  ipcMain.on(CHANNELS.DATABASE.MODES.CREATE_MODE, (_, mode: ModeCreate) => {
    pythonService.sendCommand({
      action: "create_mode",
      data: mode,
    });
  });

  ipcMain.on(CHANNELS.DATABASE.MODES.UPDATE_MODE, (_, mode: ModeUpdate) => {
    pythonService.sendCommand({
      action: "update_mode",
      data: mode,
    });
  });

  ipcMain.on(CHANNELS.RECORDING_HISTORY.OPEN_WINDOW, () => {
    windowManager.createRecordingHistoryWindow();
  });

  ipcMain.on(CHANNELS.RECORDING_HISTORY.RESULTS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_results",
    });
  });
}
