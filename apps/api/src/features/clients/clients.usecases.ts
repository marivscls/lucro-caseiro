import type { Client } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateClientData } from "./clients.domain";
import type { CreateClientData, FindAllOpts, IClientsRepo } from "./clients.types";

export class ClientsUseCases {
  constructor(private repo: IClientsRepo) {}

  async create(userId: string, data: CreateClientData): Promise<Client> {
    const errors = validateClientData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Client> {
    const client = await this.repo.findById(userId, id);
    if (!client) {
      throw new NotFoundError("Cliente nao encontrado");
    }
    return client;
  }

  async list(userId: string, opts: FindAllOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return {
      items,
      ...paginationMeta(total, opts.page, opts.limit),
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateClientData>,
  ): Promise<Client> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) {
      throw new NotFoundError("Cliente nao encontrado");
    }

    const merged = { ...existing, ...data };
    const errors = validateClientData({
      name: merged.name,
      phone: merged.phone ?? undefined,
      address: merged.address ?? undefined,
      birthday: merged.birthday ?? undefined,
      notes: merged.notes ?? undefined,
      tags: merged.tags,
    });

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const updated = await this.repo.update(userId, id, data);
    if (!updated) {
      throw new NotFoundError("Cliente nao encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Cliente nao encontrado");
    }
  }

  async getBirthdaysThisMonth(userId: string): Promise<Client[]> {
    const currentMonth = new Date().getMonth() + 1;
    return this.repo.findBirthdaysInMonth(userId, currentMonth);
  }
}
