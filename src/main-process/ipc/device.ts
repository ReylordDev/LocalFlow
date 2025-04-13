import { PythonChannels, PythonChannel } from "../../lib/models/channels";

export function registerDeviceHandlers(
  handlePythonIPC: (channel: PythonChannel) => void,
) {
  handlePythonIPC(PythonChannels.fetchAllDevices);
  handlePythonIPC(PythonChannels.setDevice);
}
