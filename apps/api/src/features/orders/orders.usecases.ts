import type {
  CreateService,
  DeliverOrder,
  Order,
  Service,
  UpdateService,
} from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { buildOrdersSummary, todayISO, validateOrder } from "./orders.domain";
import type {
  CreateOrderData,
  FindAllOrdersOpts,
  IIncomeRegistrar,
  IOrdersRepo,
  OrdersSummary,
  OrdersSummaryOpts,
  UpdateOrderData,
} from "./orders.types";

export class OrdersUseCases {
  constructor(
    private repo: IOrdersRepo,
    private income: IIncomeRegistrar,
  ) {}

  async create(userId: string, data: CreateOrderData): Promise<Order> {
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
    return this.repo.createService(userId, data);
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
    const duration = data.durationMinutes ?? existing?.durationMinutes ?? undefined;
    if (!date || !time || !duration) return;
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
