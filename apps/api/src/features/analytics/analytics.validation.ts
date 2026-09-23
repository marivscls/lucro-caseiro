import {
  ANALYTICS_ACQUISITION_MAX_LENGTH,
  ANALYTICS_ACTION_NAMES,
  ANALYTICS_SCREEN_NAMES,
} from "@lucro-caseiro/contracts";
import { z } from "zod";

const NO_CONTROL_CHARS = /^[^\p{Cc}\p{Cf}]+$/u;

function acquisitionValue(max: number) {
  return z.string().trim().min(1).max(max).regex(NO_CONTROL_CHARS).optional();
}

const AcquisitionDto = z
  .object({
    utmSource: acquisitionValue(ANALYTICS_ACQUISITION_MAX_LENGTH.utmSource),
    utmMedium: acquisitionValue(ANALYTICS_ACQUISITION_MAX_LENGTH.utmMedium),
    utmCampaign: acquisitionValue(ANALYTICS_ACQUISITION_MAX_LENGTH.utmCampaign),
    utmContent: acquisitionValue(ANALYTICS_ACQUISITION_MAX_LENGTH.utmContent),
    referrer: acquisitionValue(ANALYTICS_ACQUISITION_MAX_LENGTH.referrer),
  })
  .strict();

const RecordOpenDto = z
  .object({
    installationId: z.string().uuid(),
    platform: z.enum(["android", "ios", "web"]),
    appVersion: z.string().trim().min(1).max(32),
    appBuild: z.string().trim().min(1).max(32).optional(),
    acquisition: AcquisitionDto.optional(),
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
