import type { ITrialReminderRepo, TrialReminderPayload } from "./trial-reminder.types";
import { z } from "zod";
import { buildTrialReminderEmail } from "./trial-reminder";

export class TrialReminderUseCases {
  constructor(
    private repo: ITrialReminderRepo,
    private deliver: (payload: TrialReminderPayload) => Promise<{ id: string }>,
    private from: string,
    private replyTo: string,
  ) {}

  async runOnce(): Promise<"sent" | "retry" | "idle"> {
    for (const candidate of await this.repo.candidates()) {
      if (!z.string().email().safeParse(candidate.email).success) continue;
      await this.repo.enqueue(candidate, {
        from: this.from,
        message: {
          to: candidate.email,
          ...buildTrialReminderEmail(candidate.stage, candidate.expiresAt),
          replyTo: this.replyTo,
          idempotencyKey: `essential-trial-${candidate.stage}-v1-${candidate.userId}`,
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
    await this.repo.sent(job, result.id);
    return "sent";
  }
}
