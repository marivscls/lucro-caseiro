import { resolveBrand } from "@lucro-caseiro/brands";
import { describe, expect, it } from "vitest";

import { buildActivationFeedbackEmail } from "./activation-feedback-email";

describe("buildActivationFeedbackEmail", () => {
  it("asks one direct question and invites a reply", () => {
    const content = buildActivationFeedbackEmail();

    expect(content.subject).toBe(
      "Posso te fazer uma pergunta rápida sobre o Lucro Caseiro?",
    );
    expect(content.text).toContain("seu primeiro produto ou sua primeira venda");
    expect(content.text).toContain("responder este e-mail com uma frase");
    expect(content.html).toContain("seu primeiro produto ou sua primeira venda");
  });

  it("uses the canonical brand palette without decorative images", () => {
    const { theme } = resolveBrand("lucro-caseiro");
    const content = buildActivationFeedbackEmail();

    expect(content.html).toContain(theme.primary);
    expect(content.html).toContain(theme.primaryStrong);
    expect(content.html).toContain(theme.primarySoft);
    expect(content.html).toContain(theme.background);
    expect(content.html).not.toContain("<img");
  });
});
