import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { AppConfig, consoleLog } from "../utils/config";
import { globalShortcut } from "electron";
import {
  ApplicationConfig,
  AppSettings,
  AudioConfig,
  SETTINGS_SERVICE_EVENTS,
  KeyboardConfig,
  OutputConfig,
} from "../../lib/models";

export const DEFAULT_SETTINGS: AppSettings = {
  keyboard: {
    toggleRecordingShortcut: "Ctrl+Shift+O",
    cancelRecordingShortcut: "Ctrl+Shift+X",
    changeModeShortcut: "Ctrl+Shift+K",
  },
  audio: {
    device: null,
    useSystemDefaultDevice: true,
    automaticallyIncreaseMicVolume: false,
    soundEffects: false,
    soundEffectsVolume: 0.5,
  },
  application: {
    launchAtStartup: false,
    minimizeToTray: true,
    closeToTray: true,
    enableRecordingWindow: true,
    autoCloseRecordingWindow: false,
  },
  output: {
    autoPasteResult: false,
    restoreClipboard: false,
  },
};

export class SettingsService extends EventEmitter {
  private settings: AppSettings;
  private settingsPath: string;

  constructor(private config: AppConfig) {
    super();
    this.settingsPath = path.join(config.dataDir, "settings.json");
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        fs.writeFileSync(this.settingsPath, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(fs.readFileSync(this.settingsPath, "utf-8"));
    } catch (error) {
      console.error("Error loading settings:", error);
      return DEFAULT_SETTINGS;
    }
  }

  private persistSettings() {
    if (this.settings === this.loadSettings()) return;
    fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings));
    this.emit(SETTINGS_SERVICE_EVENTS.SETTINGS_CHANGED, this.settings);
  }

  get currentSettings(): AppSettings {
    return { ...this.settings };
  }

  disableShortcut(shortcut: string) {
    if (!shortcut) return;
    consoleLog("Unregistering shortcut:", shortcut);
    globalShortcut.unregister(shortcut);
  }

  registerShortcuts() {
    if (this.settings.keyboard.toggleRecordingShortcut) {
      consoleLog(
        "Registering toggle recording shortcut:",
        this.settings.keyboard.toggleRecordingShortcut,
      );
      globalShortcut.register(
        this.settings.keyboard.toggleRecordingShortcut,
        () => this.emit(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED.TOGGLE),
      );
    }

    if (this.settings.keyboard.cancelRecordingShortcut) {
      consoleLog(
        "Registering cancel recording shortcut:",
        this.settings.keyboard.cancelRecordingShortcut,
      );
      globalShortcut.register(
        this.settings.keyboard.cancelRecordingShortcut,
        () => this.emit(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED.CANCEL),
      );
    }

    if (this.settings.keyboard.changeModeShortcut) {
      consoleLog(
        "Registering change mode shortcut:",
        this.settings.keyboard.changeModeShortcut,
      );
      globalShortcut.register(this.settings.keyboard.changeModeShortcut, () =>
        this.emit(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED.CHANGE_MODE),
      );
    }
  }

  updateAudioConfig(audioConfig: AudioConfig) {
    this.settings.audio = { ...this.settings.audio, ...audioConfig };
    this.persistSettings();
  }

  updateKeyboardConfig(keyboardConfig: KeyboardConfig) {
    this.settings.keyboard = { ...this.settings.keyboard, ...keyboardConfig };
    this.registerShortcuts();
    this.persistSettings();
  }

  updateApplicationConfig(applicationConfig: ApplicationConfig) {
    this.settings.application = {
      ...this.settings.application,
      ...applicationConfig,
    };
    this.persistSettings();
  }

  updateOutputConfig(outputConfig: OutputConfig) {
    this.settings.output = { ...this.settings.output, ...outputConfig };
    this.persistSettings();
  }

  cleanup() {
    globalShortcut.unregisterAll();
  }
}
