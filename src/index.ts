import { app, clipboard, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { TrayManager } from "./main-process/windows/tray-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig } from "./main-process/utils/config";
import {
  HistoryItem,
  Device,
  ModelStatus,
  CHANNELS,
  PYTHON_SERVICE_EVENTS,
  SETTINGS_SERVICE_EVENTS,
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
  windowManager.createMiniWindow();
  settingsService.registerShortcuts();

  settingsService.on(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED, () => {
    pythonService.toggleRecording();
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.MODELS_READY, () => {
    windowManager.hideStartupWindow();
    windowManager.createMainWindow();
    trayManager.initialize();
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.ERROR, (error: string) => {
    new Notification({
      title: "Error",
      body: error,
    }).show();
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.RECORDING_START, () => {
    windowManager.showMiniWindow();
    windowManager.sendMiniWindowMessage(CHANNELS.MINI.RECORDING_START);
  });

  pythonService.on(PYTHON_SERVICE_EVENTS.RECORDING_STOP, () => {
    windowManager.hideMiniWindow();
    windowManager.sendMiniWindowMessage(CHANNELS.MINI.RECORDING_STOP);
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

  pythonService.on(
    PYTHON_SERVICE_EVENTS.MODEL_STATUS,
    (status: ModelStatus) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.CONTROLLER.MODEL_STATUS_RESPONSE,
        status
      );
      trayManager.updateContextMenu();
    }
  );

  pythonService.on(
    PYTHON_SERVICE_EVENTS.HISTORY,
    (transcriptions: HistoryItem[]) => {
      windowManager.sendMainWindowMessage(
        CHANNELS.CONTROLLER.HISTORY_RESPONSE,
        transcriptions
      );
    }
  );

  pythonService.on(PYTHON_SERVICE_EVENTS.DEVICES, (devices: Device[]) => {
    windowManager.sendMainWindowMessage(
      CHANNELS.DEVICE.DEVICES_RESPONSE,
      devices
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
