import path from "path";
import { app } from "electron";
import log from "electron-log";

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
    this.initializeLogger();
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
      ? path.join(process.resourcesPath, "src-py", "main.py")
      : path.join(this.rootDir, "src-py", "main.py");
  }

  get settingsPath() {
    return path.join(this.dataDir, "settings.json");
  }

  initializeLogger() {
    log.initialize();
    if (!app.isPackaged) {
      log.transports.file.resolvePathFn = () => {
        return path.join(this.rootDir, "logs", "electron.log");
      };
    }
    Object.assign(console, log.functions);
  }
}
