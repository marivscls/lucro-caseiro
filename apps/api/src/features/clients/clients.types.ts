import type { Client } from "@lucro-caseiro/contracts";

export interface IClientsRepo {
  create(userId: string, data: CreateClientData): Promise<Client>;
  findById(userId: string, id: string): Promise<Client | null>;
  findAll(userId: string, opts: FindAllOpts): Promise<{ items: Client[]; total: number }>;
  update(
    userId: string,
    id: string,
    data: Partial<CreateClientData>,
  ): Promise<Client | null>;
  delete(userId: string, id: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
  findBirthdaysInMonth(userId: string, month: number): Promise<Client[]>;
}

export interface CreateClientData {
  name: string;
  phone?: string;
  address?: string;
  birthday?: string;
  notes?: string;
  tags?: string[];
}

export interface FindAllOpts {
  page: number;
  limit: number;
  search?: string;
}
