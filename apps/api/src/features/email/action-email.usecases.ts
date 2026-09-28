import { z } from "zod";
import { buildFirstPriceEmail } from "./action-email";
import type { ActionEmailPayload, ActionEmailRepo } from "./action-email.types";

export class ActionEmailUseCases {
  constructor(
    private repo: ActionEmailRepo,
    private deliver: (payload: ActionEmailPayload) => Promise<{ id: string }>,
    private from: string,
    private replyTo: string,
    private publicApiUrl: string,
    private businessAddress: string,
  ) {}

  async runOnce(): Promise<"sent" | "retry" | "cancelled" | "idle"> {
    for (const candidate of await this.repo.candidates()) {
      if (!z.string().email().safeParse(candidate.email).success) continue;
      const unsubscribeUrl = `${this.publicApiUrl.replace(/\/$/, "")}/api/v1/email-preferences/unsubscribe/${candidate.unsubscribeToken}`;
      await this.repo.enqueue(candidate.userId, {
        from: this.from,
        message: {
          to: candidate.email,
          ...buildFirstPriceEmail({
            name: candidate.name,
            appUrl: "lucrocaseiro://pricing",
            unsubscribeUrl,
            businessAddress: this.businessAddress,
          }),
          replyTo: this.replyTo,
          idempotencyKey: `first-price-v1-${candidate.userId}`,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        },
      });
    }
    const job = await this.repo.claim();
    if (!job) return "idle";
    if (!(await this.repo.stillEligible(job))) {
      await this.repo.cancelled(job);
      return "cancelled";
    }
    let result: { id: string };
    try {
      result = await this.deliver(job.payload);
    } catch {
      await this.repo.failed(job);
      return "retry";
    }
    await this.repo.sent(job, result.id);
    return "sent";
  }
}
