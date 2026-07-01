import type { Client } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateClientData } from "./clients.domain";
import type { CreateClientData, FindAllOpts, IClientsRepo } from "./clients.types";

const CLIENT_PHONE_UNIQUE_INDEX = "idx_clients_user_phone_digits_unique";
const CLIENT_PHONE_DUPLICATE_MESSAGE =
  "Esse telefone já está cadastrado em outro cliente.";

export class ClientsUseCases {
  constructor(private repo: IClientsRepo) {}

  async create(userId: string, data: CreateClientData): Promise<Client> {
    const errors = validateClientData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    if (data.phone?.trim()) {
      const duplicate = await this.repo.findDuplicateByPhone(userId, data.phone);
      if (duplicate) {
        throw new ValidationError([CLIENT_PHONE_DUPLICATE_MESSAGE]);
      }
    }

    try {
      return await this.repo.create(userId, data);
    } catch (error) {
      if (isClientPhoneUniqueViolation(error)) {
        throw new ValidationError([CLIENT_PHONE_DUPLICATE_MESSAGE]);
      }
      throw error;
    }
  }

  async getById(userId: string, id: string): Promise<Client> {
    const client = await this.repo.findById(userId, id);
    if (!client) {
      throw new NotFoundError("Cliente não encontrado");
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
      throw new NotFoundError("Cliente não encontrado");
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

    if (merged.phone?.trim()) {
      const duplicate = await this.repo.findDuplicateByPhone(userId, merged.phone, id);
      if (duplicate) {
        throw new ValidationError([CLIENT_PHONE_DUPLICATE_MESSAGE]);
      }
    }

    let updated: Awaited<ReturnType<IClientsRepo["update"]>>;
    try {
      updated = await this.repo.update(userId, id, data);
    } catch (error) {
      if (isClientPhoneUniqueViolation(error)) {
        throw new ValidationError([CLIENT_PHONE_DUPLICATE_MESSAGE]);
      }
      throw error;
    }
    if (!updated) {
      throw new NotFoundError("Cliente não encontrado");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) {
      throw new NotFoundError("Cliente não encontrado");
    }
  }

  async getBirthdaysThisMonth(userId: string): Promise<Client[]> {
    const currentMonth = new Date().getMonth() + 1;
    return this.repo.findBirthdaysInMonth(userId, currentMonth);
  }
}

function isClientPhoneUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as {
    code?: unknown;
    constraint?: unknown;
    constraint_name?: unknown;
    constraintName?: unknown;
    message?: unknown;
  };

  if (err.code !== "23505") return false;

  return [err.constraint, err.constraint_name, err.constraintName, err.message].some(
    (value) => typeof value === "string" && value.includes(CLIENT_PHONE_UNIQUE_INDEX),
  );
}
