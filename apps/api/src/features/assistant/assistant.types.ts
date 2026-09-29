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

/** Modelo de IA (Gemini no composition root; falso nos testes). */
export interface IAssistantAi {
  parseSale(input: {
    text?: string;
    audio?: AssistantFile;
    products: CatalogProduct[];
    clients: CatalogClient[];
    today: string;
  }): Promise<RawSaleDraft>;
}

export interface IAssistantUsageRepo {
  getCount(userId: string, month: string): Promise<number>;
  increment(userId: string, month: string): Promise<number>;
}

/** Leitura do cadastro, vinda de outras features. */
export interface IAssistantBusiness {
  listProducts(userId: string): Promise<CatalogProduct[]>;
  listClients(userId: string): Promise<CatalogClient[]>;
  activePlan(userId: string): Promise<PlanType>;
}
