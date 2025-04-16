import { create } from "zustand";
import { Device } from "../lib/models/database";
import { tryCatch } from "../lib/utils";

interface AudioState {
  devices: Device[];
  selectedDeviceIndex: string;
  useSystemDefaultDevice: boolean;
  boostAudio: boolean;
  fetchDevices: () => Promise<void>;
  setSelectedDeviceIndex: (index: string) => void;
  setUseSystemDefaultDevice: (use: boolean) => void;
  setBoostAudio: (boost: boolean) => void;
  initializeFromSettings: () => Promise<void>;
}

export const useAudioStore = create<AudioState>()((set, get) => ({
  devices: [],
  selectedDeviceIndex: "",
  useSystemDefaultDevice: false,
  boostAudio: false,

  fetchDevices: async () => {
    const { data, error } = await tryCatch(window.device.fetchAllDevices());
    if (error) {
      console.error("Error fetching devices:", error);
      return;
    }
    set({ devices: data });
  },

  setSelectedDeviceIndex: (index) => {
    set({ selectedDeviceIndex: index });
    const { devices, useSystemDefaultDevice, boostAudio } = get();
    const selectedDevice =
      devices.find((d) => d.index.toString() === index) || null;
    console.info("Setting audio device:", selectedDevice);
    window.settings.setAudio({
      device: selectedDevice,
      useSystemDefaultDevice,
      automaticallyIncreaseMicVolume: boostAudio,
      soundEffects: false,
      soundEffectsVolume: 0.5,
    });
  },

  setUseSystemDefaultDevice: (use) => {
    set({ useSystemDefaultDevice: use });
    const { devices, selectedDeviceIndex, boostAudio } = get();
    let newIndex = selectedDeviceIndex;
    if (use) {
      const defaultDevice = devices.find((d) => d.is_default);
      if (defaultDevice) {
        newIndex = defaultDevice.index.toString();
        set({ selectedDeviceIndex: newIndex });
      }
    }
    const selectedDevice =
      devices.find((d) => d.index.toString() === newIndex) || null;
    console.info("Using system default device:", use, selectedDevice);
    window.settings.setAudio({
      device: selectedDevice,
      useSystemDefaultDevice: use,
      automaticallyIncreaseMicVolume: boostAudio,
      soundEffects: false,
      soundEffectsVolume: 0.5,
    });
  },

  setBoostAudio: (boost) => {
    set({ boostAudio: boost });
    const { devices, selectedDeviceIndex, useSystemDefaultDevice } = get();
    const selectedDevice =
      devices.find((d) => d.index.toString() === selectedDeviceIndex) || null;
    console.info("Setting audio boost:", boost);
    window.settings.setAudio({
      device: selectedDevice,
      useSystemDefaultDevice,
      automaticallyIncreaseMicVolume: boost,
      soundEffects: false,
      soundEffectsVolume: 0.5,
    });
  },

  initializeFromSettings: async () => {
    const { data: settings, error } = await tryCatch(window.settings.getAll());
    if (error) {
      console.error("Error fetching settings:", error);
      return;
    }
    set({
      selectedDeviceIndex: settings.audio.device
        ? settings.audio.device.index.toString()
        : "",
      useSystemDefaultDevice: settings.audio.useSystemDefaultDevice,
      boostAudio: settings.audio.automaticallyIncreaseMicVolume,
    });
  },
}));
