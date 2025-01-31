import { app, clipboard, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { TrayManager } from "./main-process/windows/tray-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig } from "./main-process/utils/config";
import { HistoryItem, InputDevice, ModelStatus } from "./lib/models";

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

  settingsService.on("start-shortcut-pressed", () => {
    pythonService.toggleRecording();
  });

  pythonService.on("models-ready", () => {
    windowManager.hideStartupWindow();
    windowManager.createMainWindow();
    trayManager.initialize();
  });

  pythonService.on("error", (error: string) => {
    new Notification({
      title: "Error",
      body: error,
    }).show();
  });

  pythonService.on("recording-start", () => {
    windowManager.showMiniWindow();
    windowManager.sendMiniWindowMessage("mini:recording-start");
  });

  pythonService.on("recording-stop", () => {
    windowManager.hideMiniWindow();
    windowManager.sendMiniWindowMessage("mini:recording-stop");
  });

  pythonService.on("transcription", (transcription: string) => {
    clipboard.writeText(transcription);
    new Notification({
      title: "Transcription copied to clipboard",
      body: transcription,
    }).show();
  });

  pythonService.on("audio-level", (level: number) => {
    windowManager.sendMiniWindowMessage("mini:audio-level", level);
  });

  pythonService.on("model-status", (status: ModelStatus) => {
    windowManager.sendMainWindowMessage("model-status", status);
    trayManager.updateContextMenu();
  });

  pythonService.on("transcriptions", (transcriptions: HistoryItem[]) => {
    windowManager.sendMainWindowMessage("transcriptions", transcriptions);
  });

  pythonService.on("devices", (devices: InputDevice[]) => {
    windowManager.sendMainWindowMessage("device:devices", devices);
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
