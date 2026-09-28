import type {
  AssistantNotebookResult,
  AssistantSaleDraft,
  AssistantUsage,
  ImportNotebook,
  ImportNotebookResult,
} from "@lucro-caseiro/contracts";

import { LimitExceededError, ValidationError } from "../../shared/errors";
import {
  assistantLimit,
  baseMimeType,
  bestNameMatch,
  fileProblem,
  monthKey,
  sanitizeItem,
  sanitizeNotebookRow,
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

  async readNotebook(
    userId: string,
    image: AssistantFile,
  ): Promise<AssistantNotebookResult> {
    const problem = fileProblem(image, "image");
    if (problem) throw new ValidationError([problem]);
    const today = todayIso(this.clock());
    const [clients, { result: raw, usage }] = await Promise.all([
      this.business.listClients(userId),
      this.withQuota(userId, () =>
        this.ai.readNotebook({
          image: {
            data: stripDataUrl(image.data),
            mimeType: baseMimeType(image.mimeType),
          },
          today,
        }),
      ),
    ]);
    const rows = raw
      .map((row) => sanitizeNotebookRow(row, today))
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .slice(0, 100)
      .map((row) => ({ ...row, clientId: bestNameMatch(row.name, clients)?.id ?? null }));
    return { rows, usage };
  }

  /**
   * Transforma as linhas revisadas em clientes (quando novos) e fiados em aberto.
   * Mesmo nome escrito em várias linhas vira um cliente só.
   */
  async importNotebook(
    userId: string,
    data: ImportNotebook,
  ): Promise<ImportNotebookResult> {
    const clients = await this.business.listClients(userId);
    const known = new Set(clients.map((client) => client.id));
    const newNames = new Map<string, string>();
    for (const row of data.rows) {
      if (row.clientId && known.has(row.clientId)) continue;
      const existing = bestNameMatch(row.name, clients);
      if (existing) continue;
      const key = row.name.trim().toLocaleLowerCase("pt-BR");
      if (!newNames.has(key)) newNames.set(key, row.name.trim());
    }

    const remaining = await this.business.remainingClients(userId);
    if (remaining !== null && newNames.size > remaining) {
      throw new LimitExceededError(
        `O plano Gratuito guarda até 50 clientes e ainda cabem ${remaining}. Essa página tem ${newNames.size} pessoas novas. Assine o Essencial para importar tudo, ou tire algumas linhas.`,
      );
    }

    const createdIds = new Map<string, string>();
    for (const [key, name] of newNames) {
      createdIds.set(key, await this.business.createClient(userId, name));
    }

    let total = 0;
    for (const row of data.rows) {
      const clientId =
        (row.clientId && known.has(row.clientId) ? row.clientId : null) ??
        bestNameMatch(row.name, clients)?.id ??
        createdIds.get(row.name.trim().toLocaleLowerCase("pt-BR"));
      if (!clientId) continue;
      await this.business.createOpeningFiado(userId, {
        clientId,
        amount: row.amount,
        date: row.date,
        note: row.note,
      });
      total += row.amount;
    }

    return {
      createdClients: createdIds.size,
      createdFiados: data.rows.length,
      total: Math.round(total * 100) / 100,
    };
  }
}
