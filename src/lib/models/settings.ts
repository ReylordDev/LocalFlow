// Application settings models
import { UUID } from "crypto";
import { Device } from "./database";

export interface ApplicationConfig {
  launchAtStartup: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  enableRecordingWindow: boolean;
  autoCloseRecordingWindow: boolean;
}

export interface KeyboardConfig {
  toggleRecordingShortcut: Electron.Accelerator; // https://www.electronjs.org/docs/latest/api/accelerator
  cancelRecordingShortcut: Electron.Accelerator;
  changeModeShortcut: Electron.Accelerator;
}

export interface AudioConfig {
  device: Device | null;
  useSystemDefaultDevice: boolean;
  automaticallyIncreaseMicVolume: boolean;
  soundEffects: boolean;
  soundEffectsVolume: number;
}

export interface OutputConfig {
  autoPasteResult: boolean;
  restoreClipboard: boolean;
}

export interface AppSettings {
  application: ApplicationConfig;
  keyboard: KeyboardConfig;
  audio: AudioConfig;
  output: OutputConfig;
}

// Service event constants for settings management
export enum SettingsEvents {
  SETTINGS_CHANGED = "settings-changed",
  SHORTCUT_PRESSED = "shortcut-pressed",
}

// Define the mapping between event names and their payload types
export type SettingsEventMap = {
  [SettingsEvents.SETTINGS_CHANGED]: AppSettings;
  [SettingsEvents.SHORTCUT_PRESSED]:
    | "toggle"
    | "cancel"
    | "change-mode"
    | {
        modeId: UUID;
      };
};
