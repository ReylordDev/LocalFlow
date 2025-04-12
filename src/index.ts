import { app, clipboard, nativeTheme, Notification } from "electron";
import { PythonService } from "./main-process/services/python-service";
import { SettingsService } from "./main-process/services/settings-service";
import { WindowManager } from "./main-process/windows/window-manager";
import { TrayManager } from "./main-process/windows/tray-manager";
import { registerIpcHandlers } from "./main-process/ipc";
import { AppConfig } from "./main-process/utils/config";
import { SETTINGS_SERVICE_EVENTS } from "./lib/models/settings";
import { CHANNELS_old, PYTHON_SERVICE_EVENTS } from "./lib/models/channels";
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
  pythonService.onPythonEvent(PYTHON_SERVICE_EVENTS.MODELS_READY, () => {
    windowManager.hideStartupWindow();
    windowManager.createMainWindow();
    windowManager.createMiniWindow();
    settingsService.registerShortcuts();
    trayManager.initialize();
  });

  pythonService.onPythonEvent(PYTHON_SERVICE_EVENTS.ERROR, (error) => {
    console.error(error);
    new Notification({
      title: "Critical Error",
      body: error.message,
    }).show();
    app.quit();
  });

  pythonService.onPythonEvent(PYTHON_SERVICE_EVENTS.AUDIO_LEVEL, (level) => {
    windowManager.sendMiniWindowMessage(
      CHANNELS_old.MINI.AUDIO_LEVEL_RESPONSE,
      level,
    );
  });

  pythonService.onPythonEvent(PYTHON_SERVICE_EVENTS.STATUS_UPDATE, (status) => {
    windowManager.sendMiniWindowMessage(
      CHANNELS_old.MINI.STATUS_UPDATE,
      status,
    );
  });

  pythonService.onPythonEvent(PYTHON_SERVICE_EVENTS.RESULT, (result) => {
    windowManager.sendMiniWindowMessage(CHANNELS_old.MINI.RESULT, result);
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

  pythonService.onPythonEvent(PYTHON_SERVICE_EVENTS.MODES, (modes) => {
    windowManager.sendMainWindowMessage(
      CHANNELS_old.DATABASE.MODES.MODES_RESPONSE,
      modes,
    );
    windowManager.sendMiniWindowMessage(
      CHANNELS_old.DATABASE.MODES.MODES_RESPONSE,
      modes,
    );
  });
}

function registerSettingsEventHandlers() {
  settingsService.onSettingsEvent(
    SETTINGS_SERVICE_EVENTS.SETTINGS_CHANGED,
    (settings) => {
      windowManager.sendMiniWindowMessage(
        CHANNELS_old.SETTINGS.SETTINGS_CHANGED,
        settings,
      );
    },
  );

  settingsService.onSettingsEvent(
    SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED,
    (type) => {
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
          CHANNELS_old.MINI.CHANGE_MODE_SHORTCUT_PRESSED,
        );
      }
    },
  );
}
