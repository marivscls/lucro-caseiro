import type { Order, OrderStatus } from "@lucro-caseiro/contracts";

export interface CreateOrderData {
  title: string;
  deliveryDate: string;
  deliveryTime?: string;
  clientId?: string;
  amount?: number;
  deposit?: number | null;
  theme?: string | null;
  honoree?: string | null;
  colors?: string | null;
  photoUrl?: string | null;
  notes?: string;
  status?: OrderStatus;
}

export type UpdateOrderData = Partial<CreateOrderData>;

export interface FindAllOrdersOpts {
  status?: OrderStatus;
  from?: string;
  to?: string;
}

export interface OrdersSummaryOpts {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Agregado das encomendas do usuario (exclui `cancelled`). Semantica de
 * PAGAMENTO (nao de status): `received` = soma dos sinais ja recebidos;
 * `toReceive` = soma de (valor - sinal) ainda em aberto.
 */
export interface OrdersSummary {
  totalOrders: number;
  totalAmount: number;
  received: number;
  toReceive: number;
}

/** Agregacao crua vinda do repo (uma linha por status). */
export interface OrdersStatusAggregate {
  status: OrderStatus;
  count: number;
  amount: number;
  deposit: number;
}

export interface IOrdersRepo {
  create(userId: string, data: CreateOrderData): Promise<Order>;
  findById(userId: string, id: string): Promise<Order | null>;
  findAll(userId: string, opts: FindAllOrdersOpts): Promise<Order[]>;
  update(userId: string, id: string, data: UpdateOrderData): Promise<Order | null>;
  delete(userId: string, id: string): Promise<boolean>;
  summarize(userId: string, opts: OrdersSummaryOpts): Promise<OrdersStatusAggregate[]>;
}

// Registra receita ao entregar — implementado por FinanceUseCases no composition
// root, sem acoplar a feature `finance` (boundary do CLAUDE.md).
export interface IIncomeRegistrar {
  create(
    userId: string,
    data: {
      type: "income";
      category: "sale";
      amount: number;
      description: string;
      date: string;
    },
  ): Promise<{ id: string }>;
}
