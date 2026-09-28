import { describe, expect, it, vi } from "vitest";
import type {
  ITrialReminderRepo,
  TrialReminderCandidate,
  TrialReminderJob,
  TrialReminderPayload,
} from "./trial-reminder.types";
import { TrialReminderUseCases } from "./trial-reminder.usecases";

class MemoryQueue implements ITrialReminderRepo {
  candidatesToSend: TrialReminderCandidate[] = [
    {
      userId: "new-user",
      email: "ana@example.com",
      stage: "three_days",
      expiresAt: "2026-10-05T21:02:54.645Z",
    },
  ];
  jobs = new Map<string, { payload: TrialReminderPayload; state: string }>();
  candidates() {
    return Promise.resolve(
      this.candidatesToSend.filter(
        (candidate) => !this.jobs.has(`${candidate.userId}:${candidate.stage}`),
      ),
    );
  }
  enqueue(candidate: TrialReminderCandidate, payload: TrialReminderPayload) {
    const key = `${candidate.userId}:${candidate.stage}`;
    if (!this.jobs.has(key)) this.jobs.set(key, { payload, state: "pending" });
    return Promise.resolve();
  }
  claim(): Promise<TrialReminderJob | null> {
    for (const [key, row] of this.jobs) {
      if (row.state !== "pending") continue;
      row.state = "sending";
      const [userId, stage] = key.split(":");
      return Promise.resolve({
        userId: userId!,
        stage: stage as TrialReminderCandidate["stage"],
        token: "claim-token",
        payload: row.payload,
      });
    }
    return Promise.resolve(null);
  }
  sent(job: TrialReminderJob) {
    this.jobs.get(`${job.userId}:${job.stage}`)!.state = "sent";
    return Promise.resolve();
  }
  failed(job: TrialReminderJob) {
    this.jobs.get(`${job.userId}:${job.stage}`)!.state = "pending";
    return Promise.resolve();
  }
}

describe("Essential trial reminder delivery", () => {
  it("sends one message at each gradual stage, even across repeated polls", async () => {
    const repo = new MemoryQueue();
    const delivered: TrialReminderPayload[] = [];
    const useCases = new TrialReminderUseCases(
      repo,
      (payload) => {
        delivered.push(payload);
        return Promise.resolve({ id: `resend-${delivered.length}` });
      },
      "Lucro Caseiro <notificacoes@lucrocaseiro.com.br>",
      "contato@orionseven.com.br",
    );

    await useCases.runOnce();
    await useCases.runOnce();
    repo.candidatesToSend[0]!.stage = "one_day";
    await useCases.runOnce();
    repo.candidatesToSend[0]!.stage = "ended";
    await useCases.runOnce();
    await useCases.runOnce();

    expect(delivered).toHaveLength(3);
    expect(delivered.map(({ message }) => message.idempotencyKey)).toEqual([
      "essential-trial-three_days-v1-new-user",
      "essential-trial-one_day-v1-new-user",
      "essential-trial-ended-v1-new-user",
    ]);
    expect(
      delivered.every(({ message }) => message.replyTo === "contato@orionseven.com.br"),
    ).toBe(true);
  });

  it("retries the saved message rather than composing a different one", async () => {
    const repo = new MemoryQueue();
    const delivered: TrialReminderPayload[] = [];
    const send = vi.fn((payload: TrialReminderPayload) => {
      delivered.push(structuredClone(payload));
      if (delivered.length === 1) return Promise.reject(new Error("network"));
      return Promise.resolve({ id: "resend-id" });
    });
    const useCases = new TrialReminderUseCases(
      repo,
      send,
      "sender@example.com",
      "support@example.com",
    );
    expect(await useCases.runOnce()).toBe("retry");
    repo.candidatesToSend[0]!.email = "changed@example.com";
    expect(await useCases.runOnce()).toBe("sent");
    expect(delivered[1]).toEqual(delivered[0]);
  });

  it("never sends to an invalid email address", async () => {
    const repo = new MemoryQueue();
    repo.candidatesToSend[0]!.email = "not-an-email";
    const send = vi.fn();
    const useCases = new TrialReminderUseCases(
      repo,
      send,
      "sender@example.com",
      "support@example.com",
    );
    expect(await useCases.runOnce()).toBe("idle");
    expect(send).not.toHaveBeenCalled();
  });
});
