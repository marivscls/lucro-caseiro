const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    contentType: string;
    contentId: string;
  }>;
}

export interface EmailSendResult {
  id: string;
}

export type EmailSender = (message: EmailMessage) => Promise<EmailSendResult>;

interface ResendEmailResponse {
  id?: unknown;
  message?: unknown;
}

export function createResendEmailSender(
  apiKey: string,
  from: string,
  fetcher: typeof fetch = fetch,
): EmailSender {
  if (!apiKey) throw new Error("RESEND_API_KEY nao configurada");
  if (!from) throw new Error("EMAIL_FROM nao configurado");

  return async (message) => {
    const response = await fetcher(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
        "User-Agent": "lucro-caseiro-api/1.0",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        ...(message.attachments
          ? {
              attachments: message.attachments.map((attachment) => ({
                content: attachment.content,
                filename: attachment.filename,
                content_type: attachment.contentType,
                content_id: attachment.contentId,
              })),
            }
          : {}),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as ResendEmailResponse;
    if (!response.ok) {
      const detail = typeof payload.message === "string" ? `: ${payload.message}` : "";
      throw new Error(`Resend respondeu HTTP ${response.status}${detail}`);
    }
    if (typeof payload.id !== "string" || !payload.id) {
      throw new Error("Resend respondeu sem um identificador de envio valido");
    }

    return { id: payload.id };
  };
}
