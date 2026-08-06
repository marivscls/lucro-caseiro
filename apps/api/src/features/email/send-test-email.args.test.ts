import { describe, expect, it } from "vitest";

import { parseTestEmailArgs } from "./send-test-email.args";

describe("parseTestEmailArgs", () => {
  it("aceita o separador literal repassado pelo pnpm", () => {
    expect(parseTestEmailArgs(["--", "pessoa@example.com", "--confirm"])).toEqual({
      recipient: "pessoa@example.com",
    });
  });

  it("exige confirmacao explicita", () => {
    expect(() => parseTestEmailArgs(["pessoa@example.com"])).toThrow(
      "Confirme o envio adicionando --confirm",
    );
  });
});
