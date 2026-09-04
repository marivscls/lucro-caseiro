import { describe, expect, it, vi } from "vitest";
import {
  businessTypeForSegment,
  marketingIdeas,
  profileAnswers,
  readBusinessOnboarding,
  saveBusinessOnboarding,
} from "./business-profile-data";
import { emptyBusinessProfile } from "./profile-data";
import { onboardingDestination } from "../../shared/utils/new-account";

const answers = {
  ...emptyBusinessProfile,
  name: " Ana ",
  business: " Ateliê ",
  segment: "craft",
  stage: "starting",
  goal: "price",
  channels: ["whatsapp", "referral"],
};
const dependencies = () => ({
  updateProfile: vi.fn().mockResolvedValue({}),
  updateMetadata: vi.fn().mockResolvedValue(undefined),
});

describe("perfil real do negócio", () => {
  it("salva os campos canônicos e as preferências antes de concluir", async () => {
    const deps = dependencies();
    const record = await saveBusinessOnboarding(answers, deps);
    expect(deps.updateProfile).toHaveBeenCalledWith({
      name: "Ana",
      businessName: "Ateliê",
      businessType: "crafts",
    });
    expect(deps.updateMetadata).toHaveBeenCalledWith({
      onboarding_completed: true,
      business_onboarding: record,
    });
    expect(record.answers).not.toHaveProperty("name");
    expect(record.status).toBe("completed");
  });
  it("dispensa sem alterar nome, negócio ou tipo e impede reabertura em outro aparelho", async () => {
    const deps = dependencies();
    expect(await saveBusinessOnboarding(null, deps)).toEqual({
      version: 1,
      status: "dismissed",
    });
    expect(deps.updateProfile).not.toHaveBeenCalled();
    const metadata = deps.updateMetadata.mock.calls[0][0];
    expect(
      onboardingDestination({
        userId: "a",
        createdAt: new Date().toISOString(),
        pendingUserIds: [],
        completed: false,
        completedUserIds: [],
        onboardingCompleted: metadata.onboarding_completed,
        now: Date.now(),
      }),
    ).toBe("/tabs");
  });
  it("não conclui quando a API falha e permite tentar novamente", async () => {
    const deps = dependencies();
    deps.updateProfile.mockRejectedValueOnce(new Error("offline"));
    await expect(saveBusinessOnboarding(answers, deps)).rejects.toThrow("offline");
    expect(deps.updateMetadata).not.toHaveBeenCalled();
    await expect(saveBusinessOnboarding(answers, deps)).resolves.toMatchObject({
      status: "completed",
    });
  });
  it("não informa sucesso se a gravação das preferências falhar", async () => {
    const deps = dependencies();
    deps.updateMetadata.mockRejectedValue(new Error("offline"));
    await expect(saveBusinessOnboarding(answers, deps)).rejects.toThrow("offline");
  });
  it("rejeita dados incompletos antes de qualquer escrita", async () => {
    const deps = dependencies();
    await expect(
      saveBusinessOnboarding({ ...answers, goal: "unknown" }, deps),
    ).rejects.toThrow();
    expect(deps.updateProfile).not.toHaveBeenCalled();
    expect(readBusinessOnboarding({ version: 2, status: "completed" })).toBeNull();
    expect(
      readBusinessOnboarding({ version: 1, status: "completed", answers: {} }),
    ).toBeNull();
  });
  it("restaura preferências e elimina canais inválidos ou repetidos", () => {
    const record = readBusinessOnboarding({
      version: 1,
      status: "completed",
      answers: { ...answers, channels: ["whatsapp", "unknown", "whatsapp"] },
    });
    expect(profileAnswers(record)).toMatchObject({
      segment: "craft",
      goal: "price",
      channels: ["whatsapp"],
    });
    expect(profileAnswers(null)).toEqual(emptyBusinessProfile);
  });
  it("mapeia os segmentos para tipos aceitos pela API", () => {
    expect(businessTypeForSegment("sweets")).toBe("food");
    expect(businessTypeForSegment("retail")).toBe("other");
    expect(businessTypeForSegment("services")).toBe("services");
  });
  it("gera ideias apenas para os canais selecionados e adapta serviço e artesanato", () => {
    expect(marketingIdeas(answers).map((idea) => idea.value)).toEqual([
      "whatsapp",
      "referral",
    ]);
    expect(marketingIdeas(answers)[0].idea).toContain("uma peça");
    expect(
      marketingIdeas({ ...answers, segment: "services", channels: ["instagram"] })[0]
        .idea,
    ).toContain("agendar");
    expect(marketingIdeas({ ...answers, channels: [] })).toEqual([]);
  });
});
