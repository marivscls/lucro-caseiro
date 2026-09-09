import { z } from "zod";

// Only browser-operated push services: endpoints are otherwise an SSRF primitive.
export const PushEndpointDto = z
  .string()
  .url()
  .max(2048)
  .refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === "fcm.googleapis.com" ||
        url.hostname === "updates.push.services.mozilla.com" ||
        url.hostname === "web.push.apple.com" ||
        url.hostname.endsWith(".notify.windows.com"))
    );
  }, "Serviço de notificações não suportado");

export const WebPrefsDto = z
  .object({
    PENDING_SALES: z.boolean().optional(),
    LOW_STOCK: z.boolean().optional(),
    DELIVERY: z.boolean().optional(),
    CLIENT_BIRTHDAY: z.boolean().optional(),
    DAILY_REMINDER: z.boolean().optional(),
    WEEKLY_SUMMARY: z.boolean().optional(),
  })
  .strict();
export type WebPrefs = z.infer<typeof WebPrefsDto>;
export const WebSubscriptionDto = z
  .object({
    endpoint: PushEndpointDto,
    keys: z
      .object({
        p256dh: z.string().regex(/^[A-Za-z0-9_-]{87}$/),
        auth: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
      })
      .strict(),
    timezone: z
      .string()
      .max(100)
      .refine((timezone) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: timezone });
          return true;
        } catch {
          return false;
        }
      }),
    prefs: WebPrefsDto,
  })
  .strict();
export type WebSubscriptionInput = z.infer<typeof WebSubscriptionDto>;
export type ReminderSlot = {
  date: string;
  period: "morning" | "evening";
  monday: boolean;
};
export type ReminderCounts = {
  pending: number;
  stock: number;
  deliveries: number;
  birthdays: number;
};
export type BrowserMessage = { title: string; body: string; url: string; tag?: string };

export function reminderSlot(now: Date, timezone: string): ReminderSlot | null {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const hour = part("hour");
  if (hour !== "09" && hour !== "19") return null;
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    period: hour === "09" ? "morning" : "evening",
    monday: part("weekday") === "Mon",
  };
}

export function reminderMessage(
  slot: ReminderSlot,
  prefs: WebPrefs,
  premium: boolean,
  features: { estoque: boolean; agendamento: boolean },
  counts: ReminderCounts,
): BrowserMessage | null {
  // Only the six schema-validated preference keys can reach this lookup.
  // eslint-disable-next-line security/detect-object-injection
  const enabled = (type: keyof WebPrefs) => prefs[type] !== false;
  if (slot.period === "evening") {
    return premium && enabled("DAILY_REMINDER")
      ? {
          title: "Fechou o dia? 📝",
          body: "Registre as vendas de hoje pra não perder nada de vista.",
          url: "/finance",
        }
      : null;
  }
  const items: { body: string; url: string }[] = [];
  if (features.agendamento && enabled("DELIVERY") && counts.deliveries)
    items.push({
      body: `${counts.deliveries} entrega(s) até amanhã para conferir.`,
      url: "/tabs/agenda",
    });
  if (enabled("PENDING_SALES") && counts.pending)
    items.push({
      body: `${counts.pending} venda(s) pendente(s) de pagamento.`,
      url: "/fiado",
    });
  if (features.estoque && enabled("LOW_STOCK") && counts.stock)
    items.push({
      body: `${counts.stock} produto(s) com estoque baixo.`,
      url: "/products",
    });
  if (premium && enabled("CLIENT_BIRTHDAY") && counts.birthdays)
    items.push({
      body: `${counts.birthdays} cliente(s) fazem aniversário hoje.`,
      url: "/tabs/clients",
    });
  if (premium && enabled("WEEKLY_SUMMARY") && slot.monday)
    items.push({
      body: "Seu resumo da semana está pronto para conferir.",
      url: "/finance",
    });
  return items.length
    ? {
        title: "Lembretes do seu negócio",
        body: items.map((item) => item.body).join("\n"),
        url: items[0]!.url,
      }
    : null;
}
