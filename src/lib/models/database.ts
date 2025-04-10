// Database models for storage and data manipulation
import { UUID } from "crypto";

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

export type LanguageType =
  | "auto"
  | "en"
  | "de"
  | "fr"
  | "it"
  | "es"
  | "pt"
  | "hi"
  | "th";

export const languageNameMap: Record<LanguageType, string> = {
  auto: "Auto",
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  pt: "Portuguese",
  hi: "Hindi",
  th: "Thai",
};

export type VoiceModelType = "large-v3-turbo" | "large-v3" | "distil-large-v3";

export interface Device {
  index: number;
  name: string;
  default_samplerate: number;
  is_default: boolean;
}

export interface ModeBase {
  name: string;
  default: boolean;
  active: boolean;
  voice_language: LanguageType;
  translate_to_english: boolean;
  record_system_audio: boolean;
  use_language_model: boolean;
}

export interface Mode extends ModeBase {
  id: UUID;
  text_replacements: TextReplacement[];
  voice_model: VoiceModel;
  language_model?: LanguageModel;
  prompt?: Prompt;
  results: Result[];
}

export interface ModeCreate extends ModeBase {
  voice_model_name: string;
  language_model_name?: string;
  prompt?: PromptBase;
  text_replacements: TextReplacementBase[];
}

export type ModeUpdate = Partial<ModeBase> & { id: UUID } & {
  voice_model_name?: string;
  language_model_name?: string;
  prompt?: Partial<PromptBase>;
  text_replacements?: TextReplacementBase[];
};

export interface VoiceModelBase {
  name: VoiceModelType;
  language: "english-only" | "multilingual";
  speed: number;
  accuracy: number;
  size: number;
  parameters: number;
}

export interface VoiceModel extends VoiceModelBase {
  id: UUID;
  modes: Mode[];
}

export interface LanguageModel {
  name: string;
  modes: Mode[];
}

export interface PromptBase {
  system_prompt: string;
  include_clipboard: boolean;
  include_active_window: boolean;
  examples: ExampleBase[];
}

export interface Prompt extends PromptBase {
  id: UUID;
  mode?: Mode;
  examples: Example[];
}

export interface ExampleBase {
  input: string;
  output: string;
}

export interface Example extends ExampleBase {
  id: UUID;
  prompt: Prompt;
}

export interface TextReplacementBase {
  original_text: string;
  replacement_text: string;
}

export interface TextReplacement extends TextReplacementBase {
  id: UUID;
  mode_id?: UUID;
  mode?: Mode;
}

export interface ResultBase {
  created_at: number;
  transcription: string;
  ai_result?: string;
  duration: number;
  processing_time: number;
}

export interface Result extends ResultBase {
  id: UUID;
  mode: Mode;
  location: string;
}
