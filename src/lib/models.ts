export interface ProgressMessage {
  step: string;
  status: "start" | "complete" | "error";
}

export interface Message {
  type:
    | "progress"
    | "transcrption"
    | "formatted_transcription"
    | "status"
    | "audio_level";
  data: object | ProgressMessage | FormattedTranscripton;
}

export interface Command {
  action: "start" | "stop" | "reset" | "audio_level" | "status" | "quit";
}

export interface FormattedTranscripton {
  formatted_transcription: string;
}

export interface AudioLevel {
  audio_level: number;
}
