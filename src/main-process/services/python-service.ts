import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig, consoleLog } from "../utils/config";
import {
  AudioLevelMessage,
  Command,
  DevicesMessage,
  Message,
  ProgressMessage,
  AppSettings,
  PYTHON_SERVICE_EVENTS,
  ErrorMessage,
  StatusMessage,
  ControllerStatusType,
  ModesMessage,
  ResultMessage,
  ResultsMessage,
  VoiceModelsMessage,
  LanguageModelsMessage,
  TextReplacementsMessage,
  TranscriptionMessage,
} from "../../lib/models";
import path from "path";
import { SettingsService } from "./settings-service";

export class PythonService extends EventEmitter {
  private shell: PythonShell;
  private activeRecording = false;

  constructor(
    private config: AppConfig,
    private settingsService: SettingsService,
  ) {
    super();
    this.settingsService.on(
      "settings-changed",
      this.handleSettingsChange.bind(this),
    );
  }

  async initialize() {
    this.shell = new PythonShell(this.config.scriptPath, {
      pythonPath: this.config.pythonPath,
      cwd: this.config.isPackaged
        ? path.join(process.resourcesPath, "src-py")
        : this.config.rootDir,
      mode: "json",
      env: {
        ...process.env,
        PRODUCTION: String(!this.config.isDev),
        USER_DATA_PATH: this.config.dataDir,
        LOG_LEVEL: this.config.isDev ? "DEBUG" : "INFO",
        PYTHONUTF8: "1",
      },
    });
    consoleLog("Python shell initialized");
    consoleLog("Script path:", this.config.scriptPath);
    consoleLog("Python path:", this.config.pythonPath);
    consoleLog(
      "Working directory:",
      this.config.isPackaged
        ? path.join(process.resourcesPath, "src-py")
        : this.config.rootDir,
    );
    consoleLog("Environment variables:", {
      PRODUCTION: String(!this.config.isDev),
      USER_DATA_PATH: this.config.dataDir,
      LOG_LEVEL: this.config.isDev ? "DEBUG" : "INFO",
      PYTHONUTF8: "1",
    });

    this.shell.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case "progress":
        this.handleProgressUpdate(message.data as ProgressMessage);
        break;
      case "status":
        this.handleStatusUpdate((message.data as StatusMessage).status);
        break;
      case "transcription":
        this.emit(
          PYTHON_SERVICE_EVENTS.TRANSCRIPTION,
          (message.data as TranscriptionMessage).transcription,
        );
        break;
      case "audio_level":
        this.emit(
          PYTHON_SERVICE_EVENTS.AUDIO_LEVEL,
          (message.data as AudioLevelMessage).audio_level,
        );
        break;
      case "devices":
        this.emit(
          PYTHON_SERVICE_EVENTS.DEVICES,
          (message.data as DevicesMessage).devices,
        );
        break;
      case "error":
        consoleLog("Error:", message.data);
        this.emit(
          PYTHON_SERVICE_EVENTS.ERROR,
          (message.data as unknown as ErrorMessage).error,
        );
        break;
      case "exception":
        consoleLog("Exception:", message.data);
        break;
      case "modes":
        this.emit(
          PYTHON_SERVICE_EVENTS.MODES,
          (message.data as ModesMessage).modes,
        );
        break;
      case "modes_update":
        this.emit(
          PYTHON_SERVICE_EVENTS.MODES_UPDATE,
          (message.data as ModesMessage).modes,
        );
        break;
      case "result":
        this.emit(
          PYTHON_SERVICE_EVENTS.RESULT,
          (message.data as ResultMessage).result,
        );
        break;
      case "results":
        this.emit(
          PYTHON_SERVICE_EVENTS.RESULTS,
          (message.data as ResultsMessage).results,
        );
        break;
      case "voice_models":
        this.emit(
          PYTHON_SERVICE_EVENTS.VOICE_MODELS,
          (message.data as VoiceModelsMessage).voice_models,
        );
        break;
      case "language_models":
        this.emit(
          PYTHON_SERVICE_EVENTS.LANGUAGE_MODELS,
          (message.data as LanguageModelsMessage).language_models,
        );
        break;
      case "text_replacements":
        this.emit(
          PYTHON_SERVICE_EVENTS.TEXT_REPLACEMENTS,
          (message.data as TextReplacementsMessage).text_replacements,
        );
        break;
      default:
        consoleLog("Unknown message type:", message.type);
    }
  }

  private handleProgressUpdate(progress: ProgressMessage) {
    if (progress.step === "init" && progress.status === "complete") {
      this.emit(PYTHON_SERVICE_EVENTS.MODELS_READY);
    }
  }

  private handleStatusUpdate(status: ControllerStatusType) {
    this.emit(PYTHON_SERVICE_EVENTS.STATUS_UPDATE, status);
  }

  toggleRecording() {
    this.sendCommand({ action: "toggle" } as Command);
    this.activeRecording = !this.activeRecording;
  }

  private handleSettingsChange(settings: AppSettings) {
    consoleLog("Settings changed:", settings);
    consoleLog("Not implemented yet.");
  }

  sendCommand(command: Command) {
    consoleLog("Sending command to Python:", command);
    this.shell.send(command);
  }

  shutdown() {
    this.shell.kill();
  }
}
