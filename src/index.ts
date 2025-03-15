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

  settingsService.on(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED, () => {
    pythonService.toggleRecording();
  });

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

  pythonService.on(
    PYTHON_SERVICE_EVENTS.TRANSCRIPTION,
    (transcription: string) => {
      clipboard.writeText(transcription);
      new Notification({
        title: "Transcription copied to clipboard",
        body: transcription,
      }).show();
    }
  );

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
    }
  );

  pythonService.on(PYTHON_SERVICE_EVENTS.MODES, (modes: Mode[]) => {
    windowManager.sendMainWindowMessage(
      CHANNELS.DATABASE.MODES.MODES_RESPONSE,
      modes
    );
  });

  registerIpcHandlers(settingsService, config, pythonService);
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
