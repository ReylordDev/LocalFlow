import { BrowserWindow, screen } from "electron";
import { AppConfig } from "../utils/config";
import { CHANNELS } from "../../lib/models";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MINI_WEBPACK_ENTRY: string;
declare const MINI_PRELOAD_WEBPACK_ENTRY: string;
declare const RECORDING_HISTORY_WEBPACK_ENTRY: string;
declare const RECORDING_HISTORY_PRELOAD_WEBPACK_ENTRY: string;
declare const STARTUP_WEBPACK_ENTRY: string;
declare const STARTUP_PRELOAD_WEBPACK_ENTRY: string;

export class WindowManager {
  private mainWindow: BrowserWindow;
  private miniWindow: BrowserWindow;
  private startupWindow: BrowserWindow;
  private recordingHistoryWindow: BrowserWindow | null = null;

  constructor(private config: AppConfig) {}

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
    mainWindow.on("close", (e) => {
      if (mainWindow.isVisible()) {
        e.preventDefault();
        mainWindow.hide();
      }
    });
    this.mainWindow = mainWindow;
  }

  toggleMainWindow() {
    if (this.mainWindow.isDestroyed()) {
      this.createMainWindow();
    } else if (this.mainWindow.isVisible()) {
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
      hiddenInMissionControl: true,
      resizable: false,
      webPreferences: {
        preload: MINI_PRELOAD_WEBPACK_ENTRY,
      },
    });
    // TEMP for development
    // miniWindow.hide();

    // and load the index.html of the app.
    miniWindow.loadURL(MINI_WEBPACK_ENTRY);

    this.miniWindow = miniWindow;
  }

  showMiniWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.showInactive();
    }
  }

  hideMiniWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.sendMiniWindowMessage(CHANNELS.MINI.STATUS_UPDATE, "idle");
      // TEMPORARY for deveopment
      // this.miniWindow.hide();
    }
  }

  sendMiniWindowMessage(channel: string, data?: unknown) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.webContents.send(channel, data);
    }
  }

  setMiniWindowHeight(height: 180 | 386) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      const currentSize = this.miniWindow.getContentSize();
      const currentPosition = this.miniWindow.getPosition();
      this.miniWindow.setContentSize(currentSize[0], height);
      this.miniWindow.setPosition(
        currentPosition[0],
        currentPosition[1] - (height - currentSize[1])
      );
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
      webPreferences: {
        preload: RECORDING_HISTORY_PRELOAD_WEBPACK_ENTRY,
      },
    });
    recordingHistoryWindow.loadURL(RECORDING_HISTORY_WEBPACK_ENTRY);
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
