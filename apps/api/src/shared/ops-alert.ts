/**
 * Alertas operacionais para a equipe (canal do Telegram).
 *
 * Avisa na hora sobre o que precisa de atenção humana (ex.: compra paga que
 * não liberou o plano). Nunca envia e-mail, nome ou token de cliente: só o id
 * da conta e dados do plano. Falha no envio nunca derruba a requisição.
 */
export type OpsAlert = (
  message: string,
  options?: { dedupeKey?: string },
) => Promise<void>;

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number }>;

const TELEGRAM_TIMEOUT_MS = 5_000;
/** O mesmo alerta (mesma dedupeKey) sai no máximo uma vez nesse intervalo. */
const DEDUPE_WINDOW_MS = 60 * 60 * 1000;

export function createTelegramOpsAlert(
  botToken: string,
  chatId: string,
  fetchImpl: FetchLike = (url, init) =>
    fetch(url, { ...init, signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS) }),
  now: () => number = Date.now,
): OpsAlert | undefined {
  if (!botToken || !chatId) return undefined;
  const lastSentAt = new Map<string, number>();

  return async (message, options) => {
    const key = options?.dedupeKey;
    if (key) {
      const previous = lastSentAt.get(key);
      if (previous !== undefined && now() - previous < DEDUPE_WINDOW_MS) return;
      lastSentAt.set(key, now());
    }
    try {
      const response = await fetchImpl(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            disable_web_page_preview: true,
          }),
        },
      );
      if (!response.ok) {
        console.error("ops_alert_failed", { status: response.status });
      }
    } catch (error) {
      console.error("ops_alert_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
