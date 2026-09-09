import type { IWelcomeEmailRepo, WelcomePayload } from "./welcome-email.types";
import { z } from "zod";
import { buildWelcomeEmail } from "./welcome-email";

export class WelcomeEmailUseCases {
  constructor(
    private repo: IWelcomeEmailRepo,
    private deliver: (payload: WelcomePayload) => Promise<{ id: string }>,
    private from: string,
    private replyTo: string,
  ) {}
  async runOnce(): Promise<"sent" | "retry" | "idle"> {
    await this.repo.activate();
    for (const candidate of await this.repo.candidates()) {
      if (!z.string().email().safeParse(candidate.email).success) continue;
      await this.repo.enqueue(candidate.userId, {
        from: this.from,
        message: {
          to: candidate.email,
          ...buildWelcomeEmail(candidate),
          replyTo: this.replyTo,
          idempotencyKey: `welcome-v1-${candidate.userId}`,
        },
      });
    }
    const job = await this.repo.claim();
    if (!job) return "idle";
    let result: { id: string };
    try {
      result = await this.deliver(job.payload);
    } catch {
      await this.repo.failed(job);
      return "retry";
    }
    // A lost acknowledgement must leave the lease intact. Recovery reuses the
    // frozen payload and key, only within Resend's 24-hour deduplication window.
    await this.repo.sent(job, result.id);
    return "sent";
  }
}
