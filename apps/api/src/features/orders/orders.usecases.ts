import type {
  CompleteServiceAppointment,
  CreateService,
  DeliverOrder,
  Order,
  PurchaseServicePackage,
  Service,
  ServiceBookingRequest,
  ServiceBookingRequestStatus,
  ServiceInsights,
  ServicePackagePurchase,
  UpdateService,
} from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { buildOrdersSummary, todayISO, validateOrder } from "./orders.domain";
import type {
  CreateOrderData,
  FindAllOrdersOpts,
  IIncomeRegistrar,
  IOrdersRepo,
  IServiceSaleRegistrar,
  OrdersSummary,
  OrdersSummaryOpts,
  UpdateOrderData,
} from "./orders.types";

export class OrdersUseCases {
  constructor(
    private repo: IOrdersRepo,
    private income: IIncomeRegistrar,
    private serviceSales?: IServiceSaleRegistrar,
  ) {}

  async create(userId: string, data: CreateOrderData): Promise<Order> {
    data = (await this.prepareServiceOrder(userId, data)) as CreateOrderData;
    const errors = validateOrder(data);
    if (errors.length > 0) throw new ValidationError(errors);
    await this.assertAvailable(userId, data);
    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Order> {
    const order = await this.repo.findById(userId, id);
    if (!order) throw new NotFoundError("Encomenda nao encontrada");
    return order;
  }

  async list(userId: string, opts: FindAllOrdersOpts): Promise<Order[]> {
    return this.repo.findAll(userId, opts);
  }

  /** Resumo agregado das encomendas (total + a receber/recebido). */
  async getSummary(userId: string, opts: OrdersSummaryOpts): Promise<OrdersSummary> {
    const rows = await this.repo.summarize(userId, opts);
    return buildOrdersSummary(rows);
  }

  async update(userId: string, id: string, data: UpdateOrderData): Promise<Order> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) throw new NotFoundError("Encomenda nao encontrada");

    if (
      data.serviceId !== undefined ||
      data.serviceVariationId !== undefined ||
      data.serviceAddOnIds !== undefined ||
      data.servicePackagePurchaseId !== undefined
    ) {
      data = await this.prepareServiceOrder(userId, data, existing);
    }

    if (data.appointmentStatus) {
      data.status = appointmentOrderStatus(data.appointmentStatus);
    }

    const errors = validateOrder(data, true);
    if (errors.length > 0) throw new ValidationError(errors);

    await this.assertAvailable(userId, data, id, existing);
    const updated = await this.repo.update(userId, id, data);
    if (!updated) throw new NotFoundError("Encomenda nao encontrada");
    return updated;
  }

  /**
   * Marca como entregue. Idempotente: se ja entregue, nao registra receita de novo.
   * Com `registerIncome`, lanca a receita no financeiro (categoria venda).
   */
  async deliver(userId: string, id: string, opts: DeliverOrder): Promise<Order> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) throw new NotFoundError("Encomenda nao encontrada");

    if (existing.status === "done") return existing;

    const updated = await this.repo.update(userId, id, { status: "done" });
    if (!updated) throw new NotFoundError("Encomenda nao encontrada");

    if (opts.registerIncome && updated.amount != null && updated.amount > 0) {
      await this.income.create(userId, {
        type: "income",
        category: "sale",
        amount: updated.amount,
        description: updated.title,
        date: todayISO(new Date()),
      });
    }

    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) throw new NotFoundError("Encomenda nao encontrada");
  }

  listServices(userId: string): Promise<Service[]> {
    return this.repo.listServices ? this.repo.listServices(userId) : Promise.resolve([]);
  }

  async createService(userId: string, data: CreateService): Promise<Service> {
    if (!this.repo.createService) {
      throw new ValidationError(["Cadastro de serviços indisponível"]);
    }
    await this.assertServiceNameAvailable(userId, data.name);
    const created = await this.repo.createService(userId, data);
    if (!created) {
      throw new ValidationError(["Já existe um serviço com esse nome"]);
    }
    return created;
  }

  async updateService(userId: string, id: string, data: UpdateService): Promise<Service> {
    if (!this.repo.updateService) {
      throw new ValidationError(["Cadastro de serviços indisponível"]);
    }
    if (data.name !== undefined) {
      await this.assertServiceNameAvailable(userId, data.name, id);
    }
    const updated = await this.repo.updateService(userId, id, data);
    if (!updated) throw new NotFoundError("Serviço não encontrado");
    return updated;
  }

  async purchaseServicePackage(
    userId: string,
    packageId: string,
    data: PurchaseServicePackage,
  ): Promise<ServicePackagePurchase> {
    if (
      !this.repo.findServicePackage ||
      !this.repo.createPackagePurchase ||
      !this.repo.updatePackagePurchaseSale
    ) {
      throw new ValidationError(["Pacotes de serviço indisponíveis"]);
    }
    const packageData = await this.repo.findServicePackage(userId, packageId);
    if (!packageData || packageData.active === false) {
      throw new NotFoundError("Pacote não encontrado");
    }
    const price = data.pricePaid ?? packageData.price;
    const purchasedAt = data.purchasedAt ? new Date(data.purchasedAt) : new Date();
    const expires = new Date(purchasedAt);
    expires.setUTCDate(expires.getUTCDate() + packageData.validityDays);
    const expiresAt = expires.toISOString().slice(0, 10);
    const purchase = await this.repo.createPackagePurchase(
      userId,
      packageId,
      packageData.serviceId,
      { ...data, pricePaid: price },
      packageData,
      expiresAt,
    );
    if (!this.serviceSales) return purchase;

    const sale = await this.serviceSales.createServiceSale(userId, {
      serviceId: packageData.serviceId,
      itemName: `Pacote ${packageData.name}`,
      total: price,
      amountReceived: data.paymentMethod === "credit" ? 0 : price,
      paymentMethod: data.paymentMethod,
      clientId: data.clientId,
      soldAt: purchasedAt.toISOString(),
      notes: `${packageData.sessions} sessões`,
    });
    return (
      (await this.repo.updatePackagePurchaseSale(userId, purchase.id, sale.id)) ??
      purchase
    );
  }

  listPackagePurchases(
    userId: string,
    opts?: { clientId?: string; serviceId?: string },
  ): Promise<ServicePackagePurchase[]> {
    return this.repo.listPackagePurchases
      ? this.repo.listPackagePurchases(userId, opts)
      : Promise.resolve([]);
  }

  async getServiceInsights(userId: string, serviceId: string): Promise<ServiceInsights> {
    if (!this.repo.getServiceInsights) {
      throw new ValidationError(["Indicadores de serviço indisponíveis"]);
    }
    const service = this.repo.findServiceById
      ? await this.repo.findServiceById(userId, serviceId)
      : null;
    if (!service) throw new NotFoundError("Serviço não encontrado");
    return this.repo.getServiceInsights(userId, serviceId);
  }

  listBookingRequests(
    userId: string,
    serviceId: string,
  ): Promise<ServiceBookingRequest[]> {
    return this.repo.listBookingRequests
      ? this.repo.listBookingRequests(userId, serviceId)
      : Promise.resolve([]);
  }

  async updateBookingRequestStatus(
    userId: string,
    id: string,
    status: ServiceBookingRequestStatus,
  ): Promise<ServiceBookingRequest> {
    if (!this.repo.updateBookingRequestStatus) {
      throw new ValidationError(["Solicitações públicas indisponíveis"]);
    }
    const updated = await this.repo.updateBookingRequestStatus(userId, id, status);
    if (!updated) throw new NotFoundError("Solicitação não encontrada");
    return updated;
  }

  async completeServiceAppointment(
    userId: string,
    id: string,
    data: CompleteServiceAppointment,
  ): Promise<Order> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) throw new NotFoundError("Atendimento não encontrado");
    if (!existing.serviceId) {
      throw new ValidationError(["Esta encomenda não possui um serviço"]);
    }
    if (existing.completedAt) return existing;

    let saleId = existing.saleId;
    if (existing.servicePackagePurchaseId) {
      if (!this.repo.consumePackageSession) {
        throw new ValidationError(["Controle de sessões indisponível"]);
      }
      const purchase = await this.repo.consumePackageSession(
        userId,
        existing.servicePackagePurchaseId,
        existing.id,
      );
      if (!purchase) {
        throw new ValidationError(["O pacote não possui sessões disponíveis"]);
      }
    } else {
      if (!this.serviceSales) {
        throw new ValidationError(["Registro de recebimento indisponível"]);
      }
      const sale = await this.serviceSales.createServiceSale(userId, {
        serviceId: existing.serviceId,
        itemName: existing.serviceName ?? existing.title,
        total: data.amount,
        amountReceived: data.amountReceived,
        paymentMethod: data.paymentMethod,
        clientId: existing.clientId ?? undefined,
        soldAt: new Date().toISOString(),
        sourceOrderId: existing.id,
        notes: `Atendimento de ${existing.deliveryDate}`,
      });
      saleId = sale.id;
    }

    const completed = await this.repo.update(userId, id, {
      status: "done",
      appointmentStatus: "completed",
      amount: data.amount,
      deposit: data.amountReceived,
      actualCost: data.actualCost,
      completedAt: new Date().toISOString(),
      saleId,
    });
    if (!completed) throw new NotFoundError("Atendimento não encontrado");
    return completed;
  }

  private async prepareServiceOrder(
    userId: string,
    data: CreateOrderData | UpdateOrderData,
    existing?: Order,
  ): Promise<CreateOrderData | UpdateOrderData> {
    const serviceId = data.serviceId === undefined ? existing?.serviceId : data.serviceId;
    if (!serviceId || !this.repo.findServiceById) return data;

    const service = await this.repo.findServiceById(userId, serviceId);
    if (!service || (!service.active && !existing)) {
      throw new ValidationError(["Escolha um serviço disponível"]);
    }

    const variationId =
      data.serviceVariationId === undefined
        ? existing?.serviceVariationId
        : data.serviceVariationId;
    const variation = variationId
      ? service.variations.find((item) => item.id === variationId && item.active)
      : undefined;
    if (variationId && !variation) {
      throw new ValidationError(["Escolha uma variação disponível"]);
    }

    const addOnIds =
      data.serviceAddOnIds === undefined
        ? (existing?.serviceAddOnIds ?? [])
        : data.serviceAddOnIds;
    const addOns = addOnIds.map((id) =>
      service.addOns.find((item) => item.id === id && item.active),
    );
    if (addOns.some((item) => !item)) {
      throw new ValidationError(["Escolha somente adicionais disponíveis"]);
    }

    const packagePurchaseId =
      data.servicePackagePurchaseId === undefined
        ? existing?.servicePackagePurchaseId
        : data.servicePackagePurchaseId;
    if (packagePurchaseId && this.repo.listPackagePurchases) {
      const purchases = await this.repo.listPackagePurchases(userId, {
        clientId: data.clientId ?? existing?.clientId ?? undefined,
        serviceId,
      });
      const purchase = purchases.find(
        (item) =>
          item.id === packagePurchaseId &&
          item.status === "active" &&
          item.sessionsUsed < item.sessionsTotal &&
          item.expiresAt >= todayISO(new Date()),
      );
      if (!purchase) {
        throw new ValidationError(["O pacote não possui uma sessão disponível"]);
      }
    }

    const selectedAddOns = addOns.filter(
      (item): item is NonNullable<typeof item> => !!item,
    );
    const duration =
      (variation?.durationMinutes ?? service.durationMinutes) +
      selectedAddOns.reduce((total, item) => total + item.durationMinutes, 0);
    const price =
      (variation?.price ?? service.defaultPrice ?? 0) +
      selectedAddOns.reduce((total, item) => total + item.price, 0);
    const defaultLocation =
      service.locationMode === "flexible" ? null : service.locationMode;

    return {
      ...data,
      serviceId,
      serviceVariationId: variation?.id ?? null,
      serviceVariationName: variation?.name ?? null,
      serviceAddOnIds: selectedAddOns.map((item) => item.id),
      serviceAddOnNames: selectedAddOns.map((item) => item.name),
      servicePackagePurchaseId: packagePurchaseId ?? null,
      durationMinutes: data.durationMinutes ?? duration,
      amount: data.amount ?? (price > 0 ? price : undefined),
      appointmentStatus:
        data.appointmentStatus ?? existing?.appointmentStatus ?? "scheduled",
      locationMode: data.locationMode ?? existing?.locationMode ?? defaultLocation,
    };
  }

  private async assertServiceNameAvailable(
    userId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    if (!this.repo.findServiceByName) return;
    const duplicate = await this.repo.findServiceByName(userId, name, excludeId);
    if (duplicate) {
      throw new ValidationError(["Já existe um serviço com esse nome"]);
    }
  }

  private async assertAvailable(
    userId: string,
    data: CreateOrderData | UpdateOrderData,
    excludeOrderId?: string,
    existing?: Order,
  ): Promise<void> {
    const date = data.deliveryDate ?? existing?.deliveryDate;
    const time = data.deliveryTime ?? existing?.deliveryTime ?? undefined;
    let duration = data.durationMinutes ?? existing?.durationMinutes ?? undefined;
    if (!date || !time || !duration) return;
    const serviceId = data.serviceId === undefined ? existing?.serviceId : data.serviceId;
    if (serviceId && this.repo.findServiceById) {
      const service = await this.repo.findServiceById(userId, serviceId);
      duration += service?.bufferMinutes ?? 0;
    }
    if (!this.repo.hasScheduleConflict) return;
    const conflict = await this.repo.hasScheduleConflict(
      userId,
      date,
      time,
      duration,
      excludeOrderId,
    );
    if (conflict) {
      throw new ValidationError(["Este horário já está ocupado"]);
    }
  }
}

function appointmentOrderStatus(
  status:
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show",
): "pending" | "in_production" | "done" | "cancelled" {
  if (status === "in_progress") return "in_production";
  if (status === "completed") return "done";
  if (status === "cancelled" || status === "no_show") return "cancelled";
  return "pending";
}
