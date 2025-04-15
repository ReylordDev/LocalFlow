// Command types for Electron to Python IPC
import { UUID } from "crypto";
import { PythonChannelFunction, PythonChannel } from "./channels";

// ----------- Requests -----------

export type BaseRequest<C extends PythonChannel> = {
  channel: C;
  data?: Parameters<PythonChannelFunction<C>>;
  id: string;
  kind: "request";
};

/**
 * A request to the Python process that expects a response.
 */
export type Request = {
  [C in PythonChannel]: BaseRequest<C>;
}[PythonChannel];

// ----------- Responseless Commands -----------

export enum Action {
  TOGGLE = "toggle",
  CANCEL = "cancel",
  AUDIO_LEVEL = "audio_level",
  SWITCH_MODE = "switch_mode", // does this actually exist?
}

export type ActionDataMap = {
  [Action.TOGGLE]: undefined;
  [Action.CANCEL]: undefined;
  [Action.AUDIO_LEVEL]: undefined;
  [Action.SWITCH_MODE]: UUID;
};

type ActionType = keyof ActionDataMap;

type BaseResponselessCommand<A extends ActionType> = {
  action: A;
  data: ActionDataMap[A];
  kind: "command";
};

/**
 * A command to the Python process that does not expect a response.
 */
export type ResponselessCommand = {
  [A in ActionType]: BaseResponselessCommand<A>;
}[ActionType];

// ----------- Command -----------

/**
 * Parent type for any message sent to the Python process.
 */
export type Command = {
  command: Request | ResponselessCommand;
};
