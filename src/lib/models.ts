// Python Models
// These have to match the models in models.py

type Action =
  | "start"
  | "stop"
  | "reset"
  | "audio_level"
  | "quit"
  | "model_status"
  | "model_load"
  | "get_history"
  | "delete_transcription"
  | "set_language"
  | "get_devices"
  | "set_device";

export interface ProgressMessage {
  step:
    | Action
    | "init"
    | "recording"
    | "compression"
    | "transcription"
    | "formatting"
    | "committing_to_history";
  status: "start" | "complete" | "error";
  timestamp: number;
}

export interface Command {
  action: Action;
  data?: object;
}

export interface Message {
  type:
    | "audio_level"
    | "progress"
    | "raw_transcription"
    | "formatted_transcription"
    | "exception"
    | "model_status"
    | "history"
    | "error"
    | "devices";
  data:
    | ProgressMessage
    | RawTranscription
    | FormattedTranscripton
    | AudioLevel
    | ExceptionMessage
    | ModelStatus
    | History
    | Devices
    | Error;
}

// TODO: Fix snake case
export interface RawTranscription {
  raw_transcription: string;
}

export interface FormattedTranscripton {
  formatted_transcription: string;
}

export interface AudioLevel {
  audio_level: number;
}

export interface ExceptionMessage {
  exception: string;
  timestamp: number;
}

export interface ModelStatus {
  transcriber_status: "offline" | "online";
  formatter_status: "offline" | "online";
}

export interface HistoryItem {
  id: number;
  raw_transcription: string;
  formatted_transcription: string;
  created_at: string;
}

export interface History {
  transcriptions: HistoryItem[];
}

export interface Device {
  index: number;
  name: string;
  default_samplerate: number;
}

export interface Devices {
  devices: Device[];
}

// Frontend-only models
export type Page = "Settings" | "History" | "Credits";
