import { Tray, Menu, NativeImage, nativeImage, app } from "electron";
import { PythonService } from "../services/python-service";
import { WindowManager } from "../windows/window-manager";
import { AppConfig } from "../utils/config";
import { SettingsService } from "../services/settings-service";
import path from "path";

export class TrayManager {
  private tray: Tray;

  constructor(
    private config: AppConfig,
    private windowManager: WindowManager,
    private pythonService: PythonService,
    private settingsService: SettingsService
  ) {}

  initialize() {
    this.createTrayIcon();
    this.updateContextMenu();
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
        path.join(process.resourcesPath, "assets/icons", image)
      );
    } else {
      icon = nativeImage.createFromPath(
        path.join(this.config.rootDir, "assets/icons", image)
      );
    }
    this.tray = new Tray(icon);

    this.tray.on("click", () => {
      this.windowManager.toggleMainWindow();
    });

    this.tray.setToolTip("LocalFlow");
  }

  updateContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Toggle Recording",
        click: () => this.pythonService.toggleRecording(),
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
