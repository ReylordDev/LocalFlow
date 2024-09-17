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
  data: any | ProgressMessage;
}

export interface Command {
  action: "start" | "stop" | "audio_level" | "status" | "quit";
}
