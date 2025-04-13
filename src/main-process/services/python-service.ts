import { PythonShell } from "python-shell";
import { EventEmitter } from "events";
import { AppConfig } from "../utils/config";
import { Message, ProgressMessage } from "../../lib/models/messages";
import {
  BaseRequest,
  Request,
  ResponselessCommand,
} from "../../lib/models/commands";
import path from "path";
import {
  PythonChannel,
  PythonEvents,
  PythonEventMap,
  PythonChannelFunction,
} from "../../lib/models/channels";
import { ControllerStatusType } from "../../lib/models/database";

// Define types for promise-based request handling
interface PendingRequest<C extends PythonChannel> {
  resolve: (
    value:
      | Awaited<ReturnType<PythonChannelFunction<C>>>
      | ReturnType<PythonChannelFunction<C>>,
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
  private pendingRequests: Map<string, PendingRequest<PythonChannel>> =
    new Map();
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
    console.info("Python shell initialized");
    console.debug("Script path:", this.config.scriptPath);
    console.debug("Python path:", this.config.pythonPath);
    console.debug(
      "Working directory:",
      this.config.isPackaged
        ? path.join(process.resourcesPath, "src-py")
        : this.config.rootDir,
    );
    console.debug("Environment variables:", {
      PRODUCTION: String(!this.config.isDev),
      USER_DATA_PATH: this.config.dataDir,
      LOG_LEVEL: this.config.isDev ? "DEBUG" : "INFO",
      PYTHONUTF8: "1",
    });

    this.shell.on("message", this.handleMessage.bind(this));
  }

  sendPythonRequest<C extends PythonChannel>(request: BaseRequest<C>) {
    const promise = new Promise<Awaited<ReturnType<PythonChannelFunction<C>>>>(
      (resolve, reject) => {
        this.pendingRequests.set(request.id, {
          // TODO: maybe this is bad
          resolve: (value) => {
            console.debug(`Resolving request ${request.id} with value:`, value);
            resolve(value as Awaited<ReturnType<PythonChannelFunction<C>>>);
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

    this.sendCommand(request as Request);
    return promise;
  }

  /**
   * Sends a command to the Python process
   *
   * @param command - The command to send
   */
  sendCommand(command: ResponselessCommand | Request) {
    console.debug("Sending command to Python:", command);
    this.shell.send({
      command,
    });
  }

  /**
   * Generates a unique request ID
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${this.requestId++}`;
  }

  private handleMessage(message: Message) {
    if (message.kind === "response") {
      console.debug("Received response from Python:", message);
      if (this.pendingRequests.has(message.id)) {
        const pendingRequest = this.pendingRequests.get(message.id);
        if (pendingRequest) {
          pendingRequest.resolve(message.data);
          this.pendingRequests.delete(message.id);
          console.debug(
            `Resolved request ${message.id} with type ${message.data}`,
          );
          return;
        }
      } else {
        console.warn(`Request ID ${message.id} not found in pending requests`);
      }
    } else if (message.kind === "update") {
      // Handle updates from the Python process
      console.debug("Received update from Python:", message);
      switch (message.updateKind) {
        case "progress":
          this.handleProgressUpdate(message);
          break;
        case "status":
          this.handleStatusUpdate(message.status);
          break;
        case "audio_level":
          this.emitPythonEvent(PythonEvents.AUDIO_LEVEL, message.audio_level);
          break;
        case "error":
          console.error("Error from Python backend:", message.error);
          this.emitPythonEvent(PythonEvents.ERROR, new Error(message.error));
          break;
        case "exception":
          console.error("Exception from Python backend:", message.exception);
          break;
        case "result":
          console.debug("Result from Python backend:", message.result);
          this.emitPythonEvent(PythonEvents.RESULT, message.result);
          break;
        case "transcription":
          this.emitPythonEvent(
            PythonEvents.TRANSCRIPTION,
            message.transcription,
          );
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
      console.info("Models initialization complete");
      this.emitPythonEvent(PythonEvents.MODELS_READY, void 0);
    }
  }

  /**
   * Handles status updates from the Python process
   *
   * @param status - Current status of the Python controller
   */
  private handleStatusUpdate(status: ControllerStatusType) {
    console.debug("Status update from Python backend:", status);
    this.emitPythonEvent(PythonEvents.STATUS_UPDATE, status);
  }

  /**
   * Shuts down the Python process
   */
  shutdown() {
    console.info("Shutting down Python service");
    this.shell.kill();
  }
}
