import { describe, expect, it, vi } from "vitest";

import { createResendEmailSender } from "./resend-email";

const message = {
  to: "destinatario@example.com",
  subject: "Teste",
  text: "Teste em texto",
  html: "<p>Teste em HTML</p>",
  idempotencyKey: "email-test-2026-08-06",
  replyTo: "suporte@example.com",
  attachments: [
    {
      content: "aW1hZ2Vt",
      filename: "logo.png",
      contentType: "image/png",
      contentId: "logo-image",
    },
  ],
};

describe("createResendEmailSender", () => {
  it("envia texto e HTML com autenticacao e idempotencia", async () => {
    let request: RequestInit | undefined;
    const fetcher = vi.fn((_input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      request = init;
      return Promise.resolve(
        new Response(JSON.stringify({ id: "email-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    const send = createResendEmailSender(
      "re_test",
      "Lucro Caseiro <notificacoes@lucrocaseiro.com.br>",
      fetcher as unknown as typeof fetch,
    );

    await expect(send(message)).resolves.toEqual({ id: "email-1" });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.any(Object),
    );
    expect(request?.headers).toEqual(
      expect.objectContaining({
        Authorization: "Bearer re_test",
        "Idempotency-Key": message.idempotencyKey,
        "User-Agent": "lucro-caseiro-api/1.0",
      }),
    );
    if (typeof request?.body !== "string") throw new Error("Corpo nao serializado");
    expect(JSON.parse(request.body)).toEqual({
      from: "Lucro Caseiro <notificacoes@lucrocaseiro.com.br>",
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
      reply_to: message.replyTo,
      attachments: [
        {
          content: "aW1hZ2Vt",
          filename: "logo.png",
          content_type: "image/png",
          content_id: "logo-image",
        },
      ],
    });
  });

  it("propaga falha segura do provedor", async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: "domain is not verified" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const send = createResendEmailSender(
      "re_test",
      "Lucro Caseiro <notificacoes@lucrocaseiro.com.br>",
      fetcher as unknown as typeof fetch,
    );

    await expect(send(message)).rejects.toThrow(
      "Resend respondeu HTTP 403: domain is not verified",
    );
  });

  it("recusa iniciar sem credencial", () => {
    expect(() => createResendEmailSender("", "remetente@example.com")).toThrow(
      "RESEND_API_KEY nao configurada",
    );
  });
});
