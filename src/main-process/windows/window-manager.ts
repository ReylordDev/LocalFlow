import { BrowserWindow, screen } from "electron";
import { AppConfig } from "../utils/config";
import { CHANNELS } from "../../lib/models";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MINI_WEBPACK_ENTRY: string;
declare const MINI_PRELOAD_WEBPACK_ENTRY: string;
declare const STARTUP_WEBPACK_ENTRY: string;
declare const STARTUP_PRELOAD_WEBPACK_ENTRY: string;

export class WindowManager {
  private mainWindow: BrowserWindow;
  private miniWindow: BrowserWindow;
  private startupWindow: BrowserWindow;

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
    // const height = 800;
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
      // Problem: click through issue, can we dynamically resize the window instead?
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
      this.sendMiniWindowMessage(CHANNELS.MINI.STATUS_UPDATE, "default");
      // TEMPORARY for deveopment
      // this.miniWindow.hide();
    }
  }

  sendMiniWindowMessage(channel: string, data?: unknown) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.webContents.send(channel, data);
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
