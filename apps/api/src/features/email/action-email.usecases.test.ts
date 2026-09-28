import { describe, expect, it, vi } from "vitest";
import { ActionEmailUseCases } from "./action-email.usecases";
import type {
  ActionEmailRepo,
  ActionEmailJob,
  ActionEmailPayload,
} from "./action-email.types";

function memoryRepo(): ActionEmailRepo & {
  eligible: boolean;
  queued: ActionEmailJob | null;
} {
  const state = { eligible: true, queued: null as ActionEmailJob | null };
  return {
    ...state,
    candidates: () =>
      Promise.resolve([
        {
          userId: "user-1",
          email: "maria@example.com",
          name: "Maria",
          unsubscribeToken: "opaque",
        },
      ]),
    enqueue: (_userId, payload) => {
      if (!state.queued) state.queued = { userId: "user-1", token: "lease", payload };
      return Promise.resolve();
    },
    claim: () => Promise.resolve(state.queued),
    stillEligible: () => Promise.resolve(state.eligible),
    cancelled: () => {
      state.queued = null;
      return Promise.resolve();
    },
    sent: () => {
      state.queued = null;
      return Promise.resolve();
    },
    failed: () => {
      state.queued = null;
      return Promise.resolve();
    },
    get eligible() {
      return state.eligible;
    },
    set eligible(value) {
      state.eligible = value;
    },
    get queued() {
      return state.queued;
    },
  };
}

describe("action email worker", () => {
  it("sends one first-price invitation with a stable idempotency key", async () => {
    const repo = memoryRepo();
    const deliver = vi.fn((_payload: ActionEmailPayload) =>
      Promise.resolve({ id: "resend-1" }),
    );
    const useCases = new ActionEmailUseCases(
      repo,
      deliver,
      "Lucro Caseiro <email@example.com>",
      "reply@example.com",
      "https://api.example.com",
      "Rua Exemplo 123",
    );

    expect(await useCases.runOnce()).toBe("sent");
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver.mock.calls[0]?.[0].message.idempotencyKey).toBe(
      "first-price-v1-user-1",
    );
    expect(deliver.mock.calls[0]?.[0].message.text).toContain(
      "https://api.example.com/api/v1/email-preferences/unsubscribe/opaque",
    );
  });

  it("cancels a queued invitation when the person completes the action before delivery", async () => {
    const repo = memoryRepo();
    repo.eligible = false;
    const deliver = vi.fn(() => Promise.resolve({ id: "resend-1" }));
    const useCases = new ActionEmailUseCases(
      repo,
      deliver,
      "from@example.com",
      "reply@example.com",
      "https://api.example.com",
      "Rua Exemplo 123",
    );

    expect(await useCases.runOnce()).toBe("cancelled");
    expect(deliver).not.toHaveBeenCalled();
  });
});
