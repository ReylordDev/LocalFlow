import { Tray, Menu, NativeImage, nativeImage, app } from "electron";
import { PythonService } from "../services/python-service";
import { WindowManager } from "./window-manager";
import { AppConfig, logger } from "../utils/config";
import { SettingsService } from "../services/settings-service";
import path from "path";
import { Mode, PYTHON_SERVICE_EVENTS } from "../../lib/models";

export class TrayManager {
  private tray: Tray;

  constructor(
    private config: AppConfig,
    private windowManager: WindowManager,
    private pythonService: PythonService,
    private settingsService: SettingsService,
  ) {}

  initialize() {
    this.createTrayIcon();

    this.tray.on("click", () => {
      this.windowManager.toggleMiniWindow();
    });

    logger.info("Requesting modes from database for context menu");
    this.updateContextMenu([]);
    this.pythonService.sendCommand({
      action: "get_modes",
    });
    this.pythonService.on(PYTHON_SERVICE_EVENTS.MODES, (modes: Mode[]) => {
      logger.info("Received modes from database for context menu");
      this.updateContextMenu(modes);
    });
  }

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
    this.tray = new Tray(icon);

    this.tray.setToolTip("LocalFlow");
  }

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
              data: {
                mode_id: mode.id,
              },
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
    this.tray.setContextMenu(contextMenu);
  }
}
