import type { UpdateProfile, UserProfile } from "@lucro-caseiro/contracts";
import {
  emptyBusinessProfile,
  profileChannels,
  profileGoals,
  profileSegments,
  profileStages,
  type BusinessProfileAnswers,
} from "./profile-data";

export type BusinessOnboarding = {
  version: 1;
  status: "completed" | "dismissed";
  answers?: Pick<BusinessProfileAnswers, "segment" | "stage" | "goal" | "channels">;
};

const includes = (items: { value: string }[], value: unknown): value is string =>
  typeof value === "string" && items.some((item) => item.value === value);

export function readBusinessOnboarding(value: unknown): BusinessOnboarding | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.version !== 1) return null;
  if (record.status === "dismissed") return { version: 1, status: "dismissed" };
  if (
    record.status !== "completed" ||
    !record.answers ||
    typeof record.answers !== "object"
  )
    return null;
  const answers = record.answers as Record<string, unknown>;
  if (
    !includes(profileSegments, answers.segment) ||
    !includes(profileStages, answers.stage) ||
    !includes(profileGoals, answers.goal) ||
    !Array.isArray(answers.channels)
  )
    return null;
  return {
    version: 1,
    status: "completed",
    answers: {
      segment: answers.segment,
      stage: answers.stage,
      goal: answers.goal,
      channels: [
        ...new Set(answers.channels.filter((item) => includes(profileChannels, item))),
      ],
    },
  };
}

export function businessTypeForSegment(segment: string) {
  if (segment === "sweets") return "food";
  if (segment === "craft") return "crafts";
  if (segment === "retail") return "other";
  return segment;
}

export function profileAnswers(
  record: BusinessOnboarding | null,
  profile?: UserProfile,
): BusinessProfileAnswers {
  let fallback = profile?.businessType ?? "";
  if (fallback === "crafts") fallback = "craft";
  if (fallback === "beauty") fallback = "services";
  return {
    ...emptyBusinessProfile,
    segment: fallback,
    ...record?.answers,
    name: profile?.name ?? "",
    business: profile?.businessName ?? "",
    channels: record?.answers?.channels ?? [],
  };
}

/** Both writes must succeed before completion is acknowledged or navigation occurs. */
export async function saveBusinessOnboarding(
  profile: BusinessProfileAnswers | null,
  dependencies: {
    updateProfile: (value: UpdateProfile) => Promise<unknown>;
    updateMetadata: (data: Record<string, unknown>) => Promise<void>;
  },
): Promise<BusinessOnboarding> {
  let record: BusinessOnboarding = { version: 1, status: "dismissed" };
  if (profile) {
    const name = profile.name.trim();
    const business = profile.business.trim();
    const parsed = readBusinessOnboarding({
      version: 1,
      status: "completed",
      answers: profile,
    });
    if (!name || name.length > 200 || business.length > 200 || !parsed)
      throw new Error("Confira as respostas antes de salvar.");
    record = parsed;
    await dependencies.updateProfile({
      name,
      businessName: business,
      businessType: businessTypeForSegment(profile.segment),
    });
  }
  await dependencies.updateMetadata({
    business_onboarding: record,
    onboarding_completed: true,
  });
  return record;
}

export function marketingIdeas(profile: BusinessProfileAnswers) {
  const subject =
    (
      {
        food: "um prato",
        sweets: "um doce",
        craft: "uma peça",
        services: "um serviço",
        retail: "um produto",
        other: "seu trabalho",
      } as Record<string, string>
    )[profile.segment] ?? "seu trabalho";
  const ideas: Record<string, string> = {
    whatsapp: `Apresente ${subject} no Status com preço e disponibilidade. Convide quem tiver interesse a conversar.`,
    instagram: `Mostre ${subject} em uma foto ou vídeo curto. Explique como pedir informações ou ${profile.segment === "services" ? "agendar" : "comprar"}.`,
    in_person: `Deixe uma apresentação de ${subject} à vista, com preço e uma forma de entrar em contato.`,
    referral: `Depois de uma boa experiência, convide o cliente a indicar ${profile.business.trim() || "seu negócio"} a alguém que possa se interessar.`,
  };
  return profileChannels
    .filter((channel) => profile.channels.includes(channel.value))
    .map((channel) => ({ ...channel, idea: ideas[channel.value] }));
}
