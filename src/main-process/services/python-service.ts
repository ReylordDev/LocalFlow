import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig, consoleLog } from "../utils/config";
import {
  AudioLevel,
  Command,
  Devices,
  FormattedTranscripton,
  Message,
  ModelStatus,
  ProgressMessage,
  History,
} from "../../lib/models";
import path from "path";
import { AppSettings, SettingsService } from "./settings-service";

export class PythonService extends EventEmitter {
  private shell: PythonShell;
  private status: ModelStatus = {
    transcriber_status: "offline",
    formatter_status: "offline",
  };
  private activeRecording = false;

  constructor(
    private config: AppConfig,
    private settingsService: SettingsService
  ) {
    super();
    this.settingsService.on(
      "settings-changed",
      this.handleSettingsChange.bind(this)
    );
    setInterval(() => {
      this.sendCommand({ action: "model_status" } as Command);
    }, 5 * 1000); // 5 seconds in milliseconds
    setInterval(
      () => {
        if (
          this.status.formatter_status === "online" &&
          this.status.transcriber_status === "online"
        ) {
          consoleLog("Auto extending models");
          this.sendCommand({ action: "model_load" } as Command);
        }
      },
      14 * 60 * 1000
    ); // 14 minutes in milliseconds, should slightly undercut the keep_alive time of the models
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
        DEVELOPMENT: String(this.config.isDev),
        USER_DATA_PATH: this.config.dataDir,
        LOG_LEVEL: this.config.isDev ? "DEBUG" : "INFO",
      },
    });

    this.shell.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case "progress":
        this.handleProgress(message.data as ProgressMessage);
        break;
      case "formatted_transcription":
        this.emit(
          "transcription",
          (message.data as FormattedTranscripton).formatted_transcription
        );
        break;
      case "audio_level":
        this.emit("audio_level", (message.data as AudioLevel).audio_level);
        break;
      case "model_status":
        this.handleModelStatus(message);
        break;
      case "history":
        this.emit("history", (message.data as History).transcriptions);
        break;
      case "devices":
        this.emit("devices", (message.data as Devices).devices);
        break;
      case "raw_transcription":
        consoleLog("Raw Transcription:", message.data);
        break;
      case "error":
        consoleLog("Error:", message.data);
        break;
      case "exception":
        consoleLog("Exception:", message.data);
        break;
      default:
        consoleLog("Unknown message type:", message.type);
    }
  }

  private handleProgress(progress: ProgressMessage) {
    if (progress.step === "init" && progress.status === "complete") {
      this.emit("models-ready");
    }
    consoleLog(`Progress: ${progress.step} - ${progress.status}`);
  }

  private handleModelStatus(message: Message) {
    const newStatus = message.data as ModelStatus;
    if (
      this.status.formatter_status !== newStatus.formatter_status ||
      this.status.transcriber_status !== newStatus.transcriber_status
    ) {
      this.status = newStatus;
      this.emit("model-status", this.status);
    }
  }

  toggleRecording() {
    if (
      this.status.transcriber_status !== "online" ||
      this.status.formatter_status !== "online"
    ) {
      this.emit("error", "Models are not ready");
      return;
    }
    if (!this.activeRecording) {
      this.sendCommand({ action: "reset" } as Command);
      this.sendCommand({ action: "start" } as Command);
      this.emit("recording-start");
      this.activeRecording = true;
    } else {
      this.emit("recording-stop");
      this.sendCommand({ action: "stop" } as Command);
      this.activeRecording = false;
    }
  }

  private handleSettingsChange(settings: AppSettings) {
    this.sendCommand({
      action: "set_language",
      data: { language: settings.language },
    });
  }

  sendCommand(command: Command) {
    this.shell.send(command);
  }

  shutdown() {
    this.shell.kill();
  }
}
