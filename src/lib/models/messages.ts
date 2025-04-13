// Message types for Python to Electron IPC
import { PythonChannelFunction, PythonChannel } from "./channels";
import { ControllerStatusType, Result } from "./database";

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

interface BaseResponse<C extends PythonChannel> {
  data: Awaited<ReturnType<PythonChannelFunction<C>>>;
  channel: C;
  id: string;
  kind: "response";
}

export type Response = {
  [C in PythonChannel]: BaseResponse<C>;
}[PythonChannel];

export type Update = MessageType & {
  kind: "update";
};

export type Message = Response | Update;
