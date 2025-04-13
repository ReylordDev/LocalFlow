import { Tray, Menu, NativeImage, nativeImage, app } from "electron";
import { PythonService } from "../services/python-service";
import { WindowManager } from "./window-manager";
import { AppConfig } from "../utils/config";
import path from "path";
import { Mode } from "../../lib/models/database";
import { PythonChannels } from "../../lib/models/channels";
import { Action } from "../../lib/models/commands";
import { tryCatch } from "../../lib/utils";

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
  async initialize() {
    const icon = this.createTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip("LocalFlow");

    this.tray.on("click", () => {
      this.windowManager.toggleMiniWindow();
    });

    const contextMenu = this.updateContextMenu([]);
    this.tray.setContextMenu(contextMenu);
    const { data, error } = await tryCatch(
      this.pythonService.sendPythonRequest({
        channel: PythonChannels.fetchAllModes,
        id: this.pythonService.generateRequestId(),
        kind: "request",
      }),
    );
    if (error) {
      console.error("Error fetching modes:", error);
      return;
    }
    const modes = data;
    this.updateContextMenu(modes);
    this.tray.setContextMenu(contextMenu);
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
        click: () =>
          this.pythonService.sendCommand({
            action: Action.TOGGLE,
            data: undefined,
            kind: "command",
          }),
      },
      {
        label: "Transcribe File",
        click: () => console.info("Transcribe File clicked"),
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
            console.info(`Switching to mode: ${mode.name}`);
            this.pythonService.sendCommand({
              action: Action.SWITCH_MODE,
              data: mode.id,
              kind: "command",
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
