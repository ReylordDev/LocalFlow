// Message types for Python to Electron IPC
import { Action, ResponseTypeFor } from "./commands";
import {
  ControllerStatusType,
  Device,
  LanguageModel,
  Mode,
  Result,
  TextReplacement,
  VoiceModel,
} from "./database";

export interface ProgressMessage {
  step: Action | "init" | "recording" | "compression" | "transcription";
  status: "start" | "complete" | "error";
  timestamp: number;
}

export interface ExceptionMessage {
  exception: string;
  timestamp: number;
}

export interface TranscriptionMessage {
  transcription: string;
}

export interface AudioLevelMessage {
  audio_level: number;
}

export interface ErrorMessage {
  error: string;
}

export interface DevicesMessage {
  devices: Device[];
}

export interface ModesMessage {
  modes: Mode[];
}

export interface StatusMessage {
  status: ControllerStatusType;
}

export interface ResultMessage {
  result: Result;
}

export interface ResultsMessage {
  results: Result[];
}

export interface VoiceModelsMessage {
  voice_models: VoiceModel[];
}

export interface LanguageModelsMessage {
  language_models: LanguageModel[];
}

export interface TextReplacementsMessage {
  text_replacements: TextReplacement[];
}

interface BaseMessage<A extends Action> {
  data: ResponseTypeFor<A>;
  type?: string;
  request_id?: string;
}

// TODO: differentiate between a result and a info message
export type Message = {
  [A in Action]: BaseMessage<A> & {
    progress: {
      data: ProgressMessage;
      type: "progress";
    };
  };
}[Action];
