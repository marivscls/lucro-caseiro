import { describe, expect, it } from "vitest";
import { buildTrialReminderEmail } from "./trial-reminder";

const expiry = "2026-10-05T21:02:54.645Z";

describe("Essential trial reminder emails", () => {
  it("gently introduces the approaching end three days ahead", () => {
    const email = buildTrialReminderEmail("three_days", expiry);
    expect(email.subject).toContain("Essencial");
    expect(email.text).toContain("5 de outubro");
    expect(email.text).toContain("sem cobrança automática");
    expect(email.text).toContain("dados continuam salvos");
    expect(email.text).toContain("Gratuito");
    expect(email.html).toContain("lucrocaseiro://");
  });

  it("offers a calm choice near the last day", () => {
    const email = buildTrialReminderEmail("one_day", expiry);
    expect(email.subject).toContain("termina em breve");
    expect(email.text).toContain("5 de outubro");
    expect(email.text).toContain("18h02");
    expect(email.text).toContain("Assinar é opcional");
  });

  it("confirms the free plan and saved data after expiry", () => {
    const email = buildTrialReminderEmail("ended", expiry);
    expect(email.subject).toContain("dados continuam salvos");
    expect(email.text).toContain("voltou ao plano Gratuito");
    expect(email.text).toContain("sem cobrança automática");
    expect(email.text).not.toContain("perdeu seus dados");
  });
});
