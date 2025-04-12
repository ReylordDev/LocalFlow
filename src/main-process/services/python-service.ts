import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig, logger } from "../utils/config";
import {
  Message,
  ProgressMessage,
  StatusMessage,
} from "../../lib/models/messages";
import { Command, Request } from "../../lib/models/commands";
import path from "path";
import {
  ChannelFunctionTypeMap,
  ChannelType,
  PYTHON_SERVICE_EVENTS,
  PythonEventMap,
} from "../../lib/models/channels";
import { ControllerStatusType } from "../../lib/models/database";

// Define types for promise-based request handling
interface PendingRequest<C extends ChannelType> {
  resolve: (
    value:
      | Awaited<ReturnType<ChannelFunctionTypeMap[C]>>
      | ReturnType<ChannelFunctionTypeMap[C]>,
  ) => void;
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
  private pendingRequests: Map<string, PendingRequest<ChannelType>> = new Map();
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

  sendPythonRequest<C extends ChannelType>(request: Request & { channel: C }) {
    const promise = new Promise<ReturnType<ChannelFunctionTypeMap[C]>>(
      (resolve, reject) => {
        this.pendingRequests.set(request.id, {
          resolve: (value) => {
            resolve(value as ReturnType<ChannelFunctionTypeMap[C]>);
          },
          reject,
        });

        // Set a timeout to reject the promise if no response is received
        setTimeout(() => {
          if (this.pendingRequests.has(request.id)) {
            const pendingRequest = this.pendingRequests.get(request.id);
            if (pendingRequest) {
              pendingRequest.reject(
                new Error(`Request timed out: ${request.id}`),
              );
              this.pendingRequests.delete(request.id);
            }
          }
        }, 10000); // 10 second timeout
      },
    );

    this.sendCommand(request);
    return promise;
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
   * Generates a unique request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${this.requestId++}`;
  }

  private handleMessage(message: Message) {
    if (message.kind === "response") {
      if (this.pendingRequests.has(message.request_id)) {
        const pendingRequest = this.pendingRequests.get(message.request_id);
        if (pendingRequest) {
          pendingRequest.resolve(message.data);
          this.pendingRequests.delete(message.request_id);
          logger.debug(
            `Resolved request ${message.request_id} with type ${message.data}`,
          );
          return;
        }
      } else {
        logger.warn(
          `Request ID ${message.request_id} not found in pending requests`,
        );
      }
    } else if (message.kind === "update") {
      // Handle updates from the Python process
      switch (message.updateKind) {
        case "progress":
          this.handleProgressUpdate(message);
          break;
        case "status":
          this.handleStatusUpdate(message.status);
          break;
        case "audio_level":
          this.emitPythonEvent(
            PYTHON_SERVICE_EVENTS.AUDIO_LEVEL,
            message.audio_level,
          );
          break;
        case "error":
          logger.error("Error from Python backend:", message.error);
          this.emitPythonEvent(
            PYTHON_SERVICE_EVENTS.ERROR,
            new Error(message.error),
          );
          break;
        case "exception":
          logger.error("Exception from Python backend:", message.exception);
          break;
        case "result":
          logger.debug("Result from Python backend:", message.result);
          this.emitPythonEvent(PYTHON_SERVICE_EVENTS.RESULT, message.result);
          break;
        default:
          // eslint-disable-next-line no-case-declarations
          const _exhaustiveCheck: never = message;
          return _exhaustiveCheck; // Ensure all cases are handled
      }
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
   * Shuts down the Python process
   */
  shutdown() {
    logger.info("Shutting down Python service");
    this.shell.kill();
  }
}
