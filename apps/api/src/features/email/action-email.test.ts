import { describe, expect, it } from "vitest";
import { buildFirstPriceEmail } from "./action-email";

describe("first price email", () => {
  it("invites one concrete action with a working app target and unsubscribe link", () => {
    const message = buildFirstPriceEmail({
      name: "Maria Silva",
      appUrl: "lucrocaseiro://pricing",
      unsubscribeUrl: "https://example.com/unsubscribe/opaque-token",
      businessAddress: "Rua Exemplo 123, São Paulo - SP",
    });

    expect(message.subject).toContain("preço");
    expect(message.text).toContain("Maria");
    expect(message.text).toContain("lucrocaseiro://pricing");
    expect(message.text).toContain("https://example.com/unsubscribe/opaque-token");
    expect(message.html).toContain('href="lucrocaseiro://pricing"');
    expect(message.html).toContain('href="https://example.com/unsubscribe/opaque-token"');
    expect(message.text).toContain("ORIONSEVEN SOFTWARE");
    expect(message.html).toContain("Rua Exemplo 123, São Paulo - SP");
  });

  it("escapes untrusted names before placing them in HTML", () => {
    const message = buildFirstPriceEmail({
      name: '<img src=x onerror="alert(1)">',
      appUrl: "lucrocaseiro://pricing",
      unsubscribeUrl: "https://example.com/unsubscribe/opaque-token",
      businessAddress: "Rua <Exemplo>",
    });
    expect(message.html).not.toContain("<img src=x");
    expect(message.html).toContain("Rua &lt;Exemplo&gt;");
  });
});
