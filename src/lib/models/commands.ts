// Command types for Electron to Python IPC
import { ChannelFunctionType, ChannelType } from "./channels";

type BaseRequest<C extends ChannelType> = {
  channel: C;
  data?: Parameters<ChannelFunctionType<C>>;
  id: string;
};

export type Request = {
  [C in ChannelType]: BaseRequest<C>;
}[ChannelType];

export type Command =
  | Request
  | {
      action: string;
      data?: unknown;
    };
