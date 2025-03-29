import fs from "fs";
import path from "path";
import { EventEmitter } from "events";
import { AppConfig } from "../utils/config";
import { globalShortcut } from "electron";
import {
  AppSettings,
  AudioConfig,
  SETTINGS_SERVICE_EVENTS,
} from "../../lib/models";

export const DEFAULT_SETTINGS: AppSettings = {
  keyboard: {
    toggleRecordingShortcut: "Ctrl+Shift+O",
    cancelRecordingShortcut: "Esc",
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
    fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings));
    this.emit(SETTINGS_SERVICE_EVENTS.SETTINGS_CHANGED, this.settings);
  }

  get currentSettings(): AppSettings {
    return { ...this.settings };
  }

  setStartShortcut(shortcut: string) {
    globalShortcut.unregister(this.settings.keyboard.toggleRecordingShortcut);
    globalShortcut.register(shortcut, () => {
      this.emit(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED);
    });
    this.settings.keyboard.toggleRecordingShortcut = shortcut;
    this.persistSettings();
  }

  disableStartShortcut() {
    globalShortcut.unregister(this.settings.keyboard.toggleRecordingShortcut);
  }

  registerShortcuts() {
    globalShortcut.register(
      this.settings.keyboard.toggleRecordingShortcut,
      () => {
        this.emit(SETTINGS_SERVICE_EVENTS.SHORTCUT_PRESSED);
      }
    );
  }

  updateAudioConfig(audioConfig: AudioConfig) {
    this.settings.audio = { ...this.settings.audio, ...audioConfig };
    this.persistSettings();
  }

  cleanup() {
    globalShortcut.unregisterAll();
  }
}
