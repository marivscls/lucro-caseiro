import { resolveBrand } from "@lucro-caseiro/brands";
import { describe, expect, it } from "vitest";

import {
  buildProfessionalTrialEmail,
  PROFESSIONAL_TRIAL_BADGE_GIFT_URL,
  PROFESSIONAL_TRIAL_DASHBOARD_URL,
  PROFESSIONAL_TRIAL_GIFT_URL,
  PROFESSIONAL_TRIAL_HEART_URL,
  PROFESSIONAL_TRIAL_STAR_URL,
} from "./professional-trial-email";

describe("buildProfessionalTrialEmail", () => {
  it("usa conteudo final, assets HTTPS e paleta canonica", () => {
    const content = buildProfessionalTrialEmail();
    const { theme } = resolveBrand("lucro-caseiro");

    expect(content.subject).toBe(
      "Um presente para o seu neg\u00f3cio: 1 m\u00eas de Profissional \ud83c\udf81",
    );
    expect(content.html).toContain("PRESENTE ESPECIAL");
    expect(content.html).toContain(PROFESSIONAL_TRIAL_GIFT_URL);
    expect(content.html).toContain(PROFESSIONAL_TRIAL_DASHBOARD_URL);
    expect(content.html).toContain(PROFESSIONAL_TRIAL_BADGE_GIFT_URL);
    expect(content.html).toContain(PROFESSIONAL_TRIAL_STAR_URL);
    expect(content.html).toContain(PROFESSIONAL_TRIAL_HEART_URL);
    expect(content.html).not.toContain("cid:");
    expect(content.html).toContain("parceria que");
    expect(content.html).toContain("Explorar meu plano");
    expect(content.html).toContain(`bgcolor="${theme.primary}"`);
    expect(content.html).toContain(theme.primaryStrong);
    expect(content.html).toContain(theme.primarySoft);
    expect(content.text).toContain("Esse presente não gera cobrança automática");
    expect(content.html).toContain('href="lucrocaseiro://"');
    expect(content.html).not.toContain('href="https://app.lucrocaseiro.com.br"');
    expect(content.html).not.toContain("teste de envio");
  });
});
