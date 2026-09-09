import { describe, expect, it, vi } from "vitest";
import { WelcomeEmailUseCases } from "./welcome-email.usecases";
import type {
  IWelcomeEmailRepo,
  WelcomeCandidate,
  WelcomeJob,
  WelcomePayload,
} from "./welcome-email.types";

class MemoryQueue implements IWelcomeEmailRepo {
  people: WelcomeCandidate[] = [
    {
      userId: "new-user",
      email: "ana@example.com",
      name: "Ana Silva",
      businessName: "Doces da Ana",
      businessType: "food",
    },
  ];
  jobs = new Map<
    string,
    { payload: WelcomePayload; state: string; providerId?: string }
  >();
  activate() {
    return Promise.resolve();
  }
  candidates() {
    return Promise.resolve(this.people.filter((p) => !this.jobs.has(p.userId)));
  }
  enqueue(id: string, payload: WelcomePayload) {
    if (!this.jobs.has(id)) this.jobs.set(id, { payload, state: "pending" });
    return Promise.resolve();
  }
  claim(): Promise<WelcomeJob | null> {
    for (const [userId, row] of this.jobs)
      if (row.state === "pending") {
        row.state = "sending";
        return Promise.resolve({ userId, token: "claim-token", payload: row.payload });
      }
    return Promise.resolve(null);
  }
  sent(job: WelcomeJob, providerId: string) {
    Object.assign(this.jobs.get(job.userId)!, { state: "sent", providerId });
    return Promise.resolve();
  }
  failed(job: WelcomeJob) {
    this.jobs.get(job.userId)!.state = "pending";
    return Promise.resolve();
  }
}

describe("welcome email automation", () => {
  it("sends a new signup once across repeated polls", async () => {
    const repo = new MemoryQueue();
    const delivered: WelcomePayload[] = [];
    const uc = new WelcomeEmailUseCases(
      repo,
      (payload) => {
        delivered.push(payload);
        return Promise.resolve({ id: "resend-id" });
      },
      "Lucro Caseiro <notificacoes@lucrocaseiro.com.br>",
      "contato@orionseven.com.br",
    );
    await uc.runOnce();
    await uc.runOnce();
    expect(delivered).toHaveLength(1);
    expect(delivered[0]?.message).toMatchObject({
      to: "ana@example.com",
      replyTo: "contato@orionseven.com.br",
      idempotencyKey: "welcome-v1-new-user",
    });
    expect(repo.jobs.get("new-user")).toMatchObject({
      state: "sent",
      providerId: "resend-id",
    });
  });
  it("retries the exact saved content after a temporary failure", async () => {
    const repo = new MemoryQueue();
    const delivered: WelcomePayload[] = [];
    const send = vi.fn((payload: WelcomePayload) => {
      delivered.push(structuredClone(payload));
      if (delivered.length === 1) return Promise.reject(new Error("network"));
      return Promise.resolve({ id: "email-id" });
    });
    const uc = new WelcomeEmailUseCases(
      repo,
      send,
      "sender@example.com",
      "support@example.com",
    );
    await uc.runOnce();
    repo.people[0]!.name = "Changed name";
    await uc.runOnce();
    expect(delivered[1]).toEqual(delivered[0]);
    expect(repo.jobs.get("new-user")?.state).toBe("sent");
  });
  it("rejects an invalid recipient without calling the provider", async () => {
    const repo = new MemoryQueue();
    repo.people[0]!.email = "not an email";
    const send = vi.fn();
    const uc = new WelcomeEmailUseCases(
      repo,
      send,
      "sender@example.com",
      "support@example.com",
    );
    expect(await uc.runOnce()).toBe("idle");
    expect(send).not.toHaveBeenCalled();
  });
  it("does not release a job when persistence fails after provider acceptance", async () => {
    const repo = new MemoryQueue();
    repo.sent = () => Promise.reject(new Error("database down"));
    const uc = new WelcomeEmailUseCases(
      repo,
      () => Promise.resolve({ id: "accepted" }),
      "sender@example.com",
      "support@example.com",
    );
    await expect(uc.runOnce()).rejects.toThrow("database down");
    expect(repo.jobs.get("new-user")?.state).toBe("sending");
  });
});
