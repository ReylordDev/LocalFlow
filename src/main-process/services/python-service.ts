import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig, logger } from "../utils/config";
import { Message, ProgressMessage } from "../../lib/models/messages";
import { Action, Command, ResponseTypeFor } from "../../lib/models/commands";
import path from "path";
import {
  PYTHON_SERVICE_EVENTS,
  PythonEventMap,
} from "../../lib/models/channels";
import { ControllerStatusType } from "../../lib/models/database";

// Define types for promise-based request handling
interface PendingRequest<A extends Action> {
  resolve: (value: ResponseTypeFor<A>) => void;
  reject: (reason?: unknown) => void;
}

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
  private pendingRequests: Map<string, PendingRequest<Action>> = new Map();
  private requestId = 0;

  /**
   * Registers an event listener for the specified event
   *
   * @param eventName - The name of the event to listen for
   * @param callback - Function to call when the event is emitted
   */
  onPythonEvent<K extends keyof PythonEventMap>(
    eventName: K,
    callback: (data: PythonEventMap[K]) => void,
  ): void {
    this.on(eventName, callback);
  }

  /**
   * Emits an event with the specified name and data
   *
   * @param eventName - The name of the event to emit
   * @param data - The data to pass to listeners (type depends on eventName)
   */
  emitPythonEvent<K extends keyof PythonEventMap>(
    eventName: K,
    data: PythonEventMap[K],
  ): void {
    this.emit(eventName, data);
  }

  /**
   * Creates a new PythonService instance
   *
   * @param config - Application configuration settings
   * @param settingsService - Service for handling application settings
   */
  constructor(private config: AppConfig) {
    super();
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
   * Sends a command to the Python process and returns a promise
   * that resolves when a response with the specified type is received
   *
   * @param command - The command to send
   * @returns A promise that resolves with the response data
   */
  async sendCommandWithResponse<A extends Command["action"]>(
    command: Command & { action: A },
  ): Promise<ResponseTypeFor<A>> {
    const requestId = this.generateRequestId();
    command.request_id = requestId; // Attach the request ID to the command

    const promise = new Promise<ResponseTypeFor<A>>((resolve, reject) => {
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
      });

      // Set a timeout to reject the promise if no response is received
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          const request = this.pendingRequests.get(requestId);
          if (request) {
            request.reject(new Error(`Request timed out: ${requestId}`));
            this.pendingRequests.delete(requestId);
          }
        }
      }, 10000); // 10 second timeout
    });

    this.sendCommand(command);
    return promise;
  }

  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${this.requestId++}`;
  }

  /**
   * Handles messages received from the Python process
   * and routes them to the appropriate handler
   *
   * @param message - Message received from Python process
   */
  private handleMessage(message: Message) {
    // Handle promise resolution if this is a response to a request
    if (message.request_id && this.pendingRequests.has(message.request_id)) {
      const request = this.pendingRequests.get(message.request_id);
      if (request) {
        request.resolve(message.data);
        this.pendingRequests.delete(message.request_id);
        logger.debug(
          `Resolved request ${message.request_id} with type ${message.data}`,
        );
        return;
      }
    } else if (message.request_id) {
      // If the request ID is not found in pending requests, log a warning
      logger.warn(
        `Request ID ${message.request_id} not found in pending requests`,
      );
    } else if (!message.request_id) {
      // Handle messages without a request ID (e.g., progress updates, status updates)
      logger.debug("Received message without request ID from Python:", message);
      if (message.type && message.type === "progress") {
        this.handleProgressUpdate(message);
      } else if (message.type && message.type === "status") {
        this.handleStatusUpdate(message.data.status);
      }
    }
    return;
    // switch (message.type) {
    //   case "progress":
    //     this.handleProgressUpdate(message.type as ProgressMessage);
    //     break;
    //     this.handleStatusUpdate(message.data.status);
    //   case "status":
    //     this.handleStatusUpdate((message.type as StatusMessage).status);
    //     break;
    //   case "transcription":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.AUDIO_LEVEL,
    //       (message.type as AudioLevelMessage).audio_level,
    //     );
    //     break;
    //   case "devices":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.DEVICES,
    //       (message.type as DevicesMessage).devices,
    //     );
    //     break;
    //   case "error":
    //     logger.error("Error from Python backend:", message.type);
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.ERROR,
    //       new Error((message.type as ErrorMessage).error),
    //     );
    //     break;
    //   case "exception":
    //     logger.error("Exception from Python backend:", message.type);
    //     break;
    //   case "modes":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.MODES,
    //       (message.type as ModesMessage).modes,
    //     );
    //     break;
    //   case "result":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.RESULT,
    //       (message.type as ResultMessage).result,
    //     );
    //     break;
    //   case "results":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.RESULTS,
    //       (message.type as ResultsMessage).results,
    //     );
    //     break;
    //   case "voice_models":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.VOICE_MODELS,
    //       (message.type as VoiceModelsMessage).voice_models,
    //     );
    //     break;
    //   case "language_models":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.LANGUAGE_MODELS,
    //       (message.type as LanguageModelsMessage).language_models,
    //     );
    //     break;
    //   case "text_replacements":
    //     this.emitPythonEvent(
    //       PYTHON_SERVICE_EVENTS.TEXT_REPLACEMENTS,
    //       (message.type as TextReplacementsMessage).text_replacements,
    //     );

    //     break;
    //   default:
    //     logger.warn("Unknown message type:", message.data);
    // }
  }

  /**
   * Handles progress updates from the Python process
   *
   * @param progress - Progress update information
   */
  private handleProgressUpdate(progress: ProgressMessage) {
    if (progress.step === "init" && progress.status === "complete") {
      logger.info("Models initialization complete");
      this.emitPythonEvent(PYTHON_SERVICE_EVENTS.MODELS_READY, void 0);
    }
  }

  /**
   * Handles status updates from the Python process
   *
   * @param status - Current status of the Python controller
   */
  private handleStatusUpdate(status: ControllerStatusType) {
    logger.debug("Status update from Python backend:", status);
    this.emitPythonEvent(PYTHON_SERVICE_EVENTS.STATUS_UPDATE, status);
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
