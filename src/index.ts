import { app, clipboard, nativeTheme, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { TrayManager } from "./main-process/windows/tray-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig } from "./main-process/utils/config";
import { SettingsEvents as SettingsEvents } from "./lib/models/settings";
import {
  ElectronChannels,
  PythonChannels,
  PythonEvents,
} from "./lib/models/channels";
import { Action } from "./lib/models/commands";
import { tryCatch } from "./lib/utils";
import { UUID } from "crypto";

// Handle setup events
if (require("electron-squirrel-startup")) app.quit();

// Use light mode for now.
nativeTheme.themeSource = "light";

// Initialize core services
const config = new AppConfig();
const settingsService = new SettingsService(config);
const pythonService = new PythonService(config);
const windowManager = new WindowManager(config, settingsService);
const trayManager = new TrayManager(config, windowManager, pythonService);

app.whenReady().then(async () => {
  registerSettingsEventHandlers();
  registerPythonEventHandlers();
  await pythonService.initialize();
  windowManager.createStartupWindow();

  registerIpcHandlers(settingsService, pythonService, windowManager);

  windowManager.on("main-window-closed", () => {
    app.quit();
  });
});

// Quit app
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("quit", () => {
  pythonService.shutdown();
  windowManager.cleanup();
  settingsService.cleanup();
});

function registerPythonEventHandlers() {
  pythonService.onPythonEvent(PythonEvents.MODELS_READY, () => {
    windowManager.hideStartupWindow();
    windowManager.createMainWindow();
    windowManager.createMiniWindow();
    settingsService.registerShortcut(
      settingsService.currentSettings.keyboard.toggleRecordingShortcut,
      "toggle",
    );
    trayManager.initialize();
  });

  pythonService.onPythonEvent(PythonEvents.ERROR, (error) => {
    console.error(error);
    new Notification({
      title: "Critical Error",
      body: error.message,
    }).show();
    app.quit();
  });

  pythonService.onPythonEvent(PythonEvents.AUDIO_LEVEL, (level) => {
    windowManager.sendMiniWindowMessage(
      ElectronChannels.onReceiveAudioLevel,
      level,
    );
  });

  pythonService.onPythonEvent(PythonEvents.STATUS_UPDATE, (status) => {
    windowManager.sendMiniWindowMessage(
      ElectronChannels.onStatusUpdate,
      status,
    );
  });

  pythonService.onPythonEvent(PythonEvents.RESULT, (result) => {
    windowManager.sendMiniWindowMessage(ElectronChannels.onResult, result);
    const text =
      result.mode.use_language_model && result.ai_result
        ? result.ai_result
        : result.transcription;
    clipboard.writeText(text);
    if (!settingsService.currentSettings.application.enableRecordingWindow) {
      new Notification({
        title: "Transcription copied to clipboard",
        body: text,
      }).show();
    }
    if (settingsService.currentSettings.application.autoCloseRecordingWindow) {
      windowManager.hideMiniWindow();
    }
  });

  pythonService.onPythonEvent(PythonEvents.MODES, (modes) => {
    windowManager.sendMiniWindowMessage(PythonChannels.onModes, modes);
    windowManager.sendMainWindowMessage(PythonChannels.onModes, modes);
  });
}

function registerSettingsEventHandlers() {
  settingsService.onSettingsEvent(
    SettingsEvents.SETTINGS_CHANGED,
    (settings) => {
      windowManager.sendMiniWindowMessage(
        ElectronChannels.onSettingsChanged,
        settings,
      );
      // We don't inform the main window about changed settings. This is because it is the only window that can change settings.
    },
  );

  settingsService.onSettingsEvent(SettingsEvents.SHORTCUT_PRESSED, (data) => {
    if (data === "toggle") {
      if (settingsService.currentSettings.application.enableRecordingWindow) {
        windowManager.showMiniWindow();
      }
      pythonService.sendCommand({
        action: Action.TOGGLE,
        data: undefined,
        kind: "command",
      });
    } else if (data === "cancel") {
      pythonService.sendCommand({
        action: Action.CANCEL,
        data: undefined,
        kind: "command",
      });
    } else if (data === "change-mode") {
      windowManager.sendMiniWindowMessage(
        ElectronChannels.onChangeModeShortcutPressed,
      );
    } else if (data.name === "activate-next-mode") {
      tryCatch(
        pythonService.sendPythonRequest({
          channel: PythonChannels.fetchAllModes,
          id: pythonService.generateRequestId(),
          kind: "request",
        }),
      ).then(({ data: modes, error }) => {
        if (error) {
          console.error("Error fetching modes:", error);
          return;
        }
        const currentIndex = modes.findIndex((mode) => mode.active);
        let nextModeId: UUID | undefined = undefined;
        if (data.direction === "previous") {
          const previousIndex =
            (currentIndex - 1 + modes.length) % modes.length;
          nextModeId = modes[previousIndex].id;
        } else if (data.direction === "next") {
          const nextIndex = (currentIndex + 1) % modes.length;
          nextModeId = modes[nextIndex].id;
        }
        if (!nextModeId) {
          console.error("No next mode found");
          return;
        }
        console.info(`Switching to mode: ${nextModeId}`);
        pythonService.sendPythonRequest({
          channel: PythonChannels.activateMode,
          id: pythonService.generateRequestId(),
          data: nextModeId,
          kind: "request",
        });
      });
    } else if (data.name === "activate-mode") {
      const modeId = data.modeId;
      console.info(`Switching to mode: ${modeId}`);
      pythonService.sendPythonRequest({
        channel: PythonChannels.activateMode,
        id: pythonService.generateRequestId(),
        data: modeId,
        kind: "request",
      });
    }
  });
}
