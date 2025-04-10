// Message types for Python to Electron IPC
import { Action } from "./commands";
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

type MessageResultType =
  | "transcription"
  | "audio_level"
  | "devices"
  | "status"
  | "modes"
  | "result"
  | "results"
  | "modes_update"
  | "voice_models"
  | "language_models"
  | "text_replacements";

export interface Message {
  type: MessageResultType | "progress" | "exception" | "error";
  data:
    | ProgressMessage
    | TranscriptionMessage
    | AudioLevelMessage
    | ExceptionMessage
    | DevicesMessage
    | ErrorMessage
    | StatusMessage
    | ModesMessage
    | ResultMessage
    | ResultsMessage
    | VoiceModelsMessage
    | LanguageModelsMessage
    | TextReplacementsMessage;
}
