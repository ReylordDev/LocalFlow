import { ipcMain, clipboard, shell, app } from "electron";
import { PythonService } from "../services/python-service";
import { SettingsService } from "../services/settings-service";
import { WindowManager } from "../windows/window-manager";
import { logger } from "../utils/config";
import { registerURLHandlers } from "./url";
import { registerDeviceHandlers } from "./device";
import { registerSettingsHandlers } from "./settings";
import {
  ChannelFunctionTypeMap,
  CHANNELS_old,
  CHANNELS,
  ChannelType,
} from "../../lib/models/channels";
import { tryCatch } from "../../lib/utils";
import { Action, Request } from "../../lib/models/commands";

export function registerIpcHandlers(
  settingsService: SettingsService,
  pythonService: PythonService,
  windowManager: WindowManager,
) {
  function handlePythonIPC<C extends ChannelType>(channel: C) {
    ipcMain.handle(
      channel,
      async (_, ...args: Parameters<ChannelFunctionTypeMap[C]>) => {
        logger.log(`Received event: ${channel}`, args);
        const { data, error } = await tryCatch(
          pythonService.sendPythonRequest({
            channel,
            id: pythonService.generateRequestId(),
            data: args,
          } as Request),
        );
        if (error) {
          logger.error(`Error in ${channel}:`, error);
          throw error;
        }
        return data;
      },
    );
  }
  registerSettingsHandlers(settingsService);
  registerURLHandlers();
  registerDeviceHandlers(handlePythonIPC);

  ipcMain.on(CHANNELS_old.MINI.AUDIO_LEVEL_REQUEST, () => {
    pythonService.sendCommand({
      action: Action.AUDIO_LEVEL,
      data: undefined,
    });
  });

  Object.values(CHANNELS).forEach((channel) => {
    handlePythonIPC(channel as CHANNELS);
  });

  ipcMain.on(CHANNELS_old.RECORDING_HISTORY.OPEN_WINDOW, () => {
    windowManager.createRecordingHistoryWindow();
  });

  ipcMain.on(CHANNELS_old.CLIPBOARD.COPY, (_, text: string) => {
    logger.log("Copying to clipboard:", text);
    clipboard.writeText(text);
  });

  ipcMain.on(CHANNELS_old.FILE.OPEN, (_, location: string) => {
    logger.log("Opening file:", location);
    shell.openPath(location);
  });

  ipcMain.handle(CHANNELS_old.SETTINGS.GET_LOCALE, () => {
    return app.getSystemLocale();
  });

  ipcMain.on(CHANNELS_old.MINI.SET_MAIN_CONTENT_HEIGHT, (_, height: number) => {
    windowManager.setMiniWindowMainContentHeight(height);
  });
}
