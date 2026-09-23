import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();
const requestReview = vi.fn(() => Promise.resolve());

vi.mock("./async-storage", () => ({
  asyncStorage: {
    getItem: (key: string) => Promise.resolve(storage.get(key) ?? null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    },
  },
}));

vi.mock("expo-store-review", () => ({
  isAvailableAsync: () => Promise.resolve(true),
  requestReview,
}));

import { maybeAskForReview } from "./store-review";

describe("maybeAskForReview", () => {
  beforeEach(() => {
    storage.clear();
    requestReview.mockClear();
  });

  it("não pede avaliação antes da 5ª venda", async () => {
    await maybeAskForReview(4);
    expect(requestReview).not.toHaveBeenCalled();
  });

  it("pede avaliação uma única vez a partir da 5ª venda", async () => {
    await maybeAskForReview(5);
    await maybeAskForReview(6);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });
});
