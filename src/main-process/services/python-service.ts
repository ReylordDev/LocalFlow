import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig, logger } from "../utils/config";
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

/**
 * Service for managing communication with the Python backend.
 * Handles initialization of Python shell, sending commands,
 * and processing messages received from the Python process.
 *
 * Extends EventEmitter to provide event-based communication
 * between the python service and the main process.
 */
export class PythonService extends EventEmitter {
  private shell!: PythonShell; // Using definite assignment assertion
  private activeRecording = false;

  /**
   * Creates a new PythonService instance
   *
   * @param config - Application configuration settings
   * @param settingsService - Service for handling application settings
   */
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

  /**
   * Initializes the Python shell with the appropriate configuration
   * and sets up the message handler
   */
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
    logger.info("Python shell initialized");
    logger.debug("Script path:", this.config.scriptPath);
    logger.debug("Python path:", this.config.pythonPath);
    logger.debug(
      "Working directory:",
      this.config.isPackaged
        ? path.join(process.resourcesPath, "src-py")
        : this.config.rootDir,
    );
    logger.debug("Environment variables:", {
      PRODUCTION: String(!this.config.isDev),
      USER_DATA_PATH: this.config.dataDir,
      LOG_LEVEL: this.config.isDev ? "DEBUG" : "INFO",
      PYTHONUTF8: "1",
    });

    this.shell.on("message", this.handleMessage.bind(this));
  }

  /**
   * Handles messages received from the Python process
   * and routes them to the appropriate handler
   *
   * @param message - Message received from Python process
   */
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
        logger.error("Error from Python backend:", message.data);
        this.emit(
          PYTHON_SERVICE_EVENTS.ERROR,
          (message.data as unknown as ErrorMessage).error,
        );
        break;
      case "exception":
        logger.error("Exception from Python backend:", message.data);
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
        logger.warn("Unknown message type:", message.type);
    }
  }

  /**
   * Handles progress updates from the Python process
   *
   * @param progress - Progress update information
   */
  private handleProgressUpdate(progress: ProgressMessage) {
    if (progress.step === "init" && progress.status === "complete") {
      logger.info("Models initialization complete");
      this.emit(PYTHON_SERVICE_EVENTS.MODELS_READY);
    }
  }

  /**
   * Handles status updates from the Python process
   *
   * @param status - Current status of the Python controller
   */
  private handleStatusUpdate(status: ControllerStatusType) {
    logger.debug("Status update from Python backend:", status);
    this.emit(PYTHON_SERVICE_EVENTS.STATUS_UPDATE, status);
  }

  /**
   * Toggles recording state and sends the toggle command to the Python process
   */
  toggleRecording() {
    this.sendCommand({ action: "toggle" } as Command);
    this.activeRecording = !this.activeRecording;
    logger.info(`Recording ${this.activeRecording ? "started" : "stopped"}`);
  }

  /**
   * Handles settings changes from the settings service
   *
   * @param settings - Updated application settings
   */
  private handleSettingsChange(settings: AppSettings) {
    logger.debug("Settings changed:", settings);
    logger.warn("Settings change handler not implemented yet.");
  }

  /**
   * Sends a command to the Python process
   *
   * @param command - The command to send
   */
  sendCommand(command: Command) {
    logger.debug("Sending command to Python:", command);
    this.shell.send(command);
  }

  /**
   * Shuts down the Python process
   */
  shutdown() {
    logger.info("Shutting down Python service");
    this.shell.kill();
  }
}
