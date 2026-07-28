import { describe, expect, it } from "vitest";

import { normalizeClient } from "./api";

describe("normalizeClient", () => {
  it("converte campos de próximo contato ausentes da API antiga em null", () => {
    const client = normalizeClient({
      id: "c86d0102-14f1-4fce-9811-8f710feae57a",
      userId: "d70b96f6-2673-499f-81e5-70f0ec8b75df",
      name: "Mariana",
      phone: null,
      address: null,
      birthday: null,
      notes: null,
      tags: [],
      totalSpent: 0,
      createdAt: "2026-07-25T00:00:00.000Z",
    });

    expect(client.nextContactAt).toBeNull();
    expect(client.nextContactReason).toBeNull();
    expect(client.nextContactNotes).toBeNull();
  });
});
