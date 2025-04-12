import { Tray, Menu, NativeImage, nativeImage, app } from "electron";
import { PythonService } from "../services/python-service";
import { WindowManager } from "./window-manager";
import { AppConfig, logger } from "../utils/config";
import path from "path";
import { Mode } from "../../lib/models/database";
import { PYTHON_SERVICE_EVENTS } from "../../lib/models/channels";

/**
 * Manages the system tray icon and its context menu functionality.
 * Handles tray initialization, icon creation, and menu updates based on application modes.
 */
export class TrayManager {
  private tray: Tray | undefined;

  constructor(
    private config: AppConfig,
    private windowManager: WindowManager,
    private pythonService: PythonService,
  ) {}

  /**
   * Initializes the system tray icon and sets up event listeners.
   * Creates the tray icon, sets up click handlers, and initializes the context menu.
   */
  initialize() {
    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip("LocalFlow");

    this.tray.on("click", () => {
      this.windowManager.toggleMiniWindow();
    });

    logger.info("Requesting modes from database for context menu");
    const contextMenu = this.updateContextMenu([]);
    this.tray.setContextMenu(contextMenu);
    // TODO: outdated
    this.pythonService.sendCommand({
      action: "get_modes",
    });
    this.pythonService.onPythonEvent(PYTHON_SERVICE_EVENTS.MODES, (modes) => {
      if (!this.tray) {
        logger.error("Tray not initialized");
        return;
      }
      logger.info("Received modes from database for context menu");
      const contextMenu = this.updateContextMenu(modes);
      this.tray.setContextMenu(contextMenu);
    });
  }

  /**
   * Creates the appropriate tray icon based on the platform and application packaging state.
   * @returns The native image object for the tray icon
   */
  private createTrayIcon() {
    let image: string;
    if (process.platform === "win32") {
      image = "icon.ico";
    } else {
      // Untested
      image = "icon_16.png";
    }
    let icon: NativeImage;
    if (this.config.isPackaged) {
      icon = nativeImage.createFromPath(
        path.join(process.resourcesPath, "assets/icons", image),
      );
    } else {
      icon = nativeImage.createFromPath(
        path.join(this.config.rootDir, "assets/icons", image),
      );
    }
    return icon;
  }

  /**
   * Updates the context menu with the provided modes.
   * @param {Mode[]} modes - The list of modes to include in the context menu
   * @returns The updated context menu
   */
  updateContextMenu(modes: Mode[]) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Start/Stop Recording",
        click: () => this.pythonService.toggleRecording(),
      },
      {
        label: "Transcribe File",
        click: () => logger.info("Transcribe File clicked"),
      },
      {
        label: "History",
        click: () => {
          this.windowManager.showRecordingHistoryWindow();
        },
      },
      {
        label: "Settings",
        click: () => {
          this.windowManager.showMainWindow();
        },
      },
      {
        type: "separator",
      },
      {
        label: "Switch Mode",
        submenu: modes.map((mode) => ({
          label: mode.name,
          type: "radio",
          checked: mode.active,
          click: () => {
            logger.info(`Switching to mode: ${mode.name}`);
            this.pythonService.sendCommand({
              action: "switch_mode",
              data: mode.id,
            });
          },
        })),
      },
      {
        type: "separator",
      },
      {
        label: "Quit",
        click: () => {
          app.quit();
        },
      },
    ]);
    return contextMenu;
  }
}
