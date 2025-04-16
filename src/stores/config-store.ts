import { create } from "zustand";
import {
  KeyboardConfig,
  ApplicationConfig,
  OutputConfig,
} from "../lib/models/settings";
import { tryCatch } from "../lib/utils";

interface ConfigState {
  // Keyboard settings
  keyboard: KeyboardConfig;
  // Application settings
  application: ApplicationConfig;
  // Output settings
  output: OutputConfig;
  // Actions
  setKeyboardConfig: (config: KeyboardConfig) => void;
  setApplicationConfig: (config: ApplicationConfig) => void;
  setOutputConfig: (config: OutputConfig) => void;
  loadSettings: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>()((set) => ({
  keyboard: {
    toggleRecordingShortcut: "",
    cancelRecordingShortcut: "",
    changeModeShortcut: "",
  },
  application: {
    launchAtStartup: false,
    minimizeToTray: false,
    closeToTray: false,
    enableRecordingWindow: true,
    autoCloseRecordingWindow: false,
  },
  output: {
    autoPasteResult: false,
    restoreClipboard: false,
  },

  setKeyboardConfig: (config) => {
    set({ keyboard: config });
    console.info("Setting keyboard config:", config);
    window.settings.setKeyboard(config);
  },

  setApplicationConfig: (config) => {
    set({ application: config });
    console.info("Setting application config:", config);
    window.settings.setApplication(config);
  },

  setOutputConfig: (config) => {
    set({ output: config });
    console.info("Setting output config:", config);
    window.settings.setOutput(config);
  },

  loadSettings: async () => {
    const { data: settings, error } = await tryCatch(window.settings.getAll());
    if (error) {
      console.error("Error loading settings:", error);
      return;
    }
    console.info("Loaded settings:", settings);
    set({
      keyboard: settings.keyboard,
      application: settings.application,
      output: settings.output,
    });
  },
}));
