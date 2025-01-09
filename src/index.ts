import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  globalShortcut,
  clipboard,
  Notification,
} from "electron";
import log from "electron-log/main";
import path from "path";
import { PythonShell } from "python-shell";
import {
  Message,
  ProgressMessage,
  Command,
  FormattedTranscripton,
  ModelStatus,
} from "./lib/models";
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MINI_WEBPACK_ENTRY: string;
declare const MINI_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}
const isDev = () => {
  return process.env["WEBPACK_SERVE"] === "true";
};

let rootDir = path.join(__dirname, "..", "..");
let dataDir = rootDir;
// TODO: add prod version
const pythonPath = path.join(rootDir, "src-py", "controller.py");
// TODO: add linux version
const venvPath = path.join(rootDir, ".venv", "Scripts", "python.exe");
if (!isDev()) {
  // Production
  rootDir = path.join(__dirname, "..", "..", "..", "..");
  dataDir = app.getPath("userData");
  console.log = log.log;
  console.error = log.error;
}

app.setAppLogsPath(path.join(dataDir, "logs"));

console.log(`Root directory: ${rootDir}`);
console.log(`Data directory: ${dataDir}`);

let miniWindow: BrowserWindow;

// temp
let activeRecording = false;

const createMainWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  // mainWindow.hide();

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow.destroy();
    if (miniWindow) {
      miniWindow.destroy();
    }
  });
  return mainWindow;
};

const createMiniWindow = (pyShell: PythonShell) => {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;
  const height = 40;
  const width = 128;

  const centerX = screenWidth / 2;
  const centerY = screenHeight - height - 60;

  const miniWindow = new BrowserWindow({
    frame: false,
    width: width,
    height: height,
    // width: 400,
    // height: 400,
    x: centerX,
    y: centerY,
    useContentSize: true,
    transparent: true,
    alwaysOnTop: true,
    hiddenInMissionControl: true,
    webPreferences: {
      preload: MINI_PRELOAD_WEBPACK_ENTRY,
    },
  });
  miniWindow.hide();

  // and load the index.html of the app.
  miniWindow.loadURL(MINI_WEBPACK_ENTRY);

  // miniWindow.webContents.openDevTools();

  // register the start / stop shortcut
  globalShortcut.register("Alt+CommandOrControl+Y", () => {
    // if (miniWindow.isVisible()) {
    if (activeRecording) {
      miniWindow.hide();
      pyShell.send({ action: "stop" } as Command);
      activeRecording = false;
    } else {
      miniWindow.showInactive();
      pyShell.send({ action: "reset" } as Command);
      pyShell.send({ action: "start" } as Command);
      activeRecording = true;
    }
  });
  return miniWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", main);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

function main() {
  const mainWindow = createMainWindow();

  const pyshell = new PythonShell(pythonPath, {
    cwd: rootDir,
    mode: "json",
    pythonPath: venvPath,
  });

  miniWindow = createMiniWindow(pyshell);

  pyshell.on("message", (message: Message) => {
    if (message.type === "progress") {
      const progressMessage = message.data as ProgressMessage;
      console.log(
        `Progress: ${progressMessage.step} - ${progressMessage.status}`
      );
      return;
    }
    if (message.type === "formatted_transcription") {
      console.log("Message", message);
      mainWindow.webContents.send(
        "controller:transcription",
        message.data as FormattedTranscripton
      );
      if (miniWindow) {
        miniWindow.webContents.send(
          "controller:transcription",
          message.data as FormattedTranscripton
        );
      }
      console.log("Transcription complete");
      return;
    }
    if (message.type === "audio_level") {
      mainWindow.webContents.send("controller:audioLevel", message.data);
      if (miniWindow) {
        miniWindow.webContents.send("controller:audioLevel", message.data);
      }
      return;
    }
    if (message.type === "model_status") {
      mainWindow.webContents.send("controller:modelStatus", message.data);
      return;
    }
    console.log("Message", message);
  });

  ipcHandling(pyshell);
}

function ipcHandling(pyShell: PythonShell) {
  ipcMain.on("controller:start", async () => {
    console.log("Starting controller");
    pyShell.send({ action: "start" } as Command);
  });

  ipcMain.on("controller:stop", async () => {
    console.log("Stopping controller");
    pyShell.send({ action: "stop" } as Command);
  });

  ipcMain.on("controller:reset", async () => {
    console.log("Resetting controller");
    pyShell.send({ action: "reset" } as Command);
  });

  ipcMain.handle("controller:loadModels", async () => {
    console.log("Loading models");
    pyShell.send({
      action: "model_load",
    } as Command);
  });

  ipcMain.handle("controller:unloadModels", async () => {
    console.log("Unloading models");
    pyShell.send({
      action: "model_unload",
    } as Command);
  });

  ipcMain.on("controller:requestAudioLevel", async () => {
    pyShell.send({
      action: "audio_level",
    } as Command);
  });

  ipcMain.on("controller:requestModelStatus", async () => {
    pyShell.send({
      action: "model_status",
    } as Command);
  });

  ipcMain.on("controller:loadModels", async () => {
    console.log("Loading models");
    pyShell.send({
      action: "model_load",
    } as Command);
  });

  ipcMain.on("controller:unloadModels", async () => {
    console.log("Unloading models");
    pyShell.send({
      action: "model_unload",
    } as Command);
  });
  // Could add the formatter/transcriber load /unload

  ipcMain.on("controller:quit", async () => {
    console.log("Quitting controller");
    pyShell.send({ action: "quit" } as Command);
  });

  // Clipboard
  ipcMain.handle("clipboard:writeText", (_, text: string) => {
    clipboard.writeText(text);
  });

  ipcMain.handle("clipboard:readText", () => {
    return clipboard.readText();
  });
}

declare global {
  interface Window {
    controller: {
      isInitialized: () => Promise<boolean>;
      onSetInitialized: (callback: (initialized: boolean) => void) => void;
      start: () => void;
      stop: () => void;
      reset: () => void;
      loadModels: () => void;
      unloadModels: () => void;
      requestAudioLevel: () => void;
      onReceiveAudioLevel: (callback: (audioLevel: number) => void) => void;
      requestModelStatus: () => void;
      onReceiveModelStatus: (callback: (status: ModelStatus) => void) => void;
      onReceiveTranscription: (
        callback: (transcription: FormattedTranscripton) => void
      ) => void;
      quit: () => void;
    };
    clipboard: {
      writeText: (text: string) => void;
      readText: () => Promise<string>;
    };
  }
}
