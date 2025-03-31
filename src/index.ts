import { app, clipboard, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { TrayManager } from "./main-process/windows/tray-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig, consoleLog } from "./main-process/utils/config";
import {
  Device,
  CHANNELS,
  PYTHON_SERVICE_EVENTS,
  SETTINGS_SERVICE_EVENTS,
  ControllerStatusType,
  Mode,
  Result,
} from "./lib/models";

// Handle setup events
if (require("electron-squirrel-startup")) app.quit();

// Initialize core services
const config = new AppConfig();
const settingsService = new SettingsService(config);
const pythonService = new PythonService(config, settingsService);
const windowManager = new WindowManager(config);
const trayManager = new TrayManager(
  config,
  windowManager,
  pythonService,
  settingsService
);

app.whenReady().then(async () => {
  await pythonService.initialize();
  windowManager.createStartupWindow();

  settingsService.on(
    SETTINGS_SERVICE_EVENTS.SETTINGS_CHANGED,
    (settings: AppConfig) => {
      windowManager.sendMiniWindowMessage(
        CHANNELS.SETTINGS.SETTINGS_CHANGED,
        settings
      );
    }
  );

  settingsService.on(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED.TOGGLE, () => {
    pythonService.toggleRecording();
  });

  settingsService.on(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED.CANCEL, () => {
    pythonService.sendCommand({
      action: "cancel",
    });
  });

  settingsService.on(
    SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED.CHANGE_MODE,
    () => {
      consoleLog("Change mode shortcut pressed");
      // TODO: Implement change mode functionality
    }
  );

  pythonService.on(PYTHON_SERVICE_EVENTS.MODELS_READY, () => {
    windowManager.hideStartupWindow();
    windowManager.createMainWindow();
    windowManager.createMiniWindow();
    settingsService.registerShortcuts();
    trayManager.initialize();
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.ERROR, (error: string) => {
    consoleLog(error);
    new Notification({
      title: "Critical Error",
      body: error,
    }).show();
    app.quit();
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.AUDIO_LEVEL, (level: number) => {
    windowManager.sendMiniWindowMessage(
      CHANNELS.MINI.AUDIO_LEVEL_RESPONSE,
      level
    );
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.DEVICES, (devices: Device[]) => {
    windowManager.sendMainWindowMessage(
      CHANNELS.DEVICE.DEVICES_RESPONSE,
      devices
    );
  });

  pythonService.on(
    PYTHON_SERVICE_EVENTS.STATUS_UPDATE,
    (status: ControllerStatusType) => {
      windowManager.sendMiniWindowMessage(CHANNELS.MINI.STATUS_UPDATE, status);
      if (status === "result") {
        windowManager.setMiniWindowHeight(386);
      } else {
        windowManager.setMiniWindowHeight(180);
      }
    }
  );

  pythonService.on(PYTHON_SERVICE_EVENTS.RESULT, (result: Result) => {
    windowManager.sendMiniWindowMessage(CHANNELS.MINI.RESULT, result);
    const text = result.mode.use_language_model
      ? result.ai_result
      : result.transcription;
    clipboard.writeText(text);
    new Notification({
      title: "Transcription copied to clipboard",
      body: text,
    }).show();
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.MODES, (modes: Mode[]) => {
    windowManager.sendMainWindowMessage(
      CHANNELS.DATABASE.MODES.MODES_RESPONSE,
      modes
    );
    windowManager.sendMiniWindowMessage(
      CHANNELS.DATABASE.MODES.MODES_RESPONSE,
      modes
    );
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.MODES_UPDATE, (modes: Mode[]) => {
    // windowManager.sendMainWindowMessage(
    //   CHANNELS.DATABASE.MODES.MODES_UPDATE,
    //   modes
    // );
    windowManager.sendMiniWindowMessage(
      CHANNELS.DATABASE.MODES.MODES_UPDATE,
      modes
    );
  });
  pythonService.on(PYTHON_SERVICE_EVENTS.RESULTS, (results: Result[]) => {
    windowManager.sendRecordingHistoryWindowMessage(
      CHANNELS.RECORDING_HISTORY.RESULTS_RESPONSE,
      results
    );
  });

  registerIpcHandlers(settingsService, config, pythonService, windowManager);
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
