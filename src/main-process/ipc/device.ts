import { InputDevice } from "../../lib/models";
import { PythonService } from "../services/python-service";
import { ipcMain } from "electron";

export function registerDeviceHandlers(pythonService: PythonService) {
  ipcMain.on("device:requestAll", async () => {
    pythonService.sendCommand({
      action: "get_devices",
    });
  });

  ipcMain.on("device:set", async (_, device: InputDevice) => {
    pythonService.sendCommand({
      action: "set_device",
      data: device,
    });
  });
}
