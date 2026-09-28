import type { PaymentMethod, PlanType } from "@lucro-caseiro/contracts";

export interface AssistantFile {
  data: string;
  mimeType: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
}

export interface CatalogClient {
  id: string;
  name: string;
}

/** O que a IA devolve para uma venda falada/escrita (antes de casar com o cadastro). */
export interface RawSaleDraft {
  transcript: string;
  clientName: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: number | null }>;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
}

export interface RawNotebookRow {
  name: string;
  amount: number;
  date: string | null;
  note: string | null;
}

/** Modelo de IA (Gemini no composition root; falso nos testes). */
export interface IAssistantAi {
  parseSale(input: {
    text?: string;
    audio?: AssistantFile;
    products: CatalogProduct[];
    clients: CatalogClient[];
    today: string;
  }): Promise<RawSaleDraft>;
  readNotebook(input: { image: AssistantFile; today: string }): Promise<RawNotebookRow[]>;
}

export interface IAssistantUsageRepo {
  getCount(userId: string, month: string): Promise<number>;
  increment(userId: string, month: string): Promise<number>;
}

/** Leitura do cadastro e escrita do caderno importado, vindas de outras features. */
export interface IAssistantBusiness {
  listProducts(userId: string): Promise<CatalogProduct[]>;
  listClients(userId: string): Promise<CatalogClient[]>;
  activePlan(userId: string): Promise<PlanType>;
  /** Quantos clientes novos ainda cabem no plano (null = sem limite). */
  remainingClients(userId: string): Promise<number | null>;
  createClient(userId: string, name: string): Promise<string>;
  createOpeningFiado(
    userId: string,
    data: { clientId: string; amount: number; date: string | null; note: string | null },
  ): Promise<void>;
}
