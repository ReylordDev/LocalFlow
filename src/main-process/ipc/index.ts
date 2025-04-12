import { ipcMain, clipboard, shell, app } from "electron";
import { PythonService } from "../services/python-service";
import { SettingsService } from "../services/settings-service";
import { WindowManager } from "../windows/window-manager";
import { logger } from "../utils/config";
import { registerURLHandlers } from "./url";
import { registerDeviceHandlers } from "./device";
import { registerSettingsHandlers } from "./settings";
import {
  ExampleBase,
  ModeCreate,
  ModeUpdate,
  TextReplacementBase,
} from "../../lib/models/database";
import { ChannelMap, CHANNELS, CHANNELS_enum } from "../../lib/models/channels";
import { UUID } from "crypto";
import { tryCatch } from "../../lib/utils";

function handleIPC<C extends keyof ChannelMap>(
  channel: C,
  callback: (...args: Parameters<ChannelMap[C]>) => ReturnType<ChannelMap[C]>,
) {
  ipcMain.handle(channel, (_, ...args: Parameters<ChannelMap[C]>) => {
    logger.log(`Received event: ${channel}`, args);
    callback(...args);
  });
}

export function registerIpcHandlers(
  settingsService: SettingsService,
  pythonService: PythonService,
  windowManager: WindowManager,
) {
  registerSettingsHandlers(settingsService, pythonService);
  registerURLHandlers();
  registerDeviceHandlers(pythonService);

  ipcMain.on(CHANNELS.MINI.AUDIO_LEVEL_REQUEST, () => {
    pythonService.sendCommand({
      action: "audio_level",
    });
  });

  // Possbile abstraction
  handleIPC(CHANNELS_enum.fetchAllModes, async () => {
    const { data, error } = await tryCatch(
      pythonService.sendCommandWithResponse({
        action: "get_modes", //TODO: this can be typed better
      }),
    );
    if (error) {
      throw error;
    }
    return data.modes;
  });

  handleIPC(CHANNELS_enum.createMode, async (mode) => {
    const { data, error } = await tryCatch(
      pythonService.sendCommandWithResponse({
        action: "create_mode",
        data: mode,
      }),
    );
    if (error) {
      throw error;
    }
    return data.modes;
  });

  handleIPC(CHANNELS_enum.updateMode, async (mode) => {
    const { data, error } = await tryCatch(
      pythonService.sendCommandWithResponse({
        action: "update_mode",
        data: mode,
      }),
    );
    if (error) {
      throw error;
    }
    return data.modes;
  });

  handleIPC(CHANNELS_enum.deleteMode, async (modeId) => {
    const { data, error } = await tryCatch(
      pythonService.sendCommandWithResponse({
        action: "delete_mode",
        data: modeId,
      }),
    );
    if (error) {
      throw error;
    }
    return data.modes;
  });

  ipcMain.on(CHANNELS.DATABASE.RESULTS.DELETE_RESULT, (_, resultId: UUID) => {
    pythonService.sendCommand({
      action: "delete_result",
      data: resultId,
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
    logger.log("Copying to clipboard:", text);
    clipboard.writeText(text);
  });

  ipcMain.on(CHANNELS.FILE.OPEN, (_, location: string) => {
    logger.log("Opening file:", location);
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

  ipcMain.on(CHANNELS.DATABASE.LANGUAGE_MODELS.LANGUAGE_MODELS_REQUEST, () => {
    pythonService.sendCommand({
      action: "get_language_models",
    });
  });

  ipcMain.on(
    CHANNELS.DATABASE.TEXT_REPLACEMENTS.TEXT_REPLACEMENTS_REQUEST,
    () => {
      pythonService.sendCommand({
        action: "get_text_replacements",
      });
    },
  );

  ipcMain.on(
    CHANNELS.DATABASE.TEXT_REPLACEMENTS.CREATE_TEXT_REPLACEMENT,
    (_, textReplacement: TextReplacementBase) => {
      pythonService.sendCommand({
        action: "create_text_replacement",
        data: {
          text_replacement: textReplacement,
        },
      });
    },
  );

  ipcMain.on(
    CHANNELS.DATABASE.TEXT_REPLACEMENTS.DELETE_TEXT_REPLACEMENT,
    (_, textReplacementId: UUID) => {
      pythonService.sendCommand({
        action: "delete_text_replacement",
        data: textReplacementId,
      });
    },
  );

  ipcMain.on(CHANNELS.MINI.SET_MAIN_CONTENT_HEIGHT, (_, height: number) => {
    windowManager.setMiniWindowMainContentHeight(height);
  });

  ipcMain.on(CHANNELS.DATABASE.MODES.ACTIVATE_MODE, (_, modeId: UUID) => {
    pythonService.sendCommand({
      action: "switch_mode",
      data: modeId,
    });
  });
}
