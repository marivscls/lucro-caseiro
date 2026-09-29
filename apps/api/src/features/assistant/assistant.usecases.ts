import type { AssistantSaleDraft, AssistantUsage } from "@lucro-caseiro/contracts";

import { LimitExceededError, ValidationError } from "../../shared/errors";
import {
  assistantLimit,
  baseMimeType,
  bestNameMatch,
  fileProblem,
  sanitizeItem,
  stripDataUrl,
  todayIso,
  usageKey,
} from "./assistant.domain";
import type {
  AssistantFile,
  IAssistantAi,
  IAssistantBusiness,
  IAssistantUsageRepo,
} from "./assistant.types";

export class AssistantUseCases {
  constructor(
    private ai: IAssistantAi,
    private usage: IAssistantUsageRepo,
    private business: IAssistantBusiness,
    private clock: () => Date = () => new Date(),
  ) {}

  async getUsage(userId: string): Promise<AssistantUsage> {
    const plan = await this.business.activePlan(userId);
    const used = await this.usage.getCount(userId, usageKey(plan, this.clock()));
    return { used, limit: assistantLimit(plan), trial: plan === "free" };
  }

  /** Confere o limite antes de gastar a IA; conta o uso só se deu certo. */
  private async withQuota<T>(
    userId: string,
    run: () => Promise<T>,
  ): Promise<{ result: T; usage: AssistantUsage }> {
    const plan = await this.business.activePlan(userId);
    const key = usageKey(plan, this.clock());
    const used = await this.usage.getCount(userId, key);
    const limit = assistantLimit(plan);
    const trial = plan === "free";
    if (used >= limit) {
      throw new LimitExceededError(
        trial
          ? `Você já usou os ${limit} testes do assistente no plano Gratuito. No Essencial ele vem com usos todo mês.`
          : `Você chegou a ${limit} usos do assistente este mês. O contador volta a zero no dia 1º.`,
      );
    }
    const result = await run();
    const count = await this.usage.increment(userId, key);
    return { result, usage: { used: count, limit, trial } };
  }

  async draftSale(
    userId: string,
    input: { text?: string; audio?: AssistantFile },
  ): Promise<AssistantSaleDraft> {
    if (input.audio) {
      const problem = fileProblem(input.audio, "audio");
      if (problem) throw new ValidationError([problem]);
    }
    const [products, clients] = await Promise.all([
      this.business.listProducts(userId),
      this.business.listClients(userId),
    ]);
    const { result: raw, usage } = await this.withQuota(userId, () =>
      this.ai.parseSale({
        text: input.text,
        audio: input.audio
          ? {
              data: stripDataUrl(input.audio.data),
              mimeType: baseMimeType(input.audio.mimeType),
            }
          : undefined,
        products,
        clients,
        today: todayIso(this.clock()),
      }),
    );

    const client = raw.clientName ? bestNameMatch(raw.clientName, clients) : null;
    const items = raw.items
      .map(sanitizeItem)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 30)
      .map((item) => {
        const product = bestNameMatch(item.name, products);
        return {
          productId: product?.id ?? null,
          name: product?.name ?? item.name,
          quantity: item.quantity,
          unitPrice:
            item.unitPrice ?? (product && product.price > 0 ? product.price : null),
        };
      });

    return {
      transcript: raw.transcript.trim().slice(0, 1000),
      clientId: client?.id ?? null,
      clientName: client?.name ?? raw.clientName?.trim() ?? null,
      items,
      paymentMethod: raw.paymentMethod,
      notes: raw.notes?.trim().slice(0, 500) || null,
      usage,
    };
  }
}
