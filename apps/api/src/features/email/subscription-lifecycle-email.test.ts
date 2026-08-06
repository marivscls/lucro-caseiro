import { describe, expect, it, vi } from "vitest";

import type { EmailSender } from "./resend-email";
import {
  buildSubscriptionLifecycleEmail,
  createSubscriptionEmailNotifier,
  type SubscriptionEmailEvent,
  type SubscriptionEmailKind,
} from "./subscription-lifecycle-email";

function makeEvent(kind: SubscriptionEmailKind): SubscriptionEmailEvent {
  return {
    kind,
    userId: "user-1",
    email: "cliente@example.com",
    plan: "professional",
    expiresAt: "2026-09-06T16:13:15.823Z",
    deduplicationKey: `${kind}:professional:2026-09-06`,
  };
}

describe("buildSubscriptionLifecycleEmail", () => {
  it.each([
    ["activated", "Seu plano Profissional est\u00e1 ativo"],
    ["renewed", "Seu plano Profissional foi renovado"],
    ["payment_failed", "N\u00e3o conseguimos renovar sua assinatura"],
    ["cancelled", "Sua assinatura do Lucro Caseiro foi encerrada"],
  ] as const)("builds the %s message", (kind, subject) => {
    const content = buildSubscriptionLifecycleEmail(makeEvent(kind));

    expect(content.subject).toContain(subject);
    expect(content.text.startsWith("Oi!\n")).toBe(true);
    expect(content.html).toContain(">Oi!</p>");
    expect(content.html).toContain('href="lucrocaseiro://"');
    expect(`${content.text}\n${content.html}`).not.toContain("Mariana");
  });
});

describe("createSubscriptionEmailNotifier", () => {
  it("sends with a stable event-scoped idempotency key", async () => {
    const sendEmail = vi.fn<EmailSender>().mockResolvedValue({ id: "email-1" });
    const notify = createSubscriptionEmailNotifier(sendEmail, "oi@lucrocaseiro.com.br");
    const event = makeEvent("activated");

    await notify(event);
    await notify(event);

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[0]?.[0].idempotencyKey).toBe(
      sendEmail.mock.calls[1]?.[0].idempotencyKey,
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "cliente@example.com",
        replyTo: "oi@lucrocaseiro.com.br",
        idempotencyKey: expect.stringMatching(/^subscription-activated-[a-f0-9]{32}$/),
      }),
    );
  });
});
