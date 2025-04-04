import { ipcMain, clipboard, shell, app } from "electron";
import { PythonService } from "../services/python-service";
import { SettingsService } from "../services/settings-service";
import { WindowManager } from "../windows/window-manager";
import { AppConfig, consoleLog } from "../utils/config";
import { registerURLHandlers } from "./url";
import { registerDeviceHandlers } from "./device";
import { registerSettingsHandlers } from "./settings";
import {
  CHANNELS,
  ExampleBase,
  ModeCreate,
  ModeUpdate,
} from "../../lib/models";
import { UUID } from "crypto";

export function registerIpcHandlers(
  settingsService: SettingsService,
  config: AppConfig,
  pythonService: PythonService,
  windowManager: WindowManager,
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

  ipcMain.on(CHANNELS.DATABASE.MODES.DELETE_MODE, (_, modeId: UUID) => {
    pythonService.sendCommand({
      action: "delete_mode",
      data: {
        mode_id: modeId,
      },
    });
  });

  ipcMain.on(CHANNELS.DATABASE.RESULTS.DELETE_RESULT, (_, resultId: UUID) => {
    pythonService.sendCommand({
      action: "delete_result",
      data: {
        result_id: resultId,
      },
    });
  });

  ipcMain.on(
    CHANNELS.DATABASE.EXAMPLES.ADD_EXAMPLE,
    (_, promptId: UUID, example: ExampleBase) => {
      pythonService.sendCommand({
        action: "add_example",
        data: {
          prompt_id: promptId,
          example,
        },
      });
    },
  );

  ipcMain.on(CHANNELS.RECORDING_HISTORY.OPEN_WINDOW, () => {
    windowManager.createRecordingHistoryWindow();
  });

  ipcMain.on(CHANNELS.RECORDING_HISTORY.RESULTS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_results",
    });
  });

  ipcMain.on(CHANNELS.CLIPBOARD.COPY, (_, text: string) => {
    consoleLog("Copying to clipboard:", text);
    clipboard.writeText(text);
  });

  ipcMain.on(CHANNELS.FILE.OPEN, (_, location: string) => {
    consoleLog("Opening file:", location);
    shell.openPath(location);
  });

  ipcMain.handle(CHANNELS.SETTINGS.GET_LOCALE, () => {
    return app.getSystemLocale();
  });

  ipcMain.on(CHANNELS.DATABASE.VOICE_MODELS.VOICE_MODELS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_voice_models",
    });
  });
}
