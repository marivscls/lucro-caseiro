import type {
  ConvertQuote,
  CreateQuote,
  Quote,
  UpdateQuote,
  UpdateQuoteStatus,
} from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { computeQuoteTotal, quoteItemsSummary, validateQuote } from "./quotes.domain";
import type { FindAllQuotesOpts, IOrderCreator, IQuotesRepo } from "./quotes.types";

export class QuotesUseCases {
  constructor(
    private repo: IQuotesRepo,
    private orderCreator: IOrderCreator,
  ) {}

  async create(userId: string, data: CreateQuote): Promise<Quote> {
    const errors = validateQuote(data);
    if (errors.length > 0) throw new ValidationError(errors);

    return this.repo.create(userId, { ...data, total: computeQuoteTotal(data.items) });
  }

  async getById(userId: string, id: string): Promise<Quote> {
    const quote = await this.repo.findById(userId, id);
    if (!quote) throw new NotFoundError("Orçamento não encontrado");
    return quote;
  }

  async list(userId: string, opts: FindAllQuotesOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return { items, ...paginationMeta(total, opts.page, opts.limit) };
  }

  async update(userId: string, id: string, data: UpdateQuote): Promise<Quote> {
    const existing = await this.getById(userId, id);
    if (existing.status === "accepted") {
      throw new ValidationError([
        "Orçamento aprovado não pode ser editado. Edite a encomenda gerada.",
      ]);
    }

    const errors = validateQuote(data);
    if (errors.length > 0) throw new ValidationError(errors);

    const total = data.items ? computeQuoteTotal(data.items) : undefined;
    const updated = await this.repo.update(userId, id, { ...data, total });
    if (!updated) throw new NotFoundError("Orçamento não encontrado");
    return updated;
  }

  async setStatus(userId: string, id: string, data: UpdateQuoteStatus): Promise<Quote> {
    await this.getById(userId, id);
    const updated = await this.repo.update(userId, id, { status: data.status });
    if (!updated) throw new NotFoundError("Orçamento não encontrado");
    return updated;
  }

  /** Aprova o orçamento e cria a encomenda correspondente na agenda. */
  async convertToOrder(userId: string, id: string, data: ConvertQuote): Promise<Quote> {
    const quote = await this.getById(userId, id);
    if (quote.orderId) {
      throw new ValidationError(["Este orçamento já virou uma encomenda."]);
    }
    if (data.deposit != null && data.deposit > quote.total) {
      throw new ValidationError(["O sinal não pode ser maior que o total do orçamento."]);
    }

    const summary = quoteItemsSummary(quote.items);
    const notes = [summary, quote.notes].filter(Boolean).join("\n");
    const order = await this.orderCreator.create(userId, {
      title: quote.title,
      deliveryDate: data.deliveryDate,
      deliveryTime: data.deliveryTime,
      clientId: quote.clientId ?? undefined,
      amount: quote.total > 0 ? quote.total : undefined,
      deposit: data.deposit,
      notes: notes.slice(0, 500) || undefined,
    });

    const updated = await this.repo.update(userId, id, {
      status: "accepted",
      orderId: order.id,
    });
    if (!updated) throw new NotFoundError("Orçamento não encontrado");
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) throw new NotFoundError("Orçamento não encontrado");
  }
}
