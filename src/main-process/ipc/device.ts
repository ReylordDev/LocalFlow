import { CHANNELS, ChannelType } from "../../lib/models/channels";

export function registerDeviceHandlers(
  handlePythonIPC: (channel: ChannelType) => void,
) {
  handlePythonIPC(CHANNELS.fetchAllDevices);
  handlePythonIPC(CHANNELS.setDevice);
}
