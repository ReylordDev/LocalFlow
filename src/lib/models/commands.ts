// Command types for Electron to Python IPC
import { UUID } from "crypto";
import {
  ExampleBase,
  ModeCreate,
  ModeUpdate,
  TextReplacementBase,
} from "./database";
import {
  StatusMessage,
  AudioLevelMessage,
  DevicesMessage,
  ModesMessage,
  ResultsMessage,
  VoiceModelsMessage,
  LanguageModelsMessage,
  TextReplacementsMessage,
} from "./messages";

export interface AddExampleCommand {
  prompt_id: UUID;
  example: ExampleBase;
}

export interface CreateTextReplacementCommand {
  text_replacement: TextReplacementBase;
}

// Define a unified map between actions, their parameter types, and their response types
type CommandStructureMap = {
  toggle: { param: undefined; response: StatusMessage };
  cancel: { param: undefined; response: StatusMessage };
  reset: { param: undefined; response: StatusMessage };
  audio_level: { param: undefined; response: AudioLevelMessage };
  select_mode: { param: UUID; response: StatusMessage };
  get_devices: { param: undefined; response: DevicesMessage };
  set_device: { param: UUID; response: StatusMessage };
  get_modes: { param: undefined; response: ModesMessage };
  create_mode: { param: ModeCreate; response: ModesMessage };
  update_mode: { param: ModeUpdate; response: ModesMessage };
  delete_mode: { param: UUID; response: ModesMessage };
  switch_mode: { param: UUID; response: StatusMessage };
  get_results: { param: undefined; response: ResultsMessage };
  delete_result: { param: UUID; response: ResultsMessage };
  add_example: { param: AddExampleCommand; response: StatusMessage };
  get_voice_models: { param: undefined; response: VoiceModelsMessage };
  get_language_models: { param: undefined; response: LanguageModelsMessage };
  get_text_replacements: {
    param: undefined;
    response: TextReplacementsMessage;
  };
  create_text_replacement: {
    param: CreateTextReplacementCommand;
    response: TextReplacementsMessage;
  };
  delete_text_replacement: {
    param: UUID;
    response: TextReplacementsMessage;
  };
};

// Derive Action type from the unified map
export type Action = keyof CommandStructureMap;

// Derive parameter type for each action
export type ParamTypeFor<A extends Action> = CommandStructureMap[A]["param"];

// Derive response type for each action
export type ResponseTypeFor<A extends Action> =
  CommandStructureMap[A]["response"];

// Base command type with correct parameter handling
type BaseCommand<A extends Action> = {
  action: A;
  data?: ParamTypeFor<A>;
  request_id?: string;
  _responseType?: ResponseTypeFor<A>;
};

// Create a union type that maps each action to a command with the correct data type
export type Command = {
  [A in Action]: BaseCommand<A>;
}[Action];
