import { ipcMain, clipboard, shell, app } from "electron";
import { PythonService } from "../services/python-service";
import { SettingsService } from "../services/settings-service";
import { WindowManager } from "../windows/window-manager";
import { registerURLHandlers } from "./url";
import { registerSettingsHandlers } from "./settings";
import {
  PythonChannels,
  PythonChannel,
  PythonChannelFunction,
  ElectronChannels,
  ElectronChannelFunction,
} from "../../lib/models/channels";
import { tryCatch } from "../../lib/utils";
import { Action } from "../../lib/models/commands";

function handlePythonIPC<C extends PythonChannel>(
  channel: C,
  pythonService: PythonService,
) {
  ipcMain.handle(
    channel,
    async (_, ...args: Parameters<PythonChannelFunction<C>>) => {
      console.log(`Received event: ${channel}`, args);
      const { data, error } = await tryCatch(
        pythonService.sendPythonRequest({
          channel,
          id: pythonService.generateRequestId(),
          data: args[0], // typing problem
          kind: "request",
        }),
      );
      if (error) {
        console.error(`Error in ${channel}:`, error);
        throw error;
      }
      return data;
    },
  );
}

// TODO: Create typesafe electron handler

export function registerIpcHandlers(
  settingsService: SettingsService,
  pythonService: PythonService,
  windowManager: WindowManager,
) {
  registerSettingsHandlers(settingsService);
  registerURLHandlers();

  Object.values(PythonChannels).forEach((channel) => {
    handlePythonIPC(channel, pythonService);
  });

  // This is a bit out of place because it uses the python service but is an electron channel.
  ipcMain.on(ElectronChannels.requestAudioLevel, () => {
    console.log("Remove this Audio Level request maybe");
    pythonService.sendCommand({
      action: Action.AUDIO_LEVEL,
      data: undefined,
      kind: "command",
    });
  });

  ipcMain.on(ElectronChannels.openHistoryWindow, () => {
    windowManager.createRecordingHistoryWindow();
  });

  ipcMain.on(ElectronChannels.copy, (_, text: string) => {
    console.log("Copying to clipboard:", text);
    clipboard.writeText(text);
  });

  ipcMain.on(ElectronChannels.openFile, (_, location: string) => {
    console.log("Opening file:", location);
    shell.openPath(location);
  });

  ipcMain.handle(ElectronChannels.getLocale, () => {
    return app.getSystemLocale();
  });

  ipcMain.on(ElectronChannels.setMainContentHeight, (_, height: number) => {
    windowManager.setMiniWindowMainContentHeight(height);
  });
}
