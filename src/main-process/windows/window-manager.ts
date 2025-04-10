import { BrowserWindow, Menu, screen } from "electron";
import { EventEmitter } from "events";
import { AppConfig, logger } from "../utils/config";
import { CHANNELS } from "../../lib/models";
import { SettingsService } from "../services/settings-service";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MINI_WEBPACK_ENTRY: string;
declare const MINI_PRELOAD_WEBPACK_ENTRY: string;
declare const RECORDING_HISTORY_WEBPACK_ENTRY: string;
declare const RECORDING_HISTORY_PRELOAD_WEBPACK_ENTRY: string;
declare const STARTUP_WEBPACK_ENTRY: string;
declare const STARTUP_PRELOAD_WEBPACK_ENTRY: string;

export class WindowManager extends EventEmitter {
  private mainWindow: BrowserWindow;
  private miniWindow: BrowserWindow;
  private startupWindow: BrowserWindow;
  private recordingHistoryWindow: BrowserWindow | null = null;

  constructor(
    private config: AppConfig,
    private settingsService: SettingsService,
  ) {
    super();
  }

  createMainWindow() {
    const mainWindow = new BrowserWindow({
      height: 1024,
      width: 1440,
      webPreferences: {
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      show: false,
    });
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    if (this.config.isDev) {
      mainWindow.webContents.openDevTools();
    }
    mainWindow.on("close", (e) => {
      if (this.settingsService.currentSettings.application.closeToTray) {
        e.preventDefault();
        mainWindow.hide();
      }
    });

    mainWindow.on("minimize", () => {
      if (this.settingsService.currentSettings.application.minimizeToTray) {
        mainWindow.hide();
      } else {
        mainWindow.minimize();
      }
    });

    mainWindow.on("closed", () => {
      this.emit("main-window-closed");
    });

    mainWindow.on("ready-to-show", () => {
      mainWindow.show();
    });

    this.mainWindow = mainWindow;
    Menu.setApplicationMenu(null);
  }

  showMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show();
    } else {
      this.createMainWindow();
      this.mainWindow.show();
    }
  }

  toggleMainWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      logger.log("Main window is destroyed or not created yet.");
      return;
    }
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.mainWindow.show();
    }
  }

  sendMainWindowMessage(channel: string, data?: unknown) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  createMiniWindow() {
    const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().workAreaSize;
    const height = 180;
    const width = 860;
    const edgeGap = 120;

    const centerX = screenWidth / 2 - width / 2;
    const centerY = screenHeight - height - edgeGap;

    const miniWindow = new BrowserWindow({
      frame: false,
      width: width,
      height: height,
      x: centerX,
      y: centerY,
      useContentSize: true,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      webPreferences: {
        preload: MINI_PRELOAD_WEBPACK_ENTRY,
      },
    });
    miniWindow.hide();

    if (this.config.isDev) {
      miniWindow.webContents.openDevTools();
    }

    // and load the index.html of the app.
    miniWindow.loadURL(MINI_WEBPACK_ENTRY);

    this.miniWindow = miniWindow;
  }

  showMiniWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.showInactive();
    } else {
      this.createMiniWindow();
      this.miniWindow.showInactive();
    }
  }

  hideMiniWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.sendMiniWindowMessage(CHANNELS.MINI.STATUS_UPDATE, "idle");
      this.miniWindow.hide();
    }
  }

  toggleMiniWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      if (this.miniWindow.isVisible()) {
        this.hideMiniWindow();
      } else {
        this.showMiniWindow();
      }
    } else {
      logger.log("Mini window is destroyed or not created yet.");
      this.showMiniWindow();
    }
  }

  sendMiniWindowMessage(channel: string, data?: unknown) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.webContents.send(channel, data);
    }
  }

  setMiniWindowPosition(x: number, y: number) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.setPosition(x, y);
    }
  }

  getMiniWindowPosition() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      return this.miniWindow.getPosition();
    }
    return [0, 0];
  }

  setMiniWindowMainContentHeight(height: number) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      const menuBarHeight = 56;
      const miniWindowHeight = height + menuBarHeight;

      const previousHeight = this.miniWindow.getContentSize()[1];
      const deltaHeight = miniWindowHeight - previousHeight;
      logger.log("previousY", this.miniWindow.getBounds().y);
      logger.log("main content height", height);
      logger.log("miniWindowHeight", miniWindowHeight);
      logger.log("previousHeight", previousHeight);
      logger.log("deltaHeight", deltaHeight);
      logger.log("newY", this.miniWindow.getBounds().y - deltaHeight);

      this.miniWindow.setBounds({
        y: this.miniWindow.getBounds().y - deltaHeight,
        height: miniWindowHeight,
      });
    }
  }

  createStartupWindow = () => {
    const startupWindow = new BrowserWindow({
      width: 600,
      height: 300,
      frame: false,
      webPreferences: {
        preload: STARTUP_PRELOAD_WEBPACK_ENTRY,
      },
    });

    // and load the index.html of the app.
    startupWindow.loadURL(STARTUP_WEBPACK_ENTRY);

    this.startupWindow = startupWindow;
  };

  hideStartupWindow = () => {
    if (this.startupWindow && !this.startupWindow.isDestroyed()) {
      this.startupWindow.hide();
    }
  };

  createRecordingHistoryWindow = () => {
    if (
      this.recordingHistoryWindow &&
      !this.recordingHistoryWindow.isDestroyed()
    ) {
      this.recordingHistoryWindow.show();
      return;
    }
    const recordingHistoryWindow = new BrowserWindow({
      height: 1024,
      width: 1440,
      // parent: this.mainWindow,
      webPreferences: {
        preload: RECORDING_HISTORY_PRELOAD_WEBPACK_ENTRY,
      },
    });
    recordingHistoryWindow.loadURL(RECORDING_HISTORY_WEBPACK_ENTRY);
    if (this.config.isDev) {
      recordingHistoryWindow.webContents.openDevTools();
    }
    this.recordingHistoryWindow = recordingHistoryWindow;
  };

  sendRecordingHistoryWindowMessage(channel: string, data?: unknown) {
    if (
      this.recordingHistoryWindow &&
      !this.recordingHistoryWindow.isDestroyed()
    ) {
      this.recordingHistoryWindow.webContents.send(channel, data);
    }
  }

  showRecordingHistoryWindow() {
    if (
      !this.recordingHistoryWindow ||
      this.recordingHistoryWindow.isDestroyed()
    ) {
      this.createRecordingHistoryWindow();
    } else {
      this.recordingHistoryWindow.show();
    }
  }

  cleanup() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.destroy();
    }
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.destroy();
    }
    if (this.startupWindow && !this.startupWindow.isDestroyed()) {
      this.startupWindow.destroy();
    }
  }
}
