export interface ProgressMessage {
  step: string;
  status: "start" | "complete" | "error";
  timestamp: number;
}

export interface Message {
  type:
    | "progress"
    | "transcrption"
    | "formatted_transcription"
    | "status"
    | "audio_level"
    | "model_status";
  data: object | ProgressMessage | FormattedTranscripton;
}

export interface Command {
  action:
    | "start"
    | "stop"
    | "reset"
    | "audio_level"
    | "status"
    | "quit"
    | "model_status"
    | "model_load"
    | "model_unload"
    | "transcriber_load"
    | "transcriber_unload"
    | "formatter_load"
    | "formatter_unload";
}

// TODO: Fix snake case

export interface FormattedTranscripton {
  formatted_transcription: string;
}

export interface AudioLevel {
  audio_level: number;
}

export interface ModelStatus {
  transcriber_status: "offline" | "loading" | "online";
  formatter_status: "offline" | "loading" | "online";
}
