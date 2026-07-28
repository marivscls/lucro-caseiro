import type { Client, CreateClient, UpdateClient } from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/clients";

type ClientContactFields = Pick<
  Client,
  "nextContactAt" | "nextContactReason" | "nextContactNotes"
>;
type ClientWire = Omit<Client, keyof ClientContactFields> & Partial<ClientContactFields>;

interface PaginatedClientsWire {
  items: ClientWire[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedClients extends Omit<PaginatedClientsWire, "items"> {
  items: Client[];
}

/**
 * A API publicada antes dos campos de próximo contato não os envia.
 * Normalize na fronteira para o restante do app manter o contrato nullable.
 */
export function normalizeClient(client: ClientWire): Client {
  return {
    ...client,
    nextContactAt: client.nextContactAt ?? null,
    nextContactReason: client.nextContactReason ?? null,
    nextContactNotes: client.nextContactNotes ?? null,
  };
}

export async function fetchClients(
  token: string,
  opts?: { page?: number; search?: string },
): Promise<PaginatedClients> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.search) params.set("search", opts.search);

  const query = params.toString();
  const queryString = query ? `?${query}` : "";
  const result = await apiClient<PaginatedClientsWire>(`${BASE}${queryString}`, {
    token,
  });
  return { ...result, items: result.items.map(normalizeClient) };
}

export async function fetchClient(token: string, id: string): Promise<Client> {
  return normalizeClient(await apiClient<ClientWire>(`${BASE}/${id}`, { token }));
}

export async function fetchBirthdays(token: string): Promise<Client[]> {
  const clients = await apiClient<ClientWire[]>(`${BASE}/birthdays`, { token });
  return clients.map(normalizeClient);
}

export async function createClient(token: string, data: CreateClient): Promise<Client> {
  return normalizeClient(
    await apiClient<ClientWire>(BASE, { method: "POST", body: data, token }),
  );
}

export async function updateClient(
  token: string,
  id: string,
  data: UpdateClient,
): Promise<Client> {
  return normalizeClient(
    await apiClient<ClientWire>(`${BASE}/${id}`, {
      method: "PATCH",
      body: data,
      token,
    }),
  );
}

export async function deleteClient(token: string, id: string): Promise<void> {
  await apiClient(`${BASE}/${id}`, { method: "DELETE", token });
}
