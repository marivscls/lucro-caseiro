import type { Order, OrderStatus } from "@lucro-caseiro/contracts";

export interface CreateOrderData {
  title: string;
  deliveryDate: string;
  deliveryTime?: string;
  clientId?: string;
  amount?: number;
  notes?: string;
  status?: OrderStatus;
}

export type UpdateOrderData = Partial<CreateOrderData>;

export interface FindAllOrdersOpts {
  status?: OrderStatus;
  from?: string;
  to?: string;
}

export interface IOrdersRepo {
  create(userId: string, data: CreateOrderData): Promise<Order>;
  findById(userId: string, id: string): Promise<Order | null>;
  findAll(userId: string, opts: FindAllOrdersOpts): Promise<Order[]>;
  update(userId: string, id: string, data: UpdateOrderData): Promise<Order | null>;
  delete(userId: string, id: string): Promise<boolean>;
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
