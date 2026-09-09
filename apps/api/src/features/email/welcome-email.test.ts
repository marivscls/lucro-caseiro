import { describe, expect, it } from "vitest";
import { buildWelcomeEmail } from "./welcome-email";

describe("welcome email", () => {
  it("uses the approved layout with the recipient's own name and business", () => {
    const email = buildWelcomeEmail({
      name: "Ana Silva",
      businessName: "Doces da Ana",
      businessType: "food",
    });
    expect(email.subject).toBe("Ana, seu negócio é bem-vindo aqui.");
    expect(email.html).toContain("Oi, Ana!");
    expect(email.text).toContain("Doces da Ana");
    expect(email.html).toContain('href="lucrocaseiro://"');
    expect(email.html).toContain("Conheça também nosso site:");
    expect(email.html).not.toMatch(/Gamaliel|Oliveira|Mariana|border-left/);
  });
  it("escapes profile text instead of interpreting HTML", () => {
    const email = buildWelcomeEmail({
      name: "<img src=x> Silva",
      businessName: "A & B <script>bad</script>",
      businessType: "other",
    });
    expect(email.html).not.toContain("<img src=x>");
    expect(email.html).toContain("A &amp; B &lt;script&gt;bad&lt;/script&gt;");
    expect(email.text).toContain("A & B <script>bad</script>");
  });
  it.each(["services", "beauty"])(
    "guides %s businesses to service pricing",
    (businessType) => {
      const email = buildWelcomeEmail({ name: "João", businessName: null, businessType });
      expect(email.text).toContain("Serviços");
      expect(email.text).not.toMatch(/garrafa|rótulo|ingredientes|licores/);
    },
  );
  it("has a useful fallback before business setup is finished", () => {
    const email = buildWelcomeEmail({
      name: " ",
      businessName: null,
      businessType: null,
    });
    expect(email.subject).toBe("Seu negócio é bem-vindo no Lucro Caseiro.");
    expect(email.text).toContain("Oi!");
    expect(email.text).not.toMatch(/undefined|null|Gamaliel/);
  });
});
