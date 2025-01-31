import { ipcMain } from "electron";
import { PythonService } from "../services/python-service";
import { AppSettings, SettingsService } from "../services/settings-service";
import { AppConfig } from "../utils/config";
import { registerURLHandlers } from "./url";
import { registerDeviceHandlers } from "./device";
import { registerSettingsHandlers } from "./settings";
import {
  ModelStatus,
  FormattedTranscripton,
  InputDevice,
  HistoryItem,
} from "../../lib/models";

export function registerIpcHandlers(
  settingsService: SettingsService,
  config: AppConfig,
  pythonService: PythonService
) {
  registerSettingsHandlers(settingsService, pythonService);
  registerURLHandlers();
  registerDeviceHandlers(pythonService);

  // Main recording controls
  ipcMain.on("controller:toggle-recording", () => {
    pythonService.toggleRecording();
  });

  ipcMain.on("controller:requestAudioLevel", () => {
    pythonService.sendCommand({
      action: "audio_level",
    });
  });

  ipcMain.on("controller:requestModelStatus", () => {
    pythonService.sendCommand({
      action: "model_status",
    });
  });

  ipcMain.on("controller:getTranscriptions", () => {
    pythonService.sendCommand({
      action: "get_transcriptions",
    });
  });

  ipcMain.on("controller:deleteTranscription", (_, id: number) => {
    pythonService.sendCommand({
      action: "delete_transcription",
      data: { id },
    });
  });
}

declare global {
  interface Window {
    controller: {
      toggleRecording: () => void;
      requestModelStatus: () => void;
      onReceiveModelStatus: (callback: (status: ModelStatus) => void) => void;
      onReceiveTranscription: (
        callback: (transcription: FormattedTranscripton) => void
      ) => void;
      getTranscriptions: () => void;
      onReceiveTranscriptions: (
        callback: (transcriptions: HistoryItem[]) => void
      ) => void;
      deleteTranscription: (id: number) => void;
    };
    settings: {
      getAll: () => Promise<AppSettings>;
      setShortcut: (shortcut: string) => Promise<string>;
      disableShortcut: () => void;
      setLanguage: (language: string) => Promise<string>;
    };
    url: {
      open: (url: string) => void;
    };
    mini: {
      onRecordingStart: (callback: () => void) => void;
      onRecordingStop: (callback: () => void) => void;
      requestAudioLevel: () => void;
      onReceiveAudioLevel: (callback: (audioLevel: number) => void) => void;
    };
    device: {
      requestAll: () => void;
      onReceiveDevices: (callback: (devices: InputDevice[]) => void) => void;
      set: (device: InputDevice) => void;
    };
  }
}
