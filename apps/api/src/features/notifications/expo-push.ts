import type { PushMessage, PushSendResult, PushSender } from "./notifications.types";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;

type ExpoPushTicket =
  | { status: "ok"; id: string }
  | { status: "error"; message?: string; details?: { error?: string } };

interface ExpoPushResponse {
  data?: ExpoPushTicket[];
}

export function createExpoPushSender(fetcher: typeof fetch = fetch): PushSender {
  return async (tokens: string[], message: PushMessage): Promise<PushSendResult> => {
    const invalidTokens: string[] = [];

    for (let offset = 0; offset < tokens.length; offset += EXPO_BATCH_SIZE) {
      const batch = tokens.slice(offset, offset + EXPO_BATCH_SIZE);
      const response = await fetcher(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          batch.map((token) => ({
            to: token,
            sound: "default",
            channelId: "default",
            title: message.title,
            body: message.body,
            data: message.data,
          })),
        ),
      });

      if (!response.ok) {
        throw new Error(`Expo Push respondeu HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ExpoPushResponse;
      for (const [index, ticket] of (payload.data ?? []).entries()) {
        if (
          ticket.status === "error" &&
          ticket.details?.error === "DeviceNotRegistered"
        ) {
          const token = batch.at(index);
          if (token) invalidTokens.push(token);
        }
      }
    }

    return { invalidTokens };
  };
}
