import { describe, expect, it } from "vitest";

import { paidAccountDeletionCopy } from "./delete-account-copy";

describe("paidAccountDeletionCopy", () => {
  it("deixa claro que excluir a conta não encerra a cobrança", () => {
    const copy = paidAccountDeletionCopy("Profissional", "Google Play");

    expect(copy.title).toBe("Cancele a assinatura primeiro");
    expect(copy.message).toContain("não cancela a cobrança");
    expect(copy.message).toContain("continuará renovando pelo Google Play");
    expect(copy.message).toContain("confirme que já cancelou");
  });
});
