import type { AssistantSaleDraft, AssistantUsage } from "@lucro-caseiro/contracts";

import { LimitExceededError, ValidationError } from "../../shared/errors";
import {
  assistantLimit,
  baseMimeType,
  bestNameMatch,
  fileProblem,
  monthKey,
  sanitizeItem,
  stripDataUrl,
  todayIso,
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
    const [used, plan] = await Promise.all([
      this.usage.getCount(userId, monthKey(this.clock())),
      this.business.activePlan(userId),
    ]);
    return { used, limit: assistantLimit(plan) };
  }

  /** Confere o limite antes de gastar a IA; conta o uso só se deu certo. */
  private async withQuota<T>(
    userId: string,
    run: () => Promise<T>,
  ): Promise<{ result: T; usage: AssistantUsage }> {
    const month = monthKey(this.clock());
    const [used, plan] = await Promise.all([
      this.usage.getCount(userId, month),
      this.business.activePlan(userId),
    ]);
    const limit = assistantLimit(plan);
    if (used >= limit) {
      throw new LimitExceededError(
        plan === "free"
          ? `Você já usou o assistente ${limit} vezes este mês no plano Gratuito. No Essencial ele fica praticamente à vontade.`
          : `Você chegou a ${limit} usos do assistente este mês. O contador volta a zero no dia 1º.`,
      );
    }
    const result = await run();
    const count = await this.usage.increment(userId, month);
    return { result, usage: { used: count, limit } };
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
