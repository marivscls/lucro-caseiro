import type {
  CreateService,
  Order,
  OrderStatus,
  PurchaseServicePackage,
  Service,
  ServiceBookingRequest,
  ServiceBookingRequestStatus,
  ServiceInsights,
  ServicePackageInput,
  ServicePackagePurchase,
  UpdateService,
} from "@lucro-caseiro/contracts";

export interface CreateOrderData {
  title: string;
  deliveryDate: string;
  deliveryTime?: string;
  clientId?: string;
  serviceId?: string | null;
  serviceVariationId?: string | null;
  serviceVariationName?: string | null;
  serviceAddOnIds?: string[];
  serviceAddOnNames?: string[];
  servicePackagePurchaseId?: string | null;
  durationMinutes?: number | null;
  appointmentStatus?:
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show"
    | null;
  locationMode?: "business" | "client" | "online" | null;
  locationDetails?: string | null;
  actualCost?: number | null;
  completedAt?: string | null;
  saleId?: string | null;
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
  listServices?(userId: string): Promise<Service[]>;
  findServiceByName?(
    userId: string,
    name: string,
    excludeId?: string,
  ): Promise<Service | null>;
  createService?(userId: string, data: CreateService): Promise<Service | null>;
  updateService?(
    userId: string,
    id: string,
    data: UpdateService,
  ): Promise<Service | null>;
  findServiceById?(userId: string, id: string): Promise<Service | null>;
  findServicePackage?(
    userId: string,
    packageId: string,
  ): Promise<(ServicePackageInput & { id: string; serviceId: string }) | null>;
  createPackagePurchase?(
    userId: string,
    packageId: string,
    serviceId: string,
    data: PurchaseServicePackage,
    packageData: ServicePackageInput,
    expiresAt: string,
  ): Promise<ServicePackagePurchase>;
  updatePackagePurchaseSale?(
    userId: string,
    purchaseId: string,
    saleId: string,
  ): Promise<ServicePackagePurchase | null>;
  listPackagePurchases?(
    userId: string,
    opts?: { clientId?: string; serviceId?: string },
  ): Promise<ServicePackagePurchase[]>;
  consumePackageSession?(
    userId: string,
    purchaseId: string,
    orderId: string,
  ): Promise<ServicePackagePurchase | null>;
  getServiceInsights?(userId: string, serviceId: string): Promise<ServiceInsights>;
  listBookingRequests?(
    userId: string,
    serviceId: string,
  ): Promise<ServiceBookingRequest[]>;
  updateBookingRequestStatus?(
    userId: string,
    id: string,
    status: ServiceBookingRequestStatus,
  ): Promise<ServiceBookingRequest | null>;
  hasScheduleConflict?(
    userId: string,
    date: string,
    time: string,
    durationMinutes: number,
    excludeOrderId?: string,
  ): Promise<boolean>;
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

export interface IServiceSaleRegistrar {
  createServiceSale(
    userId: string,
    data: {
      serviceId: string;
      itemName: string;
      total: number;
      amountReceived: number;
      paymentMethod?: string;
      clientId?: string;
      soldAt?: string;
      sourceOrderId?: string;
      notes?: string;
    },
  ): Promise<{ id: string }>;
}
