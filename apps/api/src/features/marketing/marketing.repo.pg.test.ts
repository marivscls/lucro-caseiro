import { describe, expect, it, vi } from "vitest";

import type { AppDatabase } from "../../shared/db";
import { MarketingRepoPg } from "./marketing.repo.pg";

describe("MarketingRepoPg ownership", () => {
  it("recusa inserir mensagem quando a conversa não pertence à conta", async () => {
    const insert = vi.fn();
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })),
      })),
      insert,
    } as unknown as AppDatabase;
    const repo = new MarketingRepoPg(db);

    await expect(
      repo.addMessage("user-a", "session-de-user-b", "user", "mensagem"),
    ).rejects.toThrow("Conversa não encontrada");
    expect(insert).not.toHaveBeenCalled();
  });
});
