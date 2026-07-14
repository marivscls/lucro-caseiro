import { ANALYTICS_ACTION_NAMES, ANALYTICS_SCREEN_NAMES } from "@lucro-caseiro/contracts";
import { z } from "zod";

const RecordOpenDto = z
  .object({
    installationId: z.string().uuid(),
    platform: z.enum(["android", "ios", "web"]),
    appVersion: z.string().trim().min(1).max(32),
    appBuild: z.string().trim().min(1).max(32).optional(),
  })
  .strict();

const AnalyticsEventDto = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("screen_view"),
      name: z.enum(ANALYTICS_SCREEN_NAMES),
      durationMs: z.number().int().min(250).max(21_600_000),
    })
    .strict(),
  z
    .object({
      type: z.literal("action"),
      name: z.enum(ANALYTICS_ACTION_NAMES),
    })
    .strict(),
]);

const RecordEventsDto = RecordOpenDto.extend({
  events: z.array(AnalyticsEventDto).min(1).max(25),
});

export function parseRecordOpen(value: unknown) {
  return RecordOpenDto.parse(value);
}

export function parseRecordEvents(value: unknown) {
  return RecordEventsDto.parse(value);
}
