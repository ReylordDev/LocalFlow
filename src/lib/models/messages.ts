// Message types for Python to Electron IPC
import { ChannelFunctionType, ChannelType } from "./channels";
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

export type MessageType =
  | ProgressMessage
  | ExceptionMessage
  | AudioLevelMessage
  | ErrorMessage
  | StatusMessage
  | ResultMessage;

interface BaseResponse<C extends ChannelType> {
  data: Awaited<ReturnType<ChannelFunctionType<C>>>;
  channel: C;
  request_id: string;
  kind: "response";
}

export type Response = {
  [C in ChannelType]: BaseResponse<C>;
}[ChannelType];

export type Update = MessageType & {
  kind: "update";
};

export type Message = Response | Update;
