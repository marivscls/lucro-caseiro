import {
  ANALYTICS_ACQUISITION_MAX_LENGTH,
  ANALYTICS_ACTION_NAMES,
  ANALYTICS_EVENT_PROPS_LIMITS as PROPS,
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

const PROP_KEY = /^[a-z][a-z0-9_]*$/;
// Sem espaços: identificadores (recurso, plano, tela, nome de erro), nunca texto livre.
const PROP_TEXT = /^[\w.:/()[\]-]+$/;

const EventPropsDto = z
  .record(
    z.string().max(PROPS.maxKeyLength).regex(PROP_KEY),
    z.union([
      z.string().min(1).max(PROPS.maxStringLength).regex(PROP_TEXT),
      z.number().finite().min(-PROPS.maxAbsNumber).max(PROPS.maxAbsNumber),
      z.boolean(),
    ]),
  )
  .refine((props) => {
    const keys = Object.keys(props).length;
    return keys >= 1 && keys <= PROPS.maxKeys;
  }, `Use de 1 a ${PROPS.maxKeys} propriedades`);

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
      props: EventPropsDto.optional(),
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
