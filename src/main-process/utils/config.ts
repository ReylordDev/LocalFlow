import path from "path";
import { app } from "electron";
import log from "electron-log";

// Unified logger that handles both packaged and development environments
export const logger = app.isPackaged ? log : console;

export class AppConfig {
  readonly isPackaged: boolean;
  readonly isDev: boolean;
  readonly rootDir: string;
  readonly dataDir: string;

  constructor() {
    this.isPackaged = app.isPackaged;
    this.isDev = process.env.WEBPACK_SERVE === "true";
    this.rootDir = this.isPackaged
      ? process.resourcesPath
      : path.join(__dirname, "..", "..");
    this.dataDir = this.isPackaged ? app.getPath("userData") : this.rootDir;
    app.setAppLogsPath(path.join(this.dataDir, "logs"));
  }

  get pythonPath() {
    if (this.isPackaged) {
      const basePath = path.join(process.resourcesPath, ".venv");
      switch (process.platform) {
        case "win32":
          return path.join(basePath, "Scripts", "python.exe");
        case "darwin":
          return path.join(basePath, "bin", "python3");
        case "linux":
          return path.join(basePath, "bin", "python3");
        default:
          throw new Error("Unsupported platform");
      }
    }
    return process.platform === "win32"
      ? path.join(this.rootDir, ".venv", "Scripts", "python.exe")
      : path.join(this.rootDir, ".venv", "bin", "python3");
  }

  get scriptPath() {
    return this.isPackaged
      ? path.join(process.resourcesPath, "src-py", "controller.py")
      : path.join(this.rootDir, "src-py", "controller.py");
  }

  get settingsPath() {
    return path.join(this.dataDir, "settings.json");
  }
}
