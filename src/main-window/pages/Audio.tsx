import { Separator } from "../../components/ui/separator";
import { Switch } from "../../components/ui/switch";
import { Combobox } from "../../components/combobox";
import { cn } from "../../lib/utils";
import { useAudioStore } from "../../stores/audio-store";
import { useEffect, Dispatch, SetStateAction } from "react";

const menuItemClass = "justify-between items-center flex px-4 min-h-[50px]";

export default function AudioPage() {
  const {
    devices,
    selectedDeviceIndex,
    useSystemDefaultDevice,
    boostAudio,
    fetchDevices,
    setSelectedDeviceIndex,
    setUseSystemDefaultDevice,
    setBoostAudio,
    initializeFromSettings,
  } = useAudioStore();

  useEffect(() => {
    fetchDevices();
    initializeFromSettings();
  }, [fetchDevices, initializeFromSettings]);

  const handleDeviceChange: Dispatch<SetStateAction<string>> = (value) => {
    if (typeof value === "function") {
      const newValue = value(selectedDeviceIndex);
      setSelectedDeviceIndex(newValue);
    } else {
      setSelectedDeviceIndex(value);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-l from-sky-300 to-sky-600 px-4 text-white">
        <div className="flex items-center gap-4">
          <h1 className="py-5 text-2xl font-bold">Audio</h1>
        </div>
      </div>
      <div className="flex h-full flex-col gap-4 overflow-y-auto bg-zinc-50 px-8 py-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Input Device</h2>
          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-2">
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">Input Device</h3>
              <Combobox
                items={devices.map((device) => ({
                  value: device.index.toString(),
                  label: device.name,
                }))}
                value={selectedDeviceIndex}
                setValue={handleDeviceChange}
                initialMessage="Select a device..."
                noMatchesMessage="No devices found"
                searchPlaceholder="Search for a device"
                disabled={useSystemDefaultDevice}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Use system default device
              </h3>
              <Switch
                checked={useSystemDefaultDevice}
                onCheckedChange={setUseSystemDefaultDevice}
              />
            </div>
            <Separator orientation="horizontal" />
            <div className={cn(menuItemClass)}>
              <h3 className="text-md font-semibold">
                Automatically increase microphone volume
              </h3>
              <Switch checked={boostAudio} onCheckedChange={setBoostAudio} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
