// Command types for Electron to Python IPC
import { UUID } from "crypto";
import {
  ExampleBase,
  ModeCreate,
  ModeUpdate,
  TextReplacementBase,
} from "./database";

export type Action =
  | "toggle"
  | "cancel"
  | "reset"
  | "audio_level"
  | "select_mode"
  | "get_devices"
  | "set_device"
  | "get_modes"
  | "create_mode"
  | "update_mode"
  | "delete_mode"
  | "switch_mode"
  | "get_results"
  | "delete_result"
  | "add_example"
  | "get_voice_models"
  | "get_language_models"
  | "get_text_replacements"
  | "create_text_replacement"
  | "delete_text_replacement";

export interface SelectModeCommand {
  mode_id: UUID;
}

export interface SelectResultCommand {
  result_id: UUID;
}

export interface SelectDeviceCommand {
  index: number;
}

export interface SelectTextReplacementCommand {
  text_replacement_id: UUID;
}

export interface AddExampleCommand {
  prompt_id: UUID;
  example: ExampleBase;
}

export interface Command {
  action: Action;
  data?:
    | SelectModeCommand
    | SelectDeviceCommand
    | SelectResultCommand
    | ModeCreate
    | ModeUpdate
    | AddExampleCommand
    | SelectTextReplacementCommand
    | TextReplacementBase;
}
