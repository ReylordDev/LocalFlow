import { ipcMain } from "electron";
import { PythonService } from "../services/python-service";
import { SettingsService } from "../services/settings-service";
import { AppConfig } from "../utils/config";
import { registerURLHandlers } from "./url";
import { registerDeviceHandlers } from "./device";
import { registerSettingsHandlers } from "./settings";
import { CHANNELS } from "../../lib/models";

export function registerIpcHandlers(
  settingsService: SettingsService,
  config: AppConfig,
  pythonService: PythonService
) {
  registerSettingsHandlers(settingsService, pythonService);
  registerURLHandlers();
  registerDeviceHandlers(pythonService);

  // Main recording controls
  ipcMain.on(CHANNELS.CONTROLLER.TOGGLE_RECORDING, () => {
    pythonService.toggleRecording();
  });

  ipcMain.on(CHANNELS.CONTROLLER.MODEL_STATUS_REQUEST, () => {
    pythonService.sendCommand({
      action: "model_status",
    });
  });

  ipcMain.on(CHANNELS.CONTROLLER.HISTORY_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_history",
    });
  });

  ipcMain.on(CHANNELS.CONTROLLER.DELETE_TRANSCRIPTION, (_, id: number) => {
    pythonService.sendCommand({
      action: "delete_transcription",
      data: { id },
    });
  });

  ipcMain.on(CHANNELS.MINI.AUDIO_LEVEL_REQUEST, () => {
    pythonService.sendCommand({
      action: "audio_level",
    });
  });
}
