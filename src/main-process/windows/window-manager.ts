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

/**
 * Manages the creation, display, and communication between various application windows
 * including the main window, mini-mode window, startup window, and recording history window.
 */
export class WindowManager extends EventEmitter {
  private mainWindow: BrowserWindow | undefined;
  private miniWindow: BrowserWindow | undefined;
  private startupWindow: BrowserWindow | undefined;
  private recordingHistoryWindow: BrowserWindow | null = null;

  /**
   * Creates a new instance of WindowManager
   *
   * @param config - Application configuration
   * @param settingsService - Service for accessing user settings
   */
  constructor(
    private config: AppConfig,
    private settingsService: SettingsService,
  ) {
    super();
  }

  /**
   * Creates the main application window
   *
   * @returns The main browser window instance
   */
  createMainWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
      height: 1024,
      width: 1440,
      webPreferences: {
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
      show: false,
    });

    logger.info("Creating main application window");

    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    if (this.config.isDev) {
      logger.debug("Development mode enabled, opening DevTools");
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

    Menu.setApplicationMenu(null);
    return mainWindow;
  }

  /**
   * Shows the main application window
   */
  showMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      logger.debug("Showing existing main window");
      this.mainWindow.show();
    } else {
      logger.info(
        "Main window does not exist, creating and showing new window",
      );
      this.mainWindow = this.createMainWindow();
      this.mainWindow.show();
    }
  }

  /**
   * Toggles the visibility of the main application window
   */
  toggleMainWindow() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      logger.warn(
        "Main window is destroyed or not created yet. Creating a new instance.",
      );
      this.mainWindow = this.createMainWindow();
      this.mainWindow.show();
      return;
    }

    if (this.mainWindow.isVisible()) {
      logger.debug("Hiding main window");
      this.mainWindow.hide();
    } else {
      logger.debug("Showing main window");
      this.mainWindow.show();
    }
  }

  /**
   * Sends a message to the main application window
   *
   * @param channel - The channel to send the message on
   * @param data - The data to send
   */
  sendMainWindowMessage(channel: string, data?: unknown) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Creates the mini-mode window
   *
   * @returns The mini-mode browser window instance
   */
  createMiniWindow(): BrowserWindow {
    const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().workAreaSize;
    const height = 180;
    const width = 860;
    const edgeGap = 120;

    const centerX = screenWidth / 2 - width / 2;
    const centerY = screenHeight - height - edgeGap;

    logger.info("Creating mini-mode window");

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
      logger.debug(
        "Development mode enabled, opening DevTools for mini window",
      );
      miniWindow.webContents.openDevTools();
    }

    // and load the index.html of the app.
    miniWindow.loadURL(MINI_WEBPACK_ENTRY);

    return miniWindow;
  }

  /**
   * Shows the mini-mode window
   */
  showMiniWindow(): void {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      logger.debug("Showing existing mini window");
      this.miniWindow.showInactive();
    } else {
      logger.info(
        "Mini window does not exist, creating and showing new window",
      );
      this.miniWindow = this.createMiniWindow();
      this.miniWindow.showInactive();
    }
  }

  /**
   * Hides the mini-mode window
   */
  hideMiniWindow(): void {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      logger.debug("Hiding mini window");
      this.sendMiniWindowMessage(CHANNELS.MINI.STATUS_UPDATE, "idle");
      this.miniWindow.hide();
    } else {
      logger.debug(
        "Cannot hide mini window: window is destroyed or not created",
      );
    }
  }

  /**
   * Toggles the visibility of the mini-mode window
   */
  toggleMiniWindow() {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      if (this.miniWindow.isVisible()) {
        logger.debug("Hiding mini window");
        this.hideMiniWindow();
      } else {
        logger.debug("Showing mini window");
        this.showMiniWindow();
      }
    } else {
      logger.info(
        "Mini window is destroyed or not created yet. Creating a new instance.",
      );
      this.showMiniWindow();
    }
  }

  /**
   * Sends a message to the mini-mode window
   *
   * @param channel - The channel to send the message on
   * @param data - The data to send
   */
  sendMiniWindowMessage(channel: string, data?: unknown) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.webContents.send(channel, data);
    }
  }

  /**
   * Sets the position of the mini-mode window
   *
   * @param x - The x-coordinate of the window
   * @param y - The y-coordinate of the window
   */
  setMiniWindowPosition(x: number, y: number) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      this.miniWindow.setPosition(x, y);
    }
  }

  /**
   * Sets the height of the main content area of the mini-mode window
   *
   * @param height - The height of the main content area
   */
  setMiniWindowMainContentHeight(height: number) {
    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      const menuBarHeight = 56;
      const miniWindowHeight = height + menuBarHeight;

      const previousHeight = this.miniWindow.getContentSize()[1];
      const deltaHeight = miniWindowHeight - previousHeight;

      // Replace console.log statements with appropriate logger levels
      logger.debug("Mini window resize details", {
        previousY: this.miniWindow.getBounds().y,
        mainContentHeight: height,
        miniWindowHeight,
        previousHeight,
        deltaHeight,
        newY: this.miniWindow.getBounds().y - deltaHeight,
      });

      this.miniWindow.setBounds({
        y: this.miniWindow.getBounds().y - deltaHeight,
        height: miniWindowHeight,
      });
    } else {
      logger.warn(
        "Cannot set mini window height: window is destroyed or not created",
      );
    }
  }

  /**
   * Creates the startup window
   *
   * @returns The startup browser window instance
   */
  createStartupWindow = (): BrowserWindow => {
    logger.info("Creating startup window");

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
    return startupWindow;
  };

  /**
   * Hides the startup window
   */
  hideStartupWindow = (): void => {
    if (this.startupWindow && !this.startupWindow.isDestroyed()) {
      logger.debug("Hiding startup window");
      this.startupWindow.hide();
    } else {
      logger.debug(
        "Cannot hide startup window: window is destroyed or not created",
      );
    }
  };

  /**
   * Creates the recording history window
   *
   * @returns The recording history browser window instance
   */
  createRecordingHistoryWindow = (): BrowserWindow => {
    if (
      this.recordingHistoryWindow &&
      !this.recordingHistoryWindow.isDestroyed()
    ) {
      logger.debug(
        "Recording history window already exists, showing existing instance",
      );
      this.recordingHistoryWindow.show();
      return this.recordingHistoryWindow;
    }

    logger.info("Creating new recording history window");
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

    // Add event listener for window close event
    recordingHistoryWindow.on("closed", () => {
      logger.debug("Recording history window closed");
      this.recordingHistoryWindow = null;
    });

    this.recordingHistoryWindow = recordingHistoryWindow;
    return recordingHistoryWindow;
  };

  /**
   * Sends a message to the recording history window
   *
   * @param channel - The channel to send the message on
   * @param data - The data to send
   */
  sendRecordingHistoryWindowMessage(channel: string, data?: unknown) {
    if (
      this.recordingHistoryWindow &&
      !this.recordingHistoryWindow.isDestroyed()
    ) {
      this.recordingHistoryWindow.webContents.send(channel, data);
    }
  }

  /**
   * Shows the recording history window
   */
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

  /**
   * Cleans up and destroys all windows
   */
  cleanup() {
    logger.info("Cleaning up and destroying all windows");

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      logger.debug("Destroying main window");
      this.mainWindow.destroy();
    }

    if (this.miniWindow && !this.miniWindow.isDestroyed()) {
      logger.debug("Destroying mini window");
      this.miniWindow.destroy();
    }

    if (this.startupWindow && !this.startupWindow.isDestroyed()) {
      logger.debug("Destroying startup window");
      this.startupWindow.destroy();
    }

    if (
      this.recordingHistoryWindow &&
      !this.recordingHistoryWindow.isDestroyed()
    ) {
      logger.debug("Destroying recording history window");
      this.recordingHistoryWindow.destroy();
    }
  }
}
