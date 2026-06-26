import type { CreateQuote, Quote, QuoteStatusType } from "@lucro-caseiro/contracts";

export interface FindAllQuotesOpts {
  page: number;
  limit: number;
  status?: QuoteStatusType;
}

export interface IQuotesRepo {
  create(userId: string, data: CreateQuote & { total: number }): Promise<Quote>;
  findById(userId: string, id: string): Promise<Quote | null>;
  findAll(
    userId: string,
    opts: FindAllQuotesOpts,
  ): Promise<{ items: Quote[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<
      CreateQuote & { total: number; status: QuoteStatusType; orderId: string }
    >,
  ): Promise<Quote | null>;
  delete(userId: string, id: string): Promise<boolean>;
}

/** Criador de encomendas injetado (conversão orçamento -> encomenda). */
export interface IOrderCreator {
  create(
    userId: string,
    data: {
      title: string;
      deliveryDate: string;
      deliveryTime?: string;
      clientId?: string;
      amount?: number;
      deposit?: number | null;
      notes?: string;
    },
  ): Promise<{ id: string }>;
}
