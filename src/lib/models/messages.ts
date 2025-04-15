// Message types for Python to Electron IPC
import { PythonChannelFunction, PythonChannel } from "./channels";
import { Result } from "./database";

// ---------- Update ----------

export interface ProgressMessage {
  step: "init";
  status: "start" | "complete" | "error";
  timestamp: number;
  updateKind: "progress";
}

export interface ExceptionMessage {
  exception: string;
  timestamp: number;
  updateKind: "exception";
}

export interface AudioLevelMessage {
  audio_level: number;
  updateKind: "audio_level";
}

export interface ErrorMessage {
  error: string;
  updateKind: "error";
}

export type ControllerStatusType =
  | "idle"
  | "recording"
  | "compressing"
  | "loading_voice_model"
  | "transcribing"
  | "loading_language_model"
  | "generating_ai_result"
  | "saving"
  | "result";

export interface StatusMessage {
  status: ControllerStatusType;
  updateKind: "status";
}

export interface ResultMessage {
  result: Result;
  updateKind: "result";
}

export interface TranscriptionMessage {
  transcription: string;
  updateKind: "transcription";
}

export type MessageType =
  | ProgressMessage
  | ExceptionMessage
  | AudioLevelMessage
  | ErrorMessage
  | StatusMessage
  | ResultMessage
  | TranscriptionMessage;

/**
 * A message from the Python process to the Electron process that was not explicitly requested.
 */
export type Update = MessageType & {
  kind: "update";
};

// ---------- Response ----------

interface BaseResponse<C extends PythonChannel> {
  data: Awaited<ReturnType<PythonChannelFunction<C>>>;
  channel: C;
  id: string;
  kind: "response";
}

/**
 * A response from the Python process to the Electron process that was explicitly requested.
 */
export type Response = {
  [C in PythonChannel]: BaseResponse<C>;
}[PythonChannel];

// ---------- Message ----------

/**
 * A message from the Python process to the Electron process.
 */
export type Message = Response | Update;
