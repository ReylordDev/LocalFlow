import {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  globalShortcut,
  clipboard,
  Tray,
  Menu,
  nativeImage,
  Notification,
  shell,
} from "electron";
import log from "electron-log/main";
import path from "path";
import fs from "fs";
import { PythonShell } from "python-shell";
import {
  Message,
  ProgressMessage,
  Command,
  FormattedTranscripton,
  ModelStatus,
  Transcriptions,
} from "./lib/models";
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MINI_WEBPACK_ENTRY: string;
declare const MINI_PRELOAD_WEBPACK_ENTRY: string;
declare const STARTUP_WEBPACK_ENTRY: string;
declare const STARTUP_PRELOAD_WEBPACK_ENTRY: string;

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
let tray: Tray;
let modelStatus: ModelStatus = {
  transcriber_status: "offline",
  formatter_status: "offline",
};
let globalPyShell: PythonShell;

// temp
let activeRecording = false;

const settingsPath = path.join(dataDir, "settings.json");
const defaultSettings = {
  "start-shortcut": "Alt+CommandOrControl+Y",
  language: "",
};

if (!fs.existsSync(settingsPath)) {
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings));
}
const settings = JSON.parse(fs.readFileSync(settingsPath).toString());

const createMainWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 1024,
    width: 1440,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    show: false,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

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
  const width = 160;

  const centerX = screenWidth / 2 - width / 2;
  const centerY = screenHeight - height - 60;

  const miniWindow = new BrowserWindow({
    frame: false,
    width: width,
    height: height,
    // width: 1024,
    // height: 1024,
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
  registerStartShortcut(pyShell, settings["start-shortcut"]);

  return miniWindow;
};

const createStartupWindow = () => {
  // Create the browser window.
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

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  return startupWindow;
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

app.on("quit", () => {
  globalShortcut.unregisterAll();
  globalPyShell.send({ action: "quit" } as Command);
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
  const startupWindow = createStartupWindow();

  const pyShell = new PythonShell(pythonPath, {
    cwd: rootDir,
    mode: "json",
    pythonPath: venvPath,
  });
  globalPyShell = pyShell;

  let mainWindow: BrowserWindow;
  miniWindow = createMiniWindow(pyShell);

  pyShell.on("message", (message: Message) => {
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
      if (miniWindow) {
        miniWindow.webContents.send("controller:audioLevel", message.data);
      }
      return;
    }
    if (message.type === "model_status") {
      const newModelStatus = message.data as ModelStatus;
      console.log("Model status", newModelStatus);

      // TODO: move this back into progress message
      if (!startupWindow.isDestroyed()) {
        if (
          newModelStatus.formatter_status === "online" &&
          newModelStatus.transcriber_status === "online"
        ) {
          startupWindow.close();
          mainWindow = createMainWindow();
          setupTrayIcon(mainWindow, pyShell);
          return;
        }
      } else {
        if (
          modelStatus.formatter_status !== newModelStatus.formatter_status ||
          modelStatus.transcriber_status !== newModelStatus.transcriber_status
        ) {
          console.log("Model status changed", newModelStatus);
          modelStatus = newModelStatus;
          mainWindow.webContents.send("controller:modelStatus", modelStatus);
          tray.setContextMenu(constructTrayContextMenu(pyShell));
        } else {
          mainWindow.webContents.send("controller:modelStatus", modelStatus);
        }
      }

      return;
    }
    if (message.type === "transcriptions") {
      mainWindow.webContents.send("controller:transcriptions", message.data);
      return;
    }
    console.log("Message", message);
  });

  ipcHandling(pyShell);
  requestModelStatusPeriodically(pyShell);
  autoExtendModels(pyShell);
}

function ipcHandling(pyShell: PythonShell) {
  ipcMain.on("controller:start", async () => {
    console.log("Starting transcription");
    pyShell.send({ action: "start" } as Command);
  });

  ipcMain.on("controller:stop", async () => {
    console.log("Stopping transcription");
    pyShell.send({ action: "stop" } as Command);
  });

  // unclear
  ipcMain.on("controller:reset", async () => {
    console.log("Resetting transcription");
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

  ipcMain.on("controller:getTranscriptions", async () => {
    console.log("Getting transcriptions");
    pyShell.send({
      action: "get_transcriptions",
    } as Command);
  });

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

  // Start Shortcut
  ipcMain.handle("start-shortcut:get", () => {
    return settings["start-shortcut"];
  });

  ipcMain.handle("start-shortcut:set", (_, shortcut: string) => {
    settings["start-shortcut"] = shortcut;
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
    registerStartShortcut(pyShell, shortcut);
    return shortcut;
  });

  ipcMain.on("start-shortcut:disable", () => {
    globalShortcut.unregisterAll();
  });

  // Language
  ipcMain.handle("language:get", () => {
    return settings["language"];
  });

  ipcMain.handle("language:set", (_, language: string) => {
    if (language === "auto") {
      language = "";
    }
    settings["language"] = language;
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
    pyShell.send({
      action: "set_language",
      data: { language: language },
    } as Command);
    return language;
  });

  // URL
  ipcMain.handle("url:open", (_, url: string) => {
    shell.openExternal(url);
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
      getTranscriptions: () => void;
      onReceiveTranscriptions: (
        callback: (transcriptions: Transcriptions) => void
      ) => void;
      quit: () => void;
    };
    clipboard: {
      writeText: (text: string) => void;
      readText: () => Promise<string>;
    };
    startShortcut: {
      get: () => Promise<string>;
      set: (shortcut: string) => Promise<string>;
      disable: () => void;
    };
    language: {
      get: () => Promise<string>;
      set: (language: string) => Promise<string>;
    };
    url: {
      open: (url: string) => void;
    };
    mini: {
      onRecordingStart: (callback: () => void) => void;
      onRecordingStop: (callback: () => void) => void;
    };
  }
}

function setupTrayIcon(mainWindow: BrowserWindow, pyShell: PythonShell) {
  let image: string;
  if (process.platform === "win32") {
    image = "icon.ico";
  } else {
    // Untested
    image = "icon_16.png";
  }
  const icon = nativeImage.createFromPath(
    path.join(rootDir, "assets/icons", image)
  );
  tray = new Tray(icon);

  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });

  const contextMenu = constructTrayContextMenu(pyShell);

  tray.setToolTip("LocalFlow");
  tray.setContextMenu(contextMenu);
}

function requestModelStatusPeriodically(pyShell: PythonShell) {
  setInterval(() => {
    // console.log("Periodic model status request");
    pyShell.send({ action: "model_status" } as Command);
  }, 5 * 1000); // 5 seconds in milliseconds
}

function autoExtendModels(pyShell: PythonShell) {
  setInterval(
    () => {
      if (
        modelStatus.formatter_status === "online" &&
        modelStatus.transcriber_status === "online"
      ) {
        console.log("Auto extending models");
        pyShell.send({ action: "model_load" } as Command);
      }
    },
    14 * 60 * 1000
  ); // 14 minutes in milliseconds, should slightly undercut the keep_alive time of the models
}

function toggleRecording(pyShell: PythonShell) {
  if (
    modelStatus.transcriber_status !== "online" ||
    modelStatus.formatter_status !== "online"
  ) {
    console.log("Models not loaded");
    new Notification({
      title: "Error",
      body: "Models are not loaded. Please load the models before starting the recording.",
    }).show();
    return;
  }
  if (!activeRecording) {
    miniWindow.showInactive();
    pyShell.send({ action: "reset" } as Command);
    pyShell.send({ action: "start" } as Command);
    activeRecording = true;
    miniWindow.webContents.send("mini:recordingStart");
  } else {
    miniWindow.webContents.send("mini:recordingStop");
    miniWindow.hide();
    pyShell.send({ action: "stop" } as Command);
    activeRecording = false;
  }
}

function constructTrayContextMenu(pyShell: PythonShell) {
  return Menu.buildFromTemplate([
    {
      label: "Toggle Recording",
      click: () => toggleRecording(pyShell),
    },
    // {
    //   label:
    //     modelStatus.transcriber_status === "online" &&
    //     modelStatus.formatter_status === "online"
    //       ? "Unload Models"
    //       : "Load Models",
    //   click: () => {
    //     if (
    //       modelStatus.transcriber_status === "online" &&
    //       modelStatus.formatter_status === "online"
    //     ) {
    //       pyShell.send({ action: "model_unload" } as Command);
    //     } else {
    //       pyShell.send({ action: "model_load" } as Command);
    //     }
    //   },
    // },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);
}

function registerStartShortcut(pyShell: PythonShell, shortcut: string) {
  globalShortcut.unregisterAll(); // Unregister all shortcuts (for now) can be improved by using the global variable.

  globalShortcut.register(shortcut, () => {
    toggleRecording(pyShell);
  });
}
