import { app, clipboard, nativeTheme, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { TrayManager } from "./main-process/windows/tray-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig } from "./main-process/utils/config";
import { SETTINGS_SERVICE_EVENTS as SettingsEvents } from "./lib/models/settings";
import { ElectronChannels, PythonEvents } from "./lib/models/channels";
import { Action } from "./lib/models/commands";

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
    settingsService.registerShortcuts();
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
    console.warn("I don't think this is supposed to exit anymore:", modes);
    // TODO: how to send modes update to mini window?
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
    },
  );

  settingsService.onSettingsEvent(SettingsEvents.SHORTCUT_PRESSED, (type) => {
    if (type === "toggle") {
      if (settingsService.currentSettings.application.enableRecordingWindow) {
        windowManager.showMiniWindow();
      }
      pythonService.sendCommand({
        action: Action.TOGGLE,
        data: undefined,
        kind: "command",
      });
    }
    if (type === "cancel") {
      pythonService.sendCommand({
        action: Action.CANCEL,
        data: undefined,
        kind: "command",
      });
    }
    if (type === "change-mode") {
      windowManager.sendMiniWindowMessage(
        ElectronChannels.onChangeModeShortcutPressed,
      );
    }
  });
}
