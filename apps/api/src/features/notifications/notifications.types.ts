export type PushPlatform = "android" | "ios";

export interface RegisterPushTokenInput {
  token: string;
  platform: PushPlatform;
}

export interface PushMessage {
  title: string;
  body: string;
  data: Record<string, string>;
}

export interface PushSendResult {
  invalidTokens: string[];
}

export interface INotificationsRepo {
  registerToken(
    userId: string,
    brandId: string,
    input: RegisterPushTokenInput,
  ): Promise<void>;
  unregisterToken(userId: string, token: string): Promise<void>;
  listTokens(userId: string, brandId: string): Promise<string[]>;
  deleteTokens(tokens: string[]): Promise<void>;
}

export type PushSender = (
  tokens: string[],
  message: PushMessage,
) => Promise<PushSendResult>;
