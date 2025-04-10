import { Device } from "../../lib/models/database";
import { CHANNELS } from "../../lib/models/channels";
import { PythonService } from "../services/python-service";
import { ipcMain } from "electron";

export function registerDeviceHandlers(pythonService: PythonService) {
  ipcMain.on(CHANNELS.DEVICE.DEVICES_REQUEST, async () => {
    pythonService.sendCommand({
      action: "get_devices",
    });
  });

  ipcMain.on(CHANNELS.DEVICE.SET, async (_, device: Device) => {
    pythonService.sendCommand({
      action: "set_device",
      data: device,
    });
  });
}
