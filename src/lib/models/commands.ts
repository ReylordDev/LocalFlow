// Command types for Electron to Python IPC
import { UUID } from "crypto";
import { ChannelFunctionType, ChannelType } from "./channels";

export enum Action {
  TOGGLE = "toggle",
  CANCEL = "cancel",
  AUDIO_LEVEL = "audio_level",
  SWITCH_MODE = "switch_mode",
}

export type BaseRequest<C extends ChannelType> = {
  channel: C;
  data?: Parameters<ChannelFunctionType<C>>;
  id: string;
  kind: "request";
};

export type Request = {
  [C in ChannelType]: BaseRequest<C>;
}[ChannelType];

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

export type ResponselessCommand = {
  [A in ActionType]: BaseResponselessCommand<A>;
}[ActionType];

export type Command = {
  command: Request | ResponselessCommand;
};
